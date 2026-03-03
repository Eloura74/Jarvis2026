// ==============================================================================
// modes_globe.cpp — Screensaver : Arc Reactor Voxel-Slicing (Hologramme Jarvis)
// Moteur 3D complet par projection perspective + tri de profondeur (Algorithme du Peintre).
// Remplace l'ancien globe PROGMEM. Compatible LovyanGFX + système de thèmes.
// Matériel cible : ESP32-S3 + GC9A01 240x240
// ==============================================================================

#include "globals.h"
#include "modes.h"
#include "utils.h"

// Accès au sprite partagé (défini dans main.cpp)
extern lgfx::LGFX_Sprite spr;

// Variables de veille partagées (définies dans main.cpp)
extern float     g_sleep_phase;
extern uint16_t  g_sleep_color;   // Couleur accent du thème actif

// Fonction utilitaire pour lire/écrire la RAM vidéo (LGFX a `setSwapBytes(true)`)
static inline uint16_t swap565(uint16_t c) {
    return (c >> 8) | (c << 8);
}

// ==============================================================================
// FONCTION UTILITAIRE : Glow Additif 0-RAM corrigé (Big Endian)
// Effectue un balayage pixels performant pour ajouter un Halo de Bloom 
// ==============================================================================
static void drawAdditiveGlow(int cx, int cy, int radius, uint16_t color, float intensity) {
    uint16_t* ptr_spr = (uint16_t*)spr.getBuffer();
    for (int y = cy - radius; y <= cy + radius; y++) {
        if (y < 0 || y >= 240) continue;
        for (int x = cx - radius; x <= cx + radius; x++) {
            if (x < 0 || x >= 240) continue;
            
            int dx = x - cx;
            int dy = y - cy;
            int distSq = dx * dx + dy * dy;
            
            if (distSq <= radius * radius) {
                float dist = sqrtf(distSq);
                float factor = 1.0f - (dist / (float)radius);
                if (factor > 0) {
                    // Chute lumineuse cubique adoucie + contrôle d'intensité globale
                    float i = factor * factor * factor * intensity;
                    uint16_t intense = lerpColor(0x0000, color, i);
                    
                    int idx = y * 240 + x;
                    
                    // LECTURE : On inverse pour retrouver le bon RGB565 Little Endian
                    uint16_t pxNative = swap565(ptr_spr[idx]);
                    
                    // ADDITION MATHEMATIQUE (Dithering + Bloom)
                    uint16_t dithered = add565(intense, dither2x2(x, y) ? 0x0821 : 0x0000);
                    uint16_t blended = add565(pxNative, dithered);
                    
                    // ECRITURE : On réinverse pour LovyanGFX
                    ptr_spr[idx] = swap565(blended);
                }
            }
        }
    }
}

// ==============================================================================
// renderModeScreensaver — Arc Reactor Hologram (Vue éclatée 3D)
// Restauration de la mécanique isométrique + intégration d'un shader Bloom
// ==============================================================================
void renderModeScreensaver() {
  // 1. GESTION DU TEMPS ET DE L'ANIMATION (L'ancienne que tu aimais)
  g_sleep_phase += 0.015f; 
  float rot = g_sleep_phase * 0.4f; // Rotation continue du réacteur
  
  // Facteur d'éclatement (0.0 = assemblé, 1.0 = totalement éclaté)
  float explode = (sin(g_sleep_phase * 0.6f) + 1.0f) * 0.5f;

  // 2. PALETTE LUMINEUSE (Sensible aux thèmes UI)
  float pulseLuma = (sin(g_sleep_phase * 2.0f) + 1.0f) * 0.2f; 
  
  uint16_t colCore = COL_WHITE;
  uint16_t colNeon = lerpColor(g_sleep_color, COL_WHITE, pulseLuma);
  uint16_t colDark = lerpColor(COL_BG, g_sleep_color, 0.20f);
  uint16_t colWire = lerpColor(COL_BG, g_sleep_color, 0.45f);

  // 3. PARAMETRES ISOMETRIQUES
  const float tilt = 0.45f; 
  const float maxZ = 50.0f; 
  
  int y_base  = CY + (int)(maxZ * explode);              
  int y_coilB = CY + (int)((maxZ * 0.5f) * explode);    
  int y_core  = CY;                                      
  int y_coilT = CY - (int)((maxZ * 0.5f) * explode);    
  int y_top   = CY - (int)(maxZ * explode);              

  // --- PHASE A : LIGNES DIRECTRICES D'ECLATEMENT ---
  if (explode > 0.05f) {
    spr.drawLine(CX, y_base, CX, y_top, lerpColor(COL_BG, colWire, 0.5f));
    for (int i = 0; i < 4; i++) {
      float a = i * (PI / 2.0f) + rot;
      int px = CX + (int)(cos(a) * 45.0f);
      spr.drawLine(px, y_base + (int)(sin(a) * 45.0f * tilt), 
                   px, y_top + (int)(sin(a) * 45.0f * tilt), 
                   lerpColor(COL_BG, colWire, 0.3f));
    }
  }

  // --- PHASE B : RADIATEUR INFERIEUR ---
  spr.fillEllipse(CX, y_base, 75, 75 * tilt, lerpColor(COL_BG, colDark, 0.5f));
  spr.drawEllipse(CX, y_base, 75, 75 * tilt, colWire);
  spr.drawEllipse(CX, y_base, 65, 65 * tilt, colDark);
  for (int i = 0; i < 12; i++) {
    float a = i * (PI / 6.0f) - rot;
    spr.drawLine(CX + cos(a)*20, y_base + sin(a)*20*tilt, 
                 CX + cos(a)*75, y_base + sin(a)*75*tilt, colDark);
  }

  // --- PHASE C : SUPPORT BOBINES ---
  spr.drawEllipse(CX, y_coilB, 85, 85 * tilt, colWire);
  spr.drawEllipse(CX, y_coilB, 45, 45 * tilt, colWire);

  // --- PHASE D : CŒUR & BOBINES ---
  struct CoilDrawer {
    lgfx::LGFX_Sprite& spr;
    int y_core;
    float tilt;
    uint16_t colNeon, colDark, colCore, colWire;
    void draw(float angle, bool isFront) {
      float cA = cos(angle), sA = sin(angle);
      int x_in  = CX + (int)(cA * 45);
      int y_in  = y_core + (int)(sA * 45 * tilt);
      int x_out = CX + (int)(cA * 85);
      int y_out = y_core + (int)(sA * 85 * tilt);
      uint16_t cColor = isFront ? colNeon : colDark;
      spr.drawLine(x_in, y_in,   x_out, y_out,   cColor);
      spr.drawLine(x_in, y_in-1, x_out, y_out-1, cColor);
      spr.drawLine(x_in, y_in+1, x_out, y_out+1, cColor);
      spr.fillCircle(x_in, y_in, 2, isFront ? colCore : colWire);
    }
  } coilDrawer{spr, y_core, tilt, colNeon, colDark, colCore, colWire};

  for (int i = 0; i < 10; i++) {
    float a = i * (PI / 5.0f) + rot;
    if (sin(a) < 0) coilDrawer.draw(a, false);
  }

  // Masque central et SUPER-BLOOM NÉON (Intensité réduite 0.45 pour voir l'effet 3D sans brûler l'image)
  spr.fillEllipse(CX, y_core, 40, 40 * tilt, COL_BG); 
  drawAdditiveGlow(CX, y_core, 60, colNeon, 0.45f); // MAGIE : Le plasma volumétrique additif !
  
  spr.drawEllipse(CX, y_core, 40, 40 * tilt, colNeon);
  spr.drawEllipse(CX, y_core, 30, 30 * tilt, colWire);
  
  for (int i = 0; i < 10; i++) {
    float a = i * (PI / 5.0f) + rot;
    if (sin(a) >= 0) coilDrawer.draw(a, true);
  }

  // --- PHASE E : ANNEAU SUPERIEUR ---
  spr.drawEllipse(CX, y_coilT, 85, 85 * tilt, colWire);
  spr.drawEllipse(CX, y_coilT, 45, 45 * tilt, colNeon);

  // --- PHASE F : LENTILLE PALLADIUM ---
  drawAdditiveGlow(CX, y_top, 35, colNeon, 0.60f); // Faisceau sortant de la lentille !
  spr.drawEllipse(CX, y_top, 50, 50 * tilt, colNeon);
  for (int r = 25; r > 5; r -= 4) {
    float f = (float)r / 25.0f;
    spr.drawEllipse(CX, y_top, r, r * tilt, lerpColor(colNeon, COL_BG, f));
  }
  spr.fillEllipse(CX, y_top, 10, 10 * tilt, colCore);
  
  for (int i = 0; i < 3; i++) {
    float a = i * (2.0f * PI / 3.0f) + (rot * 1.5f);
    spr.fillCircle(CX + cos(a)*40, y_top + sin(a)*40*tilt, 2, colCore);
  }

  // --- PHASE G : OVERLAY HUD ROTATIF ---
  spr.setFont(&fonts::FreeSans9pt7b);
  spr.setTextColor(colNeon);
  
  float scanA = g_sleep_phase * 1.5f;
  float scanDeg = fmodf(scanA * (180.0f / PI), 360.0f);
  spr.drawArc(CX, CY, 115, 114, scanDeg, scanDeg + 40.0f, colCore);
  spr.drawCircle(CX, CY, 115, colDark);

  if (explode > 0.8f) {
    spr.setTextDatum(ML_DATUM);
    spr.drawString("PALLADIUM", 28, 55);
    spr.drawString("CORE", 28, 70);
    spr.drawLine(90, 62, CX - 15, y_top, colWire); 

    spr.setTextDatum(MR_DATUM);
    spr.drawString("MARK I", 212, 185);
    spr.drawString("3.0 GJ/s", 212, 200);
  }
}

