#include "stepper.h"

static uint8_t dwt_active = 0;

/* ==============================================================================
 * Stepper Driver Initialization
 * Initializes DWT Cycle Counter with foolproof CPU-cycle fallback
 * ============================================================================== */
void Stepper_Init(void)
{
  /* Enable Cortex-M4 DWT Cycle Counter for microsecond delays */
  CoreDebug->DEMCR |= CoreDebug_DEMCR_TRCENA_Msk;
  DWT->CTRL |= DWT_CTRL_CYCCNTENA_Msk;
  DWT->CYCCNT = 0;

  /* Check if DWT hardware counter is actually running */
  volatile uint32_t testCount = 0;
  for (volatile int i = 0; i < 50; i++) { testCount++; }
  if (DWT->CYCCNT > 0)
  {
    dwt_active = 1;
  }
  else
  {
    dwt_active = 0;
  }

  /* Set initial pin states to HIGH (Optocoupler LEDs OFF in sinking mode) */
  HAL_GPIO_WritePin(STEPPER_PUL_PORT, STEPPER_PUL_PIN, GPIO_PIN_SET);
  HAL_GPIO_WritePin(STEPPER_DIR_PORT, STEPPER_DIR_PIN, GPIO_PIN_SET);
}

/* ==============================================================================
 * Microsecond Delay (Fail-safe: DWT or Calibrated CPU Loop)
 * ============================================================================== */
void Stepper_DelayUs(uint32_t us)
{
  if (dwt_active)
  {
    uint32_t startCycles = DWT->CYCCNT;
    uint32_t waitCycles = us * (SystemCoreClock / 1000000);

    while ((DWT->CYCCNT - startCycles) < waitCycles)
    {
      /* Wait for hardware counter to reach target */
    }
  }
  else
  {
    /* Fallback: calibrated CPU cycle loop at 84 MHz (~21 iterations per microsecond) */
    volatile uint32_t count = us * 21;
    while (count--)
    {
      __NOP();
    }
  }
}

/* ==============================================================================
 * Set Stepper Direction (PC3) - Active-LOW Sinking
 * dir: 0 = CW (DIR- pulled LOW), 1 = CCW (DIR- left HIGH)
 * ============================================================================== */
void Stepper_SetDirection(uint8_t dir)
{
  if (dir == STEPPER_DIR_CW)
  {
    HAL_GPIO_WritePin(STEPPER_DIR_PORT, STEPPER_DIR_PIN, GPIO_PIN_RESET); /* Sinks current -> Opto ON */
  }
  else
  {
    HAL_GPIO_WritePin(STEPPER_DIR_PORT, STEPPER_DIR_PIN, GPIO_PIN_SET);   /* No current -> Opto OFF */
  }

  /* TB6600 requires setup time after DIR change */
  Stepper_DelayUs(20);
}

/* ==============================================================================
 * Generate Single Step Pulse (PC2) - Active-LOW Sinking
 * PUL- pulled LOW (conducts 5V current through opto), then released HIGH
 * ============================================================================== */
void Stepper_SingleStep(uint32_t pulse_width_us)
{
  /* Active Phase: PUL- LOW -> 5V flows through optocoupler LED */
  HAL_GPIO_WritePin(STEPPER_PUL_PORT, STEPPER_PUL_PIN, GPIO_PIN_RESET);
  Stepper_DelayUs(pulse_width_us);

  /* Idle Phase: PUL- HIGH -> optocoupler LED turns OFF */
  HAL_GPIO_WritePin(STEPPER_PUL_PORT, STEPPER_PUL_PIN, GPIO_PIN_SET);
  Stepper_DelayUs(pulse_width_us);
}

/* ==============================================================================
 * Move Stepper Motor by Given Steps at Desired Speed
 * steps: positive = CW, negative = CCW
 * step_delay_us: delay between pulses (determines RPM speed, e.g. 500us - 2000us)
 * ============================================================================== */
void Stepper_MoveSteps(int32_t steps, uint32_t step_delay_us)
{
  if (steps >= 0)
  {
    Stepper_SetDirection(STEPPER_DIR_CW);
  }
  else
  {
    Stepper_SetDirection(STEPPER_DIR_CCW);
    steps = -steps;
  }

  for (int32_t i = 0; i < steps; i++)
  {
    Stepper_SingleStep(step_delay_us);
  }
}
