#include "globals.h"
#include "utils.h"

// ==============================================================================
// utils.cpp — Outils couleurs, maths et primitives graphiques
// ==============================================================================

// ==============================================================================
// PALETTE COULEURS — définitions des constantes déclarées dans globals.h
// ==============================================================================
const uint16_t COL_CYAN      = rgb565(0, 240, 255);
const uint16_t COL_BLUE      = rgb565(0, 100, 255);
const uint16_t COL_OMNI_BLUE = rgb565(0, 140, 255);
const uint16_t COL_OMNI_RED  = rgb565(255, 10, 30);
const uint16_t COL_DEEP_BLUE = rgb565(5, 15, 30);
const uint16_t COL_ORANGE    = rgb565(255, 120, 0);
const uint16_t COL_RED       = rgb565(255, 40, 60);
const uint16_t COL_WHITE     = rgb565(240, 248, 255);
const uint16_t COL_GREEN     = rgb565(0, 255, 120);
const uint16_t COL_YELLOW    = rgb565(255, 200, 0);
const uint16_t COL_PURPLE    = rgb565(180, 50, 255);
const uint16_t COL_PINK      = rgb565(255, 0, 127);
const uint16_t COL_GREY      = rgb565(100, 110, 120);
const uint16_t COL_DARK      = rgb565(10, 15, 20);
const uint16_t COL_BG        = rgb565(2, 3, 5);

// Couleurs liées aux thèmes (WOOD, COPPER, etc.)
const uint16_t COL_COPPER        = rgb565(184, 115, 51);
const uint16_t COL_WOOD          = rgb565(160, 82, 45);
const uint16_t COL_OAK           = rgb565(210, 180, 140);
const uint16_t COL_COPPER_BURNED = rgb565(120, 60, 20);
const uint16_t COL_SIENNA        = rgb565(136, 45, 23);

// ==============================================================================
// COULEURS
// ==============================================================================

// Convertit R/G/B 8-bit en couleur RGB565 pour LovyanGFX
uint16_t rgb565(uint8_t r, uint8_t g, uint8_t b) {
  return ((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3);
}

// Interpolation linéaire entre deux couleurs RGB565 (t : 0.0 → 1.0)
uint16_t lerpColor(uint16_t c1, uint16_t c2, float t) {
  if (t <= 0.0f) return c1;
  if (t >= 1.0f) return c2;
  int r1 = (c1 >> 11) & 0x1F; int g1 = (c1 >> 5) & 0x3F; int b1 = c1 & 0x1F;
  int r2 = (c2 >> 11) & 0x1F; int g2 = (c2 >> 5) & 0x3F; int b2 = c2 & 0x1F;
  return (((r1 + (int)((r2 - r1) * t)) & 0x1F) << 11) |
         (((g1 + (int)((g2 - g1) * t)) & 0x3F) << 5) |
          ((b1 + (int)((b2 - b1) * t)) & 0x1F);
}

// ==============================================================================
// PRIMITIVES GRAPHIQUES
// ==============================================================================

// Halo lumineux : cercles concentriques dégradés de COL_BG vers color
void drawGlow(int x, int y, int radius, uint16_t color, int intensity) {
  for (int r = radius + intensity; r > radius; r -= 2) {
    float factor = 1.0f - ((float)(r - radius) / intensity);
    uint16_t fadeCol = lerpColor(COL_BG, color, factor * factor);
    spr.drawCircle(x, y, r, fadeCol);
  }
}

// Fond radial dégradé centré sur CX/CY avec la couleur dynamique dyn_color
void drawRadialBackground() {
  uint16_t centerGlowCol = lerpColor(COL_BG, dyn_color, 0.12f);
  for (int r = 120; r > 30; r -= 4) {
    float factor = 1.0f - ((float)r / 120.0f);
    uint16_t ringCol = lerpColor(COL_BG, centerGlowCol, factor * factor * factor);
    spr.drawCircle(CX, CY, r, ringCol);
    spr.drawCircle(CX, CY, r-1, ringCol);
    spr.drawCircle(CX, CY, r-2, ringCol);
    spr.drawCircle(CX, CY, r-3, ringCol);
  }
}

// Anneau segmenté rotatif : segments arcs séparés par des gaps
void drawSegmentedRing(int x, int y, int r, int thickness,
                       int segments, float phase, float gapRatio, uint16_t color) {
  float angleStep = 360.0f / segments;
  float gap = angleStep * gapRatio;
  for (int i = 0; i < segments; i++) {
    float startAngle = i * angleStep + phase;
    float endAngle   = startAngle + angleStep - gap;
    spr.fillArc(x, y, r, r - thickness, startAngle, endAngle, color);
  }
}

// ==============================================================================
// GÉOMÉTRIE 3D
// ==============================================================================

// Distribution de Fibonacci sur la sphère unité — répartition uniforme des nœuds
void init3DGeometry() {
  float phi = PI * (3.0f - sqrt(5.0f));
  for (int i = 0; i < SPHERE_NODES; i++) {
    float y      = 1.0f - (i / (float)(SPHERE_NODES - 1)) * 2.0f;
    float radius = sqrt(1.0f - y * y);
    float theta  = phi * i;
    sphereBase[i].x = cos(theta) * radius;
    sphereBase[i].y = y;
    sphereBase[i].z = sin(theta) * radius;
  }
}

