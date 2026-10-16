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

/* ==============================================================================
 * Function Prototypes
 * ============================================================================== */
void Stepper_Init(void);
void Stepper_SetDirection(uint8_t dir);
void Stepper_SingleStep(uint32_t pulse_width_us);
void Stepper_MoveSteps(int32_t steps, uint32_t step_delay_us);
void Stepper_DelayUs(uint32_t us);

#ifdef __cplusplus
}
#endif

#endif /* __STEPPER_H */
