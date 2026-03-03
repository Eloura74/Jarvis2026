#pragma once

// ==============================================================================
// globals.h — Déclarations globales partagées entre tous les modules
// Inclus en premier dans chaque .cpp via #include "globals.h"
// ==============================================================================

#include <Arduino.h>
#include <WString.h>
#include <LovyanGFX.hpp>
#include <vector>
#include <cmath>

// Expose LGFX_Sprite sans namespace pour les structs locaux (ex: CoilDrawer)
using lgfx::LGFX_Sprite;

#ifndef PI
#define PI 3.14159265358979323846f
#endif

#ifndef DEG_TO_RAD
#define DEG_TO_RAD 0.0174532925f
#endif

#ifndef MC_DATUM
#define ML_DATUM 3
#define MC_DATUM 4
#define MR_DATUM 5
#endif

// ==============================================================================
// DRIVER ÉCRAN — LovyanGFX GC9A01 240x240 (SPI2, ESP32-S3)
// ==============================================================================
class LGFX : public lgfx::LGFX_Device {
  lgfx::Panel_GC9A01 _panel;
  lgfx::Bus_SPI      _bus;

public:
  LGFX() {
    {
      auto cfg = _bus.config();
      cfg.spi_host    = SPI2_HOST;
      cfg.spi_mode    = 0;
      cfg.freq_write  = 80000000;
      cfg.spi_3wire   = true;
      cfg.use_lock    = true;
      cfg.dma_channel = SPI_DMA_CH_AUTO;
      cfg.pin_sclk = 12;
      cfg.pin_mosi = 11;
      cfg.pin_miso = -1;
      cfg.pin_dc   = 9;
      _bus.config(cfg);
      _panel.setBus(&_bus);
    }
    {
      auto cfg = _panel.config();
      cfg.pin_cs   = 10;
      cfg.pin_rst  = 8;
      cfg.pin_busy = -1;
      cfg.memory_width  = 240;
      cfg.memory_height = 240;
      cfg.panel_width   = 240;
      cfg.panel_height  = 240;
      cfg.offset_x = 0;
      cfg.offset_y = 0;
      cfg.invert    = true;
      cfg.rgb_order = false;
      _panel.config(cfg);
    }
    setPanel(&_panel);
  }
};

// ==============================================================================
// ÉTATS DE L'ORB
// ==============================================================================
enum class OrbState : uint8_t {
  IDLE, LISTENING, SPEAKING, ERROR,
  MODE_WEATHER, MODE_HOME, MODE_SYSTEM, MODE_MATRIX, MODE_SEARCH,
  MODE_MEDIA, MODE_TIMER, MODE_PRINT, MODE_NOTIFICATION, MODE_SUCCESS,
  MODE_APPS, MODE_VISION, MODE_GHOST, MODE_SECURITY, MODE_SCREENSAVER,
  MODE_WHATSAPP, MODE_GMAIL, MODE_CALENDAR, MODE_MAP
};

// ==============================================================================
// THEMES DE L'APP
// ==============================================================================
enum class AppTheme : uint8_t {
  CLASSIC, IRONMAN, MATRIX, COPPER, WOOD
};

// ==============================================================================
// STRUCTURE D'ÉTAT PARTAGÉE (accès multi-core via spinlock)
// ==============================================================================
struct JarvisState {
  OrbState currentState = OrbState::IDLE;
  AppTheme currentTheme = AppTheme::CLASSIC;
  char textLabel[64]    = "STANDBY";
  portMUX_TYPE spinlock = portMUX_INITIALIZER_UNLOCKED;
};

// ==============================================================================
// MOTEUR 3D
// ==============================================================================
struct Point3D  { float x, y, z; };
struct ProjPoint { int x, y; float z; };

// (Anciennes structures particules screensaver supprimées)

// ==============================================================================
// VARIABLES GLOBALES — définies dans main.cpp, extern partout ailleurs
// ==============================================================================
extern LGFX                display;
extern lgfx::LGFX_Sprite   spr;
extern JarvisState         jarvisData;

extern const int CX;
extern const int CY;
extern float     g_phase;
extern uint32_t  ms_time;

// ==============================================================================
// LAYERS DE RENDU HYBRIDE (Screensaver Arc Reactor)
// (Supprimés pour libérer 345Ko de RAM, rendu compositing direct sur spr)
// ==============================================================================

// Screensaver
extern float          g_sleep_phase;
extern uint16_t       g_sleep_color;
extern unsigned long  g_screensaver_start;

// Moteur 3D
extern const int SPHERE_NODES;
extern Point3D   sphereBase[];
extern ProjPoint renderBuffer[];

// Dynamiques (interpolation spring)
extern float   dyn_radius;
extern float   v_radius;
extern float   dyn_speed;
extern float   v_speed;
extern uint16_t dyn_color;

// État local Core 1 (copie thread-safe depuis jarvisData)
extern OrbState local_state;
extern AppTheme local_theme;
extern char     local_text[64];
extern unsigned long idleStartTime;

// ==============================================================================
// PALETTE COULEURS (constantes, définies dans utils.cpp)
// ==============================================================================
extern const uint16_t COL_CYAN;
extern const uint16_t COL_BLUE;
extern const uint16_t COL_OMNI_BLUE;
extern const uint16_t COL_OMNI_RED;
extern const uint16_t COL_DEEP_BLUE;
extern const uint16_t COL_ORANGE;
extern const uint16_t COL_RED;
extern const uint16_t COL_WHITE;
extern const uint16_t COL_GREEN;
extern const uint16_t COL_YELLOW;
extern const uint16_t COL_PURPLE;
extern const uint16_t COL_PINK;
extern const uint16_t COL_GREY;
extern const uint16_t COL_DARK;
extern const uint16_t COL_BG;
extern const uint16_t COL_COPPER;
extern const uint16_t COL_WOOD;
extern const uint16_t COL_OAK;
extern const uint16_t COL_COPPER_BURNED;
extern const uint16_t COL_SIENNA;
