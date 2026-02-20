#pragma once

#include <Arduino.h>
#include <LovyanGFX.hpp>
#include <vector>
#include <cmath>

// ================== MACROS MATH & GFX ==================
#ifndef PI
#define PI 3.14159265358979323846f
#endif

// Compatibilité macros d'alignement TFT_eSPI pour LovyanGFX
#ifndef MC_DATUM
#define ML_DATUM 3
#define MC_DATUM 4
#define MR_DATUM 5
#endif

#ifndef DEG_TO_RAD
#define DEG_TO_RAD 0.0174532925f
#endif

// ================== DIMENSIONS DE L'ECRAN GC9A01 ==================
const int CX = 120;
const int CY = 120;

// ================== OUTILS COULEURS ==================
inline uint16_t rgb565(uint8_t r, uint8_t g, uint8_t b) {
  return ((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3);
}

inline uint16_t lerpColor(uint16_t c1, uint16_t c2, float t) {
  if (t <= 0.0f) return c1;
  if (t >= 1.0f) return c2;
  int r1 = (c1 >> 11) & 0x1F; int g1 = (c1 >> 5) & 0x3F; int b1 = c1 & 0x1F;
  int r2 = (c2 >> 11) & 0x1F; int g2 = (c2 >> 5) & 0x3F; int b2 = c2 & 0x1F;
  return (((r1 + (int)((r2 - r1) * t)) & 0x1F) << 11) | 
         (((g1 + (int)((g2 - g1) * t)) & 0x3F) << 5) | 
          ((b1 + (int)((b2 - b1) * t)) & 0x1F);
}

// ================== PALETTE CYBERPUNK ==================
const uint16_t COL_CYAN      = rgb565(0, 240, 255);
const uint16_t COL_BLUE      = rgb565(0, 100, 255);
const uint16_t COL_AI_VOICE  = rgb565(0, 150, 255);
const uint16_t COL_DEEP_BLUE = rgb565(10, 30, 80);
const uint16_t COL_ORANGE    = rgb565(255, 120, 0);
const uint16_t COL_RED       = rgb565(255, 40, 60);
const uint16_t COL_WHITE     = rgb565(240, 248, 255);
const uint16_t COL_GREEN     = rgb565(0, 255, 120);
const uint16_t COL_YELLOW    = rgb565(255, 200, 0);
const uint16_t COL_PURPLE    = rgb565(180, 50, 255);
const uint16_t COL_PINK      = rgb565(255, 0, 127);
const uint16_t COL_GREY      = rgb565(100, 110, 120);
const uint16_t COL_DARK      = rgb565(20, 25, 30);
const uint16_t COL_BG        = rgb565(4, 6, 10);

// ================== SYSTEM STATES ==================
enum class OrbState : uint8_t { 
  IDLE, LISTENING, SPEAKING, ERROR,
  MODE_WEATHER, MODE_HOME, MODE_SYSTEM, MODE_MATRIX, MODE_SEARCH,
  MODE_PRINT, MODE_TIMER, MODE_MEDIA, MODE_CALENDER, MODE_MAP,
  MODE_APPS, MODE_VISION, MODE_GHOST, MODE_SECURITY, MODE_SUCCESS
};
