/* ==============================================================================
 * Project   : STM32F446RE Four-Wheel Skid-Steer Robot Firmware
 * Target    : Dual ZLAC8015D Motor Drivers (CAN) + GameSir Wireless Controller
 * (USB) Hardware  :
 *   - CAN1  : PB8 -> CAN1_RX, PB9 -> CAN1_TX (500 kbps to Dual ZLAC8015D)
 *   - USB   : PA11 -> D- (White), PA12 -> D+ (Green) - Full-Speed Host Mode
 *   - UART2 : PA2 -> TX, PA3 -> RX (115200 Baud, 8N1 to ST-Link / Telemetry)
 *
 * Motor & Axle Mapping:
 *   - Node 1 (Front Axle): Channel 1 = Front Left, Channel 2 = Front Right
 *   - Node 2 (Rear Axle) : Channel 1 = Rear Left,  Channel 2 = Rear Right
 *   - Polarity: Left motors (CH1) negative RPM = forward; Right motors (CH2)
 * positive RPM = forward
 *
 * Safety Notice:
 *   This firmware implements a software-level Quick-Stop (CiA 402 Command
 * 0x0002) and communication watchdog fail-safe. It does NOT replace a hardware
 * safety-rated emergency stop (e.g. physical battery disconnect / safety
 * relay).
 * ==============================================================================
 */

#include "main.h"
#include "stepper.h"
#include "usbh_core.h"
#include "usbh_hid.h"
#include "zlac8015d.h"
#include <math.h>
#include <stdio.h>
#include <string.h>

/* ==============================================================================
 * SECTION 1: CONFIGURATION PARAMETERS & CONSTANTS
 * ==============================================================================
 */

/*
 * ==============================================================================
 * POWER PRESET SELECTION (Uncomment the one you want to use):
 * ==============================================================================
 */
#define USE_POWER_PRESET_3 /* ACTIVE: 32V 10.4A Benchtop Supply (~332W Total)  \
                            */
// #define USE_POWER_PRESET_1    /* UNCOMMENT WHEN BATTERY ARRIVES: 48V Battery
// (Full Power & Spin Turns) */

#if defined(USE_POWER_PRESET_1)
/* ------------------------------------------------------------------------------
 * PRESET 1: Full 48V High-Current Battery Mode (Nominal Operation)
 * ------------------------------------------------------------------------------
 */
#define MOTOR_MAX_RPM 30 /* 30 RPM (~0.41 m/s) */
#define MOTOR_ACCEL_RPM_PER_SEC                                                \
  35.0f /* Fast, responsive acceleration (35 RPM/s) */
#define MOTOR_DECEL_RPM_PER_SEC 20.0f /* Crisp braking */
#define DRIVER_HW_ACCEL_MS 100        /* Fast 100 ms driver current loop */
#define DRIVER_HW_DECEL_MS 300        /* 300 ms driver decel profile */
#define DEFAULT_TURN_OMEGA_RAD_S                                               \
  1.40f /* Full-torque zero-radius spin turn (~19 RPM delta) */
#define STEERING_EXPO 0.30f /* Exponential curve factor */
#define ENABLE_LEFT_STICK_THROTTLE                                             \
  1                          /* 1=Dual throttle support (Triggers & Stick Y) */
#define STICK_DEADZONE 0.08f /* Deadband around neutral stick */
#define FULL_DEFLECTION_THRESH                                                 \
  0.85f /* Stick deflection needed for spot turn                               \
         */
#define MIN_TURN_RADIUS                                                        \
  1.50f /* Minimum radius for moving arc turns (meters)                        \
         */

#elif defined(USE_POWER_PRESET_3)
/* ------------------------------------------------------------------------------
 * PRESET 3: 32V 10.4A Benchtop Power Supply (Max ~332W Total / ~2.6A per Motor)
 * ------------------------------------------------------------------------------
 */
#define MOTOR_MAX_RPM                                                          \
  25 /* Safe, controllable default top speed (~0.34 m/s) */
#define MOTOR_ACCEL_RPM_PER_SEC                                                \
  35.0f /* Smooth acceleration ramp (35.0 RPM/s) */
#define MOTOR_DECEL_RPM_PER_SEC                                                \
  28.0f /* Sharp software braking ramp (28.0 RPM/s) when stick returns to      \
           neutral */
#define DRIVER_HW_ACCEL_MS                                                     \
  300 /* Internal driver acceleration profile: 300 ms */
#define DRIVER_HW_DECEL_MS                                                     \
  200 /* Tightens ZLAC8015D internal deceleration loop to stop passive         \
         coasting */
#define DEFAULT_TURN_OMEGA_RAD_S                                               \
  0.45f /* Restricts yaw rate to keep scrub current below 10.4A */
#define STEERING_EXPO 0.45f /* Smooth center stick control */
#define ENABLE_LEFT_STICK_THROTTLE                                             \
  1                          /* 1=Dual throttle support (Triggers & Stick Y) */

/* Kinematic Thresholds */
#define STICK_DEADZONE 0.08f /* Deadband around neutral stick */
#define FULL_DEFLECTION_THRESH                                                 \
  0.85f /* Stick deflection needed for spot turn                               \
         */
#define MIN_TURN_RADIUS                                                        \
  0.50f /* Minimum radius for moving arc turns (meters)                        \
         */

#else
#error                                                                         \
    "No power preset selected! Please uncomment either USE_POWER_PRESET_1 or USE_POWER_PRESET_3."
#endif

/* Robot Geometry */
#define ROBOT_TRACK_WIDTH_MM                                                   \
  575.0f /* Distance between left & right wheels (W = 0.575 m) */
#define ROBOT_WHEELBASE_MM                                                     \
  488.75f /* Distance between front & rear axles (L = 0.48875 m, L/W = 0.85)   \
           */
#define ROBOT_WHEEL_RADIUS_MM                                                  \
  131.5f /* Wheel radius (R = 263mm diameter / 2 = 0.1315 m) */
#define ROBOT_TRACK_WIDTH_M (ROBOT_TRACK_WIDTH_MM / 1000.0f)   /* 0.575 m */
#define ROBOT_WHEEL_RADIUS_M (ROBOT_WHEEL_RADIUS_MM / 1000.0f) /* 0.1315 m */

/* Steering & Controller Sensitivity */
#define STICK_DEADZONE_NORM STICK_DEADZONE /* 8% stick deadzone alias */
#define TRIGGER_DEADZONE_PCT 3             /* 3% trigger deadzone */
#define BTN_SPOT_TURN                                                          \
  (BTN_LB | BTN_RB) /* Dedicated spot-turn button: LB or RB bumper */

/* Timing & Safety Thresholds */
#define CONTROLLER_TIMEOUT_MS                                                  \
  250 /* Fail-safe stop if no valid report for 250 ms */
#define MOTOR_CAN_INTERVAL_MS                                                  \
  20 /* Send CAN velocity commands every 20 ms (50 Hz control loop) */
#define TELEMETRY_INTERVAL_MS                                                  \
  100 /* Telemetry UART print every 100 ms (10 Hz) */
#define CAN_PROBE_TIMEOUT_MS                                                   \
  1000 /* Node response timeout for CAN health check */

/* Diagnostic Options */
#define DEBUG_RAW_GAMEPAD_REPORTS                                              \
  0 /* Set to 1 to print raw HID packet hex bytes */

/* CAN Node Identifiers */
#define ZLAC_NODE_ID_1 1 /* Front Axle Driver */
#define ZLAC_NODE_ID_2 2 /* Rear Axle Driver */

/* Gamepad Button Bitmasks (Normalized Internal Mapping) */
#define BTN_A 0x0001
#define BTN_B 0x0002
#define BTN_X 0x0004
#define BTN_Y 0x0008
#define BTN_LB 0x0010
#define BTN_RB 0x0020
#define BTN_START 0x0040
#define BTN_BACK 0x0080
#define BTN_DPAD_UP 0x0100
#define BTN_DPAD_DOWN 0x0200
#define BTN_DPAD_LEFT 0x0400
#define BTN_DPAD_RIGHT 0x0800

/* ==============================================================================
 * SECTION 2: SYSTEM STATE & TYPE DEFINITIONS
 * ==============================================================================
 */

typedef enum {
  ROBOT_STATE_INIT = 0,
  ROBOT_STATE_DISCONNECTED,  /* USB Dongle / Gamepad disconnected */
  ROBOT_STATE_WATCHDOG_STOP, /* Controller report timeout (>250ms) */
  ROBOT_STATE_ESTOP_LATCHED, /* Software Quick-Stop triggered via B or BACK */
  ROBOT_STATE_CAN_FAULT,     /* CAN communication or driver fault */
  ROBOT_STATE_READY          /* Armed and ready for operation */
} Robot_State_t;

typedef enum {
  DRIVE_MODE_STOP = 0, /* Neutral / Stopped */
  DRIVE_MODE_STRAIGHT, /* Straight Forward or Reverse (Symmetrical wheels, wz =
                          0) */
  DRIVE_MODE_ARC_TURN, /* Sweeping Arc Turn (R >= MIN_TURN_RADIUS,
                          non-scrubbing) */
  DRIVE_MODE_SPOT_TURN /* In-Place Pivot (Locked unless button held & full
                          deflection) */
} Drive_Mode_t;

typedef struct {
  uint8_t raw[64];
  uint16_t len;
  uint8_t valid;
} Gamepad_Report_t;

/* Global Adjustable Motion Variables */
volatile float g_turn_angular_velocity = DEFAULT_TURN_OMEGA_RAD_S;
volatile int32_t g_motor_max_rpm = MOTOR_MAX_RPM;
volatile float g_motor_accel_rpm_per_sec = MOTOR_ACCEL_RPM_PER_SEC;
volatile float g_motor_decel_rpm_per_sec = MOTOR_DECEL_RPM_PER_SEC;

/* Hardware Handles */
CAN_HandleTypeDef hcan1;
UART_HandleTypeDef huart2;
USBH_HandleTypeDef hUsbHostFS;

/* Controller Input State */
static Gamepad_Report_t last_report;
static volatile uint8_t new_report_flag = 0;
static uint32_t last_valid_report_tick = 0;

static uint8_t current_lt_pct = 0;
static uint8_t current_rt_pct = 0;
static float current_stick_x_norm = 0.0f; /* Normalized -1.0 to +1.0 */
static float current_stick_y_norm = 0.0f; /* Normalized -1.0 to +1.0 */
static uint16_t current_btns = 0;
static uint16_t prev_btns = 0;

/* Kinematic Setpoints & Filtered Output */
static Drive_Mode_t current_drive_mode = DRIVE_MODE_STOP;
static float commanded_linear_v_m_s = 0.0f;
static float commanded_linear_v_mm_s = 0.0f;
static float commanded_omega_rad_s = 0.0f;
static int32_t target_left_rpm = 0;
static int32_t target_right_rpm = 0;
static float ramped_left_rpm_f = 0.0f;
static float ramped_right_rpm_f = 0.0f;
static int32_t active_left_rpm = 0;
static int32_t active_right_rpm = 0;

/* System Status */
static Robot_State_t robot_state = ROBOT_STATE_INIT;
static uint32_t last_can_tx_tick = 0;
static uint32_t last_telemetry_tick = 0;

/* Stepper Actuator State (Lower / Retract 110 mm) */
static uint8_t stepper_is_lowered = 0; /* 0 = Retracted (Up), 1 = Lowered (Down) */

/* ==============================================================================
 * SECTION 3: FUNCTION PROTOTYPES
 * ==============================================================================
 */

void SystemClock_Config(void);
static void MX_GPIO_Init(void);
static void MX_CAN1_Init(void);
static void MX_USART2_UART_Init(void);
static void USBH_UserProcess(USBH_HandleTypeDef *phost, uint8_t id);

/* Motion & Kinematic Functions */
static float Process_Analog_Stick(float raw, float deadzone, float expo);
void Map_Controller_Inputs(float raw_throttle, float raw_steer,
                           uint8_t btn_spot_turn, float *out_vx, float *out_wz,
                           Drive_Mode_t *out_mode);
void Drive_UGV_With_Mode(float vx, float wz, Drive_Mode_t mode,
                         int32_t *out_left_rpm, int32_t *out_right_rpm);
static void Calculate_Kinematics(uint8_t lt_pct, uint8_t rt_pct, float stick_x,
                                 float stick_y, uint16_t btns,
                                 int32_t *out_target_left,
                                 int32_t *out_target_right, float *out_v,
                                 float *out_omega);
static float Update_Ramp_Channel(float current, float target, float dt);
static void Motor_Set_Velocity_All(int32_t left_rpm, int32_t right_rpm);
static void Motor_Stop_Quick(void);
static void Motor_Stop_Controlled(void);
static void Motor_Clear_Faults_And_Enable(void);

/* Communication & Parsing */
static uint8_t Parse_Gamepad_Report(uint8_t *data, uint16_t len,
                                    uint8_t *out_lt_pct, uint8_t *out_rt_pct,
                                    float *out_stick_x, float *out_stick_y,
                                    uint16_t *out_btns);
static void Process_Incoming_CAN(void);
static uint8_t Verify_CAN_Node(uint8_t nodeId);
static void Print_Telemetry(void);

/* ==============================================================================
 * SECTION 4: MAIN ENTRY POINT & CONTROL LOOP
 * ==============================================================================
 */

int main(void) {
  /* 4.1 System & Hardware Initialization */
  HAL_Init();
  SystemClock_Config();
  MX_GPIO_Init();
  MX_USART2_UART_Init();
  MX_CAN1_Init();
  Stepper_Init();

  /* Welcome & Architecture Banner */
  printf("\r\n================================================================="
         "=====\r\n");
  printf(
      "  STM32F446RE FOUR-WHEEL SKID-STEER ROBOT FIRMWARE (PROPORTIONAL)\r\n");
  printf("====================================================================="
         "=\r\n");
  printf("  CAN Bus    : 500 kbps (PB8: RX, PB9: TX)\r\n");
  printf("  Axles      : Node 1 (Front Wheels), Node 2 (Rear Wheels)\r\n");
  printf("  Chassis    : Track Width = %.1f mm | Wheelbase = %.1f mm\r\n",
         ROBOT_TRACK_WIDTH_MM, ROBOT_WHEELBASE_MM);
  printf("  Limits     : Max Wheel Speed = +/-%ld RPM | Omega = %.2f rad/s\r\n",
         (long)g_motor_max_rpm, g_turn_angular_velocity);
  printf("  Ramp Rates : Accel = %.1f RPM/s | Decel = %.1f RPM/s\r\n",
         g_motor_accel_rpm_per_sec, g_motor_decel_rpm_per_sec);
  printf("  Watchdog   : %d ms timeout on wireless controller reports\r\n",
         CONTROLLER_TIMEOUT_MS);
  printf("  Stepper    : PC2 (PUL), PC3 (DIR) | Stroke = %.1f mm (%ld steps) | Button [X] Toggle\r\n",
         STEPPER_TRAVEL_MM, (long)STEPPER_TOTAL_STEPS);
  printf("---------------------------------------------------------------------"
         "-\r\n");

  /* 4.2 Initialize Motor Drivers over CAN */
  printf(">>> [INIT] Connecting to ZLAC8015D Motor Drivers...\r\n");
  ZLAC8015D_Init(&hcan1, ZLAC_NODE_ID_1);

  /* Verify both drivers respond on CAN */
  uint8_t n1_ok = Verify_CAN_Node(ZLAC_NODE_ID_1);
  uint8_t n2_ok = Verify_CAN_Node(ZLAC_NODE_ID_2);
  if (!n1_ok || !n2_ok) {
    printf("[!] WARNING: One or more motor drivers did not acknowledge "
           "probe!\r\n");
  }

  /* Clear errors and configure Profile Velocity Mode (Async control) */
  ZLAC8015D_ClearError_Node(ZLAC_NODE_ID_1);
  ZLAC8015D_ClearError_Node(ZLAC_NODE_ID_2);
  HAL_Delay(30);

  ZLAC8015D_Init_Velocity_Mode_Async_Node(ZLAC_NODE_ID_1, DRIVER_HW_ACCEL_MS,
                                          DRIVER_HW_DECEL_MS);
  ZLAC8015D_Init_Velocity_Mode_Async_Node(ZLAC_NODE_ID_2, DRIVER_HW_ACCEL_MS,
                                          DRIVER_HW_DECEL_MS);
  HAL_Delay(50);

  /* Arm drivers into CiA 402 Operation Enabled */
  ZLAC8015D_Enable_Node(ZLAC_NODE_ID_1);
  ZLAC8015D_Enable_Node(ZLAC_NODE_ID_2);
  HAL_Delay(30);

  /* 4.3 Initialize USB Host Stack */
  printf(">>> [INIT] Starting USB Host Stack (GameSir Wireless / HID)...\r\n");
  if (USBH_Init(&hUsbHostFS, USBH_UserProcess, 0) != USBH_OK ||
      USBH_RegisterClass(&hUsbHostFS, USBH_HID_CLASS) != USBH_OK ||
      USBH_Start(&hUsbHostFS) != USBH_OK) {
    printf("[!] USB Host initialization FAILED!\r\n");
    Error_Handler();
  }

  robot_state = ROBOT_STATE_DISCONNECTED;
  printf(">>> System initialized. Connect controller dongle to begin.\r\n\r\n");

  uint32_t led_tick = 0;

  /* ============================================================================
   * 4.4 Main Event Loop
   * ============================================================================
   */
  while (1) {
    /* Step 0: Service non-blocking stepper motion */
    Stepper_Update();

    /* Step 1: Maintain USB Host state machine */
    USBH_Process(&hUsbHostFS);

    /* Step 2: Ingest CAN feedback & driver statuswords */
    Process_Incoming_CAN();

    /* Step 3: Parse incoming gamepad report */
    if (new_report_flag) {
      new_report_flag = 0;

      uint8_t lt_pct = 0, rt_pct = 0;
      float stick_x = 0.0f, stick_y = 0.0f;
      uint16_t btns = 0;

      uint8_t valid =
          Parse_Gamepad_Report(last_report.raw, last_report.len, &lt_pct,
                               &rt_pct, &stick_x, &stick_y, &btns);

      if (valid) {
        last_valid_report_tick = HAL_GetTick();
        current_lt_pct = lt_pct;
        current_rt_pct = rt_pct;
        current_stick_x_norm = stick_x;
        current_stick_y_norm = stick_y;
        prev_btns = current_btns;
        current_btns = btns;

        /* D-Pad Real-Time Parameter Tuning:
         * - D-Pad Left / Right: Decrement / Increment turn omega by 0.1 rad/s
         * - D-Pad Down / Up   : Decrement / Increment max wheel RPM by 1 RPM
         */
        uint16_t btns_pressed = current_btns & ~prev_btns;

        if (btns_pressed & BTN_DPAD_LEFT) {
          g_turn_angular_velocity = roundf((g_turn_angular_velocity - 0.10f) * 10.0f) / 10.0f;
          if (g_turn_angular_velocity < 0.10f) g_turn_angular_velocity = 0.10f;
          printf("\r\n>>> [TUNING] Turn Omega: %.2f rad/s (-0.1)\r\n", g_turn_angular_velocity);
        } else if (btns_pressed & BTN_DPAD_RIGHT) {
          g_turn_angular_velocity = roundf((g_turn_angular_velocity + 0.10f) * 10.0f) / 10.0f;
          if (g_turn_angular_velocity > 4.00f) g_turn_angular_velocity = 4.00f;
          printf("\r\n>>> [TUNING] Turn Omega: %.2f rad/s (+0.1)\r\n", g_turn_angular_velocity);
        }

        if (btns_pressed & BTN_DPAD_UP) {
          g_motor_max_rpm += 1;
          if (g_motor_max_rpm > 100) g_motor_max_rpm = 100;
          printf("\r\n>>> [TUNING] Max Wheel Speed: %ld RPM (+1)\r\n", (long)g_motor_max_rpm);
        } else if (btns_pressed & BTN_DPAD_DOWN) {
          g_motor_max_rpm -= 1;
          if (g_motor_max_rpm < 1) g_motor_max_rpm = 1;
          printf("\r\n>>> [TUNING] Max Wheel Speed: %ld RPM (-1)\r\n", (long)g_motor_max_rpm);
        }

        /* Button X: Toggle Stepper Lower / Retract 110 mm */
        if (btns_pressed & BTN_X) {
          if (Stepper_IsBusy()) {
            printf("\r\n>>> [STEPPER] Motion already in progress (%ld steps remaining)!\r\n",
                   (long)Stepper_GetRemainingSteps());
          } else {
            if (!stepper_is_lowered) {
              int32_t move_steps = (STEPPER_DIR_LOWER == STEPPER_DIR_CW) ? STEPPER_TOTAL_STEPS : -STEPPER_TOTAL_STEPS;
              Stepper_StartMove(move_steps, STEPPER_STEP_DELAY_US);
              stepper_is_lowered = 1;
              printf("\r\n>>> [STEPPER] LOWERING by %.1f mm (%ld steps)...\r\n",
                     STEPPER_TRAVEL_MM, (long)STEPPER_TOTAL_STEPS);
            } else {
              int32_t move_steps = (STEPPER_DIR_RETRACT == STEPPER_DIR_CW) ? STEPPER_TOTAL_STEPS : -STEPPER_TOTAL_STEPS;
              Stepper_StartMove(move_steps, STEPPER_STEP_DELAY_US);
              stepper_is_lowered = 0;
              printf("\r\n>>> [STEPPER] RETRACTING by %.1f mm (%ld steps)...\r\n",
                     STEPPER_TRAVEL_MM, (long)STEPPER_TOTAL_STEPS);
            }
          }
        }

        /* If controller was in watchdog stop, check if we can transition to
         * wait-neutral */
        if (robot_state == ROBOT_STATE_DISCONNECTED) {
          robot_state = ROBOT_STATE_WATCHDOG_STOP;
        }

        /* 3A: Latched Software Quick-Stop check (Button B or BACK) */
        if ((current_btns & (BTN_B | BTN_BACK)) != 0) {
          if (robot_state != ROBOT_STATE_ESTOP_LATCHED) {
            robot_state = ROBOT_STATE_ESTOP_LATCHED;
            Motor_Stop_Quick();
            Stepper_Stop();
            printf("\r\n>>> [SAFETY] SOFTWARE QUICK-STOP LATCHED via "
                   "Controller Button!\r\n");
            printf(">>> Neutralize all controls and press [A] (fresh press) to "
                   "re-arm.\r\n\r\n");
          }
        }

        /* 3B: Auto-Arm & Driver Alarm Clear (Auto-arms when neutral; [A] or
         * [START] clears driver faults) */
        uint8_t controls_neutral =
            (current_lt_pct <= TRIGGER_DEADZONE_PCT) &&
            (current_rt_pct <= TRIGGER_DEADZONE_PCT) &&
            (fabsf(current_stick_x_norm) <= STICK_DEADZONE) &&
            (fabsf(current_stick_y_norm) <= STICK_DEADZONE);

        uint8_t reset_pressed = ((current_btns & (BTN_A | BTN_START)) &&
                                 !(prev_btns & (BTN_A | BTN_START)));

        /* Auto-arm from WATCHDOG_STOP when controls are in neutral */
        if (robot_state == ROBOT_STATE_WATCHDOG_STOP && controls_neutral) {
          robot_state = ROBOT_STATE_READY;
          printf("\r\n>>> [SYSTEM READY] Controls neutral & controller linked! "
                 "Ready to drive.\r\n\r\n");
        } else if (reset_pressed) {
          if (controls_neutral) {
            Motor_Clear_Faults_And_Enable();
            target_left_rpm = 0;
            target_right_rpm = 0;
            ramped_left_rpm_f = 0.0f;
            ramped_right_rpm_f = 0.0f;
            active_left_rpm = 0;
            active_right_rpm = 0;
            robot_state = ROBOT_STATE_READY;
            printf("\r\n>>> [ALARM CLEAR & RESET] Sent Fault Reset (0x0080) to "
                   "Node 1 & Node 2. Drivers cleared & re-armed!\r\n\r\n");
          } else {
            printf("\r\n>>> [RESET REJECTED] Cannot clear alarm while throttle "
                   "or stick is active!\r\n");
            printf("    Release triggers & center stick, then press [A] or "
                   "[START].\r\n\r\n");
          }
        }
      }
    }

    /* Step 4: Controller Report Watchdog Check (250 ms) */
    if (robot_state == ROBOT_STATE_READY) {
      if (HAL_GetTick() - last_valid_report_tick >= CONTROLLER_TIMEOUT_MS) {
        robot_state = ROBOT_STATE_WATCHDOG_STOP;
        current_lt_pct = 0;
        current_rt_pct = 0;
        current_stick_x_norm = 0.0f;
        current_stick_y_norm = 0.0f;
        target_left_rpm = 0;
        target_right_rpm = 0;
        current_drive_mode = DRIVE_MODE_STOP;
        Motor_Stop_Controlled();
        printf(
            "\r\n>>> [WATCHDOG FAIL-SAFE] Gamepad report timeout (>%d ms)!\r\n",
            CONTROLLER_TIMEOUT_MS);
        printf("    Motors stopped. Return controls to neutral and press [A] "
               "to re-arm.\r\n\r\n");
      }
    }

    /* Step 5: Kinematics & Setpoint Calculation (3-Regime Control) */
    if (robot_state == ROBOT_STATE_READY) {
      Calculate_Kinematics(current_lt_pct, current_rt_pct, current_stick_x_norm,
                           current_stick_y_norm, current_btns, &target_left_rpm,
                           &target_right_rpm, &commanded_linear_v_mm_s,
                           &commanded_omega_rad_s);
    } else {
      target_left_rpm = 0;
      target_right_rpm = 0;
      commanded_linear_v_mm_s = 0.0f;
      commanded_omega_rad_s = 0.0f;
      current_drive_mode = DRIVE_MODE_STOP;
    }

    /* Step 6: Periodic Ramping & CAN Velocity Dispatcher (every 20 ms / 50 Hz)
     */
    if (HAL_GetTick() - last_can_tx_tick >= MOTOR_CAN_INTERVAL_MS) {
      uint32_t now = HAL_GetTick();
      float dt = (float)(now - last_can_tx_tick) / 1000.0f;
      if (dt > 0.1f)
        dt = 0.020f; /* Clamp anomalous timing glitch */
      last_can_tx_tick = now;

      if (robot_state == ROBOT_STATE_READY || active_left_rpm != 0 ||
          active_right_rpm != 0) {
        /* Apply independent software ramping with zero-crossing deceleration
         * clamp */
        ramped_left_rpm_f =
            Update_Ramp_Channel(ramped_left_rpm_f, (float)target_left_rpm, dt);
        ramped_right_rpm_f = Update_Ramp_Channel(ramped_right_rpm_f,
                                                 (float)target_right_rpm, dt);

        int32_t new_left = (int32_t)roundf(ramped_left_rpm_f);
        int32_t new_right = (int32_t)roundf(ramped_right_rpm_f);

        /* Only send CAN messages when in ready state, or ramping down to
         * deadstop */
        if (robot_state != ROBOT_STATE_ESTOP_LATCHED) {
          active_left_rpm = new_left;
          active_right_rpm = new_right;
          Motor_Set_Velocity_All(active_left_rpm, active_right_rpm);
        }
      }
    }

    /* Step 7: Periodic Telemetry Output (every 100 ms) */
    if (HAL_GetTick() - last_telemetry_tick >= TELEMETRY_INTERVAL_MS) {
      last_telemetry_tick = HAL_GetTick();
      Print_Telemetry();
    }

    /* Step 8: Blue User Button (B1 / PC13) on STM32 Nucleo for manual alarm
     * reset */
    static uint8_t b1_prev_state = GPIO_PIN_SET;
    uint8_t b1_state = HAL_GPIO_ReadPin(B1_GPIO_Port, B1_Pin);
    if (b1_state == GPIO_PIN_RESET && b1_prev_state == GPIO_PIN_SET) {
      Motor_Clear_Faults_And_Enable();
      target_left_rpm = 0;
      target_right_rpm = 0;
      ramped_left_rpm_f = 0.0f;
      ramped_right_rpm_f = 0.0f;
      active_left_rpm = 0;
      active_right_rpm = 0;
      robot_state = ROBOT_STATE_READY;
      printf("\r\n>>> [B1 BUTTON PRESSED] Manual Hardware Reset: Cleared ZLAC "
             "alarms & re-armed motors!\r\n\r\n");
    }
    b1_prev_state = b1_state;

    /* Step 9: Heartbeat LED (PA5 / LD2) */
    if (HAL_GetTick() - led_tick >= 500) {
      led_tick = HAL_GetTick();
      HAL_GPIO_TogglePin(LD2_GPIO_Port, LD2_Pin);
    }
  }
}

/* ==============================================================================
 * SECTION 5: 3-REGIME STEERING KINEMATICS, ANTI-SATURATION & NON-BLOCKING
 * RAMPING
 * ==============================================================================
 */

/**
 * @brief  Normalizes and conditions analog stick input with deadzone rescaling
 *         and exponential response curve.
 * @param  raw: Raw axis value normalized to -1.0 .. +1.0
 * @param  deadzone: Deadzone threshold (e.g. 0.08 for 8%)
 * @param  expo: Exponential curvature factor (0.0=linear, 1.0=cubic)
 * @retval Processed value -1.0 .. +1.0 (strictly 0.0f within deadzone)
 */
static float Process_Analog_Stick(float raw, float deadzone, float expo) {
  float abs_val = fabsf(raw);
  if (abs_val <= deadzone) {
    return 0.0f;
  }

  /* Linear rescaling to preserve full 0.0 to 1.0 usable output range */
  float scaled = (abs_val - deadzone) / (1.0f - deadzone);
  if (scaled > 1.0f)
    scaled = 1.0f;

  /* Exponential shaping for finer precision around neutral */
  float shaped = (1.0f - expo) * scaled + expo * (scaled * scaled * scaled);

  return (raw > 0.0f) ? shaped : -shaped;
}

/**
 * @brief  Maps raw controller inputs into chassis longitudinal velocity (vx)
 *         and yaw rate (wz) enforcing the 3-regime steering control model:
 *
 * 1. Straight Driving (Forward / Reverse):
 *    - Active when throttle is commanded (|raw_throttle| > STICK_DEADZONE)
 *      and steering stick is neutral (|raw_steer| <= STICK_DEADZONE).
 *    - Yaw rate is forced to wz = 0.0 rad/s.
 *
 * 2. Arc Turn While Moving (Sweeping Curve):
 *    - Active when BOTH throttle is non-zero (|vx| > 0.05 m/s) AND
 *      steering stick is deflected (|raw_steer| > STICK_DEADZONE).
 *    - Rolls smoothly through an arc with minimum turning radius clamp:
 *      |wz| <= |vx| / MIN_TURN_RADIUS (prevents inner wheel
 * reversal/scrubbing).
 *
 * 3. Turn-on-the-Spot (In-Place Pivot):
 *    - Allowed ONLY when BOTH conditions are met:
 *      a) Dedicated controller button (btn_spot_turn / LB / RB) is held (true).
 *      b) Steering stick is pushed past threshold (|raw_steer| >=
 * FULL_DEFLECTION_THRESH).
 *    - vx = 0.0 m/s, yaw rate capped at DEFAULT_TURN_OMEGA_RAD_S.
 *    - Safety Lockout: If btn_spot_turn is NOT held OR stick is below
 * threshold, stationary yaw is strictly locked out (wz = 0.0 rad/s).
 *
 * @param  raw_throttle:  Raw normalized throttle input [-1.0 .. +1.0]
 * @param  raw_steer:     Raw normalized steering input [-1.0 .. +1.0] (+ =
 * Right, - = Left)
 * @param  btn_spot_turn: Non-zero if dedicated spot-turn button/bumper is held
 * @param  out_vx:        Output commanded linear velocity in m/s
 * @param  out_wz:        Output commanded angular velocity in rad/s
 * @param  out_mode:      Output active Drive_Mode_t regime
 */
void Map_Controller_Inputs(float raw_throttle, float raw_steer,
                           uint8_t btn_spot_turn, float *out_vx, float *out_wz,
                           Drive_Mode_t *out_mode) {
  float vx = 0.0f;
  float wz = 0.0f;
  Drive_Mode_t mode = DRIVE_MODE_STOP;

  /* Maximum permissible linear speed in m/s based on g_motor_max_rpm */
  const float wheel_circ_m = 2.0f * 3.14159265f * ROBOT_WHEEL_RADIUS_M;
  const float max_linear_speed_m_s =
      ((float)g_motor_max_rpm * wheel_circ_m) / 60.0f;

  /* --------------------------------------------------------------------------
   * Step 1: Throttle Deadband & Linear Conditioning
   * --------------------------------------------------------------------------
   */
  float abs_th = fabsf(raw_throttle);
  if (abs_th > STICK_DEADZONE) {
    /* Scale linearly above deadzone to preserve full 0.0 .. 1.0 range */
    float th_scaled = (abs_th - STICK_DEADZONE) / (1.0f - STICK_DEADZONE);
    if (th_scaled > 1.0f)
      th_scaled = 1.0f;
    vx = (raw_throttle > 0.0f) ? (th_scaled * max_linear_speed_m_s)
                               : (-th_scaled * max_linear_speed_m_s);
  } else {
    /* Strict deadzone clamp to prevent zero-drift */
    vx = 0.0f;
  }

  /* --------------------------------------------------------------------------
   * Step 2: 3-Regime Steering Evaluation
   * --------------------------------------------------------------------------
   */
  float abs_steer = fabsf(raw_steer);
  uint8_t throttle_moving = (fabsf(vx) > 0.05f) ? 1 : 0;
  uint8_t steer_active = (abs_steer > STICK_DEADZONE) ? 1 : 0;

  if (throttle_moving) {
    if (!steer_active) {
      /* Regime 1: Straight Driving (Forward / Reverse) */
      mode = DRIVE_MODE_STRAIGHT;
      wz = 0.0f; /* Yaw rate forced to zero for perfectly straight tracking */
    } else {
      /* Regime 2: Arc Turn While Moving (Sweeping Curve) */
      mode = DRIVE_MODE_ARC_TURN;

      /* Condition steering stick with deadzone and exponential shaping */
      float shaped_steer_signed =
          Process_Analog_Stick(raw_steer, STICK_DEADZONE, STEERING_EXPO);

      /* Coordinate Convention: Left (raw_steer < 0) -> Turn Left
       *                        Right (raw_steer > 0) -> Turn Right */
      float unconstrained_wz = shaped_steer_signed * g_turn_angular_velocity;

      /* Enforce minimum turning radius clamp: |wz| <= |vx| / MIN_TURN_RADIUS */
      float max_wz = fabsf(vx) / MIN_TURN_RADIUS;
      if (fabsf(unconstrained_wz) > max_wz) {
        wz = (unconstrained_wz > 0.0f) ? max_wz : -max_wz;
      } else {
        wz = unconstrained_wz;
      }
    }
  } else {
    /* Chassis is stationary (or throttle within deadzone) */
    vx = 0.0f;

    /* Regime 3: Turn-on-the-Spot (In-Place Pivot) */
    if (steer_active) {
      mode = DRIVE_MODE_SPOT_TURN;
      float shaped_steer_signed =
          Process_Analog_Stick(raw_steer, STICK_DEADZONE, STEERING_EXPO);
      /* Left (raw_steer < 0) -> Turn Left (-wz), Right -> Turn Right (+wz) */
      wz = shaped_steer_signed * g_turn_angular_velocity;
    } else {
      /* Safety Lockout: Stationary yaw is strictly locked out (wz = 0.0) */
      mode = DRIVE_MODE_STOP;
      wz = 0.0f;
    }
  }

  if (out_vx)
    *out_vx = vx;
  if (out_wz)
    *out_wz = wz;
  if (out_mode)
    *out_mode = mode;
}

/**
 * @brief  Computes differential wheel RPM setpoints with Kinematic
 * Anti-Saturation.
 *
 * Kinematic Equations:
 *   v_L = vx - (wz * W) / 2
 *   v_R = vx + (wz * W) / 2
 *   RPM = (v * 60) / (2 * pi * r)
 *
 * Kinematic Anti-Saturation:
 *   If either wheel RPM exceeds MOTOR_MAX_RPM (22 RPM), scale both wheel RPMs
 *   proportionally by scale = MOTOR_MAX_RPM / max(|RPM_L|, |RPM_R|) to preserve
 *   the curvature radius and trajectory without clipping distortion.
 *
 * @param  vx:            Longitudinal linear velocity (m/s)
 * @param  wz:            Yaw angular velocity (rad/s)
 * @param  mode:          Current Drive_Mode_t regime
 * @param  out_left_rpm:  Output RPM target for left wheel pair
 * @param  out_right_rpm: Output RPM target for right wheel pair
 */
void Drive_UGV_With_Mode(float vx, float wz, Drive_Mode_t mode,
                         int32_t *out_left_rpm, int32_t *out_right_rpm) {
  if (mode == DRIVE_MODE_STOP) {
    if (out_left_rpm)
      *out_left_rpm = 0;
    if (out_right_rpm)
      *out_right_rpm = 0;
    return;
  }

  /* Mode-specific kinematic assertions */
  if (mode == DRIVE_MODE_STRAIGHT) {
    wz = 0.0f;
  } else if (mode == DRIVE_MODE_SPOT_TURN) {
    vx = 0.0f;
  }

  /* 1. Compute wheel linear velocities (m/s) */
  float half_track_wz = (wz * ROBOT_TRACK_WIDTH_M) / 2.0f;
  float v_left = vx - half_track_wz;
  float v_right = vx + half_track_wz;

  /* 2. Convert linear velocities to wheel RPM */
  const float wheel_circ_m = 2.0f * 3.14159265f * ROBOT_WHEEL_RADIUS_M;
  float rpm_left = (v_left * 60.0f) / wheel_circ_m;
  float rpm_right = (v_right * 60.0f) / wheel_circ_m;

  /* 3. Kinematic Anti-Saturation Proportional Scaling */
  float max_wheel_rpm = fmaxf(fabsf(rpm_left), fabsf(rpm_right));
  if (max_wheel_rpm > (float)g_motor_max_rpm && max_wheel_rpm > 0.0001f) {
    float scale = (float)g_motor_max_rpm / max_wheel_rpm;
    rpm_left *= scale;
    rpm_right *= scale;
  }

  /* Strict symmetry reinforcement */
  if (mode == DRIVE_MODE_STRAIGHT) {
    rpm_right = rpm_left; /* Strict symmetrical wheel output */
  } else if (mode == DRIVE_MODE_SPOT_TURN) {
    rpm_right = -rpm_left; /* Strict opposite rotation */
  }

  if (out_left_rpm)
    *out_left_rpm = (int32_t)roundf(rpm_left);
  if (out_right_rpm)
    *out_right_rpm = (int32_t)roundf(rpm_right);
}

/**
 * @brief  Backward-compatible wrapper integrating Map_Controller_Inputs()
 *         and Drive_UGV_With_Mode() into the existing firmware architecture.
 */
static void Calculate_Kinematics(uint8_t lt_pct, uint8_t rt_pct, float stick_x,
                                 float stick_y, uint16_t btns,
                                 int32_t *out_target_left,
                                 int32_t *out_target_right, float *out_v,
                                 float *out_omega) {
  /* 1. Extract raw throttle [-1.0 .. +1.0] */
  float raw_throttle = 0.0f;
  if (rt_pct > TRIGGER_DEADZONE_PCT && lt_pct > TRIGGER_DEADZONE_PCT) {
    raw_throttle = 0.0f; /* Simultaneous triggers cancel throttle */
  } else if (rt_pct > TRIGGER_DEADZONE_PCT) {
    raw_throttle = (float)rt_pct / 100.0f;
  } else if (lt_pct > TRIGGER_DEADZONE_PCT) {
    raw_throttle = -((float)lt_pct / 100.0f);
  }
#if (ENABLE_LEFT_STICK_THROTTLE == 1)
  else if (fabsf(stick_y) > STICK_DEADZONE) {
    raw_throttle = stick_y;
  }
#endif

  /* 2. Extract raw steering [-1.0 .. +1.0] from analog stick */
  float raw_steer = stick_x;

  /* 3. Extract spot turn button condition (LB or RB bumper held) */
  uint8_t btn_spot_turn = ((btns & BTN_SPOT_TURN) != 0) ? 1 : 0;

  /* 4. Map inputs through 3-regime controller */
  Drive_Mode_t mode = DRIVE_MODE_STOP;
  float vx = 0.0f, wz = 0.0f;
  Map_Controller_Inputs(raw_throttle, raw_steer, btn_spot_turn, &vx, &wz,
                        &mode);
  current_drive_mode = mode;
  commanded_linear_v_m_s = vx;

  /* 5. Differential drive kinematics & anti-saturation */
  Drive_UGV_With_Mode(vx, wz, mode, out_target_left, out_target_right);

  /* Output velocities in telemetry units (mm/s and rad/s) */
  if (out_v)
    *out_v = vx * 1000.0f;
  if (out_omega)
    *out_omega = wz;
}

/**
 * @brief  Smoothly ramps speed towards target rate, handling reversals cleanly.
 *         During direction reversal (+ to - or - to +), it actively decelerates
 *         through 0 into reverse without latching the state machine or dropping
 * frames.
 */
static float Update_Ramp_Channel(float current, float target, float dt) {
  if (dt <= 0.0f)
    return current;

  float accel_max = g_motor_accel_rpm_per_sec * dt;
  float decel_max = g_motor_decel_rpm_per_sec * dt;

  /* Case 1: Target is strictly 0.0f -> Active Deceleration to complete stop */
  if (target == 0.0f) {
    if (current > 0.0f) {
      current -= decel_max;
      if (current < 0.0f)
        current = 0.0f;
    } else if (current < 0.0f) {
      current += decel_max;
      if (current > 0.0f)
        current = 0.0f;
    }
    return current;
  }

  /* Case 2: Direction Reversal (+ to - or - to +) */
  /* Actively decelerate through zero into reverse without hanging or dropping
   * frames */
  if ((current > 0.0f && target < 0.0f) || (current < 0.0f && target > 0.0f)) {
    if (current > 0.0f) {
      current -= decel_max;
      if (current < 0.0f) {
        /* Crossed zero: immediately apply remaining step towards reverse target
         */
        float remainder = -current;
        current = -fminf(remainder, accel_max);
        if (current < target)
          current = target;
      }
    } else {
      current += decel_max;
      if (current > 0.0f) {
        /* Crossed zero: immediately apply remaining step towards forward target
         */
        float remainder = current;
        current = fminf(remainder, accel_max);
        if (current > target)
          current = target;
      }
    }
    return current;
  }

  /* Case 3: Same sign or accelerating from zero */
  if (fabsf(target) > fabsf(current)) {
    /* Accelerating in current direction */
    float diff = target - current;
    if (diff > accel_max)
      diff = accel_max;
    if (diff < -accel_max)
      diff = -accel_max;
    current += diff;
  } else {
    /* Decelerating towards smaller target of same sign */
    float diff = target - current;
    if (diff > decel_max)
      diff = decel_max;
    if (diff < -decel_max)
      diff = -decel_max;
    current += diff;
  }

  return current;
}

/* ==============================================================================
 * SECTION 6: MOTOR DRIVER DISPATCH & CONTROL (ALL 4 WHEELS)
 * ==============================================================================
 */

/**
 * @brief  Dispatches velocity command to both Node 1 (Front) and Node 2 (Rear)
 *         synchronously over CAN with non-blocking mailbox checks.
 *
 * Physical Motor Orientation & Polarity:
 *   - Channel 1 (Left Motors) : Negative RPM commanded over CAN produces
 * forward rotation.
 *   - Channel 2 (Right Motors): Positive RPM commanded over CAN produces
 * forward rotation.
 */
static void Motor_Set_Velocity_All(int32_t left_rpm, int32_t right_rpm) {
  /*
   * Node 1 (Front Axle): CH1 = Front Left (-left_rpm),  CH2 = Front Right
   * (+right_rpm) Node 2 (Rear Axle) : CH1 = Rear Left  (-left_rpm),  CH2 = Rear
   * Right (+right_rpm)
   */
  ZLAC8015D_SetVelocity_Node(ZLAC_NODE_ID_1, -left_rpm, right_rpm);
  HAL_Delay(2);
  ZLAC8015D_SetVelocity_Node(ZLAC_NODE_ID_2, -left_rpm, right_rpm);
}

/**
 * @brief  Quick-Stop (CiA 402 Command 0x0002) - Halts motor immediately
 */
static void Motor_Stop_Quick(void) {
  target_left_rpm = 0;
  target_right_rpm = 0;
  ramped_left_rpm_f = 0.0f;
  ramped_right_rpm_f = 0.0f;
  active_left_rpm = 0;
  active_right_rpm = 0;
  ZLAC8015D_EmergencyStop_Node(ZLAC_NODE_ID_1);
  HAL_Delay(2);
  ZLAC8015D_EmergencyStop_Node(ZLAC_NODE_ID_2);
}

/**
 * @brief  Controlled Stop - Commands 0 RPM while keeping drivers enabled
 */
static void Motor_Stop_Controlled(void) {
  target_left_rpm = 0;
  target_right_rpm = 0;
  ramped_left_rpm_f = 0.0f;
  ramped_right_rpm_f = 0.0f;
  active_left_rpm = 0;
  active_right_rpm = 0;
  Motor_Set_Velocity_All(0, 0);
}

/**
 * @brief  Clears fault latches, reconfigures Velocity Mode, and re-enables
 * operation
 */
static void Motor_Clear_Faults_And_Enable(void) {
  /* Step 1: Clear any fault/alarm latch */
  ZLAC8015D_ClearError_Node(ZLAC_NODE_ID_1);
  HAL_Delay(10);
  ZLAC8015D_ClearError_Node(ZLAC_NODE_ID_2);
  HAL_Delay(20);

  /* Step 2: Ensure Async Velocity Mode is configured (0x200F=0, 0x6060=3,
   * Accel/Decel) */
  ZLAC8015D_Init_Velocity_Mode_Async_Node(ZLAC_NODE_ID_1, DRIVER_HW_ACCEL_MS,
                                          DRIVER_HW_DECEL_MS);
  HAL_Delay(20);
  ZLAC8015D_Init_Velocity_Mode_Async_Node(ZLAC_NODE_ID_2, DRIVER_HW_ACCEL_MS,
                                          DRIVER_HW_DECEL_MS);
  HAL_Delay(20);

  /* Step 3: Arm drivers into CiA 402 Operation Enabled */
  ZLAC8015D_Enable_Node(ZLAC_NODE_ID_1);
  HAL_Delay(10);
  ZLAC8015D_Enable_Node(ZLAC_NODE_ID_2);
  HAL_Delay(20);
}

/**
 * @brief  Probes a driver node over CAN via SDO read of Statusword (0x6041)
 */
static uint8_t Verify_CAN_Node(uint8_t nodeId) {
  CAN_TxHeaderTypeDef txHeader;
  uint8_t txData[8] = {0};
  uint32_t txMailbox;

  txHeader.StdId = 0x600 + nodeId;
  txHeader.ExtId = 0x00;
  txHeader.RTR = CAN_RTR_DATA;
  txHeader.IDE = CAN_ID_STD;
  txHeader.DLC = 8;
  txHeader.TransmitGlobalTime = DISABLE;

  txData[0] = 0x40; /* SDO Upload Request */
  txData[1] = 0x41; /* Object 0x6041 Low */
  txData[2] = 0x60; /* Object 0x6041 High */
  txData[3] = 0x00; /* Sub-index 0 */

  if (HAL_CAN_AddTxMessage(&hcan1, &txHeader, txData, &txMailbox) != HAL_OK) {
    return 0;
  }

  uint32_t start = HAL_GetTick();
  while (HAL_GetTick() - start < 60) {
    while (HAL_CAN_GetRxFifoFillLevel(&hcan1, CAN_RX_FIFO0) > 0) {
      CAN_RxHeaderTypeDef rxHeader;
      uint8_t rxData[8] = {0};
      if (HAL_CAN_GetRxMessage(&hcan1, CAN_RX_FIFO0, &rxHeader, rxData) ==
          HAL_OK) {
        if (rxHeader.StdId == (0x580 + nodeId)) {
          uint16_t sw = (uint16_t)rxData[4] | ((uint16_t)rxData[5] << 8);
          printf("  >>> [CAN OK] Node %d acknowledged (Statusword: 0x%04X)\r\n",
                 nodeId, sw);
          ZLAC8015D_ProcessRxMessage(&rxHeader, rxData);
          return 1;
        }
      }
    }
  }
  printf("  >>> [CAN WARNING] Node %d did not respond to probe!\r\n", nodeId);
  return 0;
}

/* ==============================================================================
 * SECTION 7: USB GAMEPAD PARSER & DIAGNOSTICS
 * ==============================================================================
 */

/**
 * @brief  Parses raw HID report into normalized triggers, sticks, and buttons.
 * @retval 1 if valid known report, 0 if malformed/unrecognized (watchdog NOT
 * fed)
 */
static uint8_t Parse_Gamepad_Report(uint8_t *data, uint16_t len,
                                    uint8_t *out_lt_pct, uint8_t *out_rt_pct,
                                    float *out_stick_x, float *out_stick_y,
                                    uint16_t *out_btns) {
  *out_lt_pct = 0;
  *out_rt_pct = 0;
  *out_stick_x = 0.0f;
  *out_stick_y = 0.0f;
  *out_btns = 0;

  if (len < 4)
    return 0;

#if (DEBUG_RAW_GAMEPAD_REPORTS == 1)
  printf("[RAW HID %2d B]: ", len);
  for (uint16_t i = 0; i < len && i < 16; i++) {
    printf("%02X ", data[i]);
  }
  printf("\r\n");
#endif

  /* 7.1 XInput Format (GameSir Wireless Dongle / PC Mode) */
  if (data[0] == 0x00 && data[1] == 0x14 && len >= 14) {
    uint8_t dpad = data[2];
    uint8_t btns = data[3];
    uint8_t lt = data[4];
    uint8_t rt = data[5];
    int16_t raw_lx = (int16_t)((uint16_t)data[6] | ((uint16_t)data[7] << 8));
    int16_t raw_ly = (int16_t)((uint16_t)data[8] | ((uint16_t)data[9] << 8));

    *out_lt_pct = (uint8_t)((uint32_t)lt * 100 / 255);
    *out_rt_pct = (uint8_t)((uint32_t)rt * 100 / 255);

    /* Normalize stick to -1.0 .. +1.0 */
    float norm_x = (float)raw_lx / 32768.0f;
    float norm_y = (float)raw_ly / 32768.0f;
    if (norm_x > 1.0f)
      norm_x = 1.0f;
    if (norm_x < -1.0f)
      norm_x = -1.0f;
    if (norm_y > 1.0f)
      norm_y = 1.0f;
    if (norm_y < -1.0f)
      norm_y = -1.0f;
    *out_stick_x = norm_x;
    *out_stick_y = norm_y;

    uint16_t b = 0;
    if (btns & 0x10)
      b |= BTN_A;
    if (btns & 0x20)
      b |= BTN_B;
    if (btns & 0x40)
      b |= BTN_X;
    if (btns & 0x80)
      b |= BTN_Y;
    if (btns & 0x01)
      b |= BTN_LB;
    if (btns & 0x02)
      b |= BTN_RB;
    if (dpad & 0x10)
      b |= BTN_START;
    if (dpad & 0x20)
      b |= BTN_BACK;

    if (dpad & 0x01)
      b |= BTN_DPAD_UP;
    if (dpad & 0x02)
      b |= BTN_DPAD_DOWN;
    if (dpad & 0x04)
      b |= BTN_DPAD_LEFT;
    if (dpad & 0x08)
      b |= BTN_DPAD_RIGHT;

    *out_btns = b;
    return 1;
  }

  /* 7.2 Switch Pro / Android Mode Format */
  if ((data[0] == 0x30 || data[0] == 0x21) && len >= 12) {
    uint8_t b_right = data[3];
    uint8_t b_left = data[5];

    *out_rt_pct = (b_right & 0x80) ? 100 : 0;
    *out_lt_pct = (b_left & 0x80) ? 100 : 0;

    uint16_t lx_raw = (uint16_t)data[6] | (((uint16_t)data[7] & 0x0F) << 8);
    uint16_t ly_raw =
        (((uint16_t)data[7] >> 4) & 0x0F) | (((uint16_t)data[8]) << 4);

    float norm_x = ((float)lx_raw - 2048.0f) / 2048.0f;
    float norm_y = ((float)ly_raw - 2048.0f) / 2048.0f;
    if (norm_x > 1.0f)
      norm_x = 1.0f;
    if (norm_x < -1.0f)
      norm_x = -1.0f;
    if (norm_y > 1.0f)
      norm_y = 1.0f;
    if (norm_y < -1.0f)
      norm_y = -1.0f;
    *out_stick_x = norm_x;
    *out_stick_y = norm_y;

    uint16_t b = 0;
    if (b_right & 0x08)
      b |= BTN_A;
    if (b_right & 0x04)
      b |= BTN_B;
    if (b_right & 0x02)
      b |= BTN_X;
    if (b_right & 0x01)
      b |= BTN_Y;

    if (b_left & 0x02)
      b |= BTN_DPAD_UP;
    if (b_left & 0x01)
      b |= BTN_DPAD_DOWN;
    if (b_left & 0x08)
      b |= BTN_DPAD_LEFT;
    if (b_left & 0x04)
      b |= BTN_DPAD_RIGHT;

    *out_btns = b;
    return 1;
  }

  /* 7.3 Generic HID Gamepad Format (DirectInput / Standard HID) */
  if (len >= 6) {
    uint8_t offset = (data[0] == 0x01 || data[0] == 0x02) ? 1 : 0;
    if (len >= (offset + 4)) {
      uint8_t lx = data[offset + 0];
      uint8_t ly = data[offset + 1];
      uint8_t btn1 = (len > offset + 4) ? data[offset + 4] : 0;
      uint8_t btn2 = (len > offset + 5) ? data[offset + 5] : 0;

      float norm_x = ((float)lx - 128.0f) / 128.0f;
      float norm_y = -((float)ly - 128.0f) / 128.0f;
      if (norm_x > 1.0f)
        norm_x = 1.0f;
      if (norm_x < -1.0f)
        norm_x = -1.0f;
      if (norm_y > 1.0f)
        norm_y = 1.0f;
      if (norm_y < -1.0f)
        norm_y = -1.0f;
      *out_stick_x = norm_x;
      *out_stick_y = norm_y;

      *out_rt_pct = (btn2 & 0x02) ? 100 : 0;
      *out_lt_pct = (btn2 & 0x01) ? 100 : 0;

      uint16_t b = 0;
      if (btn1 & 0x10)
        b |= BTN_A;
      if (btn1 & 0x20)
        b |= BTN_B;

      uint8_t hat = (len > offset + 2) ? (data[offset + 2] & 0x0F) : 0x0F;
      if (hat == 0 || hat == 1 || hat == 7)
        b |= BTN_DPAD_UP;
      if (hat == 3 || hat == 4 || hat == 5)
        b |= BTN_DPAD_DOWN;
      if (hat == 5 || hat == 6 || hat == 7)
        b |= BTN_DPAD_LEFT;
      if (hat == 1 || hat == 2 || hat == 3)
        b |= BTN_DPAD_RIGHT;

      *out_btns = b;
      return 1;
    }
  }

  return 0; /* Unrecognized packet format */
}

/* ==============================================================================
 * SECTION 8: UART TELEMETRY & PRINTF RETARGETING
 * ==============================================================================
 */

/**
 * @brief  Retargets C standard library printf to USART2 (ST-Link VCP @ 115200
 * Baud)
 */
int __io_putchar(int ch) {
  if (ch == '\n') {
    uint8_t cr = '\r';
    HAL_UART_Transmit(&huart2, &cr, 1, 10);
  }
  HAL_UART_Transmit(&huart2, (uint8_t *)&ch, 1, 10);
  return ch;
}

static void Print_Telemetry(void) {
  const char *state_str = "INIT ";
  switch (robot_state) {
  case ROBOT_STATE_READY:
    state_str = "READY";
    break;
  case ROBOT_STATE_ESTOP_LATCHED:
    state_str = "STOP ";
    break;
  case ROBOT_STATE_WATCHDOG_STOP:
    state_str = "WD_TO";
    break;
  case ROBOT_STATE_DISCONNECTED:
    state_str = "NO_CT";
    break;
  case ROBOT_STATE_CAN_FAULT:
    state_str = "CAN_F";
    break;
  default:
    break;
  }

  ZLAC_NodeStatus_t *n1 = ZLAC8015D_GetNodeStatus(ZLAC_NODE_ID_1);
  ZLAC_NodeStatus_t *n2 = ZLAC8015D_GetNodeStatus(ZLAC_NODE_ID_2);
  char n1_stat = (n1 && n1->online) ? (n1->has_fault ? 'E' : 'O') : 'X';
  char n2_stat = (n2 && n2->online) ? (n2->has_fault ? 'E' : 'O') : 'X';

  uint32_t wd_ms = (last_valid_report_tick > 0)
                       ? (HAL_GetTick() - last_valid_report_tick)
                       : 999;
  if (wd_ms > 999)
    wd_ms = 999;

  float v_m_s = commanded_linear_v_mm_s / 1000.0f;
  char v_sign = (v_m_s < -0.001f) ? '-' : '+';
  float abs_v = fabsf(v_m_s);
  int32_t v_int = (int32_t)abs_v;
  int32_t v_cent = (int32_t)roundf((abs_v - (float)v_int) * 100.0f);
  if (v_cent >= 100) {
    v_int++;
    v_cent = 0;
  }

  int32_t w_crad = (int32_t)roundf(commanded_omega_rad_s * 100.0f);
  int32_t stk_pct = (int32_t)roundf(current_stick_x_norm * 100.0f);

  const char *mode_str = "STP";
  switch (current_drive_mode) {
  case DRIVE_MODE_STRAIGHT:
    mode_str = "STR";
    break;
  case DRIVE_MODE_ARC_TURN:
    mode_str = "ARC";
    break;
  case DRIVE_MODE_SPOT_TURN:
    mode_str = "SPT";
    break;
  default:
    mode_str = "STP";
    break;
  }

  printf("[%s|%s] v:%c%ld.%02ld m/s w:%+2ld.%02ld | L:%+3ld R:%+3ld (Tgt:%+3ld "
         "%+3ld) | StkX:%+4ld%% RT:%3d%% LT:%3d%% | CAN:N1[%c] N2[%c] | [Cfg:%ldRPM/%.1frad] "
         "WD:%3lums\r\n",
         state_str, mode_str, v_sign, v_int, v_cent, w_crad / 100,
         (w_crad < 0 ? -w_crad : w_crad) % 100, active_left_rpm,
         active_right_rpm, target_left_rpm, target_right_rpm, stk_pct,
         current_rt_pct, current_lt_pct, n1_stat, n2_stat,
         (long)g_motor_max_rpm, g_turn_angular_velocity, wd_ms);
}

/* ==============================================================================
 * SECTION 9: USB HOST CALLBACKS & CAN RX HANDLERS
 * ==============================================================================
 */

static void USBH_UserProcess(USBH_HandleTypeDef *phost, uint8_t id) {
  switch (id) {
  case HOST_USER_CLASS_ACTIVE:
    printf("\r\n>>> [USB] Controller Dongle Attached & Class Active!\r\n");
    printf(">>> Press [A] (with controls neutral) to arm robot.\r\n\r\n");
    robot_state = ROBOT_STATE_WATCHDOG_STOP;
    break;

  case HOST_USER_DISCONNECTION:
    printf("\r\n>>> [USB] Controller Dongle Disconnected! Immediate Fail-Safe "
           "Stop.\r\n\r\n");
    robot_state = ROBOT_STATE_DISCONNECTED;
    Motor_Stop_Controlled();
    break;

  default:
    break;
  }
}

void USBH_HID_EventCallback(USBH_HandleTypeDef *phost) {
  HID_HandleTypeDef *HID_Handle =
      (HID_HandleTypeDef *)phost->pActiveClass->pData;
  if (HID_Handle != NULL && HID_Handle->pData != NULL) {
    uint16_t len = HID_Handle->length;
    if (len > sizeof(last_report.raw)) {
      len = sizeof(last_report.raw);
    }
    memcpy(last_report.raw, HID_Handle->pData, len);
    last_report.len = len;
    new_report_flag = 1;
  }
}

static void Process_Incoming_CAN(void) {
  while (HAL_CAN_GetRxFifoFillLevel(&hcan1, CAN_RX_FIFO0) > 0) {
    CAN_RxHeaderTypeDef rxHeader;
    uint8_t rxData[8] = {0};
    if (HAL_CAN_GetRxMessage(&hcan1, CAN_RX_FIFO0, &rxHeader, rxData) ==
        HAL_OK) {
      ZLAC8015D_ProcessRxMessage(&rxHeader, rxData);
    }
  }

  /* Monitor for CAN peripheral bus-off or severe error flags */
  uint32_t can_err = HAL_CAN_GetError(&hcan1);
  if (can_err & HAL_CAN_ERROR_BOF) {
    /* Bus-off recovery */
    robot_state = ROBOT_STATE_CAN_FAULT;
    Motor_Stop_Controlled();
    printf("\r\n>>> [CAN ERROR] CAN1 Bus-Off detected! Resetting "
           "peripheral...\r\n");
    HAL_CAN_ResetError(&hcan1);
  }
}

/* ==============================================================================
 * SECTION 10: PERIPHERAL & CLOCK INITIALIZATION
 * ==============================================================================
 */

static void MX_CAN1_Init(void) {
  CAN_FilterTypeDef sFilterConfig = {0};

  /*
   * CAN1 Timing Calculation:
   * Clock Source : APB1 Peripheral Clock = 42 MHz
   * Prescaler    : 6 -> CAN Time Quantum (tq) = 6 / 42 MHz = 142.857 ns
   * Bit Timing   : 1 tq (Sync) + 10 tq (TimeSeg1) + 3 tq (TimeSeg2) = 14 tq
   * Nominal Bit Rate : 42 MHz / (6 * 14) = 500,000 bps = 500 kbps
   * Sample Point : (1 + 10) / 14 = 78.57% (Within CiA 301 recommended 75-87.5%)
   */
  hcan1.Instance = CAN1;
  hcan1.Init.Prescaler = 6;
  hcan1.Init.Mode = CAN_MODE_NORMAL;
  hcan1.Init.SyncJumpWidth = CAN_SJW_1TQ;
  hcan1.Init.TimeSeg1 = CAN_BS1_10TQ;
  hcan1.Init.TimeSeg2 = CAN_BS2_3TQ;
  hcan1.Init.TimeTriggeredMode = DISABLE;
  hcan1.Init.AutoBusOff = ENABLE;
  hcan1.Init.AutoWakeUp = DISABLE;
  hcan1.Init.AutoRetransmission =
      DISABLE; /* Prevents bus congestion if node missing */
  hcan1.Init.ReceiveFifoLocked = DISABLE;
  hcan1.Init.TransmitFifoPriority = DISABLE;

  if (HAL_CAN_Init(&hcan1) != HAL_OK) {
    Error_Handler();
  }

  sFilterConfig.FilterBank = 0;
  sFilterConfig.FilterMode = CAN_FILTERMODE_IDMASK;
  sFilterConfig.FilterScale = CAN_FILTERSCALE_32BIT;
  sFilterConfig.FilterIdHigh = 0x0000;
  sFilterConfig.FilterIdLow = 0x0000;
  sFilterConfig.FilterMaskIdHigh = 0x0000;
  sFilterConfig.FilterMaskIdLow = 0x0000;
  sFilterConfig.FilterFIFOAssignment = CAN_RX_FIFO0;
  sFilterConfig.FilterActivation = CAN_FILTER_ENABLE;
  sFilterConfig.SlaveStartFilterBank = 14;

  if (HAL_CAN_ConfigFilter(&hcan1, &sFilterConfig) != HAL_OK ||
      HAL_CAN_Start(&hcan1) != HAL_OK) {
    Error_Handler();
  }
}

static void MX_USART2_UART_Init(void) {
  huart2.Instance = USART2;
  huart2.Init.BaudRate = 115200;
  huart2.Init.WordLength = UART_WORDLENGTH_8B;
  huart2.Init.StopBits = UART_STOPBITS_1;
  huart2.Init.Parity = UART_PARITY_NONE;
  huart2.Init.Mode = UART_MODE_TX_RX;
  huart2.Init.HwFlowCtl = UART_HWCONTROL_NONE;
  huart2.Init.OverSampling = UART_OVERSAMPLING_16;

  if (HAL_UART_Init(&huart2) != HAL_OK) {
    Error_Handler();
  }
}

/**
 * @brief  System Clock Configuration
 *
 * Current Baseline (HSI RC Oscillator):
 *   - HSI Oscillator    : 16 MHz
 *   - PLLM = 16, PLLN = 336, PLLP = 4 -> System Clock (SYSCLK) = 84 MHz
 *   - AHB Prescaler     : DIV1 -> HCLK = 84 MHz
 *   - APB1 Prescaler    : DIV2 -> PCLK1 = 42 MHz (Feeds CAN1 and USART2)
 *   - APB2 Prescaler    : DIV1 -> PCLK2 = 84 MHz
 *   - PLLQ = 7          : PLL48CLK = 336 / 7 = 48 MHz (Feeds USB OTG FS)
 *
 * USB Full-Speed Clock Compliance Note:
 *   USB 2.0 Full-Speed standard mandates clock frequency accuracy within
 * +/-0.25% (+/-2500 ppm). The internal HSI oscillator on STM32F446RE has
 * typical tolerance of +/-1.0% at 25 deg C and +/-3.0% over operating
 * temperature, exceeding the USB FS specification. While HSI operates reliably
 * on a workbench with tolerant dongles, an external 8 MHz HSE crystal (ST-LINK
 * MCO or onboard crystal) should be configured for production deployments to
 * guarantee 100% USB FS clock compliance.
 */
void SystemClock_Config(void) {
  RCC_OscInitTypeDef RCC_OscInitStruct = {0};
  RCC_ClkInitTypeDef RCC_ClkInitStruct = {0};

  __HAL_RCC_PWR_CLK_ENABLE();
  __HAL_PWR_VOLTAGESCALING_CONFIG(PWR_REGULATOR_VOLTAGE_SCALE3);

  RCC_OscInitStruct.OscillatorType = RCC_OSCILLATORTYPE_HSI;
  RCC_OscInitStruct.HSIState = RCC_HSI_ON;
  RCC_OscInitStruct.HSICalibrationValue = RCC_HSICALIBRATION_DEFAULT;
  RCC_OscInitStruct.PLL.PLLState = RCC_PLL_ON;
  RCC_OscInitStruct.PLL.PLLSource = RCC_PLLSOURCE_HSI;
  RCC_OscInitStruct.PLL.PLLM = 16;
  RCC_OscInitStruct.PLL.PLLN = 336;
  RCC_OscInitStruct.PLL.PLLP = RCC_PLLP_DIV4; /* 84 MHz SysClk */
  RCC_OscInitStruct.PLL.PLLQ = 7;             /* 48 MHz USB Clock */
  RCC_OscInitStruct.PLL.PLLR = 2;
  if (HAL_RCC_OscConfig(&RCC_OscInitStruct) != HAL_OK) {
    Error_Handler();
  }

  RCC_ClkInitStruct.ClockType = RCC_CLOCKTYPE_HCLK | RCC_CLOCKTYPE_SYSCLK |
                                RCC_CLOCKTYPE_PCLK1 | RCC_CLOCKTYPE_PCLK2;
  RCC_ClkInitStruct.SYSCLKSource = RCC_SYSCLKSOURCE_PLLCLK;
  RCC_ClkInitStruct.AHBCLKDivider = RCC_SYSCLK_DIV1;
  RCC_ClkInitStruct.APB1CLKDivider = RCC_HCLK_DIV2; /* 42 MHz APB1 */
  RCC_ClkInitStruct.APB2CLKDivider = RCC_HCLK_DIV1;

  if (HAL_RCC_ClockConfig(&RCC_ClkInitStruct, FLASH_LATENCY_2) != HAL_OK) {
    Error_Handler();
  }

  SystemCoreClockUpdate();
}

static void MX_GPIO_Init(void) {
  GPIO_InitTypeDef GPIO_InitStruct = {0};

  __HAL_RCC_GPIOA_CLK_ENABLE();
  __HAL_RCC_GPIOB_CLK_ENABLE();
  __HAL_RCC_GPIOC_CLK_ENABLE();

  HAL_GPIO_WritePin(LD2_GPIO_Port, LD2_Pin, GPIO_PIN_RESET);

  /* User LED LD2: PA5 */
  GPIO_InitStruct.Pin = LD2_Pin;
  GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_LOW;
  HAL_GPIO_Init(LD2_GPIO_Port, &GPIO_InitStruct);

  /* User Blue Button B1: PC13 */
  GPIO_InitStruct.Pin = B1_Pin;
  GPIO_InitStruct.Mode = GPIO_MODE_INPUT;
  GPIO_InitStruct.Pull = GPIO_NOPULL; /* External pull-up on Nucleo board */
  HAL_GPIO_Init(B1_GPIO_Port, &GPIO_InitStruct);

  /* Stepper Motor (TB6600): PC2 (PUL) & PC3 (DIR) in 5V Sinking Open-Drain */
  HAL_GPIO_WritePin(STEPPER_PUL_PORT, STEPPER_PUL_PIN | STEPPER_DIR_PIN, GPIO_PIN_SET);
  GPIO_InitStruct.Pin = STEPPER_PUL_PIN | STEPPER_DIR_PIN;
  GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_OD;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_VERY_HIGH;
  HAL_GPIO_Init(GPIOC, &GPIO_InitStruct);
}

void HAL_CAN_MspInit(CAN_HandleTypeDef *hcan) {
  GPIO_InitTypeDef GPIO_InitStruct = {0};
  if (hcan->Instance == CAN1) {
    __HAL_RCC_CAN1_CLK_ENABLE();
    __HAL_RCC_GPIOB_CLK_ENABLE();

    GPIO_InitStruct.Pin = CAN_RX_PIN | CAN_TX_PIN;
    GPIO_InitStruct.Mode = GPIO_MODE_AF_PP;
    GPIO_InitStruct.Pull = GPIO_NOPULL;
    GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_VERY_HIGH;
    GPIO_InitStruct.Alternate = GPIO_AF9_CAN1;
    HAL_GPIO_Init(GPIOB, &GPIO_InitStruct);
  }
}

void HAL_UART_MspInit(UART_HandleTypeDef *huart) {
  GPIO_InitTypeDef GPIO_InitStruct = {0};
  if (huart->Instance == USART2) {
    __HAL_RCC_USART2_CLK_ENABLE();
    __HAL_RCC_GPIOA_CLK_ENABLE();

    GPIO_InitStruct.Pin = USART_TX_Pin | USART_RX_Pin;
    GPIO_InitStruct.Mode = GPIO_MODE_AF_PP;
    GPIO_InitStruct.Pull = GPIO_NOPULL;
    GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_VERY_HIGH;
    GPIO_InitStruct.Alternate = GPIO_AF7_USART2;
    HAL_GPIO_Init(GPIOA, &GPIO_InitStruct);
  }
}

void Error_Handler(void) {
  __disable_irq();
  while (1) {
    HAL_GPIO_TogglePin(LD2_GPIO_Port, LD2_Pin);
    for (volatile int i = 0; i < 200000; i++)
      ;
  }
}
