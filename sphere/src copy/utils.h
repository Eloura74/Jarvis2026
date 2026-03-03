#pragma once
#include "globals.h"

// ==============================================================================
// utils.h — Outils couleurs, maths et primitives graphiques partagées
// ==============================================================================

// Convertit R/G/B 8-bit en couleur RGB565 pour LovyanGFX
uint16_t rgb565(uint8_t r, uint8_t g, uint8_t b);

// Interpolation linéaire entre deux couleurs RGB565 (t : 0.0 → 1.0)
uint16_t lerpColor(uint16_t c1, uint16_t c2, float t);

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

// Initialise les particules de poussière flottantes du screensaver
void initDustParticles();
