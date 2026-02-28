// ==============================================================================
// modes_globe.cpp — Données PROGMEM des continents/villes + renderModeScreensaver
// Contient : tableaux PROGMEM, projectGlobe, drawContinent, drawContinent16,
//            renderModeScreensaver (Arc Reactor Hologram style Iron Man HUD)
// ==============================================================================

#include "globals.h"
#include "modes.h"
#include "utils.h"

// Accès au sprite partagé (défini dans main.cpp)
extern lgfx::LGFX_Sprite spr;

// Variables de veille partagées (définies dans main.cpp)
extern float g_sleep_phase;
extern uint16_t g_sleep_color;

// Variables d'animation partagées (définies dans main.cpp)
extern float g_phase;

// ── GLOBE v4 : données continents en PROGMEM {lat_deg, lon_deg} ─────────────

// Amérique du Nord (contour simplifié) — int16_t car lon < -128
static const int16_t CONT_NA[] PROGMEM = {
  50,-125, 60,-140, 70,-140, 72,-120, 70,-95, 72,-80, 68,-75, 60,-65,
  50,-55,  47,-53,  45,-60,  44,-66,  42,-70, 40,-74, 35,-75, 30,-80,
  25,-80,  25,-90,  20,-87,  15,-85,  10,-83,  8,-77, 10,-75, 12,-72,
  18,-66,  20,-70,  22,-80,  25,-80,  30,-88, 29,-94, 26,-97, 23,-106,
  20,-105, 15,-92,  15,-90,  20,-87,  25,-80, 30,-88, 35,-90, 38,-90,
  40,-80,  42,-83,  45,-83,  46,-84,  47,-88, 47,-92, 45,-93, 44,-93,
  43,-88,  42,-87,  42,-83,  43,-79,  44,-76, 45,-75, 47,-70, 47,-68,
  45,-64,  44,-66,  45,-60,  47,-53,  50,-55, 52,-56, 53,-60, 55,-60,
  58,-62,  60,-65,  62,-68,  63,-75,  65,-80, 68,-75, 70,-80, 72,-80,
  72,-120, 70,-140, 60,-140, 50,-125
};
static const uint8_t CONT_NA_N = sizeof(CONT_NA) / 4;

// Europe
static const int8_t CONT_EU[] PROGMEM = {
  36,-9,  38,-9,  40,-8,  43,-9,  44,-1,  44,3,  43,5,  43,7,
  44,8,   44,10,  43,12,  41,13,  38,15,  38,16, 40,18, 41,19,
  42,19,  44,17,  45,14,  46,13,  47,10,  48,9,  48,8,  50,8,
  51,3,   51,4,   52,5,   53,5,   54,8,   55,9,  55,10, 56,10,
  57,10,  58,7,   58,5,   59,5,   60,5,   61,5,  62,5,  63,7,
  64,14,  65,14,  66,14,  68,16,  70,25,  70,28, 69,29, 68,28,
  67,26,  65,25,  64,26,  63,25,  62,24,  60,25, 59,24, 58,22,
  57,21,  56,21,  55,21,  54,19,  54,18,  53,18, 52,17, 50,18,
  49,18,  48,17,  47,17,  47,16,  46,16,  46,14, 45,14, 44,17,
  43,17,  42,19,  41,20,  40,20,  39,20,  38,21, 37,22, 37,23,
  38,24,  38,22,  37,22,  36,23,  36,28,  37,28, 38,27, 38,26,
  39,26,  40,26,  41,28,  42,28,  42,27,  41,26, 40,26, 39,26,
  38,27,  37,28,  36,28,  36,23,  36,-5,  36,-9
};
static const uint8_t CONT_EU_N = sizeof(CONT_EU) / 2;

// Afrique
static const int8_t CONT_AF[] PROGMEM = {
  37,10,  36,10,  35,9,   33,9,   32,12,  30,32,  27,34,  22,37,
  15,42,  12,44,  11,43,  10,42,   8,38,   5,36,   2,41,
   0,42,  -2,41,  -4,40,  -5,39,  -8,35, -11,34, -15,35, -18,35,
 -22,35, -26,33, -29,30, -34,26, -35,20, -35,18, -34,17, -33,16,
 -32,17, -30,17, -28,16, -26,15, -24,14, -22,14, -20,14, -18,12,
 -16,12, -14,12, -12,14, -10,15,  -8,14,  -6,12,  -4,10,  -2,9,
   0,9,    2,9,    4,2,    5,1,    6,1,    7,2,    8,3,    9,2,
  10,2,   11,3,  12,3,   13,2,   14,3,   15,2,   16,3,   17,2,
  18,3,   20,3,  22,4,   24,3,   26,3,   28,3,   30,32,  32,12,
  33,9,   35,9,  36,10,  37,10
};
static const uint8_t CONT_AF_N = sizeof(CONT_AF) / 2;

// Asie (simplifié)
static const int8_t CONT_AS[] PROGMEM = {
  70,30,  72,55,  73,80,  73,105, 72,120, 68,120, 65,121, 60,121,
  55,125, 50,120, 48,125, 45,125, 43,122, 42,120, 40,118, 38,122,
  35,120, 32,120, 30,121, 28,120, 25,121, 22,114, 22,110, 20,110,
  18,106, 15,108, 12,109, 10,104,  8,100,  5,103,  1,104, -5,105,
  -8,115, -5,120,  0,110,  5,100,  8,98,  10,98,  12,98,  15,98,
  18,94,  20,92,  22,92,  24,88,  22,88,  20,86,  18,84,  15,80,
  12,80,  10,77,   8,77,   8,80,  10,80,  12,80,  15,74,  18,73,
  20,73,  22,70,  24,68,  26,66,  25,62,  22,60,  20,58,  18,56,
  15,50,  12,45,  12,44,  15,42,  18,42,  20,40,  22,38,  24,38,
  26,38,  28,34,  30,32,  32,36,  35,36,  37,36,  38,36,  40,36,
  42,42,  42,45,  44,44,  45,42,  47,40,  48,38,  50,36,  52,34,
  55,36,  55,40,  55,45,  55,50,  55,55,  55,60,  55,65,  55,70,
  55,75,  55,80,  55,85,  55,90,  55,95,  55,100, 58,100, 60,100,
  62,100, 65,100, 68,100, 70,80,  72,55,  70,30
};
static const uint8_t CONT_AS_N = sizeof(CONT_AS) / 2;

// Amérique du Sud
static const int8_t CONT_SA[] PROGMEM = {
  12,-72,  10,-62,   8,-60,   6,-61,   4,-52,   2,-50,   0,-50,
  -2,-44,  -5,-35,  -8,-35, -10,-37, -12,-38, -15,-39, -18,-39,
 -20,-40, -22,-41, -23,-43, -25,-48, -28,-49, -30,-51, -33,-53,
 -35,-57, -38,-57, -40,-62, -42,-64, -45,-66, -48,-66, -50,-68,
 -52,-68, -54,-68, -55,-67, -52,-68, -50,-68, -48,-66, -45,-66,
 -42,-64, -40,-62, -38,-57, -35,-57, -33,-53, -30,-51, -28,-49,
 -25,-48, -23,-43, -22,-41, -20,-40, -18,-39, -15,-39, -12,-38,
 -10,-37,  -8,-35,  -5,-35,  -2,-44,   0,-50,   2,-50,   4,-52,
   6,-61,   8,-60,  10,-62,  12,-72,  10,-75,   8,-77,   5,-77,
   2,-77,   0,-78,  -2,-80,  -5,-81,  -8,-80, -10,-78, -12,-77,
 -15,-75, -18,-70, -20,-70, -22,-68, -24,-68, -26,-70, -28,-70,
 -30,-71, -33,-71, -35,-72, -38,-72, -40,-72, -42,-73, -45,-73,
 -48,-75, -50,-75, -52,-72, -54,-68, -55,-67, -52,-68, -50,-75,
 -48,-75, -45,-73, -42,-73, -40,-72, -38,-72, -35,-72, -33,-71,
 -30,-71, -28,-70, -26,-70, -24,-68, -22,-68, -20,-70, -18,-70,
 -15,-75, -12,-77, -10,-78,  -8,-80,  -5,-81,  -2,-80,   0,-78,
   2,-77,   5,-77,   8,-77,  10,-75,  12,-72
};
static const uint8_t CONT_SA_N = sizeof(CONT_SA) / 2;

// Australie — int16_t car lon > 127
static const int16_t CONT_AU[] PROGMEM = {
 -14,130, -12,132, -12,136, -14,140, -16,140, -18,140,
 -20,140, -22,140, -24,140, -26,140, -28,140, -30,140, -32,140,
 -34,140, -36,140, -38,140, -38,146, -37,120, -35,121, -34,121,
 -32,122, -30,123, -28,123, -26,123, -24,122, -22,120, -20,118,
 -18,116, -16,125, -14,130
};
static const uint8_t CONT_AU_N = sizeof(CONT_AU) / 4;

// Villes principales {lat, lon} en int8_t
static const int8_t CITIES[] PROGMEM = {
  48,  2,   51,  0,   40, 29,   55, 37,   40,-74,
  34,-118,  19,-99,  -23,-43,   39,116,   35,116,
  28, 77,  -34,121,  -26, 28,   30, 31,   37,-122,
  41,-87,   43,-79
};
static const uint8_t CITIES_N = sizeof(CITIES) / 2;

// ==============================================================================
// projectGlobe — Projette lat/lon (radians) sur sphère 3D.
// Retourne true si le point est sur la face avant (visible).
// Paramètres :
//   lat, lon  : coordonnées géographiques en radians
//   rotY      : angle de rotation Y courant (animation)
//   R         : rayon de la sphère en pixels
//   cosTX, sinTX : cosinus/sinus de l'inclinaison X de la caméra
//   sx, sy    : coordonnées écran calculées (sortie)
// ==============================================================================
static bool projectGlobe(float lat, float lon, float rotY, float R,
                         float cosTX, float sinTX, int &sx, int &sy) {
  // Conversion sphérique → cartésien 3D
  float x3 =  cos(lat) * sin(lon + rotY);
  float y3 =  sin(lat);
  float z3 =  cos(lat) * cos(lon + rotY);

  // Application de l'inclinaison caméra sur l'axe X
  float yc =  y3 * cosTX - z3 * sinTX;
  float zc =  y3 * sinTX + z3 * cosTX;

  // Rejet des points derrière la sphère (face arrière)
  if (zc > 0.12f) return false;

  // Projection perspective
  float persp = 220.0f / (220.0f - zc * R);
  sx = CX + (int)(x3 * R * persp);
  sy = CY - (int)(yc * R * persp);
  return true;
}

// ==============================================================================
// drawContinent — Dessine le contour d'un continent stocké en int8_t PROGMEM.
// Utilisé pour EU, AF, AS, SA (longitudes dans -128..127).
// ==============================================================================
static void drawContinent(const int8_t* cont, uint8_t n, float rotY, float R,
                          float cosTX, float sinTX, uint16_t col) {
  int px0 = 0, py0 = 0, px1 = 0, py1 = 0;
  bool v0 = false, v1 = false;
  for (uint8_t i = 0; i < n; i++) {
    float lat = (float)(int8_t)pgm_read_byte(&cont[i * 2])     * DEG_TO_RAD;
    float lon = (float)(int8_t)pgm_read_byte(&cont[i * 2 + 1]) * DEG_TO_RAD;
    v1 = projectGlobe(lat, lon, rotY, R, cosTX, sinTX, px1, py1);
    if (i > 0 && v0 && v1) {
      int dx = px1 - px0, dy = py1 - py0;
      // Filtre anti-saut : ignore les segments trop longs (discontinuités de contour)
      if (dx * dx + dy * dy < 4000) spr.drawLine(px0, py0, px1, py1, col);
    }
    px0 = px1; py0 = py1; v0 = v1;
  }
}

// ==============================================================================
// drawContinent16 — Dessine le contour d'un continent stocké en int16_t PROGMEM.
// Utilisé pour NA et AU (longitudes hors de la plage -128..127).
// ==============================================================================
static void drawContinent16(const int16_t* cont, uint8_t n, float rotY, float R,
                            float cosTX, float sinTX, uint16_t col) {
  int px0 = 0, py0 = 0, px1 = 0, py1 = 0;
  bool v0 = false, v1 = false;
  for (uint8_t i = 0; i < n; i++) {
    float lat = (float)(int16_t)pgm_read_word(&cont[i * 2])     * DEG_TO_RAD;
    float lon = (float)(int16_t)pgm_read_word(&cont[i * 2 + 1]) * DEG_TO_RAD;
    v1 = projectGlobe(lat, lon, rotY, R, cosTX, sinTX, px1, py1);
    if (i > 0 && v0 && v1) {
      int dx = px1 - px0, dy = py1 - py0;
      if (dx * dx + dy * dy < 4000) spr.drawLine(px0, py0, px1, py1, col);
    }
    px0 = px1; py0 = py1; v0 = v1;
  }
}

// ==============================================================================
// renderModeScreensaver — Arc Reactor Hologram (style Iron Man HUD vue éclatée)
// Projection isométrique avec séparation dynamique sur l'axe Z.
// Aucun paramètre : utilise g_sleep_phase, g_sleep_color (variables de veille).
// ==============================================================================
void renderModeScreensaver() {
  // 1. GESTION DU TEMPS ET DE L'ANIMATION
  g_sleep_phase += 0.015f; 
  float rot = g_sleep_phase * 0.4f; // Rotation continue du réacteur
  
  // Facteur d'éclatement (0.0 = assemblé, 1.0 = totalement éclaté)
  // L'animation respire lentement grâce à une onde sinusoïdale
  float explode = (sin(g_sleep_phase * 0.6f) + 1.0f) * 0.5f;

  // 2. PALETTE DE COULEURS THEMATISEE
  // Au lieu de calculer un "Stark drift", on utilise g_sleep_color (définie par le thème actif)
  // On crée par contre de légères oscillations lumineuses sur cette base
  float pulseLuma = (sin(g_sleep_phase * 2.0f) + 1.0f) * 0.2f; // Léger pulse 0.0 -> 0.4
  
  uint16_t colCore = COL_WHITE;
  uint16_t colNeon = lerpColor(g_sleep_color, COL_WHITE, pulseLuma);
  uint16_t colDark = lerpColor(COL_BG, g_sleep_color, 0.20f);
  uint16_t colWire = lerpColor(COL_BG, g_sleep_color, 0.45f);

  // 3. PARAMETRES DE PERSPECTIVE
  const float tilt = 0.45f; // Inclinaison de la caméra (ellipse ratio)
  const float maxZ = 50.0f; // Distance maximale de séparation en pixels
  
  // Calcul des hauteurs (Y-screen) pour chaque couche
  int y_base  = CY + (int)(maxZ * explode);              // Couche 1: Radiateur bas
  int y_coilB = CY + (int)((maxZ * 0.5f) * explode);    // Couche 2: Support bobines
  int y_core  = CY;                                      // Couche 3: Centre (Fixe)
  int y_coilT = CY - (int)((maxZ * 0.5f) * explode);    // Couche 4: Anneau de confinement
  int y_top   = CY - (int)(maxZ * explode);              // Couche 5: Lentille Palladium

  // ----------------------------------------------------------------------------
  // PHASE A : LIGNES DIRECTRICES D'ECLATEMENT (Arrière-plan)
  // ----------------------------------------------------------------------------
  if (explode > 0.05f) {
    // Axe central
    spr.drawLine(CX, y_base, CX, y_top, lerpColor(COL_BG, colWire, 0.5f));
    // Axes périphériques
    for (int i = 0; i < 4; i++) {
      float a = i * (PI / 2.0f) + rot;
      int px = CX + (int)(cos(a) * 45.0f);
      spr.drawLine(px, y_base + (int)(sin(a) * 45.0f * tilt), 
                   px, y_top + (int)(sin(a) * 45.0f * tilt), 
                   lerpColor(COL_BG, colWire, 0.3f));
    }
  }

  // ----------------------------------------------------------------------------
  // PHASE B : COUCHE 1 - RADIATEUR INFERIEUR (Heat Sink)
  // ----------------------------------------------------------------------------
  // Disque sombre pour masquer les lignes arrière
  spr.fillEllipse(CX, y_base, 75, 75 * tilt, lerpColor(COL_BG, colDark, 0.5f));
  spr.drawEllipse(CX, y_base, 75, 75 * tilt, colWire);
  spr.drawEllipse(CX, y_base, 65, 65 * tilt, colDark);
  // Grille de dissipation radiale
  for (int i = 0; i < 12; i++) {
    float a = i * (PI / 6.0f) - rot;
    spr.drawLine(CX + cos(a)*20, y_base + sin(a)*20*tilt, 
                 CX + cos(a)*75, y_base + sin(a)*75*tilt, colDark);
  }

  // ----------------------------------------------------------------------------
  // PHASE C : COUCHE 2 - SUPPORT INFERIEUR DES BOBINES
  // ----------------------------------------------------------------------------
  spr.drawEllipse(CX, y_coilB, 85, 85 * tilt, colWire);
  spr.drawEllipse(CX, y_coilB, 45, 45 * tilt, colWire);

  // ----------------------------------------------------------------------------
  // PHASE D : COUCHE 3 - MODULES D'ACCELERATION & CŒUR (Gestion Profondeur)
  // ----------------------------------------------------------------------------
  // Pour un effet 3D correct, on divise les 10 bobines :
  // On dessine d'abord celles de l'arrière, puis le cœur central, puis celles de l'avant.
  
  // drawCoil : dessine une bobine radiale (ligne triple + connecteur)
  // Définie comme struct local pour éviter les lambdas capturantes (compatibilité ESP32)
  struct CoilDrawer {
    LGFX_Sprite& spr;
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

  // 1. Bobines Arrière (sin(a) < 0)
  for (int i = 0; i < 10; i++) {
    float a = i * (PI / 5.0f) + rot;
    if (sin(a) < 0) coilDrawer.draw(a, false);
  }

  // 2. Chambre de réaction centrale (Masque le fond)
  spr.fillEllipse(CX, y_core, 40, 40 * tilt, COL_BG); 
  spr.drawEllipse(CX, y_core, 40, 40 * tilt, colNeon);
  spr.drawEllipse(CX, y_core, 30, 30 * tilt, colWire);
  
  // 3. Bobines Avant (sin(a) >= 0)
  for (int i = 0; i < 10; i++) {
    float a = i * (PI / 5.0f) + rot;
    if (sin(a) >= 0) coilDrawer.draw(a, true);
  }

  // ----------------------------------------------------------------------------
  // PHASE E : COUCHE 4 - ANNEAU DE CONFINEMENT SUPERIEUR
  // ----------------------------------------------------------------------------
  spr.drawEllipse(CX, y_coilT, 85, 85 * tilt, colWire);
  spr.drawEllipse(CX, y_coilT, 45, 45 * tilt, colNeon);

  // ----------------------------------------------------------------------------
  // PHASE F : COUCHE 5 - LENTILLE PALLADIUM SUPERIEURE
  // ----------------------------------------------------------------------------
  // Anneau externe
  spr.drawEllipse(CX, y_top, 50, 50 * tilt, colNeon);
  // Halo interne
  for (int r = 25; r > 5; r -= 4) {
    float f = (float)r / 25.0f;
    spr.drawEllipse(CX, y_top, r, r * tilt, lerpColor(colNeon, COL_BG, f));
  }
  // Noyau brillant
  spr.fillEllipse(CX, y_top, 10, 10 * tilt, colCore);
  
  // Détails de verrouillage (3 points tournants)
  for (int i = 0; i < 3; i++) {
    float a = i * (2.0f * PI / 3.0f) + (rot * 1.5f);
    spr.fillCircle(CX + cos(a)*40, y_top + sin(a)*40*tilt, 2, colCore);
  }

  // ----------------------------------------------------------------------------
  // PHASE G : OVERLAY UI & DONNEES DIAGNOSTIQUES
  // ----------------------------------------------------------------------------
  spr.setFont(&fonts::FreeSans9pt7b);
  spr.setTextColor(colNeon);
  
  // Scanner rotatif externe
  float scanA = g_sleep_phase * 1.5f;
  float scanDeg = fmodf(scanA * (180.0f / PI), 360.0f);
  spr.drawArc(CX, CY, 115, 114, scanDeg, scanDeg + 40.0f, colCore);
  spr.drawCircle(CX, CY, 115, colDark);

  // Textes statiques simulants un plan technique
  if (explode > 0.8f) {
    // Affiche le texte uniquement quand l'éclatement est maximal (Lisibilité)
    spr.setTextDatum(ML_DATUM);
    spr.drawString("PALLADIUM", 28, 55);
    spr.drawString("CORE", 28, 70);
    spr.drawLine(90, 62, CX - 15, y_top, colWire); // Ligne de repère

    spr.setTextDatum(MR_DATUM);
    spr.drawString("MARK I", 212, 185);
    spr.drawString("3.0 GJ/s", 212, 200);
  }
}
