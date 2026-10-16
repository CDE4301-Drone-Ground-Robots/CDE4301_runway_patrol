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
#define USE_POWER_PRESET_3 /* ACTIVE: 33V 6A Benchtop Supply (Low Current /    \
                              Arc Turns) */
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
#define ENABLE_LEFT_STICK_THROTTLE                                             \
  0 /* 0=Triggers only for throttle, stick for steering */

#elif defined(USE_POWER_PRESET_3)
/* ------------------------------------------------------------------------------
 * PRESET 3: 33V 6A Benchtop Power Supply (Max 198W Total / ~1.5A per Motor)
 * ------------------------------------------------------------------------------
 */
#define MOTOR_MAX_RPM                                                          \
  15 /* 15 RPM (~0.20 m/s) to keep total power well under 198W */
#define MOTOR_ACCEL_RPM_PER_SEC                                                \
  6.0f /* Smooth 2.5s ramp: completely flattens inrush current */
#define MOTOR_DECEL_RPM_PER_SEC                                                \
  6.0f /* Gentle decel: stops regenerative overvoltage trip */
#define DRIVER_HW_ACCEL_MS 500 /* Internal driver profile: 500 ms */
#define DRIVER_HW_DECEL_MS 600 /* Internal driver profile: 600 ms */
#define DEFAULT_TURN_OMEGA_RAD_S                                               \
  0.25f /* Low-torque turn (~3.5 RPM delta) to prevent OCP trip */
#define ENABLE_LEFT_STICK_THROTTLE                                             \
  0 /* 0=Triggers only for throttle, stick for steering */

#else
#error                                                                         \
    "No power preset selected! Please uncomment either USE_POWER_PRESET_1 or USE_POWER_PRESET_3."
#endif

/* Robot Geometry */
#define ROBOT_TRACK_WIDTH_MM                                                   \
  381.2f /* Distance between left & right wheels (W) */
#define ROBOT_WHEELBASE_MM 324.0f    /* Distance between front & rear axles (L/W = 0.85) */
#define ROBOT_WHEEL_RADIUS_MM 131.5f /* Wheel radius (R = 263mm diameter / 2)  \
                                      */

/* Steering & Controller Sensitivity */
#define STICK_DEADZONE_NORM 0.08f /* 8% stick deadzone */
#define TRIGGER_DEADZONE_PCT 3    /* 3% trigger deadzone */
#define STEERING_EXPO                                                          \
  0.30f /* Exponential curve factor (0.0=linear, 0.3=soft center) */

/* Timing & Safety Thresholds */
#define CONTROLLER_TIMEOUT_MS                                                  \
  250 /* Fail-safe stop if no valid report for 250 ms */
#define MOTOR_CAN_INTERVAL_MS                                                  \
  25 /* Send CAN velocity commands every 25 ms (40 Hz) */
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

typedef struct {
  uint8_t raw[64];
  uint16_t len;
  uint8_t valid;
} Gamepad_Report_t;

/* Global Adjustable Motion Variables */
volatile float g_turn_angular_velocity = DEFAULT_TURN_OMEGA_RAD_S;
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
  printf("  Limits     : Max Wheel Speed = +/-%d RPM | Omega = %.2f rad/s\r\n",
         MOTOR_MAX_RPM, g_turn_angular_velocity);
  printf("  Ramp Rates : Accel = %.1f RPM/s | Decel = %.1f RPM/s\r\n",
         g_motor_accel_rpm_per_sec, g_motor_decel_rpm_per_sec);
  printf("  Watchdog   : %d ms timeout on wireless controller reports\r\n",
         CONTROLLER_TIMEOUT_MS);
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
            (fabsf(current_stick_x_norm) < 0.01f) &&
            (fabsf(current_stick_y_norm) < 0.01f) &&
            ((current_btns & (BTN_DPAD_LEFT | BTN_DPAD_RIGHT | BTN_DPAD_UP |
                              BTN_DPAD_DOWN)) == 0);

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
        Motor_Stop_Controlled();
        printf(
            "\r\n>>> [WATCHDOG FAIL-SAFE] Gamepad report timeout (>%d ms)!\r\n",
            CONTROLLER_TIMEOUT_MS);
        printf("    Motors stopped. Return controls to neutral and press [A] "
               "to re-arm.\r\n\r\n");
      }
    }

    /* Step 5: Kinematics & Setpoint Calculation */
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
    }

    /* Step 6: Periodic Ramping & CAN Velocity Dispatcher (every 25 ms) */
    if (HAL_GetTick() - last_can_tx_tick >= MOTOR_CAN_INTERVAL_MS) {
      uint32_t now = HAL_GetTick();
      float dt = (float)(now - last_can_tx_tick) / 1000.0f;
      if (dt > 0.1f)
        dt = 0.025f; /* Clamp anomalous timing glitch */
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
 * SECTION 5: PROPORTIONAL DIFFERENTIAL DRIVE KINEMATICS & RAMPING
 * ==============================================================================
 */

/**
 * @brief  Normalizes and conditions analog stick input with deadzone rescaling
 * & exponential response
 * @param  raw: Raw axis value normalized to -1.0 .. +1.0
 * @param  deadzone: Deadzone threshold (e.g. 0.08 for 8%)
 * @param  expo: Exponential curvature factor (0.0=linear, 1.0=cubic)
 * @retval Processed value -1.0 .. +1.0
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

  /* Optional exponential shaping for finer precision around neutral */
  float shaped = (1.0f - expo) * scaled + expo * (scaled * scaled * scaled);

  return (raw > 0.0f) ? shaped : -shaped;
}

/**
 * @brief  Computes longitudinal linear velocity (v) and angular velocity
 * (omega), applies differential equations, and performs steering-priority
 * saturation.
 *
 * Coordinate Convention (Standard ROS / ISO 8855):
 *   +X = Forward, +Y = Left, +Z = Up
 *   Positive omega (rad/s) = Counter-Clockwise (CCW) yaw = Turning LEFT
 *   Negative omega (rad/s) = Clockwise (CW) yaw         = Turning RIGHT
 *
 * Differential Equations:
 *   v_L = v - (omega * W) / 2
 *   v_R = v + (omega * W) / 2
 *
 * Linear velocity to Wheel RPM:
 *   RPM = (v_mm_s * 60) / (2 * pi * R_mm)
 */
static void Calculate_Kinematics(uint8_t lt_pct, uint8_t rt_pct, float stick_x,
                                 float stick_y, uint16_t btns,
                                 int32_t *out_target_left,
                                 int32_t *out_target_right, float *out_v,
                                 float *out_omega) {
  float v_lin_mm_s = 0.0f;
  float omega_rad_s = 0.0f;

  /* 1. Longitudinal Throttle Calculation */
  /* Safety Check: Simultaneous RT and LT cancels all throttle */
  if (lt_pct > TRIGGER_DEADZONE_PCT && rt_pct > TRIGGER_DEADZONE_PCT) {
    v_lin_mm_s = 0.0f;
  } else if (rt_pct > TRIGGER_DEADZONE_PCT) {
    /* Forward movement: Proportional to RT (0 to +30 RPM) */
    float throttle_norm = (float)rt_pct / 100.0f;
    float max_linear_speed =
        ((float)MOTOR_MAX_RPM * 2.0f * 3.14159265f * ROBOT_WHEEL_RADIUS_MM) /
        60.0f;
    v_lin_mm_s = throttle_norm * max_linear_speed;
  } else if (lt_pct > TRIGGER_DEADZONE_PCT) {
    /* Reverse movement: Proportional to LT (0 to -30 RPM) */
    float throttle_norm = (float)lt_pct / 100.0f;
    float max_linear_speed =
        ((float)MOTOR_MAX_RPM * 2.0f * 3.14159265f * ROBOT_WHEEL_RADIUS_MM) /
        60.0f;
    v_lin_mm_s = -throttle_norm * max_linear_speed;
  }
#if (ENABLE_LEFT_STICK_THROTTLE == 1)
  else if (fabsf(stick_y) > 0.01f) {
    /* Optional left stick Y throttle backup */
    float max_linear_speed =
        ((float)MOTOR_MAX_RPM * 2.0f * 3.14159265f * ROBOT_WHEEL_RADIUS_MM) /
        60.0f;
    v_lin_mm_s = stick_y * max_linear_speed;
  }
#endif
  else {
    v_lin_mm_s = 0.0f;
  }

  /* 2. Angular Velocity Calculation (Primary: Stick X, Secondary: D-Pad) */
  if (fabsf(stick_x) > 0.01f) {
    /*
     * Proportional Stick Steering:
     * stick_x > 0 (Right) -> Commanded CW yaw (omega < 0)
     * stick_x < 0 (Left)  -> Commanded CCW yaw (omega > 0)
     */
    omega_rad_s = -stick_x * g_turn_angular_velocity;
  } else if (btns & BTN_DPAD_RIGHT) {
    /* Optional D-Pad Right: Fixed turning rate */
    omega_rad_s = -g_turn_angular_velocity;
  } else if (btns & BTN_DPAD_LEFT) {
    /* Optional D-Pad Left: Fixed turning rate */
    omega_rad_s = +g_turn_angular_velocity;
  } else {
    omega_rad_s = 0.0f;
  }

  /* 3. Differential Drive Wheel Velocities */
  float v_diff_half = (omega_rad_s * ROBOT_TRACK_WIDTH_MM) / 2.0f;
  float v_left_mm_s = v_lin_mm_s - v_diff_half;
  float v_right_mm_s = v_lin_mm_s + v_diff_half;

  /* 4. Convert Linear Wheel Velocities to Wheel RPM */
  float wheel_circ_mm = 2.0f * 3.14159265f * ROBOT_WHEEL_RADIUS_MM;
  float rpm_left = (v_left_mm_s * 60.0f) / wheel_circ_mm;
  float rpm_right = (v_right_mm_s * 60.0f) / wheel_circ_mm;

  /*
   * 5. Steering-Priority Saturation Strategy:
   * When combined throttle and steering exceed MOTOR_MAX_RPM (+/- 30 RPM),
   * dynamically scale back longitudinal throttle (v) so that the full
   * differential steering delta (v_diff) is preserved without clipping
   * distortion.
   */
  float delta_rpm = fabsf((v_diff_half * 60.0f) / wheel_circ_mm);
  if (delta_rpm > (float)MOTOR_MAX_RPM) {
    delta_rpm = (float)MOTOR_MAX_RPM;
  }

  float max_permissible_base = (float)MOTOR_MAX_RPM - delta_rpm;
  float base_rpm = (v_lin_mm_s * 60.0f) / wheel_circ_mm;

  if (fabsf(base_rpm) > max_permissible_base) {
    base_rpm = (base_rpm > 0.0f) ? max_permissible_base : -max_permissible_base;
    /* Recompute with trimmed base RPM */
    float steer_offset = (omega_rad_s >= 0.0f) ? -delta_rpm : +delta_rpm;
    rpm_left = base_rpm + steer_offset;
    rpm_right = base_rpm - steer_offset;
  }

  /* Hard Clamp to +/- MOTOR_MAX_RPM as ultimate safeguard */
  if (rpm_left > (float)MOTOR_MAX_RPM)
    rpm_left = (float)MOTOR_MAX_RPM;
  if (rpm_left < -(float)MOTOR_MAX_RPM)
    rpm_left = -(float)MOTOR_MAX_RPM;
  if (rpm_right > (float)MOTOR_MAX_RPM)
    rpm_right = (float)MOTOR_MAX_RPM;
  if (rpm_right < -(float)MOTOR_MAX_RPM)
    rpm_right = -(float)MOTOR_MAX_RPM;

  *out_target_left = (int32_t)roundf(rpm_left);
  *out_target_right = (int32_t)roundf(rpm_right);
  *out_v = v_lin_mm_s;
  *out_omega = omega_rad_s;
}

/**
 * @brief  Smoothly ramps speed towards target rate, handling reversals cleanly.
 *         During direction reversal (+ to - or - to +), it strictly decelerates
 *         to 0.0 before accelerating in the new direction.
 */
static float Update_Ramp_Channel(float current, float target, float dt) {
  if (dt <= 0.0f)
    return current;

  float accel_max = g_motor_accel_rpm_per_sec * dt;
  float decel_max = g_motor_decel_rpm_per_sec * dt;

  /* Case 1: Target is zero -> Decelerate towards 0 */
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

  /* Case 2: Target and Current have same sign (or current is exactly 0) */
  if ((current >= 0.0f && target > 0.0f) ||
      (current <= 0.0f && target < 0.0f)) {
    if (fabsf(target) > fabsf(current)) {
      /* Accelerating in current direction */
      float diff = target - current;
      if (diff > accel_max)
        diff = accel_max;
      if (diff < -accel_max)
        diff = -accel_max;
      current += diff;
    } else {
      /* Decelerating towards target of same sign */
      float diff = target - current;
      if (diff > decel_max)
        diff = decel_max;
      if (diff < -decel_max)
        diff = -decel_max;
      current += diff;
    }
    return current;
  }

  /* Case 3: Direction Reversal (+ to - or - to +) -> Decelerate to 0 first! */
  if (current > 0.0f) {
    current -= decel_max;
    if (current < 0.0f)
      current = 0.0f; /* Clamp at zero before accelerating reverse */
  } else if (current < 0.0f) {
    current += decel_max;
    if (current > 0.0f)
      current = 0.0f; /* Clamp at zero before accelerating forward */
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
    *out_stick_x =
        Process_Analog_Stick(norm_x, STICK_DEADZONE_NORM, STEERING_EXPO);
    *out_stick_y =
        Process_Analog_Stick(norm_y, STICK_DEADZONE_NORM, STEERING_EXPO);

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
    *out_stick_x =
        Process_Analog_Stick(norm_x, STICK_DEADZONE_NORM, STEERING_EXPO);
    *out_stick_y =
        Process_Analog_Stick(norm_y, STICK_DEADZONE_NORM, STEERING_EXPO);

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
      *out_stick_x =
          Process_Analog_Stick(norm_x, STICK_DEADZONE_NORM, STEERING_EXPO);
      *out_stick_y =
          Process_Analog_Stick(norm_y, STICK_DEADZONE_NORM, STEERING_EXPO);

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

  printf("[%s] v:%c%ld.%02ld m/s w:%+2ld.%02ld | L:%+3ld R:%+3ld (Tgt:%+3ld "
         "%+3ld) | StkX:%+4ld%% RT:%3d%% LT:%3d%% | CAN:N1[%c] N2[%c] | "
         "WD:%3lums\r\n",
         state_str, v_sign, v_int, v_cent, w_crad / 100,
         (w_crad < 0 ? -w_crad : w_crad) % 100, active_left_rpm,
         active_right_rpm, target_left_rpm, target_right_rpm, stk_pct,
         current_rt_pct, current_lt_pct, n1_stat, n2_stat, wd_ms);
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
