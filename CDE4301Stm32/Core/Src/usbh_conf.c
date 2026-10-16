/**
  ******************************************************************************
  * @file    usbh_conf.c
  * @brief   USB Host configuration for STM32F446RE (Nucleo-F446RE)
  *          Pins: PA11 (DM), PA12 (DP) - Full Speed Host Mode
  ******************************************************************************
  */

#include "stm32f4xx_hal.h"
#include "usbh_core.h"
#include "usbh_conf.h"

HCD_HandleTypeDef hhcd_USB_OTG_FS;

/*******************************************************************************
                       HCD MSP Routines
*******************************************************************************/
void HAL_HCD_MspInit(HCD_HandleTypeDef *hhcd)
{
  GPIO_InitTypeDef GPIO_InitStruct = {0};

  if (hhcd->Instance == USB_OTG_FS)
  {
    /* Enable GPIOA Clock */
    __HAL_RCC_GPIOA_CLK_ENABLE();

    /* Configure PA11 (DM) and PA12 (DP) */
    GPIO_InitStruct.Pin = GPIO_PIN_11 | GPIO_PIN_12;
    GPIO_InitStruct.Mode = GPIO_MODE_AF_PP;
    GPIO_InitStruct.Pull = GPIO_NOPULL;
    GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_VERY_HIGH;
    GPIO_InitStruct.Alternate = GPIO_AF10_OTG_FS;
    HAL_GPIO_Init(GPIOA, &GPIO_InitStruct);

    /* Enable USB OTG FS Clock */
    __HAL_RCC_USB_OTG_FS_CLK_ENABLE();

    /* Set USBFS Interrupt priority and enable */
    HAL_NVIC_SetPriority(OTG_FS_IRQn, 5, 0);
    HAL_NVIC_EnableIRQ(OTG_FS_IRQn);
  }
}

void HAL_HCD_MspDeInit(HCD_HandleTypeDef *hhcd)
{
  if (hhcd->Instance == USB_OTG_FS)
  {
    __HAL_RCC_USB_OTG_FS_CLK_DISABLE();
    HAL_GPIO_DeInit(GPIOA, GPIO_PIN_11 | GPIO_PIN_12);
    HAL_NVIC_DisableIRQ(OTG_FS_IRQn);
  }
}

/**
  * @brief  OTG FS Global Interrupt Handler
  */
void OTG_FS_IRQHandler(void)
{
  HAL_HCD_IRQHandler(&hhcd_USB_OTG_FS);
}

/*******************************************************************************
                       HCD Callbacks
*******************************************************************************/
void HAL_HCD_SOF_Callback(HCD_HandleTypeDef *hhcd)
{
  USBH_LL_IncTimer(hhcd->pData);
}

void HAL_HCD_Connect_Callback(HCD_HandleTypeDef *hhcd)
{
  USBH_LL_Connect(hhcd->pData);
}

void HAL_HCD_Disconnect_Callback(HCD_HandleTypeDef *hhcd)
{
  USBH_LL_Disconnect(hhcd->pData);
}

void HAL_HCD_PortEnabled_Callback(HCD_HandleTypeDef *hhcd)
{
  USBH_LL_PortEnabled(hhcd->pData);
}

void HAL_HCD_PortDisabled_Callback(HCD_HandleTypeDef *hhcd)
{
  USBH_HandleTypeDef *phost = (USBH_HandleTypeDef *)hhcd->pData;
  USBH_LL_PortDisabled(hhcd->pData);
  phost->device.is_disconnected = 0U;
}

void HAL_HCD_HC_NotifyURBChange_Callback(HCD_HandleTypeDef *hhcd, uint8_t chnum, HCD_URBStateTypeDef urb_state)
{
  /* Not using RTOS queue */
}

/*******************************************************************************
                       LL Driver Interface (USB Host Library --> HCD)
*******************************************************************************/
USBH_StatusTypeDef USBH_LL_Init(USBH_HandleTypeDef *phost)
{
  hhcd_USB_OTG_FS.Instance = USB_OTG_FS;
  hhcd_USB_OTG_FS.Init.Host_channels = 8;
  hhcd_USB_OTG_FS.Init.dma_enable = 0;
  hhcd_USB_OTG_FS.Init.low_power_enable = 0;
  hhcd_USB_OTG_FS.Init.phy_itface = HCD_PHY_EMBEDDED;
  hhcd_USB_OTG_FS.Init.Sof_enable = 0;
  hhcd_USB_OTG_FS.Init.speed = HCD_SPEED_FULL;
  hhcd_USB_OTG_FS.Init.vbus_sensing_enable = 0; /* Direct 5V power wired */
  hhcd_USB_OTG_FS.Init.lpm_enable = 0;

  hhcd_USB_OTG_FS.pData = phost;
  phost->pData = &hhcd_USB_OTG_FS;

  HAL_HCD_Init(&hhcd_USB_OTG_FS);

  USBH_LL_SetTimer(phost, HAL_HCD_GetCurrentFrame(&hhcd_USB_OTG_FS));
  return USBH_OK;
}

USBH_StatusTypeDef USBH_LL_DeInit(USBH_HandleTypeDef *phost)
{
  HAL_HCD_DeInit(phost->pData);
  return USBH_OK;
}

USBH_StatusTypeDef USBH_LL_Start(USBH_HandleTypeDef *phost)
{
  HAL_HCD_Start(phost->pData);
  return USBH_OK;
}

USBH_StatusTypeDef USBH_LL_Stop(USBH_HandleTypeDef *phost)
{
  HAL_HCD_Stop(phost->pData);
  return USBH_OK;
}

USBH_SpeedTypeDef USBH_LL_GetSpeed(USBH_HandleTypeDef *phost)
{
  USBH_SpeedTypeDef speed = USBH_SPEED_FULL;
  switch (HAL_HCD_GetCurrentSpeed(phost->pData))
  {
    case 0:  speed = USBH_SPEED_HIGH; break;
    case 1:  speed = USBH_SPEED_FULL; break;
    case 2:  speed = USBH_SPEED_LOW;  break;
    default: speed = USBH_SPEED_FULL; break;
  }
  return speed;
}

USBH_StatusTypeDef USBH_LL_ResetPort(USBH_HandleTypeDef *phost)
{
  HAL_HCD_ResetPort(phost->pData);
  return USBH_OK;
}

uint32_t USBH_LL_GetLastXferSize(USBH_HandleTypeDef *phost, uint8_t pipe)
{
  return HAL_HCD_HC_GetXferCount(phost->pData, pipe);
}

USBH_StatusTypeDef USBH_LL_OpenPipe(USBH_HandleTypeDef *phost,
                                    uint8_t pipe,
                                    uint8_t epnum,
                                    uint8_t dev_address,
                                    uint8_t speed,
                                    uint8_t ep_type,
                                    uint16_t mps)
{
  HAL_HCD_HC_Init(phost->pData, pipe, epnum, dev_address, speed, ep_type, mps);
  return USBH_OK;
}

USBH_StatusTypeDef USBH_LL_ClosePipe(USBH_HandleTypeDef *phost, uint8_t pipe)
{
  HAL_HCD_HC_Halt(phost->pData, pipe);
  return USBH_OK;
}

USBH_StatusTypeDef USBH_LL_SubmitURB(USBH_HandleTypeDef *phost,
                                     uint8_t pipe,
                                     uint8_t direction,
                                     uint8_t ep_type,
                                     uint8_t token,
                                     uint8_t *pbuff,
                                     uint16_t length,
                                     uint8_t do_ping)
{
  HAL_HCD_HC_SubmitRequest(phost->pData, pipe, direction, ep_type, token, pbuff, length, do_ping);
  return USBH_OK;
}

USBH_URBStateTypeDef USBH_LL_GetURBState(USBH_HandleTypeDef *phost, uint8_t pipe)
{
  return (USBH_URBStateTypeDef)HAL_HCD_HC_GetURBState(phost->pData, pipe);
}

USBH_StatusTypeDef USBH_LL_DriverVBUS(USBH_HandleTypeDef *phost, uint8_t state)
{
  /* Controller is powered directly from 5V header pin */
  HAL_Delay(100);
  return USBH_OK;
}

USBH_StatusTypeDef USBH_LL_SetToggle(USBH_HandleTypeDef *phost, uint8_t pipe, uint8_t toggle)
{
  HCD_HandleTypeDef *hhcd = (HCD_HandleTypeDef *)phost->pData;
  if (hhcd->hc[pipe].ep_is_in)
  {
    hhcd->hc[pipe].toggle_in = toggle;
  }
  else
  {
    hhcd->hc[pipe].toggle_out = toggle;
  }
  return USBH_OK;
}

uint8_t USBH_LL_GetToggle(USBH_HandleTypeDef *phost, uint8_t pipe)
{
  HCD_HandleTypeDef *hhcd = (HCD_HandleTypeDef *)phost->pData;
  if (hhcd->hc[pipe].ep_is_in)
  {
    return hhcd->hc[pipe].toggle_in;
  }
  else
  {
    return hhcd->hc[pipe].toggle_out;
  }
}

void USBH_Delay(uint32_t Delay)
{
  HAL_Delay(Delay);
}
