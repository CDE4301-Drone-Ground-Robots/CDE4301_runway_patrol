/* ==============================================================================
 * Project   : STM32F446RE Four-Wheel Skid-Steer Robot Firmware
 * Target    : Dual ZLAC8015D Motor Drivers (CAN) + GameSir Wireless Controller (USB)
 *             + Future ROS / Micro-ROS High-Level Autonomy Interface
 * Hardware  :
 *   - CAN1  : PB8 -> CAN1_RX, PB9 -> CAN1_TX (500 kbps to Dual ZLAC8015D)
 *   - USB   : PA11 -> D- (White), PA12 -> D+ (Green) - Full-Speed Host Mode
 *   - UART2 : PA2 -> TX, PA3 -> RX (115200 Baud, 8N1 to ST-Link / Telemetry / ROS)
 *   - Stepper: PC2 -> PUL, PC3 -> DIR (TB6600 Driver, 110 mm Linear Actuator)
 *
 * Motor & Axle Mapping:
 *   - Node 1 (Front Axle): Channel 1 = Front Left, Channel 2 = Front Right
 *   - Node 2 (Rear Axle) : Channel 1 = Rear Left,  Channel 2 = Rear Right
 *   - Polarity: Left motors (CH1) negative RPM = forward; Right motors (CH2)
 *               positive RPM = forward
 *
 * Coordinate Convention (ROS REP 103 Standard):
 *   - Linear  vx : Forward = + (m/s), Reverse = - (m/s)
 *   - Angular wz : Counter-Clockwise (Turn Left) = + (rad/s), Clockwise (Turn Right) = - (rad/s)
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
 * SECTION 1: USER CONFIGURATION & GLOBAL TUNING VARIABLES
 * ------------------------------------------------------------------------------
 * [MODIFY GLOBAL VARIABLES HERE!]
 * All primary operating parameters, speeds, geometry, and preset power budgets
 * can be tuned in this section without touching low-level logic.
 * ==============================================================================
 */

/* --- 1.1 Stepper Actuator Tuning (Linear Lift / Tool Mechanism) --- */
volatile uint32_t g_stepper_step_delay_us = 18;       /* Microseconds per half-step (18 us = Ultra-Fast, 25 us = Fast, 60 us = Slow) */
volatile float    g_stepper_travel_mm     = 110.0f;   /* Full stroke travel distance in millimeters */

/* --- 1.2 Power Supply Preset Selection --- */
#define USE_POWER_PRESET_3   /* ACTIVE: 32V 10.4A Benchtop Supply (~332W Total) */
//#define USE_POWER_PRESET_1 /* UNCOMMENT FOR 48V BATTERY (Full Power & Aggressive Yaw) */

#if defined(USE_POWER_PRESET_1)
  /* PRESET 1: Full 48V High-Current Battery Operation */
  #define CONFIG_MOTOR_MAX_RPM             30       /* Top wheel speed (~0.41 m/s) */
  #define CONFIG_MOTOR_ACCEL_RPM_PER_SEC   35.0f    /* Smooth acceleration ramp (RPM/s) */
  #define CONFIG_MOTOR_DECEL_RPM_PER_SEC   20.0f    /* Crisp deceleration ramp (RPM/s) */
  #define CONFIG_DRIVER_HW_ACCEL_MS        100      /* Driver hardware current loop accel (ms) */
  #define CONFIG_DRIVER_HW_DECEL_MS        300      /* Driver hardware decel profile (ms) */
  #define CONFIG_DEFAULT_TURN_OMEGA_RAD_S  1.40f    /* Fast spot-turn yaw rate (rad/s) */
  #define CONFIG_STEERING_EXPO             0.30f    /* Stick expo curve */
  #define CONFIG_MIN_TURN_RADIUS           1.50f    /* Minimum radius for moving arc turns (m) */
#elif defined(USE_POWER_PRESET_3)
  /* PRESET 3: 32V 10.4A Benchtop Power Supply (Current-Safe Mode) */
  #define CONFIG_MOTOR_MAX_RPM             25       /* Safe controllable top speed (~0.34 m/s) */
  #define CONFIG_MOTOR_ACCEL_RPM_PER_SEC   35.0f    /* Ramping acceleration (RPM/s) */
  #define CONFIG_MOTOR_DECEL_RPM_PER_SEC   28.0f    /* Software braking ramp (RPM/s) */
  #define CONFIG_DRIVER_HW_ACCEL_MS        300      /* Driver internal acceleration profile (ms) */
  #define CONFIG_DRIVER_HW_DECEL_MS        200      /* Driver decel profile (ms) */
  #define CONFIG_DEFAULT_TURN_OMEGA_RAD_S  0.45f    /* Scrub-safe angular velocity (rad/s) */
  #define CONFIG_STEERING_EXPO             0.45f    /* Center-stick exponential shaping */
  #define CONFIG_MIN_TURN_RADIUS           0.50f    /* Minimum radius for moving arc turns (m) */
#else
  #error "No power preset selected! Please define USE_POWER_PRESET_1 or USE_POWER_PRESET_3."
#endif

/* --- 1.3 Active Global Motion Variables (Modifiable at runtime or via D-Pad) --- */
volatile int32_t g_motor_max_rpm          = CONFIG_MOTOR_MAX_RPM;
volatile float   g_turn_angular_velocity  = CONFIG_DEFAULT_TURN_OMEGA_RAD_S;
volatile float   g_motor_accel_rpm_per_sec = CONFIG_MOTOR_ACCEL_RPM_PER_SEC;
volatile float   g_motor_decel_rpm_per_sec = CONFIG_MOTOR_DECEL_RPM_PER_SEC;
volatile float   g_min_turn_radius        = CONFIG_MIN_TURN_RADIUS;

/* --- 1.4 Physical Robot Geometry --- */
#define ROBOT_TRACK_WIDTH_MM      575.0f   /* Lateral distance between left & right wheels (0.575 m) */
#define ROBOT_WHEELBASE_MM        488.75f  /* Longitudinal distance between front & rear axles (0.48875 m) */
#define ROBOT_WHEEL_RADIUS_MM     131.5f   /* Wheel radius: diameter 263 mm / 2 (0.1315 m) */

#define ROBOT_TRACK_WIDTH_M       (ROBOT_TRACK_WIDTH_MM / 1000.0f)   /* 0.575 m */
#define ROBOT_WHEEL_RADIUS_M      (ROBOT_WHEEL_RADIUS_MM / 1000.0f)  /* 0.1315 m */

/* --- 1.5 Gamepad Sensitivity & Deadzones --- */
#define ENABLE_LEFT_STICK_THROTTLE 1       /* 1 = Allow Left Stick Y for forward/reverse throttle */
#define STICK_DEADZONE             0.08f   /* 8% deadband around neutral stick */
#define TRIGGER_DEADZONE_PCT       3       /* 3% trigger deadzone */
#define FULL_DEFLECTION_THRESH     0.85f   /* Stick deflection threshold required for spot-turn */

/* --- 1.6 Timing & Fail-Safe Timeouts --- */
#define CONTROLLER_TIMEOUT_MS      250     /* Gamepad watchdog: stop motors if no packet for 250 ms */
#define ROS_CMD_VEL_TIMEOUT_MS     500     /* ROS watchdog: stop motors if no cmd_vel received for 500 ms */
#define MOTOR_CAN_INTERVAL_MS      20      /* 50 Hz CAN velocity command dispatch loop */
#define TELEMETRY_INTERVAL_MS      100     /* 10 Hz UART telemetry broadcast */
#define CAN_PROBE_TIMEOUT_MS       1000    /* CAN node probe timeout */

/* --- 1.7 CAN Node IDs --- */
#define ZLAC_NODE_ID_1             1       /* Node 1: Front Axle Dual Driver */
#define ZLAC_NODE_ID_2             2       /* Node 2: Rear Axle Dual Driver */

/* --- 1.8 Diagnostic Options --- */
#define DEBUG_RAW_GAMEPAD_REPORTS  0       /* 1 = Print raw HID packet hex bytes to UART */

/* Gamepad Button Bitmask Definitions */
#define BTN_A                      0x0001
#define BTN_B                      0x0002
#define BTN_X                      0x0004
#define BTN_Y                      0x0008
#define BTN_LB                     0x0010
#define BTN_RB                     0x0020
#define BTN_START                  0x0040
#define BTN_BACK                   0x0080
#define BTN_DPAD_UP                0x0100
#define BTN_DPAD_DOWN              0x0200
#define BTN_DPAD_LEFT              0x0400
#define BTN_DPAD_RIGHT             0x0800
#define BTN_SPOT_TURN              (BTN_LB | BTN_RB)

/* ==============================================================================
 * SECTION 2: HARDWARE HANDLES, DATA STRUCTURES & STATE DEFINITIONS
 * ==============================================================================
 */

/* Hardware Peripheral Handles */
CAN_HandleTypeDef   hcan1;
UART_HandleTypeDef  huart2;
USBH_HandleTypeDef  hUsbHostFS;

/* Robot System State Enumeration */
typedef enum {
  ROBOT_STATE_INIT = 0,
  ROBOT_STATE_DISCONNECTED,  /* USB Dongle / ROS link disconnected */
  ROBOT_STATE_WATCHDOG_STOP, /* Communication watchdog triggered (stale inputs) */
  ROBOT_STATE_ESTOP_LATCHED, /* Latched software Quick-Stop (CiA 402 Command 0x0002) */
  ROBOT_STATE_CAN_FAULT,     /* CAN communication or driver hardware alarm */
  ROBOT_STATE_READY          /* Drivers armed and ready for velocity commands */
} Robot_State_t;

/* Drive Regime Modes */
typedef enum {
  DRIVE_MODE_STOP = 0,       /* Zero motion / Neutral */
  DRIVE_MODE_STRAIGHT,       /* Straight drive: symmetric wheel speeds, wz = 0 */
  DRIVE_MODE_ARC_TURN,       /* Sweeping arc turn: bounded turning radius */
  DRIVE_MODE_SPOT_TURN       /* In-place pivot / zero-radius rotation */
} Drive_Mode_t;

/* Active Motion Control Source */
typedef enum {
  CONTROL_SOURCE_GAMEPAD = 0, /* Commanded by USB Gamepad */
  CONTROL_SOURCE_ROS          /* Commanded by ROS / Autonomy cmd_vel */
} Control_Source_t;

/* USB Gamepad Report Structure */
typedef struct {
  uint8_t  raw[64];
  uint16_t len;
  uint8_t  valid;
} Gamepad_Report_t;

/* Robot Telemetry & Feedback Structure */
typedef struct {
  Robot_State_t    state;
  Drive_Mode_t     mode;
  Control_Source_t control_source;
  float            linear_v_m_s;
  float            angular_wz_rad_s;
  int32_t          target_left_rpm;
  int32_t          target_right_rpm;
  int32_t          active_left_rpm;
  int32_t          active_right_rpm;
  uint8_t          stepper_lowered;
  uint8_t          stepper_busy;
} Robot_Telemetry_t;

/* System State Variables */
static Robot_State_t    robot_state           = ROBOT_STATE_INIT;
static Control_Source_t current_control_source = CONTROL_SOURCE_GAMEPAD;
static Drive_Mode_t     current_drive_mode    = DRIVE_MODE_STOP;

/* Controller Input State */
static Gamepad_Report_t last_report;
static volatile uint8_t new_report_flag        = 0;
static uint32_t         last_valid_report_tick = 0;
static uint32_t         last_ros_cmd_tick      = 0;

static uint8_t  current_lt_pct        = 0;
static uint8_t  current_rt_pct        = 0;
static float    current_stick_x_norm  = 0.0f;
static float    current_stick_y_norm  = 0.0f;
static uint16_t current_btns          = 0;
static uint16_t prev_btns             = 0;

/* Kinematic Setpoints & Filtered Output */
static float   commanded_linear_v_m_s   = 0.0f;
static float   commanded_linear_v_mm_s  = 0.0f;
static float   commanded_omega_rad_s    = 0.0f;
static int32_t target_left_rpm          = 0;
static int32_t target_right_rpm         = 0;
static float   ramped_left_rpm_f        = 0.0f;
static float   ramped_right_rpm_f       = 0.0f;
static int32_t active_left_rpm          = 0;
static int32_t active_right_rpm         = 0;

/* Periodic Timers */
static uint32_t last_can_tx_tick        = 0;
static uint32_t last_telemetry_tick     = 0;

/* Stepper Actuator State */
static uint8_t stepper_is_lowered       = 0; /* 0 = Retracted (Home), 1 = Lowered (110 mm) */

/* ==============================================================================
 * SECTION 3: FUNCTION DECLARATIONS & PROTOTYPES
 * ==============================================================================
 */

/* --- 3.1 ROS & High-Level Autonomy Interface Functions --- */
uint8_t Robot_Set_CmdVel(float vx_m_s, float wz_rad_s);
uint8_t Robot_Set_Wheel_RPM(int32_t left_rpm, int32_t right_rpm);
void    Robot_Emergency_Stop(void);
void    Robot_Controlled_Stop(void);
void    Robot_Clear_Faults_And_Enable(void);
void    Robot_Get_Telemetry(Robot_Telemetry_t *out_telem);
void    Robot_Set_Control_Source(Control_Source_t source);
Control_Source_t Robot_Get_Control_Source(void);
void    Robot_Set_Motion_Limits(int32_t max_rpm, float max_omega, float accel_rpm_s, float decel_rpm_s);

/* Actuator (Stepper) High-Level Commands */
uint8_t Robot_Actuator_Lower(void);
uint8_t Robot_Actuator_Retract(void);
uint8_t Robot_Actuator_Toggle(void);
void    Robot_Actuator_Stop(void);
uint8_t Robot_Actuator_IsBusy(void);
uint8_t Robot_Actuator_IsLowered(void);

/* --- 3.2 Kinematics & Conditioning Functions --- */
float Process_Analog_Stick(float raw, float deadzone, float expo);
void  Map_Controller_Inputs(float raw_throttle, float raw_steer,
                            uint8_t btn_spot_turn, float *out_vx, float *out_wz,
                            Drive_Mode_t *out_mode);
void  Drive_UGV_With_Mode(float vx, float wz, Drive_Mode_t mode,
                          int32_t *out_left_rpm, int32_t *out_right_rpm);
void  Calculate_Kinematics(uint8_t lt_pct, uint8_t rt_pct, float stick_x,
                           float stick_y, uint16_t btns,
                           int32_t *out_target_left, int32_t *out_target_right,
                           float *out_v, float *out_omega);
float Update_Ramp_Channel(float current, float target, float dt);

/* --- 3.3 Low-Level Motor Driver CAN Dispatch --- */
void    Motor_Set_Velocity_All(int32_t left_rpm, int32_t right_rpm);
void    Motor_Stop_Quick(void);
void    Motor_Stop_Controlled(void);
void    Motor_Clear_Faults_And_Enable(void);
uint8_t Verify_CAN_Node(uint8_t nodeId);
void    Process_Incoming_CAN(void);

/* --- 3.4 Gamepad Parser & Telemetry --- */
uint8_t Parse_Gamepad_Report(uint8_t *data, uint16_t len,
                             uint8_t *out_lt_pct, uint8_t *out_rt_pct,
                             float *out_stick_x, float *out_stick_y,
                             uint16_t *out_btns);
void    Print_Telemetry(void);
int     __io_putchar(int ch);

/* --- 3.5 Peripheral & Low-Level Clock Initialization --- */
void SystemClock_Config(void);
static void MX_GPIO_Init(void);
static void MX_CAN1_Init(void);
static void MX_USART2_UART_Init(void);
static void USBH_UserProcess(USBH_HandleTypeDef *phost, uint8_t id);
void USBH_HID_EventCallback(USBH_HandleTypeDef *phost);
void Error_Handler(void);

/* ==============================================================================
 * SECTION 4: MOTION CONTROL, KINEMATICS & ROS INTERFACE FUNCTIONS
 * ------------------------------------------------------------------------------
 * [ALL WORKABLE MOTION & ROS API FUNCTIONS]
 * Contains the callable functions designed for integration with ROS (e.g. cmd_vel
 * subscribers, /odom publishers, service calls for stepper/e-stop), as well as
 * the 3-regime kinematics and acceleration ramping engines.
 * ==============================================================================
 */

/**
 * @brief  ROS Command Velocity (cmd_vel) Setpoint Handler.
 *         Directly callable by a ROS subscriber (e.g. micro-ROS, rosserial, or custom UART packet).
 *
 * Kinematic Pipeline:
 *   1. Accepts linear velocity vx (m/s) and angular yaw rate wz (rad/s) in ROS REP 103 coordinates.
 *   2. Applies differential drive kinematics:
 *        v_left  = vx - (wz * W) / 2
 *        v_right = vx + (wz * W) / 2
 *   3. Converts linear speed (m/s) to wheel angular speed (RPM):
 *        RPM = (v * 60) / (2 * pi * R)
 *   4. Performs Kinematic Anti-Saturation: If either wheel RPM exceeds g_motor_max_rpm,
 *      scales both RPMs proportionally to preserve exact curvature radius without clipping.
 *   5. Feeds the software ramping engine.
 *
 * @param  vx_m_s:   Longitudinal velocity in m/s (Forward > 0, Reverse < 0)
 * @param  wz_rad_s: Angular yaw rate in rad/s (Left / CCW > 0, Right / CW < 0)
 * @retval 1 if command accepted and set, 0 if rejected (e.g. E-Stop latched or system not ready)
 */
uint8_t Robot_Set_CmdVel(float vx_m_s, float wz_rad_s) {
  /* Reject motion if latched in emergency stop or hardware CAN fault */
  if (robot_state == ROBOT_STATE_ESTOP_LATCHED || robot_state == ROBOT_STATE_CAN_FAULT) {
    return 0;
  }

  /* Auto-arm if previously in watchdog stop */
  if (robot_state == ROBOT_STATE_WATCHDOG_STOP || robot_state == ROBOT_STATE_INIT) {
    robot_state = ROBOT_STATE_READY;
  }

  /* Refresh ROS command watchdog timestamp */
  last_ros_cmd_tick = HAL_GetTick();

  /* Classify active drive mode for telemetry */
  if (fabsf(vx_m_s) < 0.001f && fabsf(wz_rad_s) < 0.001f) {
    current_drive_mode = DRIVE_MODE_STOP;
  } else if (fabsf(wz_rad_s) < 0.001f) {
    current_drive_mode = DRIVE_MODE_STRAIGHT;
  } else if (fabsf(vx_m_s) < 0.001f) {
    current_drive_mode = DRIVE_MODE_SPOT_TURN;
  } else {
    current_drive_mode = DRIVE_MODE_ARC_TURN;
  }

  /* 1. Calculate individual wheel linear velocities (m/s) */
  float half_track_wz = (wz_rad_s * ROBOT_TRACK_WIDTH_M) / 2.0f;
  float v_left  = vx_m_s - half_track_wz;
  float v_right = vx_m_s + half_track_wz;

  /* 2. Convert wheel linear velocities (m/s) to RPM */
  const float wheel_circ_m = 2.0f * 3.14159265f * ROBOT_WHEEL_RADIUS_M;
  float rpm_left  = (v_left  * 60.0f) / wheel_circ_m;
  float rpm_right = (v_right * 60.0f) / wheel_circ_m;

  /* 3. Kinematic Anti-Saturation Proportional Scaling */
  float max_wheel_rpm = fmaxf(fabsf(rpm_left), fabsf(rpm_right));
  if (max_wheel_rpm > (float)g_motor_max_rpm && max_wheel_rpm > 0.0001f) {
    float scale = (float)g_motor_max_rpm / max_wheel_rpm;
    rpm_left  *= scale;
    rpm_right *= scale;
  }

  /* Update global target setpoints */
  target_left_rpm         = (int32_t)roundf(rpm_left);
  target_right_rpm        = (int32_t)roundf(rpm_right);
  commanded_linear_v_m_s  = vx_m_s;
  commanded_linear_v_mm_s = vx_m_s * 1000.0f;
  commanded_omega_rad_s   = wz_rad_s;

  return 1;
}

/**
 * @brief  Directly commands raw left and right wheel RPM targets.
 *         Useful for direct wheel velocity testing or custom ROS diff-drive controllers.
 * @param  left_rpm:  Left wheel pair RPM setpoint
 * @param  right_rpm: Right wheel pair RPM setpoint
 * @retval 1 if accepted, 0 if rejected
 */
uint8_t Robot_Set_Wheel_RPM(int32_t left_rpm, int32_t right_rpm) {
  if (robot_state == ROBOT_STATE_ESTOP_LATCHED || robot_state == ROBOT_STATE_CAN_FAULT) {
    return 0;
  }

  /* Clamp setpoints to maximum RPM */
  if (left_rpm > g_motor_max_rpm)   left_rpm = g_motor_max_rpm;
  if (left_rpm < -g_motor_max_rpm)  left_rpm = -g_motor_max_rpm;
  if (right_rpm > g_motor_max_rpm)  right_rpm = g_motor_max_rpm;
  if (right_rpm < -g_motor_max_rpm) right_rpm = -g_motor_max_rpm;

  target_left_rpm   = left_rpm;
  target_right_rpm  = right_rpm;
  last_ros_cmd_tick = HAL_GetTick();

  return 1;
}

/**
 * @brief  Emergency Quick-Stop: Latches software emergency stop state and halts
 *         all motors immediately using CiA 402 Command 0x0002.
 */
void Robot_Emergency_Stop(void) {
  robot_state = ROBOT_STATE_ESTOP_LATCHED;
  Motor_Stop_Quick();
  Stepper_Stop();
  printf("\r\n>>> [SAFETY] EMERGENCY STOP LATCHED!\r\n");
}

/**
 * @brief  Controlled Stop: Ramps wheels down to 0 RPM without latching a fault.
 */
void Robot_Controlled_Stop(void) {
  target_left_rpm         = 0;
  target_right_rpm        = 0;
  commanded_linear_v_m_s  = 0.0f;
  commanded_linear_v_mm_s = 0.0f;
  commanded_omega_rad_s   = 0.0f;
  current_drive_mode      = DRIVE_MODE_STOP;
  Motor_Stop_Controlled();
}

/**
 * @brief  Clears driver fault alarms and re-arms motors to Operation Enabled.
 */
void Robot_Clear_Faults_And_Enable(void) {
  Motor_Clear_Faults_And_Enable();
  target_left_rpm   = 0;
  target_right_rpm  = 0;
  ramped_left_rpm_f = 0.0f;
  ramped_right_rpm_f= 0.0f;
  active_left_rpm   = 0;
  active_right_rpm  = 0;
  robot_state       = ROBOT_STATE_READY;
  printf("\r\n>>> [ALARM CLEAR] Sent Fault Reset (0x0080) to Node 1 & 2. Ready!\r\n");
}

/**
 * @brief  Fills a telemetry structure with current states, speeds, and actuator position.
 *         Use this to publish ROS /odom and /robot_status topics!
 * @param  out_telem: Pointer to Robot_Telemetry_t struct to populate
 */
void Robot_Get_Telemetry(Robot_Telemetry_t *out_telem) {
  if (!out_telem) return;
  out_telem->state            = robot_state;
  out_telem->mode             = current_drive_mode;
  out_telem->control_source   = current_control_source;
  out_telem->linear_v_m_s     = commanded_linear_v_m_s;
  out_telem->angular_wz_rad_s = commanded_omega_rad_s;
  out_telem->target_left_rpm  = target_left_rpm;
  out_telem->target_right_rpm = target_right_rpm;
  out_telem->active_left_rpm  = active_left_rpm;
  out_telem->active_right_rpm = active_right_rpm;
  out_telem->stepper_lowered  = stepper_is_lowered;
  out_telem->stepper_busy     = Stepper_IsBusy();
}

/**
 * @brief  Switches the active command authority between Gamepad and ROS Autonomy.
 * @param  source: CONTROL_SOURCE_GAMEPAD or CONTROL_SOURCE_ROS
 */
void Robot_Set_Control_Source(Control_Source_t source) {
  current_control_source = source;
  Robot_Controlled_Stop();
  printf(">>> [CONTROL SOURCE] Switched to %s mode.\r\n",
         (source == CONTROL_SOURCE_ROS) ? "ROS / AUTONOMY" : "GAMEPAD");
}

/**
 * @brief  Queries the currently active control source.
 */
Control_Source_t Robot_Get_Control_Source(void) {
  return current_control_source;
}

/**
 * @brief  Dynamically updates motion parameters (usable via ROS dynamic_reconfigure).
 */
void Robot_Set_Motion_Limits(int32_t max_rpm, float max_omega, float accel_rpm_s, float decel_rpm_s) {
  if (max_rpm > 0)       g_motor_max_rpm           = max_rpm;
  if (max_omega > 0.0f)  g_turn_angular_velocity   = max_omega;
  if (accel_rpm_s > 0.0f) g_motor_accel_rpm_per_sec = accel_rpm_s;
  if (decel_rpm_s > 0.0f) g_motor_decel_rpm_per_sec = decel_rpm_s;
}

/**
 * @brief  Triggers non-blocking lowering of the stepper linear actuator.
 * @retval 1 if move initiated, 0 if already busy
 */
uint8_t Robot_Actuator_Lower(void) {
  if (Stepper_IsBusy()) return 0;
  int32_t total_steps = (int32_t)((STEPPER_STEPS_PER_MM * g_stepper_travel_mm) + 0.5f);
  int32_t move_steps  = (STEPPER_DIR_LOWER == STEPPER_DIR_CW) ? total_steps : -total_steps;
  Stepper_StartMove(move_steps, g_stepper_step_delay_us);
  stepper_is_lowered = 1;
  return 1;
}

/**
 * @brief  Triggers non-blocking retraction of the stepper linear actuator.
 * @retval 1 if move initiated, 0 if already busy
 */
uint8_t Robot_Actuator_Retract(void) {
  if (Stepper_IsBusy()) return 0;
  int32_t total_steps = (int32_t)((STEPPER_STEPS_PER_MM * g_stepper_travel_mm) + 0.5f);
  int32_t move_steps  = (STEPPER_DIR_RETRACT == STEPPER_DIR_CW) ? total_steps : -total_steps;
  Stepper_StartMove(move_steps, g_stepper_step_delay_us);
  stepper_is_lowered = 0;
  return 1;
}

/**
 * @brief  Toggles actuator position between Lowered and Retracted states.
 */
uint8_t Robot_Actuator_Toggle(void) {
  return stepper_is_lowered ? Robot_Actuator_Retract() : Robot_Actuator_Lower();
}

/**
 * @brief  Immediately halts any active stepper motion.
 */
void Robot_Actuator_Stop(void) {
  Stepper_Stop();
}

/**
 * @brief  Returns whether the stepper actuator is currently executing steps.
 */
uint8_t Robot_Actuator_IsBusy(void) {
  return Stepper_IsBusy();
}

/**
 * @brief  Returns whether the actuator is in the Lowered position.
 */
uint8_t Robot_Actuator_IsLowered(void) {
  return stepper_is_lowered;
}

/* ------------------------------------------------------------------------------
 * Kinematic Conditioning & Conditioning Helpers
 * ------------------------------------------------------------------------------
 */

/**
 * @brief  Normalizes and conditions analog stick input with deadzone rescaling
 *         and exponential response curve.
 * @param  raw: Raw axis value normalized to -1.0 .. +1.0
 * @param  deadzone: Deadzone threshold (e.g. 0.08 for 8%)
 * @param  expo: Exponential curvature factor (0.0=linear, 1.0=cubic)
 * @retval Processed value -1.0 .. +1.0 (strictly 0.0f within deadzone)
 */
float Process_Analog_Stick(float raw, float deadzone, float expo) {
  float abs_val = fabsf(raw);
  if (abs_val <= deadzone) {
    return 0.0f;
  }

  /* Linear rescaling to preserve full 0.0 to 1.0 usable output range */
  float scaled = (abs_val - deadzone) / (1.0f - deadzone);
  if (scaled > 1.0f) scaled = 1.0f;

  /* Exponential shaping for finer precision around neutral */
  float shaped = (1.0f - expo) * scaled + expo * (scaled * scaled * scaled);
  return (raw > 0.0f) ? shaped : -shaped;
}

/**
 * @brief  Maps raw controller inputs into chassis longitudinal velocity (vx)
 *         and yaw rate (wz) enforcing the 3-regime steering control model:
 *
 * 1. Straight Driving (Forward / Reverse):
 *    - Active when throttle is commanded and steering stick is neutral.
 *    - Yaw rate is forced to wz = 0.0 rad/s for razor-sharp tracking.
 *
 * 2. Arc Turn While Moving (Sweeping Curve):
 *    - Active when BOTH throttle is non-zero AND steering stick is deflected.
 *    - Enforces minimum turning radius clamp: |wz| <= |vx| / MIN_TURN_RADIUS
 *      to completely prevent inner-wheel reversal and heavy mechanical scrubbing.
 *
 * 3. Turn-on-the-Spot (In-Place Pivot):
 *    - Allowed when stationary and steering stick is pushed past threshold.
 *    - vx = 0.0 m/s, yaw rate capped at g_turn_angular_velocity.
 */
void Map_Controller_Inputs(float raw_throttle, float raw_steer,
                           uint8_t btn_spot_turn, float *out_vx, float *out_wz,
                           Drive_Mode_t *out_mode) {
  (void)btn_spot_turn;
  float vx = 0.0f;
  float wz = 0.0f;
  Drive_Mode_t mode = DRIVE_MODE_STOP;

  /* Maximum permissible linear speed in m/s based on g_motor_max_rpm */
  const float wheel_circ_m = 2.0f * 3.14159265f * ROBOT_WHEEL_RADIUS_M;
  const float max_linear_speed_m_s = ((float)g_motor_max_rpm * wheel_circ_m) / 60.0f;

  /* Step 1: Throttle Deadband & Linear Conditioning */
  float abs_th = fabsf(raw_throttle);
  if (abs_th > STICK_DEADZONE) {
    float th_scaled = (abs_th - STICK_DEADZONE) / (1.0f - STICK_DEADZONE);
    if (th_scaled > 1.0f) th_scaled = 1.0f;
    vx = (raw_throttle > 0.0f) ? (th_scaled * max_linear_speed_m_s)
                               : (-th_scaled * max_linear_speed_m_s);
  } else {
    vx = 0.0f;
  }

  /* Step 2: 3-Regime Steering Evaluation */
  float abs_steer = fabsf(raw_steer);
  uint8_t throttle_moving = (fabsf(vx) > 0.05f) ? 1 : 0;
  uint8_t steer_active    = (abs_steer > STICK_DEADZONE) ? 1 : 0;

  if (throttle_moving) {
    if (!steer_active) {
      /* Regime 1: Straight Driving */
      mode = DRIVE_MODE_STRAIGHT;
      wz = 0.0f;
    } else {
      /* Regime 2: Arc Turn While Moving */
      mode = DRIVE_MODE_ARC_TURN;
      float shaped_steer_signed = Process_Analog_Stick(raw_steer, STICK_DEADZONE, CONFIG_STEERING_EXPO);
      float unconstrained_wz    = shaped_steer_signed * g_turn_angular_velocity;

      /* Minimum turning radius clamp: |wz| <= |vx| / MIN_TURN_RADIUS */
      float max_wz = fabsf(vx) / g_min_turn_radius;
      if (fabsf(unconstrained_wz) > max_wz) {
        wz = (unconstrained_wz > 0.0f) ? max_wz : -max_wz;
      } else {
        wz = unconstrained_wz;
      }
    }
  } else {
    /* Stationary */
    vx = 0.0f;
    if (steer_active) {
      /* Regime 3: Turn-on-the-Spot */
      mode = DRIVE_MODE_SPOT_TURN;
      float shaped_steer_signed = Process_Analog_Stick(raw_steer, STICK_DEADZONE, CONFIG_STEERING_EXPO);
      wz = shaped_steer_signed * g_turn_angular_velocity;
    } else {
      mode = DRIVE_MODE_STOP;
      wz = 0.0f;
    }
  }

  if (out_vx)   *out_vx = vx;
  if (out_wz)   *out_wz = wz;
  if (out_mode) *out_mode = mode;
}

/**
 * @brief  Differential drive inverse kinematics with Kinematic Anti-Saturation.
 */
void Drive_UGV_With_Mode(float vx, float wz, Drive_Mode_t mode,
                         int32_t *out_left_rpm, int32_t *out_right_rpm) {
  if (mode == DRIVE_MODE_STOP) {
    if (out_left_rpm)  *out_left_rpm  = 0;
    if (out_right_rpm) *out_right_rpm = 0;
    return;
  }

  if (mode == DRIVE_MODE_STRAIGHT)  wz = 0.0f;
  else if (mode == DRIVE_MODE_SPOT_TURN) vx = 0.0f;

  /* 1. Compute wheel linear velocities (m/s) */
  float half_track_wz = (wz * ROBOT_TRACK_WIDTH_M) / 2.0f;
  float v_left  = vx - half_track_wz;
  float v_right = vx + half_track_wz;

  /* 2. Convert to RPM */
  const float wheel_circ_m = 2.0f * 3.14159265f * ROBOT_WHEEL_RADIUS_M;
  float rpm_left  = (v_left  * 60.0f) / wheel_circ_m;
  float rpm_right = (v_right * 60.0f) / wheel_circ_m;

  /* 3. Anti-saturation proportional scaling */
  float max_wheel_rpm = fmaxf(fabsf(rpm_left), fabsf(rpm_right));
  if (max_wheel_rpm > (float)g_motor_max_rpm && max_wheel_rpm > 0.0001f) {
    float scale = (float)g_motor_max_rpm / max_wheel_rpm;
    rpm_left  *= scale;
    rpm_right *= scale;
  }

  if (mode == DRIVE_MODE_STRAIGHT) {
    rpm_right = rpm_left;
  } else if (mode == DRIVE_MODE_SPOT_TURN) {
    rpm_right = -rpm_left;
  }

  if (out_left_rpm)  *out_left_rpm  = (int32_t)roundf(rpm_left);
  if (out_right_rpm) *out_right_rpm = (int32_t)roundf(rpm_right);
}

/**
 * @brief  Gamepad Kinematics Wrapper: extracts raw triggers and stick deflection,
 *         passes them through Map_Controller_Inputs and Drive_UGV_With_Mode.
 */
void Calculate_Kinematics(uint8_t lt_pct, uint8_t rt_pct, float stick_x,
                          float stick_y, uint16_t btns,
                          int32_t *out_target_left, int32_t *out_target_right,
                          float *out_v, float *out_omega) {
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

  /* 2. Steering input */
  float raw_steer = stick_x;
  uint8_t btn_spot_turn = ((btns & BTN_SPOT_TURN) != 0) ? 1 : 0;

  /* 3. Map through 3-regime controller */
  Drive_Mode_t mode = DRIVE_MODE_STOP;
  float vx = 0.0f, wz = 0.0f;
  Map_Controller_Inputs(raw_throttle, raw_steer, btn_spot_turn, &vx, &wz, &mode);
  current_drive_mode     = mode;
  commanded_linear_v_m_s = vx;

  /* 4. Differential drive kinematics & anti-saturation */
  Drive_UGV_With_Mode(vx, wz, mode, out_target_left, out_target_right);

  if (out_v)     *out_v     = vx * 1000.0f;
  if (out_omega) *out_omega = wz;
}

/**
 * @brief  Smoothly ramps wheel speed towards target rate, handling direction reversals cleanly.
 */
float Update_Ramp_Channel(float current, float target, float dt) {
  if (dt <= 0.0f) return current;

  float accel_max = g_motor_accel_rpm_per_sec * dt;
  float decel_max = g_motor_decel_rpm_per_sec * dt;

  /* Case 1: Target is zero -> Decelerate to complete stop */
  if (target == 0.0f) {
    if (current > 0.0f) {
      current -= decel_max;
      if (current < 0.0f) current = 0.0f;
    } else if (current < 0.0f) {
      current += decel_max;
      if (current > 0.0f) current = 0.0f;
    }
    return current;
  }

  /* Case 2: Direction Reversal (+ to - or - to +) */
  if ((current > 0.0f && target < 0.0f) || (current < 0.0f && target > 0.0f)) {
    if (current > 0.0f) {
      current -= decel_max;
      if (current < 0.0f) {
        float remainder = -current;
        current = -fminf(remainder, accel_max);
        if (current < target) current = target;
      }
    } else {
      current += decel_max;
      if (current > 0.0f) {
        float remainder = current;
        current = fminf(remainder, accel_max);
        if (current > target) current = target;
      }
    }
    return current;
  }

  /* Case 3: Same sign or accelerating from zero */
  if (fabsf(target) > fabsf(current)) {
    float diff = target - current;
    if (diff > accel_max)  diff = accel_max;
    if (diff < -accel_max) diff = -accel_max;
    current += diff;
  } else {
    float diff = target - current;
    if (diff > decel_max)  diff = decel_max;
    if (diff < -decel_max) diff = -decel_max;
    current += diff;
  }

  return current;
}

/* ==============================================================================
 * SECTION 5: HARDWARE COMMUNICATION & DRIVER DISPATCH FUNCTIONS
 * ------------------------------------------------------------------------------
 * [CAN DISPATCH, SENSOR INGESTION, USB HID PARSER & TELEMETRY]
 * ==============================================================================
 */

/**
 * @brief  Dispatches velocity commands to both ZLAC8015D drivers over CAN.
 *         Polarity handling:
 *           - Channel 1 (Left):  Negative RPM commanded = Forward rotation
 *           - Channel 2 (Right): Positive RPM commanded = Forward rotation
 */
void Motor_Set_Velocity_All(int32_t left_rpm, int32_t right_rpm) {
  ZLAC8015D_SetVelocity_Node(ZLAC_NODE_ID_1, -left_rpm, right_rpm);
  HAL_Delay(2);
  ZLAC8015D_SetVelocity_Node(ZLAC_NODE_ID_2, -left_rpm, right_rpm);
}

/**
 * @brief  Quick-Stop (CiA 402 Command 0x0002) - Halts motor driver immediately.
 */
void Motor_Stop_Quick(void) {
  target_left_rpm    = 0;
  target_right_rpm   = 0;
  ramped_left_rpm_f  = 0.0f;
  ramped_right_rpm_f = 0.0f;
  active_left_rpm    = 0;
  active_right_rpm   = 0;
  ZLAC8015D_EmergencyStop_Node(ZLAC_NODE_ID_1);
  HAL_Delay(2);
  ZLAC8015D_EmergencyStop_Node(ZLAC_NODE_ID_2);
}

/**
 * @brief  Controlled Stop - Commands 0 RPM over CAN while keeping drivers enabled.
 */
void Motor_Stop_Controlled(void) {
  target_left_rpm    = 0;
  target_right_rpm   = 0;
  ramped_left_rpm_f  = 0.0f;
  ramped_right_rpm_f = 0.0f;
  active_left_rpm    = 0;
  active_right_rpm   = 0;
  Motor_Set_Velocity_All(0, 0);
}

/**
 * @brief  Clears fault latches (0x0080), configures Velocity Mode, and re-enables operation.
 */
void Motor_Clear_Faults_And_Enable(void) {
  ZLAC8015D_ClearError_Node(ZLAC_NODE_ID_1);
  HAL_Delay(10);
  ZLAC8015D_ClearError_Node(ZLAC_NODE_ID_2);
  HAL_Delay(20);

  ZLAC8015D_Init_Velocity_Mode_Async_Node(ZLAC_NODE_ID_1, CONFIG_DRIVER_HW_ACCEL_MS, CONFIG_DRIVER_HW_DECEL_MS);
  HAL_Delay(20);
  ZLAC8015D_Init_Velocity_Mode_Async_Node(ZLAC_NODE_ID_2, CONFIG_DRIVER_HW_ACCEL_MS, CONFIG_DRIVER_HW_DECEL_MS);
  HAL_Delay(20);

  ZLAC8015D_Enable_Node(ZLAC_NODE_ID_1);
  HAL_Delay(10);
  ZLAC8015D_Enable_Node(ZLAC_NODE_ID_2);
  HAL_Delay(20);
}

/**
 * @brief  Probes a driver node over CAN via SDO read of Statusword (0x6041).
 */
uint8_t Verify_CAN_Node(uint8_t nodeId) {
  CAN_TxHeaderTypeDef txHeader;
  uint8_t txData[8] = {0};
  uint32_t txMailbox;

  txHeader.StdId = 0x600 + nodeId;
  txHeader.ExtId = 0x00;
  txHeader.RTR   = CAN_RTR_DATA;
  txHeader.IDE   = CAN_ID_STD;
  txHeader.DLC   = 8;
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
      if (HAL_CAN_GetRxMessage(&hcan1, CAN_RX_FIFO0, &rxHeader, rxData) == HAL_OK) {
        if (rxHeader.StdId == (0x580 + nodeId)) {
          uint16_t sw = (uint16_t)rxData[4] | ((uint16_t)rxData[5] << 8);
          printf("  >>> [CAN OK] Node %d acknowledged (Statusword: 0x%04X)\r\n", nodeId, sw);
          ZLAC8015D_ProcessRxMessage(&rxHeader, rxData);
          return 1;
        }
      }
    }
  }
  printf("  >>> [CAN WARNING] Node %d did not respond to probe!\r\n", nodeId);
  return 0;
}

/**
 * @brief  Ingests incoming CAN messages from RX FIFO and monitors for bus-off errors.
 */
void Process_Incoming_CAN(void) {
  while (HAL_CAN_GetRxFifoFillLevel(&hcan1, CAN_RX_FIFO0) > 0) {
    CAN_RxHeaderTypeDef rxHeader;
    uint8_t rxData[8] = {0};
    if (HAL_CAN_GetRxMessage(&hcan1, CAN_RX_FIFO0, &rxHeader, rxData) == HAL_OK) {
      ZLAC8015D_ProcessRxMessage(&rxHeader, rxData);
    }
  }

  uint32_t can_err = HAL_CAN_GetError(&hcan1);
  if (can_err & HAL_CAN_ERROR_BOF) {
    robot_state = ROBOT_STATE_CAN_FAULT;
    Motor_Stop_Controlled();
    printf("\r\n>>> [CAN ERROR] CAN1 Bus-Off detected! Resetting peripheral...\r\n");
    HAL_CAN_ResetError(&hcan1);
  }
}

/**
 * @brief  Parses raw HID report into normalized triggers, sticks, and buttons.
 *         Supports XInput (PC/Xbox), Switch Pro, and standard DirectInput formats.
 */
uint8_t Parse_Gamepad_Report(uint8_t *data, uint16_t len,
                             uint8_t *out_lt_pct, uint8_t *out_rt_pct,
                             float *out_stick_x, float *out_stick_y,
                             uint16_t *out_btns) {
  *out_lt_pct  = 0;
  *out_rt_pct  = 0;
  *out_stick_x = 0.0f;
  *out_stick_y = 0.0f;
  *out_btns    = 0;

  if (len < 4) return 0;

#if (DEBUG_RAW_GAMEPAD_REPORTS == 1)
  printf("[RAW HID %2d B]: ", len);
  for (uint16_t i = 0; i < len && i < 16; i++) {
    printf("%02X ", data[i]);
  }
  printf("\r\n");
#endif

  /* 1. XInput Format (GameSir Wireless Dongle / PC Mode) */
  if (data[0] == 0x00 && data[1] == 0x14 && len >= 14) {
    uint8_t dpad = data[2];
    uint8_t btns = data[3];
    uint8_t lt   = data[4];
    uint8_t rt   = data[5];
    int16_t raw_lx = (int16_t)((uint16_t)data[6] | ((uint16_t)data[7] << 8));
    int16_t raw_ly = (int16_t)((uint16_t)data[8] | ((uint16_t)data[9] << 8));

    *out_lt_pct = (uint8_t)((uint32_t)lt * 100 / 255);
    *out_rt_pct = (uint8_t)((uint32_t)rt * 100 / 255);

    float norm_x = (float)raw_lx / 32768.0f;
    float norm_y = (float)raw_ly / 32768.0f;
    if (norm_x > 1.0f)  norm_x = 1.0f;
    if (norm_x < -1.0f) norm_x = -1.0f;
    if (norm_y > 1.0f)  norm_y = 1.0f;
    if (norm_y < -1.0f) norm_y = -1.0f;
    *out_stick_x = norm_x;
    *out_stick_y = norm_y;

    uint16_t b = 0;
    if (btns & 0x10) b |= BTN_A;
    if (btns & 0x20) b |= BTN_B;
    if (btns & 0x40) b |= BTN_X;
    if (btns & 0x80) b |= BTN_Y;
    if (btns & 0x01) b |= BTN_LB;
    if (btns & 0x02) b |= BTN_RB;
    if (dpad & 0x10) b |= BTN_START;
    if (dpad & 0x20) b |= BTN_BACK;
    if (dpad & 0x01) b |= BTN_DPAD_UP;
    if (dpad & 0x02) b |= BTN_DPAD_DOWN;
    if (dpad & 0x04) b |= BTN_DPAD_LEFT;
    if (dpad & 0x08) b |= BTN_DPAD_RIGHT;

    *out_btns = b;
    return 1;
  }

  /* 2. Switch Pro / Android Mode Format */
  if ((data[0] == 0x30 || data[0] == 0x21) && len >= 12) {
    uint8_t b_right = data[3];
    uint8_t b_left  = data[5];

    *out_rt_pct = (b_right & 0x80) ? 100 : 0;
    *out_lt_pct = (b_left & 0x80)  ? 100 : 0;

    uint16_t lx_raw = (uint16_t)data[6] | (((uint16_t)data[7] & 0x0F) << 8);
    uint16_t ly_raw = (((uint16_t)data[7] >> 4) & 0x0F) | (((uint16_t)data[8]) << 4);

    float norm_x = ((float)lx_raw - 2048.0f) / 2048.0f;
    float norm_y = ((float)ly_raw - 2048.0f) / 2048.0f;
    if (norm_x > 1.0f)  norm_x = 1.0f;
    if (norm_x < -1.0f) norm_x = -1.0f;
    if (norm_y > 1.0f)  norm_y = 1.0f;
    if (norm_y < -1.0f) norm_y = -1.0f;
    *out_stick_x = norm_x;
    *out_stick_y = norm_y;

    uint16_t b = 0;
    if (b_right & 0x08) b |= BTN_A;
    if (b_right & 0x04) b |= BTN_B;
    if (b_right & 0x02) b |= BTN_X;
    if (b_right & 0x01) b |= BTN_Y;
    if (b_left & 0x02)  b |= BTN_DPAD_UP;
    if (b_left & 0x01)  b |= BTN_DPAD_DOWN;
    if (b_left & 0x08)  b |= BTN_DPAD_LEFT;
    if (b_left & 0x04)  b |= BTN_DPAD_RIGHT;

    *out_btns = b;
    return 1;
  }

  /* 3. Generic DirectInput / Standard HID */
  if (len >= 6) {
    uint8_t offset = (data[0] == 0x01 || data[0] == 0x02) ? 1 : 0;
    if (len >= (offset + 4)) {
      uint8_t lx = data[offset + 0];
      uint8_t ly = data[offset + 1];
      uint8_t btn1 = (len > offset + 4) ? data[offset + 4] : 0;
      uint8_t btn2 = (len > offset + 5) ? data[offset + 5] : 0;

      float norm_x = ((float)lx - 128.0f) / 128.0f;
      float norm_y = -((float)ly - 128.0f) / 128.0f;
      if (norm_x > 1.0f)  norm_x = 1.0f;
      if (norm_x < -1.0f) norm_x = -1.0f;
      if (norm_y > 1.0f)  norm_y = 1.0f;
      if (norm_y < -1.0f) norm_y = -1.0f;
      *out_stick_x = norm_x;
      *out_stick_y = norm_y;

      *out_rt_pct = (btn2 & 0x02) ? 100 : 0;
      *out_lt_pct = (btn2 & 0x01) ? 100 : 0;

      uint16_t b = 0;
      if (btn1 & 0x10) b |= BTN_A;
      if (btn1 & 0x20) b |= BTN_B;

      uint8_t hat = (len > offset + 2) ? (data[offset + 2] & 0x0F) : 0x0F;
      if (hat == 0 || hat == 1 || hat == 7) b |= BTN_DPAD_UP;
      if (hat == 3 || hat == 4 || hat == 5) b |= BTN_DPAD_DOWN;
      if (hat == 5 || hat == 6 || hat == 7) b |= BTN_DPAD_LEFT;
      if (hat == 1 || hat == 2 || hat == 3) b |= BTN_DPAD_RIGHT;

      *out_btns = b;
      return 1;
    }
  }

  return 0;
}

/**
 * @brief  Retargets standard printf to USART2 (ST-Link Virtual COM Port @ 115200 Baud).
 */
int __io_putchar(int ch) {
  if (ch == '\n') {
    uint8_t cr = '\r';
    HAL_UART_Transmit(&huart2, &cr, 1, 10);
  }
  HAL_UART_Transmit(&huart2, (uint8_t *)&ch, 1, 10);
  return ch;
}

/**
 * @brief  Prints 10 Hz telemetry status to UART.
 */
void Print_Telemetry(void) {
  const char *state_str = "INIT ";
  switch (robot_state) {
    case ROBOT_STATE_READY:         state_str = "READY"; break;
    case ROBOT_STATE_ESTOP_LATCHED: state_str = "STOP "; break;
    case ROBOT_STATE_WATCHDOG_STOP: state_str = "WD_TO"; break;
    case ROBOT_STATE_DISCONNECTED:  state_str = "NO_CT"; break;
    case ROBOT_STATE_CAN_FAULT:     state_str = "CAN_F"; break;
    default: break;
  }

  ZLAC_NodeStatus_t *n1 = ZLAC8015D_GetNodeStatus(ZLAC_NODE_ID_1);
  ZLAC_NodeStatus_t *n2 = ZLAC8015D_GetNodeStatus(ZLAC_NODE_ID_2);
  char n1_stat = (n1 && n1->online) ? (n1->has_fault ? 'E' : 'O') : 'X';
  char n2_stat = (n2 && n2->online) ? (n2->has_fault ? 'E' : 'O') : 'X';

  uint32_t wd_ms = (last_valid_report_tick > 0) ? (HAL_GetTick() - last_valid_report_tick) : 999;
  if (wd_ms > 999) wd_ms = 999;

  float v_m_s = commanded_linear_v_mm_s / 1000.0f;
  char v_sign = (v_m_s < -0.001f) ? '-' : '+';
  float abs_v = fabsf(v_m_s);
  int32_t v_int  = (int32_t)abs_v;
  int32_t v_cent = (int32_t)roundf((abs_v - (float)v_int) * 100.0f);
  if (v_cent >= 100) {
    v_int++;
    v_cent = 0;
  }

  int32_t w_crad  = (int32_t)roundf(commanded_omega_rad_s * 100.0f);
  int32_t stk_pct = (int32_t)roundf(current_stick_x_norm * 100.0f);

  const char *mode_str = "STP";
  switch (current_drive_mode) {
    case DRIVE_MODE_STRAIGHT:  mode_str = "STR"; break;
    case DRIVE_MODE_ARC_TURN:  mode_str = "ARC"; break;
    case DRIVE_MODE_SPOT_TURN: mode_str = "SPT"; break;
    default: mode_str = "STP"; break;
  }

  printf("[%s|%s] v:%c%ld.%02ld m/s w:%+2ld.%02ld | L:%+3ld R:%+3ld (Tgt:%+3ld %+3ld) | StkX:%+4ld%% RT:%3d%% LT:%3d%% | CAN:N1[%c] N2[%c] | [Cfg:%ldRPM/%.1frad] WD:%3lums\r\n",
         state_str, mode_str, v_sign, v_int, v_cent, w_crad / 100,
         (w_crad < 0 ? -w_crad : w_crad) % 100, active_left_rpm,
         active_right_rpm, target_left_rpm, target_right_rpm, stk_pct,
         current_rt_pct, current_lt_pct, n1_stat, n2_stat,
         (long)g_motor_max_rpm, g_turn_angular_velocity, wd_ms);
}

/* ==============================================================================
 * SECTION 6: MAIN ENTRY POINT & CONTROL LOOP
 * ------------------------------------------------------------------------------
 * [SUPER-LOOP ARBITRATION, GAMEPAD TUNING & DISPATCH]
 * ==============================================================================
 */

int main(void) {
  /* 6.1 Hardware & Peripheral Initialization */
  HAL_Init();
  SystemClock_Config();
  MX_GPIO_Init();
  MX_USART2_UART_Init();
  MX_CAN1_Init();
  Stepper_Init();

  /* Welcome Banner */
  printf("\r\n======================================================================\r\n");
  printf("  STM32F446RE FOUR-WHEEL SKID-STEER ROBOT FIRMWARE (PROPORTIONAL)\r\n");
  printf("======================================================================\r\n");
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
  printf("  Stepper    : PC2 (PUL), PC3 (DIR) | Stroke = %.1f mm (%ld steps) | Delay = %lu us | Button [X] Toggle\r\n",
         g_stepper_travel_mm, (long)((STEPPER_STEPS_PER_MM * g_stepper_travel_mm) + 0.5f), g_stepper_step_delay_us);
  printf("----------------------------------------------------------------------\r\n");

  /* 6.2 Initialize Motor Drivers over CAN */
  printf(">>> [INIT] Connecting to ZLAC8015D Motor Drivers...\r\n");
  ZLAC8015D_Init(&hcan1, ZLAC_NODE_ID_1);

  uint8_t n1_ok = Verify_CAN_Node(ZLAC_NODE_ID_1);
  uint8_t n2_ok = Verify_CAN_Node(ZLAC_NODE_ID_2);
  if (!n1_ok || !n2_ok) {
    printf("[!] WARNING: One or more motor drivers did not acknowledge probe!\r\n");
  }

  ZLAC8015D_ClearError_Node(ZLAC_NODE_ID_1);
  ZLAC8015D_ClearError_Node(ZLAC_NODE_ID_2);
  HAL_Delay(30);

  ZLAC8015D_Init_Velocity_Mode_Async_Node(ZLAC_NODE_ID_1, CONFIG_DRIVER_HW_ACCEL_MS, CONFIG_DRIVER_HW_DECEL_MS);
  ZLAC8015D_Init_Velocity_Mode_Async_Node(ZLAC_NODE_ID_2, CONFIG_DRIVER_HW_ACCEL_MS, CONFIG_DRIVER_HW_DECEL_MS);
  HAL_Delay(50);

  ZLAC8015D_Enable_Node(ZLAC_NODE_ID_1);
  ZLAC8015D_Enable_Node(ZLAC_NODE_ID_2);
  HAL_Delay(30);

  /* 6.3 Initialize USB Host Stack */
  printf(">>> [INIT] Starting USB Host Stack (GameSir Wireless / HID)...\r\n");
  if (USBH_Init(&hUsbHostFS, USBH_UserProcess, 0) != USBH_OK ||
      USBH_RegisterClass(&hUsbHostFS, USBH_HID_CLASS) != USBH_OK ||
      USBH_Start(&hUsbHostFS) != USBH_OK) {
    printf("[!] USB Host initialization FAILED!\r\n");
    Error_Handler();
  }

  robot_state = ROBOT_STATE_DISCONNECTED;
  printf(">>> System initialized. Connect controller dongle or send ROS commands.\r\n\r\n");

  uint32_t led_tick = 0;

  /* ============================================================================
   * 6.4 Main Super-Loop
   * ============================================================================
   */
  while (1) {
    /* Step 0: Service non-blocking stepper actuator motion */
    Stepper_Update();

    static uint8_t last_stepper_busy_state = 0;
    uint8_t curr_stepper_busy_state = Stepper_IsBusy();
    if (last_stepper_busy_state && !curr_stepper_busy_state) {
      printf("\r\n>>> [STEPPER] Motion COMPLETE! Actuator is now %s.\r\n",
             stepper_is_lowered ? "LOWERED (110 mm)" : "RETRACTED (Home)");
    }
    last_stepper_busy_state = curr_stepper_busy_state;

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

      uint8_t valid = Parse_Gamepad_Report(last_report.raw, last_report.len,
                                           &lt_pct, &rt_pct, &stick_x, &stick_y, &btns);

      if (valid) {
        last_valid_report_tick = HAL_GetTick();
        current_lt_pct         = lt_pct;
        current_rt_pct         = rt_pct;
        current_stick_x_norm   = stick_x;
        current_stick_y_norm   = stick_y;
        prev_btns              = current_btns;
        current_btns           = btns;

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

        /* Button X: Toggle Stepper Lower / Retract via clean API */
        if (btns_pressed & BTN_X) {
          if (Robot_Actuator_IsBusy()) {
            printf("\r\n>>> [STEPPER] Motion in progress (%ld steps remaining)!\r\n",
                   (long)Stepper_GetRemainingSteps());
          } else {
            Robot_Actuator_Toggle();
            printf("\r\n>>> [STEPPER] %s by %.1f mm (%lu us delay)...\r\n",
                   stepper_is_lowered ? "LOWERING" : "RETRACTING",
                   g_stepper_travel_mm, g_stepper_step_delay_us);
          }
        }

        /* Auto-transition from disconnected to watchdog */
        if (robot_state == ROBOT_STATE_DISCONNECTED) {
          robot_state = ROBOT_STATE_WATCHDOG_STOP;
        }

        /* Latched Software Quick-Stop check (Button B or BACK) */
        if ((current_btns & (BTN_B | BTN_BACK)) != 0) {
          if (robot_state != ROBOT_STATE_ESTOP_LATCHED) {
            Robot_Emergency_Stop();
            printf(">>> Neutralize all controls and press [A] to re-arm.\r\n\r\n");
          }
        }

        /* Auto-Arm & Driver Alarm Clear (Controls neutral; [A] or [START] clears faults) */
        uint8_t controls_neutral = (current_lt_pct <= TRIGGER_DEADZONE_PCT) &&
                                   (current_rt_pct <= TRIGGER_DEADZONE_PCT) &&
                                   (fabsf(current_stick_x_norm) <= STICK_DEADZONE) &&
                                   (fabsf(current_stick_y_norm) <= STICK_DEADZONE);

        uint8_t reset_pressed = ((current_btns & (BTN_A | BTN_START)) &&
                                 !(prev_btns & (BTN_A | BTN_START)));

        if (robot_state == ROBOT_STATE_WATCHDOG_STOP && controls_neutral) {
          robot_state = ROBOT_STATE_READY;
          printf("\r\n>>> [SYSTEM READY] Controls neutral & controller linked! Ready to drive.\r\n\r\n");
        } else if (reset_pressed) {
          if (controls_neutral) {
            Robot_Clear_Faults_And_Enable();
          } else {
            printf("\r\n>>> [RESET REJECTED] Release triggers & center stick, then press [A] or [START].\r\n\r\n");
          }
        }
      }
    }

    /* Step 4: Gamepad Watchdog Check (250 ms timeout) */
    if (current_control_source == CONTROL_SOURCE_GAMEPAD && robot_state == ROBOT_STATE_READY) {
      if (HAL_GetTick() - last_valid_report_tick >= CONTROLLER_TIMEOUT_MS) {
        robot_state = ROBOT_STATE_WATCHDOG_STOP;
        current_lt_pct        = 0;
        current_rt_pct        = 0;
        current_stick_x_norm  = 0.0f;
        current_stick_y_norm  = 0.0f;
        target_left_rpm       = 0;
        target_right_rpm      = 0;
        current_drive_mode    = DRIVE_MODE_STOP;
        Motor_Stop_Controlled();
        printf("\r\n>>> [WATCHDOG FAIL-SAFE] Gamepad report timeout (>%d ms)! Motors stopped.\r\n",
               CONTROLLER_TIMEOUT_MS);
      }
    }

    /* Step 5: Kinematics Setpoint Calculation (Gamepad mode) */
    if (current_control_source == CONTROL_SOURCE_GAMEPAD) {
      if (robot_state == ROBOT_STATE_READY) {
        Calculate_Kinematics(current_lt_pct, current_rt_pct, current_stick_x_norm,
                             current_stick_y_norm, current_btns, &target_left_rpm,
                             &target_right_rpm, &commanded_linear_v_mm_s,
                             &commanded_omega_rad_s);
      } else {
        target_left_rpm         = 0;
        target_right_rpm        = 0;
        commanded_linear_v_mm_s = 0.0f;
        commanded_omega_rad_s   = 0.0f;
        current_drive_mode      = DRIVE_MODE_STOP;
      }
    }

    /* Step 6: 50 Hz Software Ramping & CAN Velocity Dispatcher (every 20 ms) */
    if (HAL_GetTick() - last_can_tx_tick >= MOTOR_CAN_INTERVAL_MS) {
      uint32_t now = HAL_GetTick();
      float dt = (float)(now - last_can_tx_tick) / 1000.0f;
      if (dt > 0.1f) dt = 0.020f;
      last_can_tx_tick = now;

      if (robot_state == ROBOT_STATE_READY || active_left_rpm != 0 || active_right_rpm != 0) {
        ramped_left_rpm_f  = Update_Ramp_Channel(ramped_left_rpm_f,  (float)target_left_rpm,  dt);
        ramped_right_rpm_f = Update_Ramp_Channel(ramped_right_rpm_f, (float)target_right_rpm, dt);

        int32_t new_left  = (int32_t)roundf(ramped_left_rpm_f);
        int32_t new_right = (int32_t)roundf(ramped_right_rpm_f);

        if (robot_state != ROBOT_STATE_ESTOP_LATCHED) {
          active_left_rpm  = new_left;
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

    /* Step 8: Blue User Button (B1 / PC13) on STM32 Nucleo for manual hardware reset */
    static uint8_t b1_prev_state = GPIO_PIN_SET;
    uint8_t b1_state = HAL_GPIO_ReadPin(B1_GPIO_Port, B1_Pin);
    if (b1_state == GPIO_PIN_RESET && b1_prev_state == GPIO_PIN_SET) {
      Robot_Clear_Faults_And_Enable();
      printf("\r\n>>> [B1 BUTTON PRESSED] Manual Hardware Reset: Cleared ZLAC alarms & re-armed!\r\n\r\n");
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
 * SECTION 7: PERIPHERAL & LOW-LEVEL INITIALIZATION
 * ------------------------------------------------------------------------------
 * [HAL INITIALIZATION, CLOCK CONFIG, PIN MUXING & INTERRUPT MSPs]
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
  hcan1.Init.AutoRetransmission = DISABLE;
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
 * @brief  System Clock Configuration (84 MHz SysClk, 48 MHz USB OTG FS)
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
  GPIO_InitStruct.Pull = GPIO_NOPULL;
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

static void USBH_UserProcess(USBH_HandleTypeDef *phost, uint8_t id) {
  switch (id) {
    case HOST_USER_CLASS_ACTIVE:
      printf("\r\n>>> [USB] Controller Dongle Attached & Class Active!\r\n");
      printf(">>> Press [A] (with controls neutral) to arm robot.\r\n\r\n");
      robot_state = ROBOT_STATE_WATCHDOG_STOP;
      break;

    case HOST_USER_DISCONNECTION:
      printf("\r\n>>> [USB] Controller Dongle Disconnected! Immediate Fail-Safe Stop.\r\n\r\n");
      robot_state = ROBOT_STATE_DISCONNECTED;
      Motor_Stop_Controlled();
      break;

    default:
      break;
  }
}

void USBH_HID_EventCallback(USBH_HandleTypeDef *phost) {
  HID_HandleTypeDef *HID_Handle = (HID_HandleTypeDef *)phost->pActiveClass->pData;
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

void Error_Handler(void) {
  __disable_irq();
  while (1) {
    HAL_GPIO_TogglePin(LD2_GPIO_Port, LD2_Pin);
    for (volatile int i = 0; i < 200000; i++)
      ;
  }
}
