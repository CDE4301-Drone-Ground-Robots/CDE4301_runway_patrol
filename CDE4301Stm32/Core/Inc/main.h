#ifndef __MAIN_H
#define __MAIN_H

#ifdef __cplusplus
extern "C" {
#endif

#include "stm32f4xx_hal.h"

/* --- Function Prototypes --- */
void SystemClock_Config(void);
void Error_Handler(void);

/* --- Pin Definitions: Relay & Vacuum Circuit --- */
#define RELAY_VACUUM_PIN            GPIO_PIN_0
#define RELAY_VACUUM_PORT           GPIOC

/* --- Pin Definitions: Stepper Motor (TB6600 Driver) / Headlights (PC2, PC3) --- */
#define STEPPER_PUL_PIN             GPIO_PIN_2
#define STEPPER_PUL_PORT            GPIOC
#define STEPPER_DIR_PIN             GPIO_PIN_3
#define STEPPER_DIR_PORT            GPIOC

/* Headlight & Status Light pin aliases */
#define HEADLIGHT_PIN               GPIO_PIN_2
#define HEADLIGHT_PORT              GPIOC
#define STATUS_LIGHT_PIN            GPIO_PIN_3
#define STATUS_LIGHT_PORT           GPIOC

/* --- Pin Definitions: ZLAC8015D Motor Driver --- */
#define MOTOR_DRIVER_PIN            GPIO_PIN_12
#define MOTOR_DRIVER_PORT           GPIOB

/* --- Pin Definitions: Microhard Radio v2 (UART4) --- */
#define RADIO_TX_PIN                GPIO_PIN_0
#define RADIO_TX_PORT               GPIOA
#define RADIO_RX_PIN                GPIO_PIN_1
#define RADIO_RX_PORT               GPIOA

/* --- Pin Definitions: UM980 GPS Module (USART3) --- */
#define GPS_TX_PIN                  GPIO_PIN_10
#define GPS_TX_PORT                 GPIOC
#define GPS_RX_PIN                  GPIO_PIN_11
#define GPS_RX_PORT                 GPIOC

/* --- Pin Definitions: IMU (I2C1) --- */
#define IMU_SCL_PIN                 GPIO_PIN_6
#define IMU_SCL_PORT                GPIOB
#define IMU_SDA_PIN                 GPIO_PIN_7
#define IMU_SDA_PORT                GPIOB

/* --- Pin Definitions: LiFePo4 BMS (USART1) --- */
#define BMS_TX_PIN                  GPIO_PIN_9
#define BMS_TX_PORT                 GPIOA
#define BMS_RX_PIN                  GPIO_PIN_10
#define BMS_RX_PORT                 GPIOA

/* --- Pin Definitions: TOF Sensor (UART5) --- */
#define TOF_TX_PIN                  GPIO_PIN_12
#define TOF_TX_PORT                 GPIOC
#define TOF_RX_PIN                  GPIO_PIN_2
#define TOF_RX_PORT                 GPIOD

/* --- Pin Definitions: CAN Transceiver (CAN1) --- */
#define CAN_RX_PIN                  GPIO_PIN_8
#define CAN_RX_PORT                 GPIOB
#define CAN_TX_PIN                  GPIO_PIN_9
#define CAN_TX_PORT                 GPIOB

/* --- Pin Definitions: Nucleo On-Board Hardware --- */
#define B1_Pin                      GPIO_PIN_13
#define B1_GPIO_Port                GPIOC
#define LD2_Pin                     GPIO_PIN_5
#define LD2_GPIO_Port               GPIOA
#define USART_TX_Pin                GPIO_PIN_2
#define USART_TX_GPIO_Port          GPIOA
#define USART_RX_Pin                GPIO_PIN_3
#define USART_RX_GPIO_Port          GPIOA
#define TMS_Pin                     GPIO_PIN_13
#define TMS_GPIO_Port               GPIOA
#define TCK_Pin                     GPIO_PIN_14
#define TCK_GPIO_Port               GPIOA
#define SWO_Pin                     GPIO_PIN_3
#define SWO_GPIO_Port               GPIOB

#ifdef __cplusplus
}
#endif

#endif /* __MAIN_H */
