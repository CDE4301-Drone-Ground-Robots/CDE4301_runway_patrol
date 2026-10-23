#include "zlac8015d.h"
#include <stdio.h>

/* Internal Driver Handle */
static CAN_HandleTypeDef *pZlacCan = NULL;
static uint8_t zlacDefaultNodeId = 1;

#define ZLAC_MAX_NODES 8
static ZLAC_NodeStatus_t g_nodeStatus[ZLAC_MAX_NODES] = {0};

/* ==============================================================================
 * Driver Initialization & Status
 * ==============================================================================
 */
HAL_StatusTypeDef ZLAC8015D_Init(CAN_HandleTypeDef *hcan,
                                 uint8_t defaultNodeId) {
  pZlacCan = hcan;
  zlacDefaultNodeId = defaultNodeId;
  for (uint8_t i = 0; i < ZLAC_MAX_NODES; i++) {
    g_nodeStatus[i].node_id = i;
    g_nodeStatus[i].online = 0;
    g_nodeStatus[i].has_fault = 0;
    g_nodeStatus[i].statusword = 0;
    g_nodeStatus[i].error_code = 0;
    g_nodeStatus[i].actual_velocity_left = 0;
    g_nodeStatus[i].actual_velocity_right = 0;
    g_nodeStatus[i].last_seen_ms = 0;
  }
  return HAL_OK;
}

ZLAC_NodeStatus_t *ZLAC8015D_GetNodeStatus(uint8_t nodeId) {
  if (nodeId == 0 || nodeId >= ZLAC_MAX_NODES) {
    return NULL;
  }
  return &g_nodeStatus[nodeId];
}

void ZLAC8015D_SetNodeStatus(uint8_t nodeId, uint8_t online, uint8_t has_fault) {
  if (nodeId > 0 && nodeId < ZLAC_MAX_NODES) {
    g_nodeStatus[nodeId].online = online;
    g_nodeStatus[nodeId].has_fault = has_fault;
    if (online) {
      g_nodeStatus[nodeId].last_seen_ms = HAL_GetTick();
    }
  }
}

/* ==============================================================================
 * Profile Velocity Mode Initialization - Asynchronous Control (Section 3.4.2)
 * Sets independent Left/Right motor control via Object 0x200F = 0
 * ==============================================================================
 */
HAL_StatusTypeDef ZLAC8015D_Init_Velocity_Mode_Async_Node(uint8_t nodeId,
                                                          uint32_t accel_ms,
                                                          uint32_t decel_ms) {
  if (pZlacCan == NULL)
    return HAL_ERROR;

  /* 0. Send NMT Start Operational */
  ZLAC8015D_SendNMT_Node(nodeId, 0x01);
  HAL_Delay(50);

  /* 1. Set Asynchronous Control (0x200F = 0x0000) */
  ZLAC8015D_Write16_Node(nodeId, ZLAC_OBJ_SYNC_ASYNC_FLAG, ZLAC_SUB_ALL,
                         ZLAC_CONTROL_ASYNC);
  HAL_Delay(30);

  /* 2. Set Profile Velocity Mode (0x6060 = 0x03) */
  ZLAC8015D_Write8_Node(nodeId, ZLAC_OBJ_MODES_OF_OPERATION, ZLAC_SUB_ALL,
                        ZLAC_MODE_PROFILE_VELOCITY);
  HAL_Delay(30);

  /* 3. Set Left Motor Acceleration Time (0x6083 sub 01) */
  ZLAC8015D_Write32_Node(nodeId, ZLAC_OBJ_PROFILE_ACCEL, ZLAC_SUB_CH1_LEFT,
                         accel_ms);
  HAL_Delay(30);

  /* 4. Set Right Motor Acceleration Time (0x6083 sub 02) */
  ZLAC8015D_Write32_Node(nodeId, ZLAC_OBJ_PROFILE_ACCEL, ZLAC_SUB_CH2_RIGHT,
                         accel_ms);
  HAL_Delay(30);

  /* 5. Set Left Motor Deceleration Time (0x6084 sub 01) */
  ZLAC8015D_Write32_Node(nodeId, ZLAC_OBJ_PROFILE_DECEL, ZLAC_SUB_CH1_LEFT,
                         decel_ms);
  HAL_Delay(30);

  /* 6. Set Right Motor Deceleration Time (0x6084 sub 02) */
  ZLAC8015D_Write32_Node(nodeId, ZLAC_OBJ_PROFILE_DECEL, ZLAC_SUB_CH2_RIGHT,
                         decel_ms);
  HAL_Delay(30);

  /* 7. CiA 402 Enable Sequence: Shutdown (0x0006) -> Switch On (0x0007) ->
   * Enable (0x000F) */
  ZLAC8015D_Write16_Node(nodeId, ZLAC_OBJ_CONTROLWORD, ZLAC_SUB_ALL,
                         ZLAC_CMD_SHUTDOWN);
  HAL_Delay(30);
  ZLAC8015D_Write16_Node(nodeId, ZLAC_OBJ_CONTROLWORD, ZLAC_SUB_ALL,
                         ZLAC_CMD_SWITCH_ON);
  HAL_Delay(30);
  ZLAC8015D_Write16_Node(nodeId, ZLAC_OBJ_CONTROLWORD, ZLAC_SUB_ALL,
                         ZLAC_CMD_ENABLE_OPERATION);
  HAL_Delay(50);

  /* 8. Explicitly initialize Left and Right target speeds to 0 RPM */
  ZLAC8015D_Write32_Node(nodeId, ZLAC_OBJ_TARGET_VELOCITY, ZLAC_SUB_CH1_LEFT,
                         0);
  HAL_Delay(30);
  ZLAC8015D_Write32_Node(nodeId, ZLAC_OBJ_TARGET_VELOCITY, ZLAC_SUB_CH2_RIGHT,
                         0);
  HAL_Delay(30);

  return HAL_OK;
}

HAL_StatusTypeDef ZLAC8015D_Init_Velocity_Mode_Async(uint32_t accel_ms,
                                                     uint32_t decel_ms) {
  return ZLAC8015D_Init_Velocity_Mode_Async_Node(zlacDefaultNodeId, accel_ms,
                                                 decel_ms);
}

/* ==============================================================================
 * Profile Velocity Mode Initialization - Synchronous Control (Section 3.4.2)
 * Sets combined Left+Right motor control via Object 0x200F = 1
 * ==============================================================================
 */
HAL_StatusTypeDef ZLAC8015D_Init_Velocity_Mode_Sync_Node(uint8_t nodeId,
                                                         uint32_t accel_ms,
                                                         uint32_t decel_ms) {
  if (pZlacCan == NULL)
    return HAL_ERROR;

  /* 0. Send NMT Start Operational */
  ZLAC8015D_SendNMT_Node(nodeId, 0x01);
  HAL_Delay(50);

  /* 1. Set Synchronous Control (0x200F = 0x0001) */
  ZLAC8015D_Write16_Node(nodeId, ZLAC_OBJ_SYNC_ASYNC_FLAG, ZLAC_SUB_ALL,
                         ZLAC_CONTROL_SYNC);
  HAL_Delay(30);

  /* 2. Set Profile Velocity Mode (0x6060 = 0x03) */
  ZLAC8015D_Write8_Node(nodeId, ZLAC_OBJ_MODES_OF_OPERATION, ZLAC_SUB_ALL,
                        ZLAC_MODE_PROFILE_VELOCITY);
  HAL_Delay(30);

  /* 3. Set Left & Right Acceleration (0x6083) */
  ZLAC8015D_Write32_Node(nodeId, ZLAC_OBJ_PROFILE_ACCEL, ZLAC_SUB_CH1_LEFT,
                         accel_ms);
  HAL_Delay(30);
  ZLAC8015D_Write32_Node(nodeId, ZLAC_OBJ_PROFILE_ACCEL, ZLAC_SUB_CH2_RIGHT,
                         accel_ms);
  HAL_Delay(30);

  /* 4. Set Left & Right Deceleration (0x6084) */
  ZLAC8015D_Write32_Node(nodeId, ZLAC_OBJ_PROFILE_DECEL, ZLAC_SUB_CH1_LEFT,
                         decel_ms);
  HAL_Delay(30);
  ZLAC8015D_Write32_Node(nodeId, ZLAC_OBJ_PROFILE_DECEL, ZLAC_SUB_CH2_RIGHT,
                         decel_ms);
  HAL_Delay(30);

  /* 5. CiA 402 Enable Sequence: Shutdown (0x0006) -> Switch On (0x0007) ->
   * Enable (0x000F) */
  ZLAC8015D_Write16_Node(nodeId, ZLAC_OBJ_CONTROLWORD, ZLAC_SUB_ALL,
                         ZLAC_CMD_SHUTDOWN);
  HAL_Delay(30);
  ZLAC8015D_Write16_Node(nodeId, ZLAC_OBJ_CONTROLWORD, ZLAC_SUB_ALL,
                         ZLAC_CMD_SWITCH_ON);
  HAL_Delay(30);
  ZLAC8015D_Write16_Node(nodeId, ZLAC_OBJ_CONTROLWORD, ZLAC_SUB_ALL,
                         ZLAC_CMD_ENABLE_OPERATION);
  HAL_Delay(50);

  return HAL_OK;
}

HAL_StatusTypeDef ZLAC8015D_Init_Velocity_Mode_Sync(uint32_t accel_ms,
                                                    uint32_t decel_ms) {
  return ZLAC8015D_Init_Velocity_Mode_Sync_Node(zlacDefaultNodeId, accel_ms,
                                                decel_ms);
}

/* Enable Motor Driver (CiA 402 Operation Enabled) */
HAL_StatusTypeDef ZLAC8015D_Enable_Node(uint8_t nodeId) {
  if (pZlacCan == NULL)
    return HAL_ERROR;

  ZLAC8015D_SendNMT_Node(nodeId, 0x01);
  HAL_Delay(20);
  ZLAC8015D_Write16_Node(nodeId, ZLAC_OBJ_CONTROLWORD, ZLAC_SUB_ALL,
                         ZLAC_CMD_SHUTDOWN);
  HAL_Delay(20);
  ZLAC8015D_Write16_Node(nodeId, ZLAC_OBJ_CONTROLWORD, ZLAC_SUB_ALL,
                         ZLAC_CMD_SWITCH_ON);
  HAL_Delay(20);
  ZLAC8015D_Write16_Node(nodeId, ZLAC_OBJ_CONTROLWORD, ZLAC_SUB_ALL,
                         ZLAC_CMD_ENABLE_OPERATION);
  HAL_Delay(50);

  return HAL_OK;
}

HAL_StatusTypeDef ZLAC8015D_Enable(void) {
  return ZLAC8015D_Enable_Node(zlacDefaultNodeId);
}

/* ==============================================================================
 * Speed Commands (RPM)
 * ==============================================================================
 */

/* Set Both Speeds for a specific Node in Asynchronous Mode */
HAL_StatusTypeDef ZLAC8015D_SetVelocity_Node(uint8_t nodeId, int32_t leftRpm,
                                             int32_t rightRpm) {
  HAL_StatusTypeDef res1 = ZLAC8015D_Write32_Node(
      nodeId, ZLAC_OBJ_TARGET_VELOCITY, ZLAC_SUB_CH1_LEFT, leftRpm);
  HAL_Delay(5);
  HAL_StatusTypeDef res2 = ZLAC8015D_Write32_Node(
      nodeId, ZLAC_OBJ_TARGET_VELOCITY, ZLAC_SUB_CH2_RIGHT, rightRpm);
  return (res1 == HAL_OK && res2 == HAL_OK) ? HAL_OK : HAL_ERROR;
}

HAL_StatusTypeDef ZLAC8015D_SetVelocity_Async_Left(int32_t rpm) {
  return ZLAC8015D_Write32_Node(zlacDefaultNodeId, ZLAC_OBJ_TARGET_VELOCITY,
                                ZLAC_SUB_CH1_LEFT, rpm);
}

HAL_StatusTypeDef ZLAC8015D_SetVelocity_Async_Right(int32_t rpm) {
  return ZLAC8015D_Write32_Node(zlacDefaultNodeId, ZLAC_OBJ_TARGET_VELOCITY,
                                ZLAC_SUB_CH2_RIGHT, rpm);
}

HAL_StatusTypeDef ZLAC8015D_SetVelocity_Right_Node(uint8_t nodeId,
                                                   int32_t rpm) {
  return ZLAC8015D_Write32_Node(nodeId, ZLAC_OBJ_TARGET_VELOCITY,
                                ZLAC_SUB_CH2_RIGHT, rpm);
}

HAL_StatusTypeDef ZLAC8015D_SetVelocity_Left_Node(uint8_t nodeId, int32_t rpm) {
  return ZLAC8015D_Write32_Node(nodeId, ZLAC_OBJ_TARGET_VELOCITY,
                                ZLAC_SUB_CH1_LEFT, rpm);
}

HAL_StatusTypeDef ZLAC8015D_SetVelocity_Async(int32_t leftRpm,
                                              int32_t rightRpm) {
  return ZLAC8015D_SetVelocity_Node(zlacDefaultNodeId, leftRpm, rightRpm);
}

/* Set Both Speeds Simultaneously in Synchronous Mode (Section 3.4.2) */
HAL_StatusTypeDef ZLAC8015D_SetVelocity_Sync_Node(uint8_t nodeId,
                                                  int16_t leftRpm,
                                                  int16_t rightRpm) {
  int32_t combined =
      ((int32_t)(uint16_t)rightRpm << 16) | (int32_t)(uint16_t)leftRpm;
  return ZLAC8015D_Write32_Node(nodeId, ZLAC_OBJ_TARGET_VELOCITY,
                                ZLAC_SUB_SYNC_BOTH, combined);
}

HAL_StatusTypeDef ZLAC8015D_SetVelocity_Sync(int16_t leftRpm,
                                             int16_t rightRpm) {
  return ZLAC8015D_SetVelocity_Sync_Node(zlacDefaultNodeId, leftRpm, rightRpm);
}

/* ==============================================================================
 * Stop & Emergency Stop Commands (Section 3.2, 3.6, 3.7)
 * ==============================================================================
 */

/* Normal Stop (Shutdown Command: 2B 40 60 00 06 00 00 00) */
HAL_StatusTypeDef ZLAC8015D_Stop_Node(uint8_t nodeId) {
  return ZLAC8015D_Write16_Node(nodeId, ZLAC_OBJ_CONTROLWORD, ZLAC_SUB_ALL,
                                ZLAC_CMD_SHUTDOWN);
}

HAL_StatusTypeDef ZLAC8015D_Stop(void) {
  return ZLAC8015D_Stop_Node(zlacDefaultNodeId);
}

/* Emergency Stop (Section 3.6 - Command: 2B 40 60 00 02 00 00 00) */
HAL_StatusTypeDef ZLAC8015D_EmergencyStop_Node(uint8_t nodeId) {
  return ZLAC8015D_Write16_Node(nodeId, ZLAC_OBJ_CONTROLWORD, ZLAC_SUB_ALL,
                                ZLAC_CMD_EMERGENCY_STOP);
}

HAL_StatusTypeDef ZLAC8015D_EmergencyStop(void) {
  return ZLAC8015D_EmergencyStop_Node(zlacDefaultNodeId);
}

/* Release Emergency Stop (Section 3.6 - Command: 2B 40 60 00 0F 00 00 00) */
HAL_StatusTypeDef ZLAC8015D_ReleaseEmergencyStop_Node(uint8_t nodeId) {
  return ZLAC8015D_Write16_Node(nodeId, ZLAC_OBJ_CONTROLWORD, ZLAC_SUB_ALL,
                                ZLAC_CMD_ENABLE_OPERATION);
}

HAL_StatusTypeDef ZLAC8015D_ReleaseEmergencyStop(void) {
  return ZLAC8015D_ReleaseEmergencyStop_Node(zlacDefaultNodeId);
}

/* Clear Error / Fault Reset (Section 3.7 - Command: 2B 40 60 00 80 00 00 00) */
HAL_StatusTypeDef ZLAC8015D_ClearError_Node(uint8_t nodeId) {
  if (nodeId > 0 && nodeId < ZLAC_MAX_NODES) {
    g_nodeStatus[nodeId].has_fault = 0;
  }
  return ZLAC8015D_Write16_Node(nodeId, ZLAC_OBJ_CONTROLWORD, ZLAC_SUB_ALL,
                                ZLAC_CMD_CLEAR_ERROR);
}

HAL_StatusTypeDef ZLAC8015D_ClearError(void) {
  return ZLAC8015D_ClearError_Node(zlacDefaultNodeId);
}

/* ==============================================================================
 * Incoming CAN Packet Handler
 * ==============================================================================
 */
void ZLAC8015D_ProcessRxMessage(CAN_RxHeaderTypeDef *rxHeader,
                                uint8_t *rxData) {
  /* Check for SDO Response COB-ID (0x580 + NodeID) */
  if (rxHeader->StdId >= 0x581 && rxHeader->StdId <= 0x58F) {
    uint8_t responderNodeId = (uint8_t)(rxHeader->StdId - 0x580);
    ZLAC_NodeStatus_t *status = ZLAC8015D_GetNodeStatus(responderNodeId);
    if (status != NULL) {
      status->online = 1;
      status->last_seen_ms = HAL_GetTick();
    }

    /* Byte 0 == 0x60: SDO Download Acknowledged (Write successful) */
    if (rxData[0] == 0x60) {
      /* Write acknowledged by Node */
    }
    /* Byte 0 == 0x80: SDO Abort / Error Feedback */
    else if (rxData[0] == 0x80) {
      if (status != NULL) {
        status->has_fault = 1;
      }
      uint32_t abortCode = ((uint32_t)rxData[7] << 24) |
                           ((uint32_t)rxData[6] << 16) |
                           ((uint32_t)rxData[5] << 8) | rxData[4];
      printf("  [ZLAC NODE %d SDO ERROR] Object 0x%02X%02X sub 0x%02X Abort "
             "Code: 0x%08lX\r\n",
             responderNodeId, rxData[2], rxData[1], rxData[3], abortCode);
    }
    /* SDO Upload (Read) Response (Byte 0: 0x4B = 2 bytes, 0x4F = 1 byte, 0x43 = 4 bytes, etc.) */
    else if (rxData[0] == 0x4B || rxData[0] == 0x4F || rxData[0] == 0x43 || (rxData[0] & 0x40)) {
      uint16_t index = (uint16_t)rxData[1] | ((uint16_t)rxData[2] << 8);
      if (index == ZLAC_OBJ_STATUSWORD) {
        uint16_t sw = (uint16_t)rxData[4] | ((uint16_t)rxData[5] << 8);
        if (status != NULL) {
          status->statusword = sw;
          /* CiA 402 Bit 3 is Fault */
          status->has_fault = (sw & 0x0008) ? 1 : 0;
        }
      } else if (index == ZLAC_OBJ_ERROR_CODE) {
        uint16_t err = (uint16_t)rxData[4] | ((uint16_t)rxData[5] << 8);
        if (status != NULL) {
          status->error_code = err;
          if (err != 0) {
            status->has_fault = 1;
          }
        }
      }
    }
  }
  /* Heartbeat / Bootup COB-ID (0x700 + NodeID) */
  else if (rxHeader->StdId >= 0x701 && rxHeader->StdId <= 0x70F) {
    uint8_t responderNodeId = (uint8_t)(rxHeader->StdId - 0x700);
    ZLAC_NodeStatus_t *status = ZLAC8015D_GetNodeStatus(responderNodeId);
    if (status != NULL) {
      status->online = 1;
      status->last_seen_ms = HAL_GetTick();
    }
  }
}

/* ==============================================================================
 * Low-Level CANopen Protocol Implementations (SDO & NMT)
 * ==============================================================================
 */

/* Send CANopen NMT Command (0x01=Start, 0x02=Stop, 0x80=Pre-Op, 0x81=Reset) */
HAL_StatusTypeDef ZLAC8015D_SendNMT_Node(uint8_t nodeId, uint8_t command) {
  if (pZlacCan == NULL)
    return HAL_ERROR;

  CAN_TxHeaderTypeDef txHeader;
  uint8_t txData[2] = {0};
  uint32_t txMailbox;

  txHeader.StdId = 0x000;
  txHeader.ExtId = 0x00;
  txHeader.RTR = CAN_RTR_DATA;
  txHeader.IDE = CAN_ID_STD;
  txHeader.DLC = 2;
  txHeader.TransmitGlobalTime = DISABLE;

  txData[0] = command;
  txData[1] = nodeId;

  return HAL_CAN_AddTxMessage(pZlacCan, &txHeader, txData, &txMailbox);
}

HAL_StatusTypeDef ZLAC8015D_SendNMT(uint8_t command) {
  return ZLAC8015D_SendNMT_Node(zlacDefaultNodeId, command);
}

/* Helper: Transmit CAN message safely by clearing stuck mailboxes if none are free */
static HAL_StatusTypeDef CAN_Send_Safe(CAN_HandleTypeDef *hcan,
                                       CAN_TxHeaderTypeDef *pHeader,
                                       uint8_t aData[], uint32_t *pTxMailbox) {
  if (HAL_CAN_GetTxMailboxesFreeLevel(hcan) == 0) {
    HAL_CAN_AbortTxRequest(hcan, CAN_TX_MAILBOX0);
    HAL_CAN_AbortTxRequest(hcan, CAN_TX_MAILBOX1);
    HAL_CAN_AbortTxRequest(hcan, CAN_TX_MAILBOX2);
  }
  return HAL_CAN_AddTxMessage(hcan, pHeader, aData, pTxMailbox);
}

/* SDO Expedited Download 1 Byte (Command 0x2F) */
HAL_StatusTypeDef ZLAC8015D_Write8_Node(uint8_t nodeId, uint16_t index,
                                        uint8_t subindex, uint8_t value) {
  if (pZlacCan == NULL)
    return HAL_ERROR;

  CAN_TxHeaderTypeDef txHeader;
  uint8_t txData[8] = {0};
  uint32_t txMailbox;

  txHeader.StdId = 0x600 + nodeId;
  txHeader.ExtId = 0x00;
  txHeader.RTR = CAN_RTR_DATA;
  txHeader.IDE = CAN_ID_STD;
  txHeader.DLC = 8;
  txHeader.TransmitGlobalTime = DISABLE;

  txData[0] = 0x2F;                    /* 1 byte expedited write */
  txData[1] = (uint8_t)(index & 0xFF); /* Index Low Byte */
  txData[2] = (uint8_t)(index >> 8);   /* Index High Byte */
  txData[3] = subindex;
  txData[4] = value;

  return CAN_Send_Safe(pZlacCan, &txHeader, txData, &txMailbox);
}

HAL_StatusTypeDef ZLAC8015D_Write8(uint16_t index, uint8_t subindex,
                                   uint8_t value) {
  return ZLAC8015D_Write8_Node(zlacDefaultNodeId, index, subindex, value);
}

/* SDO Expedited Download 2 Bytes (Command 0x2B) */
HAL_StatusTypeDef ZLAC8015D_Write16_Node(uint8_t nodeId, uint16_t index,
                                         uint8_t subindex, uint16_t value) {
  if (pZlacCan == NULL)
    return HAL_ERROR;

  CAN_TxHeaderTypeDef txHeader;
  uint8_t txData[8] = {0};
  uint32_t txMailbox;

  txHeader.StdId = 0x600 + nodeId;
  txHeader.ExtId = 0x00;
  txHeader.RTR = CAN_RTR_DATA;
  txHeader.IDE = CAN_ID_STD;
  txHeader.DLC = 8;
  txHeader.TransmitGlobalTime = DISABLE;

  txData[0] = 0x2B; /* 2 bytes expedited write */
  txData[1] = (uint8_t)(index & 0xFF);
  txData[2] = (uint8_t)(index >> 8);
  txData[3] = subindex;
  txData[4] = (uint8_t)(value & 0xFF);
  txData[5] = (uint8_t)(value >> 8);

  return CAN_Send_Safe(pZlacCan, &txHeader, txData, &txMailbox);
}

HAL_StatusTypeDef ZLAC8015D_Write16(uint16_t index, uint8_t subindex,
                                    uint16_t value) {
  return ZLAC8015D_Write16_Node(zlacDefaultNodeId, index, subindex, value);
}

/* SDO Expedited Download 4 Bytes (Command 0x23) */
HAL_StatusTypeDef ZLAC8015D_Write32_Node(uint8_t nodeId, uint16_t index,
                                         uint8_t subindex, int32_t value) {
  if (pZlacCan == NULL)
    return HAL_ERROR;

  CAN_TxHeaderTypeDef txHeader;
  uint8_t txData[8] = {0};
  uint32_t txMailbox;

  txHeader.StdId = 0x600 + nodeId;
  txHeader.ExtId = 0x00;
  txHeader.RTR = CAN_RTR_DATA;
  txHeader.IDE = CAN_ID_STD;
  txHeader.DLC = 8;
  txHeader.TransmitGlobalTime = DISABLE;

  txData[0] = 0x23; /* 4 bytes expedited write */
  txData[1] = (uint8_t)(index & 0xFF);
  txData[2] = (uint8_t)(index >> 8);
  txData[3] = subindex;
  txData[4] = (uint8_t)(value & 0xFF);
  txData[5] = (uint8_t)((value >> 8) & 0xFF);
  txData[6] = (uint8_t)((value >> 16) & 0xFF);
  txData[7] = (uint8_t)((value >> 24) & 0xFF);

  return CAN_Send_Safe(pZlacCan, &txHeader, txData, &txMailbox);
}

HAL_StatusTypeDef ZLAC8015D_Write32(uint16_t index, uint8_t subindex,
                                    int32_t value) {
  return ZLAC8015D_Write32_Node(zlacDefaultNodeId, index, subindex, value);
}

/* SDO Upload Request (Read Object Dictionary - Command 0x40) */
HAL_StatusTypeDef ZLAC8015D_RequestRead_Node(uint8_t nodeId, uint16_t index,
                                             uint8_t subindex) {
  if (pZlacCan == NULL)
    return HAL_ERROR;

  CAN_TxHeaderTypeDef txHeader;
  uint8_t txData[8] = {0};
  uint32_t txMailbox;

  txHeader.StdId = 0x600 + nodeId;
  txHeader.ExtId = 0x00;
  txHeader.RTR = CAN_RTR_DATA;
  txHeader.IDE = CAN_ID_STD;
  txHeader.DLC = 8;
  txHeader.TransmitGlobalTime = DISABLE;

  txData[0] = 0x40;                    /* SDO Upload request */
  txData[1] = (uint8_t)(index & 0xFF); /* Index Low */
  txData[2] = (uint8_t)(index >> 8);   /* Index High */
  txData[3] = subindex;                /* Sub-index */

  return CAN_Send_Safe(pZlacCan, &txHeader, txData, &txMailbox);
}
