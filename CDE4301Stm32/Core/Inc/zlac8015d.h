#ifndef __ZLAC8015D_H
#define __ZLAC8015D_H

#ifdef __cplusplus
extern "C" {
#endif

#include "stm32f4xx_hal.h"

/* ==============================================================================
 * ZLAC8015D V4 Official CANopen Object Dictionary (per ZLTECH Manual V1.07)
 * ============================================================================== */

/* --- Manufacturer Factory Custom Parameters (0x2000 - 0x2FFF) --- */
#define ZLAC_OBJ_SYNC_ASYNC_FLAG            0x200F  /* 16-bit: 0=Asynchronous, 1=Synchronous */
#define ZLAC_OBJ_COMM_PROTECT_TIME          0x2000  /* 16-bit: Heartbeat/offline protection (ms) */
#define ZLAC_OBJ_INPUT_STATUS               0x2003  /* 16-bit: X0, X1 level status */
#define ZLAC_OBJ_OUTPUT_STATUS              0x2004  /* 16-bit: Y0, Y1, B0, B1 status */
#define ZLAC_OBJ_MOTOR_MAX_SPEED            0x2008  /* 16-bit: Max speed (r/min, default 1000) */
#define ZLAC_OBJ_ACTUAL_STATUS              0x2033  /* 16-bit: Sub 01=Left, Sub 02=Right (0=stop, 1=run) */
#define ZLAC_OBJ_BUS_VOLTAGE                0x2035  /* 16-bit: 0.01V units */

/* --- CiA 402 Motion Control Parameters (0x6000 - 0x6FFF) --- */
#define ZLAC_OBJ_ERROR_CODE                 0x603F  /* 16-bit: Fault code */
#define ZLAC_OBJ_CONTROLWORD                0x6040  /* 16-bit: State Machine Control */
#define ZLAC_OBJ_STATUSWORD                 0x6041  /* 16-bit: State Machine Status */
#define ZLAC_OBJ_QUICK_STOP_OPTION          0x605A  /* 16-bit: 5=Normal, 6=Decel stop, 7=Immediate stop */
#define ZLAC_OBJ_MODES_OF_OPERATION         0x6060  /* 8-bit: 1=Position, 3=Velocity, 4=Torque */
#define ZLAC_OBJ_MODES_OF_OPERATION_DISPLAY 0x6061  /* 8-bit: Mode display */
#define ZLAC_OBJ_ACTUAL_VELOCITY            0x606C  /* 32-bit: Sub 01=Left, Sub 02=Right (0.1 r/min) */
#define ZLAC_OBJ_PROFILE_ACCEL              0x6083  /* 32-bit: Sub 01=Left, Sub 02=Right (ms) */
#define ZLAC_OBJ_PROFILE_DECEL              0x6084  /* 32-bit: Sub 01=Left, Sub 02=Right (ms) */
#define ZLAC_OBJ_QUICK_STOP_DECEL           0x6085  /* 32-bit: Sub 01=Left, Sub 02=Right (ms) */
#define ZLAC_OBJ_TARGET_VELOCITY            0x60FF  /* 32-bit: Sub 01=Left, Sub 02=Right, Sub 03=Sync */

/* --- Sub-Index Definitions --- */
#define ZLAC_SUB_ALL                        0x00
#define ZLAC_SUB_CH1_LEFT                   0x01    /* Sub-index 01: Left Motor */
#define ZLAC_SUB_CH2_RIGHT                  0x02    /* Sub-index 02: Right Motor */
#define ZLAC_SUB_SYNC_BOTH                  0x03    /* Sub-index 03: Both Motors (Low16=Left, High16=Right) */

/* --- Control Flags (Object 0x200F) --- */
#define ZLAC_CONTROL_ASYNC                  0       /* Asynchronous Control */
#define ZLAC_CONTROL_SYNC                   1       /* Synchronous Control */

/* --- CiA 402 Modes of Operation (Object 0x6060) --- */
#define ZLAC_MODE_PROFILE_POSITION          1
#define ZLAC_MODE_PROFILE_VELOCITY          3
#define ZLAC_MODE_PROFILE_TORQUE            4

/* --- CiA 402 Controlword Commands (Object 0x6040) per Manual Section 3.2 --- */
#define ZLAC_CMD_SHUTDOWN                   0x0006  /* Ready to Switch On (motor released) */
#define ZLAC_CMD_SWITCH_ON                  0x0007  /* Switched On */
#define ZLAC_CMD_ENABLE_OPERATION           0x000F  /* Operation Enable (motor enabled & powered) */
#define ZLAC_CMD_EMERGENCY_STOP             0x0002  /* Quick Stop: stops motor and remains enabled */
#define ZLAC_CMD_CLEAR_ERROR                0x0080  /* Clear Error / Fault Reset */

/* ==============================================================================
 * Public API Function Prototypes
 * ============================================================================== */

/* Initialization & Enable */
HAL_StatusTypeDef ZLAC8015D_Init(CAN_HandleTypeDef *hcan, uint8_t defaultNodeId);
HAL_StatusTypeDef ZLAC8015D_Init_Velocity_Mode_Async(uint32_t accel_ms, uint32_t decel_ms);
HAL_StatusTypeDef ZLAC8015D_Init_Velocity_Mode_Async_Node(uint8_t nodeId, uint32_t accel_ms, uint32_t decel_ms);
HAL_StatusTypeDef ZLAC8015D_Init_Velocity_Mode_Sync(uint32_t accel_ms, uint32_t decel_ms);
HAL_StatusTypeDef ZLAC8015D_Init_Velocity_Mode_Sync_Node(uint8_t nodeId, uint32_t accel_ms, uint32_t decel_ms);
HAL_StatusTypeDef ZLAC8015D_Enable(void);
HAL_StatusTypeDef ZLAC8015D_Enable_Node(uint8_t nodeId);

/* Speed Control (RPM) */
HAL_StatusTypeDef ZLAC8015D_SetVelocity_Async_Left(int32_t rpm);
HAL_StatusTypeDef ZLAC8015D_SetVelocity_Async_Right(int32_t rpm);
HAL_StatusTypeDef ZLAC8015D_SetVelocity_Right_Node(uint8_t nodeId, int32_t rpm);
HAL_StatusTypeDef ZLAC8015D_SetVelocity_Left_Node(uint8_t nodeId, int32_t rpm);
HAL_StatusTypeDef ZLAC8015D_SetVelocity_Async(int32_t leftRpm, int32_t rightRpm);
HAL_StatusTypeDef ZLAC8015D_SetVelocity_Node(uint8_t nodeId, int32_t leftRpm, int32_t rightRpm);
HAL_StatusTypeDef ZLAC8015D_SetVelocity_Sync(int16_t leftRpm, int16_t rightRpm);
HAL_StatusTypeDef ZLAC8015D_SetVelocity_Sync_Node(uint8_t nodeId, int16_t leftRpm, int16_t rightRpm);
#define ZLAC8015D_SetVelocity ZLAC8015D_SetVelocity_Async

/* Stop & Emergency Controls */
HAL_StatusTypeDef ZLAC8015D_Stop(void);
HAL_StatusTypeDef ZLAC8015D_Stop_Node(uint8_t nodeId);
HAL_StatusTypeDef ZLAC8015D_EmergencyStop(void);
HAL_StatusTypeDef ZLAC8015D_EmergencyStop_Node(uint8_t nodeId);
HAL_StatusTypeDef ZLAC8015D_ReleaseEmergencyStop(void);
HAL_StatusTypeDef ZLAC8015D_ReleaseEmergencyStop_Node(uint8_t nodeId);
HAL_StatusTypeDef ZLAC8015D_ClearError(void);
HAL_StatusTypeDef ZLAC8015D_ClearError_Node(uint8_t nodeId);

/* Low-level Protocol Handlers */
HAL_StatusTypeDef ZLAC8015D_SendNMT(uint8_t command);
HAL_StatusTypeDef ZLAC8015D_SendNMT_Node(uint8_t nodeId, uint8_t command);
HAL_StatusTypeDef ZLAC8015D_Write8(uint16_t index, uint8_t subindex, uint8_t value);
HAL_StatusTypeDef ZLAC8015D_Write8_Node(uint8_t nodeId, uint16_t index, uint8_t subindex, uint8_t value);
HAL_StatusTypeDef ZLAC8015D_Write16(uint16_t index, uint8_t subindex, uint16_t value);
HAL_StatusTypeDef ZLAC8015D_Write16_Node(uint8_t nodeId, uint16_t index, uint8_t subindex, uint16_t value);
HAL_StatusTypeDef ZLAC8015D_Write32(uint16_t index, uint8_t subindex, int32_t value);
HAL_StatusTypeDef ZLAC8015D_Write32_Node(uint8_t nodeId, uint16_t index, uint8_t subindex, int32_t value);
HAL_StatusTypeDef ZLAC8015D_RequestRead_Node(uint8_t nodeId, uint16_t index, uint8_t subindex);
void ZLAC8015D_ProcessRxMessage(CAN_RxHeaderTypeDef *rxHeader, uint8_t *rxData);

typedef struct {
  uint32_t last_rx_tick;
  uint16_t statusword;
  uint32_t abort_code;
  uint8_t online;
  uint8_t has_fault;
} ZLAC_NodeStatus_t;

ZLAC_NodeStatus_t *ZLAC8015D_GetNodeStatus(uint8_t nodeId);

#ifdef __cplusplus
}
#endif

#endif /* __ZLAC8015D_H */
