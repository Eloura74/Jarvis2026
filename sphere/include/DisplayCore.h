#pragma once

#include "Config.h"
#include <LovyanGFX.hpp>

// ================== CLASSE ÉCRAN GC9A01 (ESP32-S3) ==================
class LGFX : public lgfx::LGFX_Device {
  lgfx::Panel_GC9A01 _panel;
  lgfx::Bus_SPI      _bus;

public:
  LGFX();
};

// Instances Globales (Déclarées pour usage dans d'autres fichiers)
extern LGFX display;
extern lgfx::LGFX_Sprite spr;

void initDisplay();
