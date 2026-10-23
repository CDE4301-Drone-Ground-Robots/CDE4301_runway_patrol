#ifndef __STEPPER_H
#define __STEPPER_H

#ifdef __cplusplus
extern "C" {
#endif

#include "stm32f4xx_hal.h"
#include "main.h"

/* Direction Definitions */
#define STEPPER_DIR_CW              0
#define STEPPER_DIR_CCW             1

/* Stepper Mechanism Configuration (12mm Lead/Pitch, 1/32 Microstepping = 6400 pulses/rev) */
#define STEPPER_PULSES_PER_REV      6400.0f /* 1/32 microstepping (6,400 pulses/rev) */
#define STEPPER_LEAD_MM             12.0f   /* Lead screw pitch/lead: 12 mm / rev */
#define STEPPER_STEPS_PER_MM        (STEPPER_PULSES_PER_REV / STEPPER_LEAD_MM) /* 533.3333 steps/mm */
#define STEPPER_TRAVEL_MM           110.0f  /* 110 mm stroke */
#define STEPPER_TOTAL_STEPS         ((int32_t)((STEPPER_STEPS_PER_MM * STEPPER_TRAVEL_MM) + 0.5f)) /* 58,667 steps */
#define STEPPER_STEP_DELAY_US       60      /* Microseconds per half-step pulse (~8.33 kHz -> 15.6 mm/s, ~7.0s) */

/* Direction mapping (flip if physical movement is reversed) */
#define STEPPER_DIR_LOWER           STEPPER_DIR_CW
#define STEPPER_DIR_RETRACT         STEPPER_DIR_CCW

/* ==============================================================================
 * Function Prototypes
 * ============================================================================== */
void Stepper_Init(void);
void Stepper_SetDirection(uint8_t dir);
void Stepper_SingleStep(uint32_t pulse_width_us);
void Stepper_MoveSteps(int32_t steps, uint32_t step_delay_us);
void Stepper_DelayUs(uint32_t us);

/* Non-blocking API (Safe for concurrent 50 Hz CAN & USB Host loops) */
void Stepper_StartMove(int32_t steps, uint32_t step_delay_us);
void Stepper_Stop(void);
void Stepper_Update(void);
uint8_t Stepper_IsBusy(void);
int32_t Stepper_GetRemainingSteps(void);

#ifdef __cplusplus
}
#endif

#endif /* __STEPPER_H */
