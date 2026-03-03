#pragma once
#include "globals.h"

// ==============================================================================
// utils.h — Outils couleurs, maths et primitives graphiques partagées
// ==============================================================================

// Convertit R/G/B 8-bit en couleur RGB565 pour LovyanGFX
uint16_t rgb565(uint8_t r, uint8_t g, uint8_t b);

// Interpolation linéaire entre deux couleurs RGB565 (t : 0.0 → 1.0)
uint16_t lerpColor(uint16_t c1, uint16_t c2, float t);

// Additive blending saturé pour RGB565 (pour les effets de lumière/bloom)
static inline uint16_t add565(uint16_t a, uint16_t b) {
  uint32_t ar = (a >> 11) & 0x1F, ag = (a >> 5) & 0x3F, ab = a & 0x1F;
  uint32_t br = (b >> 11) & 0x1F, bg = (b >> 5) & 0x3F, bb = b & 0x1F;

  uint32_t r = ar + br; if (r > 31) r = 31;
  uint32_t g = ag + bg; if (g > 63) g = 63;
  uint32_t bl = ab + bb; if (bl > 31) bl = 31;

  return (r << 11) | (g << 5) | bl;
}

// Table de dithering 2x2 (matrices de Bayer) pour l'anti-banding
static const uint8_t d2x2[4] = {0, 2, 3, 1}; 
static inline uint8_t dither2x2(int x, int y) {
  return d2x2[((y & 1) << 1) | (x & 1)];
}

// Dessine un halo lumineux autour d'un point (cercles dégradés)
void drawGlow(int x, int y, int radius, uint16_t color, int intensity);

// Fond radial dégradé centré sur CX/CY avec la couleur dynamique dyn_color
void drawRadialBackground();

// Anneau segmenté rotatif (utilisé par plusieurs modes)
// segments : nombre de segments, gapRatio : ratio de l'espace entre segments
void drawSegmentedRing(int x, int y, int r, int thickness,
                       int segments, float phase, float gapRatio, uint16_t color);

// Initialise la géométrie 3D de la sphère (distribution de Fibonacci)
void init3DGeometry();

