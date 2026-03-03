// ==============================================================================
// modes_render.cpp — Renderers des modes spéciaux (hors screensaver/globe)
// Contient : System, Vision, Home, Media, Timer, Weather, Print, Matrix,
//            Ghost, Error, Success, DefaultLocked, Whatsapp, Gmail, Calendar,
//            Doors
// ==============================================================================

#include "globals.h"
#include "modes.h"
#include "utils.h"

// Accès au sprite partagé (défini dans main.cpp)
extern lgfx::LGFX_Sprite spr;

// Variables dynamiques partagées (définies dans main.cpp)
extern float dyn_radius;
extern uint16_t dyn_color;
extern float g_phase;
extern uint32_t ms_time;
extern char local_text[64];

// Couleurs personnalisées pour un rendu "Dark Mode" technique
#define COL_BG      rgb565(20, 20, 25)
#define COL_ACCENT  rgb565(0, 255, 180) // Cyan/Vert fluo
#define COL_GREY    rgb565(100, 105, 110)
#define COL_FRAME_OUT  rgb565(100, 110, 120)
#define COL_FRAME_IN   rgb565(50, 60, 70)
#define COL_DOOR_SEC   rgb565(15, 35, 20)
#define COL_DOOR_ALRT  rgb565(60, 15, 15)
#define COL_ROOM_DARK  rgb565(25, 5, 5)
// ================== MODE SYSTEM ==================
// Affiche un HUD système avec anneaux segmentés, barre de charge CPU et RAM.
void renderModeSystem() {
  drawSegmentedRing(CX, CY, 110, 8, 8, g_phase * 50.0f, 0.1f, dyn_color);
  drawSegmentedRing(CX, CY, 95, 2, 36, -g_phase * 80.0f, 0.5f, lerpColor(COL_BG, dyn_color, 0.6f));

  spr.setFont(&fonts::FreeSans12pt7b);
  spr.setTextColor(COL_WHITE);
  spr.drawString("SYS.OPT", CX - (spr.textWidth("SYS.OPT") / 2), CY - 25);

  // Barre de charge CPU simulée (oscille entre 20% et 60%)
  int load = 40 + (int)(sin(g_phase * 5.0f) * 20);
  spr.drawRect(CX - 40, CY, 80, 12, dyn_color);
  spr.fillRect(CX - 38, CY + 2, (76 * load) / 100, 8, dyn_color);

  spr.setFont(&fonts::FreeSans9pt7b);
  spr.setTextColor(COL_GREEN);
  spr.drawString("RAM: 1.2G", CX - (spr.textWidth("RAM: 1.2G") / 2), CY + 30);
}

// ================== MODE VISION ==================
// Affiche une grille de ciblage avec un scanner horizontal animé (style caméra IA).
void renderModeVision() {
  // Grille de fond rouge sombre
  for (int i = -120; i <= 120; i += 25) {
    spr.drawFastVLine(CX + i, 0, 240, rgb565(40, 0, 0));
    spr.drawFastHLine(0, CY + i, 240, rgb565(40, 0, 0));
  }

  // Coins de viseur aux quatre angles
  int tr = 90 + (int)(sin(g_phase * 10.0f) * 5);
  spr.drawLine(CX - tr, CY - tr / 2, CX - tr, CY - tr, COL_RED);
  spr.drawLine(CX - tr, CY - tr, CX - tr / 2, CY - tr, COL_RED);
  spr.drawLine(CX + tr, CY - tr / 2, CX + tr, CY - tr, COL_RED);
  spr.drawLine(CX + tr, CY - tr, CX + tr / 2, CY - tr, COL_RED);
  spr.drawLine(CX - tr, CY + tr / 2, CX - tr, CY + tr, COL_RED);
  spr.drawLine(CX - tr, CY + tr, CX - tr / 2, CY + tr, COL_RED);
  spr.drawLine(CX + tr, CY + tr / 2, CX + tr, CY + tr, COL_RED);
  spr.drawLine(CX + tr, CY + tr, CX + tr / 2, CY + tr, COL_RED);

  // Ligne de scan horizontale animée
  int scanY = CY + (int)(sin(g_phase * 4.0f) * 115);
  spr.fillRect(CX - 110, scanY - 2, 220, 4, COL_RED);

  spr.setFont(&fonts::FreeSans9pt7b);
  spr.setTextColor(COL_RED);
  spr.drawString("AI_LOCK", CX - (spr.textWidth("AI_LOCK") / 2), CY - 40);
}

// ================== MODE HOME ==================
// Affiche un radar domotique avec noeuds de pièces et balayage angulaire.
void renderModeHome() {
  // Cercles concentriques du radar
  spr.fillArc(CX, CY, 50, 49, 0, 360, COL_BLUE);
  spr.fillArc(CX, CY, 100, 99, 0, 360, COL_BLUE);

  // Secteur de balayage (triangle tournant)
  float scanA = g_phase * 2.0f;
  spr.fillTriangle(CX, CY,
                   CX + (int)(cos(scanA) * 120), CY + (int)(sin(scanA) * 120),
                   CX + (int)(cos(scanA - 0.2f) * 120), CY + (int)(sin(scanA - 0.2f) * 120),
                   rgb565(0, 50, 100));
  spr.drawLine(CX, CY, CX + (int)(cos(scanA) * 120), CY + (int)(sin(scanA) * 120), dyn_color);

  // Noeuds de pièces (position angulaire + distance + label)
  struct Pt { float a; float d; const char* nm; };
  Pt nodes[] = { {0.5f, 55.0f, "LIV"}, {2.1f, 95.0f, "KIT"}, {4.8f, 80.0f, "BED"} };
  spr.setFont(&fonts::FreeSans9pt7b);
  for (int i = 0; i < 3; i++) {
    int nx = CX + (int)(cos(nodes[i].a) * nodes[i].d);
    int ny = CY + (int)(sin(nodes[i].a) * nodes[i].d);
    spr.fillCircle(nx, ny, 4, dyn_color);
    spr.setTextColor(COL_WHITE);
    spr.drawString(nodes[i].nm, nx, ny - 15);
  }
}

// ================== MODE MEDIA ==================
// Affiche un égaliseur circulaire animé avec halo central pulsant.
void renderModeMedia() {
  int bars = 45;
  float radius = 55.0f;
  for (int i = 0; i < bars; i++) {
    float angle = (i * 360.0f / bars) * DEG_TO_RAD + g_phase;
    // Hauteur de barre : combinaison de sinus pour simuler un spectre audio
    float val = 10.0f + fabsf(sin(g_phase * 4.0f + i * 0.4f) * 45.0f) + (sin(i * 132.0f) * 5.0f);
    uint16_t col = lerpColor(COL_PINK, COL_PURPLE, (float)i / bars);
    // Double trait pour épaisseur visuelle
    spr.drawLine((int)(CX + cos(angle) * radius),       (int)(CY + sin(angle) * radius),
                 (int)(CX + cos(angle) * (radius + val)), (int)(CY + sin(angle) * (radius + val)), col);
    spr.drawLine((int)(CX + cos(angle) * radius) + 1,   (int)(CY + sin(angle) * radius) + 1,
                 (int)(CX + cos(angle) * (radius + val)) + 1, (int)(CY + sin(angle) * (radius + val)) + 1, col);
  }
  // Halo et disque central blanc pulsant
  drawGlow(CX, CY, (int)(25 + sin(g_phase * 5.0f) * 5.0f), COL_PINK, 15);
  spr.fillCircle(CX, CY, (int)(20 + sin(g_phase * 5.0f) * 5.0f), COL_WHITE);
}

// ================== MODE TIMER ==================
// Affiche un arc de progression de minuterie avec marqueurs et label.
void renderModeTimer() {
  int r = 80;
  // Progression basée sur les millisecondes (cycle de 60s)
  int angleEnd = (int)((ms_time % 60000) / 60000.0f * 360.0f);
  spr.fillArc(CX, CY, r, r - 5, 0, 360, rgb565(50, 50, 0));
  spr.fillArc(CX, CY, r, r - 5, 0, angleEnd, COL_YELLOW);

  // 12 marqueurs horaires autour de l'arc
  for (int i = 0; i < 12; i++) {
    float a = i * 30.0f * DEG_TO_RAD;
    spr.fillCircle(CX + (int)(cos(a) * (r + 15)), CY + (int)(sin(a) * (r + 15)), 3, COL_ORANGE);
  }

  spr.setFont(&fonts::FreeSans18pt7b);
  spr.setTextColor(COL_WHITE);
  spr.drawString("TIMER", CX - (spr.textWidth("TIMER") / 2), CY);
}

// ================== MODE WEATHER ==================
// Affiche un soleil stylisé avec halo et température depuis local_text.
void renderModeWeather() {
    // 1. Parsing "TEMP|CONDITION"
    char temp[16] = "--";
    char cond[16] = "SUN";
    
    char* sep = strchr(local_text, '|');
    if (sep) {
        int len = sep - local_text;
        if (len < sizeof(temp)) {
            strncpy(temp, local_text, len);
            temp[len] = '\0';
        }
        strncpy(cond, sep + 1, sizeof(cond) - 1);
        cond[sizeof(cond) - 1] = '\0';
    } else {
        strncpy(temp, local_text, sizeof(temp) - 1);
        temp[sizeof(temp) - 1] = '\0';
    }

    // 2. Rendu de l'icône selon la condition
    if (strcmp(cond, "SUN") == 0 || strcmp(cond, "CLEAR") == 0) {
        // Soleil rotatif
        drawGlow(CX, CY - 20, 30, COL_YELLOW, 15);
        spr.fillCircle(CX, CY - 20, 25, COL_YELLOW);
        for(int i = 0; i < 8; i++) {
            float a = (i * 45.0f + g_phase * 20.0f) * DEG_TO_RAD;
            spr.drawLine(CX + cos(a)*35, (CY - 20) + sin(a)*35, 
                         CX + cos(a)*50, (CY - 20) + sin(a)*50, COL_YELLOW);
        }
    } else {
        // Base Nuage (CLOUD, RAIN, SNOW...)
        spr.fillCircle(CX - 20, CY - 20, 20, TFT_WHITE);
        spr.fillCircle(CX, CY - 35, 25, TFT_WHITE);
        spr.fillCircle(CX + 20, CY - 20, 20, TFT_WHITE);
        spr.fillRect(CX - 20, CY - 20, 40, 20, TFT_WHITE);
        
        if (strcmp(cond, "RAIN") == 0) {
            // Gouttes de pluie animées
            for(int j = 0; j < 4; j++) {
                int ry = (CY - 5) + ((int)(g_phase * 60 + j * 15) % 40);
                spr.drawFastVLine(CX - 25 + j * 16, ry, 10, dyn_color);
            }
        }
    }

    // 3. Affichage Texte
    spr.setFont(&fonts::FreeSans18pt7b);
    spr.setTextColor(TFT_WHITE);
    spr.drawCenterString(temp, CX, CY + 50);

    spr.setFont(&fonts::FreeSans9pt7b);
    spr.setTextColor(dyn_color);
    spr.drawCenterString(cond, CX, CY + 80);
}

// ================== MODE PRINT ==================
// Simule une imprimante 3D en cours d'impression avec tête mobile et données de température.
// local_text format attendu : "TEMP_TETE|TEMP_BED|POURCENTAGE" ou "FLOTTE"
void renderModePrint() {
    // 1. Parsing des données (Optimisé avec sscanf)
    char t[8] = "0", b[8] = "0", p[8] = "0";
    int progress = 0;
    
    if (strstr(local_text, "|")) {
        sscanf(local_text, "%[^|]|%[^|]|%s", t, b, p);
        progress = atoi(p);
    }

    // 2. Dessin de la barre de progression circulaire (Pourtour de l'écran)
    // Utile pour exploiter la forme du GC9A01
    int angle = map(progress, 0, 100, 0, 360);
    spr.drawArc(CX, CY, 116, 110, 0, 360, rgb565(40, 40, 45)); // Fond
    spr.drawArc(CX, CY, 116, 110, -90, angle - 90, COL_ACCENT); // Progression

    // 3. Animation de la structure
    // Oscillation de la tête (X) et montée du plateau (Y)
    float headX = CX + sin(g_phase * 2.2f) * 40.0f;
    float nozzleY = CY - 10 + sin(g_phase * 0.5f) * 5.0f; // Légère vibration
    
    // Dessin du portique (Rail)
    spr.fillRect(CX - 70, nozzleY - 22, 140, 4, COL_GREY);
    
    // 4. Le Plateau (Perspective simplifiée)
    int bedY = CY + 45;
    spr.fillTriangle(CX - 60, bedY, CX + 60, bedY, CX + 40, bedY - 10, rgb565(60, 60, 65));
    spr.fillTriangle(CX - 60, bedY, CX - 40, bedY - 10, CX + 40, bedY - 10, rgb565(50, 50, 55));
    
    // Halo de chaleur sur le plateau (si T > 40°C par exemple)
    if (atoi(b) > 40) {
        drawGlow(CX, bedY - 5, 40, COL_RED, 8);
    }

    // 5. La Pièce en cours (Croissance dynamique)
    int pieceHeight = map(progress, 0, 100, 0, 40);
    spr.fillRect(CX - 20, bedY - 10 - pieceHeight, 40, pieceHeight, COL_GREEN);
    spr.drawRect(CX - 20, bedY - 10 - pieceHeight, 40, pieceHeight, COL_WHITE);

    // 6. Tête d'impression et "Filament"
    // Ligne de filament entre la tête et la pièce
    spr.drawLine(headX, nozzleY, headX, bedY - 10 - pieceHeight, COL_GREEN);
    
    // Corps de la tête
    spr.fillRoundRect(headX - 12, nozzleY - 25, 24, 18, 3, rgb565(200, 200, 210));
    spr.fillTriangle(headX - 5, nozzleY - 7, headX + 5, nozzleY - 7, headX, nozzleY, COL_ORANGE);
    
    // Effet de particules (Sparkles d'extrusion)
    if (progress > 0 && progress < 100) {
        float sparkY = nozzleY + (fmod(g_phase * 10, 15));
        spr.fillCircle(headX + (sin(g_phase * 10) * 2), sparkY, 1, COL_ORANGE);
    }

    // 7. Affichage des Textes (Interface)
    spr.setFont(&fonts::FreeSansBold9pt7b);
    
    // Températures avec icônes simples (Cercles)
    spr.fillCircle(CX - 75, CY - 75, 3, COL_ORANGE);
    spr.setTextColor(COL_WHITE);
    spr.setCursor(CX - 68, CY - 82);
    spr.printf("%s°", t);

    spr.fillCircle(CX + 35, CY - 75, 3, COL_RED);
    spr.setCursor(CX + 42, CY - 82);
    spr.printf("%s°", b);

    // Pourcentage central bas
    spr.setTextColor(COL_ACCENT);
    spr.drawCenterString(String(p) + "%", CX, CY + 75, &fonts::FreeSansBold12pt7b);
}

// ================== MODE MATRIX ==================
// Affiche une pluie de caractères binaires aléatoires (style Matrix).
void renderModeMatrix() {
  spr.setFont(&fonts::FreeSans12pt7b);
  spr.setTextColor(COL_GREEN);
  for (int i = 0; i < 18; i++) {
    int x = (i * 20) % 240;
    int y = (int)((ms_time / 15 + i * 40) % 240);
    char cStr[2] = {(char)('0' + rand() % 2), '\0'};
    spr.drawString(cStr, x, y);
  }
}

// ================== MODE GHOST ==================
// Affiche une sphère fantôme sombre avec une onde sinusoïdale de pixels.
void renderModeGhost() {
  spr.fillCircle(CX, CY, (int)(55 + sin(g_phase) * 5), COL_DARK);
  spr.fillArc(CX, CY, 110, 108, 0, 360, rgb565(30, 30, 30));
  // Onde de pixels horizontale
  for (int x = -60; x < 60; x += 3) {
    int y = CY + (int)(sin(x * 0.2f + g_phase) * 15);
    spr.drawPixel(CX + x, y, COL_GREY);
  }
}

// ================== MODE ERROR ==================
// Affiche un message d'erreur avec glitch visuel (barres horizontales aléatoires).
void renderModeError() {
  spr.setFont(&fonts::FreeSans18pt7b);
  spr.setTextColor(COL_RED);
  // Décalage aléatoire pour effet glitch
  spr.drawString("ERROR",
                 CX - (spr.textWidth("ERROR") / 2) + (rand() % 10 - 5),
                 CY + (rand() % 10 - 5));
  // Barres de glitch horizontales
  for (int i = 0; i < 8; i++) {
    spr.fillRect(0, rand() % 240, 240, 4, rgb565(150, 0, 0));
  }
}

// ================== MODE SUCCESS ==================
// Affiche un anneau vert avec une coche de validation.
void renderModeSuccess() {
  drawSegmentedRing(CX, CY, 85, 4, 1, 0, 0, COL_GREEN);
  // Coche (double trait pour épaisseur)
  spr.drawLine(CX - 30, CY,      CX - 5,  CY + 25, COL_GREEN);
  spr.drawLine(CX - 29, CY,      CX - 4,  CY + 25, COL_WHITE);
  spr.drawLine(CX - 5,  CY + 25, CX + 40, CY - 30, COL_GREEN);
  spr.drawLine(CX - 4,  CY + 25, CX + 41, CY - 30, COL_WHITE);
}

// ================== MODE DEFAULT LOCKED ==================
// Affiche un HUD de verrouillage générique avec anneaux tournants et label "LOCKED".
void renderDefaultLocked() {
  drawSegmentedRing(CX, CY, 100, 5, 4, g_phase * 50.0f, 0.2f, dyn_color);
  drawSegmentedRing(CX, CY, 80, 3, 8, -g_phase * 70.0f, 0.4f, COL_WHITE);
  spr.setFont(&fonts::FreeSans12pt7b);
  spr.setTextColor(COL_WHITE);
  spr.drawString("LOCKED", CX - (spr.textWidth("LOCKED") / 2), CY);
}

// ================== MODE WHATSAPP ==================
// Affiche une notification WhatsApp avec anneau vert et halo pulsant.
void renderModeWhatsapp() {
    // 1. Anneau extérieur et halo
    drawSegmentedRing(CX, CY, 110, 4, 12, g_phase * 30.0f, 0.3f, COL_GREEN);
    drawGlow(CX, CY - 10, 35, COL_GREEN, 20);
    
    // 2. Corps de la bulle WhatsApp
    uint16_t bubbleCol = rgb565(10, 150, 50);
    spr.fillRect(CX - 50, CY - 45, 100, 60, bubbleCol); // Rectangle principal
    spr.fillTriangle(CX - 50, CY - 5, CX - 30, CY + 15, CX - 30, CY - 5, bubbleCol); // Pointe
    
    // 3. Points de suspension animés (...)
    int phase = ((int)(g_phase * 3.0f)) % 4;
    if (phase > 0) spr.fillCircle(CX - 20, CY - 15, 4, TFT_WHITE);
    if (phase > 1) spr.fillCircle(CX, CY - 15, 4, TFT_WHITE);
    if (phase > 2) spr.fillCircle(CX + 20, CY - 15, 4, TFT_WHITE);

    // 4. Textes HUD
    spr.setFont(&fonts::FreeSans9pt7b);
    spr.setTextColor(TFT_WHITE);
    spr.drawCenterString("WHATSAPP", CX, CY + 55);
    
    spr.setTextColor(COL_GREEN);
    spr.setFont(&fonts::FreeSansBold9pt7b);
    if (strlen(local_text) > 0 && strcmp(local_text, "STANDBY") != 0) {
        spr.drawCenterString(local_text, CX, CY + 75);
    } else {
        spr.drawCenterString("MESSAGE ENTRANT", CX, CY + 75);
    }
}
// ================== MODE GMAIL ==================
// Affiche une notification Gmail avec enveloppe animée et compteur de mails.
void renderModeGmail() {
    // 1. Anneau extérieur et halo
    drawSegmentedRing(CX, CY, 110, 3, 6, g_phase * 25.0f, 0.25f, COL_RED);
    drawGlow(CX, CY - 10, 40, COL_RED, 15);
    
    // 2. Corps de l'enveloppe
    uint16_t envBaseCol = rgb565(200, 30, 40);
    uint16_t envFlapCol = rgb565(240, 50, 60);
    
    spr.fillRect(CX - 50, CY - 40, 100, 60, envBaseCol);
    spr.drawRect(CX - 50, CY - 40, 100, 60, TFT_WHITE);
    
    // 3. Rabat supérieur de l'enveloppe
    spr.fillTriangle(CX - 50, CY - 40, CX + 50, CY - 40, CX, CY - 5, envFlapCol);
    spr.drawLine(CX - 50, CY - 40, CX, CY - 5, TFT_WHITE);
    spr.drawLine(CX + 50, CY - 40, CX, CY - 5, TFT_WHITE);

    // 4. Textes HUD
    spr.setFont(&fonts::FreeSans9pt7b);
    spr.setTextColor(TFT_WHITE);
    spr.drawCenterString("INBOX", CX, CY + 55);
    
    spr.setTextColor(COL_RED);
    spr.setFont(&fonts::FreeSansBold9pt7b);
    if (strlen(local_text) > 0 && strcmp(local_text, "INBOX") != 0) {
        spr.drawCenterString(local_text, CX, CY + 75);
    } else {
        spr.drawCenterString("NOUVEAU MESSAGE", CX, CY + 75);
    }
}

// ================== MODE CALENDAR ==================
// Affiche une notification agenda avec calendrier stylisé et événement depuis local_text.
void renderModeCalendar() {
  // Anneaux tournants cyan agenda
  drawSegmentedRing(CX, CY, 90, 5, 8, g_phase * 20.0f, 0.15f, dyn_color);
  drawSegmentedRing(CX, CY, 72, 2, 32, -g_phase * 40.0f, 0.5f, lerpColor(COL_BG, dyn_color, 0.6f));

  // Corps du calendrier
  drawGlow(CX, CY, 38, dyn_color, 15);
  spr.fillRect(CX - 32, CY - 28, 64, 56, rgb565(5, 20, 35));
  spr.drawRect(CX - 32, CY - 28, 64, 56, dyn_color);

  // Barre de titre
  spr.fillRect(CX - 32, CY - 28, 64, 14, dyn_color);
  spr.setFont(&fonts::FreeSans9pt7b);
  spr.setTextColor(COL_BG);
  spr.drawString("CAL", CX - (spr.textWidth("CAL") / 2), CY - 23);

  // Grille de jours (3 lignes x 4 colonnes de points)
  uint16_t dotCol = lerpColor(COL_BLUE, COL_WHITE, (sin(g_phase * 3.0f) + 1.0f) * 0.5f);
  for (int row = 0; row < 3; row++) {
    for (int col = 0; col < 4; col++) {
      int dx = CX - 22 + col * 15;
      int dy = CY - 8 + row * 14;
      // Rendez-vous mis en surbrillance (ligne 1, colonne 2)
      bool highlight = (row == 1 && col == 2);
      spr.fillCircle(dx, dy, highlight ? 4 : 2,
                     highlight ? lerpColor(dyn_color, COL_WHITE, (sin(g_phase * 6.0f) + 1.0f) * 0.5f)
                               : dotCol);
    }
  }

  spr.setFont(&fonts::FreeSans9pt7b);
  spr.setTextColor(COL_WHITE);
  spr.drawString("AGENDA", CX - (spr.textWidth("AGENDA") / 2), CY - 48);

  // Texte de l'événement depuis local_text
  if (strlen(local_text) > 0) {
    spr.setTextColor(dyn_color);
    spr.drawString(local_text, CX - (spr.textWidth(local_text) / 2), CY + 40);
  }
}

// ================== MODE MAP (TRAJET RÉEL) ==================
// Affiche une carte schématique avec trajectoire, curseur de progression et ETA.
// local_text format attendu : "DESTINATION|DISTANCE|ETA" (ex: "Paris|12.5km|14:30")
void renderModeMap() {
  // 1. Grille de fond style GPS tactique
  for (int i = -120; i <= 120; i += 30) {
    spr.drawFastVLine(CX + i, 0, 240, rgb565(10, 25, 40));
    spr.drawFastHLine(0, CY + i, 240, rgb565(10, 25, 40));
  }

  // 2. Tracé de la route (courbe sinusoïdale animée)
  int prevX = -1, prevY = -1;
  for (int i = 0; i <= 100; i += 5) {
    float t = i / 100.0f;
    int px = (CX - 80) + (int)(t * 160);
    int py = (CY + 60) - (int)(t * 120) + (int)(sin(t * 6.0f + g_phase * 0.5f) * 15);
    if (prevX != -1) {
      spr.drawLine(prevX, prevY, px, py, rgb565(60, 60, 80));
    }
    prevX = px;
    prevY = py;
  }

  // 3. Curseur de position actuelle (progression simulée)
  float progress = (sin(g_phase * 0.2f) + 1.0f) / 2.0f;
  int currX = (CX - 80) + (int)(progress * 160);
  int currY = (CY + 60) - (int)(progress * 120) + (int)(sin(progress * 6.0f + g_phase * 0.5f) * 15);
  drawGlow(currX, currY, 15, dyn_color, 10);
  spr.fillCircle(currX, currY, 5, COL_WHITE);
  spr.drawCircle(currX, currY, 8, dyn_color);

  // 4. Point de destination (pulse clignotant)
  int destX = (CX - 80) + 160;
  int destY = (CY + 60) - 120 + (int)(sin(6.0f + g_phase * 0.5f) * 15);
  if ((ms_time / 500) % 2) {
    spr.fillCircle(destX, destY, 6, COL_RED);
  }
  spr.drawCircle(destX, destY, 12, COL_RED);

  // 5. Parsing des données de navigation depuis local_text
  char dest[16] = "MAP", dist[16] = "--", eta[16] = "--";
  const char* p1 = strchr(local_text, '|');
  if (p1) {
    const char* p2 = strchr(p1 + 1, '|');
    if (p2) {
      strncpy(dest, local_text, p1 - local_text); dest[p1 - local_text] = '\0';
      strncpy(dist, p1 + 1, p2 - p1 - 1);         dist[p2 - p1 - 1]    = '\0';
      strncpy(eta,  p2 + 1, sizeof(eta) - 1);
    }
  }

  // 6. HUD Navigation
  spr.setFont(&fonts::FreeSans9pt7b);
  spr.setTextColor(dyn_color);
  spr.drawString(dest, 15, 15);

  char buf[32];
  spr.setTextColor(COL_WHITE);
  snprintf(buf, sizeof(buf), "DIST: %s", dist);
  spr.drawString(buf, 150, 200);
  snprintf(buf, sizeof(buf), "ETA: %s", eta);
  spr.drawString(buf, 15, 200);

  // 7. Boussole (coin haut droit)
  int bx = 210, by = 30;
  spr.drawCircle(bx, by, 15, COL_GREY);
  spr.drawLine(bx, by - 10, bx - 5, by + 5, COL_RED);
  spr.drawLine(bx, by - 10, bx + 5, by + 5, COL_RED);
  spr.drawLine(bx - 5, by + 5, bx + 5, by + 5, COL_WHITE);
}

// ================== MODE DOORS ==================
// Affiche une notification de porte avec anneau vert et halo pulsant.
void renderModeDoors() {
    // 1. Parsing de l'état ("0|1|0|0") -> Avant|Arrière|Garage|Latéral
    int d[4] = {0, 0, 0, 0};
    if (strlen(local_text) >= 7) {
        sscanf(local_text, "%d|%d|%d|%d", &d[0], &d[1], &d[2], &d[3]);
    }
    
    const char* names[4] = {"AVANT", "ARRIERE", "GARAGE", "LATERAL"};
    int openCount = d[0] + d[1] + d[2] + d[3];
    bool isSecure = (openCount == 0);

    // 2. Halo d'ambiance
    float pulse = (sin(g_phase * (isSecure ? 2.0f : 8.0f)) + 1.0f) / 2.0f;
    drawGlow(CX, CY - 20, isSecure ? 40 : 50 + (int)(pulse * 10), isSecure ? COL_GREEN : COL_RED, 15);

    // 3. Cadre Fixe (Centré, décalé vers le haut)
    int fX = CX - 40;
    int fY = CY - 80;
    spr.drawRect(fX, fY, 80, 120, COL_FRAME_OUT);
    spr.drawRect(fX + 2, fY + 2, 76, 116, COL_FRAME_IN);

    spr.setFont(&fonts::FreeSans9pt7b);

    if (isSecure) {
        // --- PORTE FERMÉE ---
        spr.fillRect(fX + 2, fY + 2, 76, 116, COL_DOOR_SEC);
        
        // Panneaux
        spr.drawRect(fX + 8, fY + 8, 64, 45, COL_GREEN);
        spr.drawRect(fX + 8, fY + 60, 64, 52, COL_GREEN);
        
        // Poignée
        spr.fillRect(fX + 62, fY + 55, 10, 3, TFT_WHITE);
        spr.fillRect(fX + 68, fY + 55, 4, 16, TFT_WHITE);
        spr.fillCircle(fX + 66, fY + 45, 2, COL_GREEN);
        
        // Ligne de balayage de sécurité
        int scanY = fY + 2 + ((int)(g_phase * 30.0f) % 116);
        spr.drawFastHLine(fX + 2, scanY, 76, COL_GREEN);

        // Textes
        spr.setTextColor(TFT_WHITE);
        spr.drawCenterString("TOUTES PORTES", CX, CY + 60);
        spr.setTextColor(COL_GREEN);
        spr.setFont(&fonts::FreeSansBold9pt7b);
        spr.drawCenterString("VERROUILLEES", CX, CY + 80);
    } else {
        // --- PORTE OUVERTE ---
        spr.fillRect(fX + 2, fY + 2, 76, 116, COL_ROOM_DARK);
        spr.setTextColor(COL_RED);
        spr.drawCenterString("!!!", CX, CY - 20);

        // Geométrie porte pivotée (2 Triangles LGFX)
        int pTopL_x = fX + 2,  pTopL_y = fY + 2;
        int pBotL_x = fX + 2,  pBotL_y = fY + 118;
        int pTopR_x = fX + 55, pTopR_y = fY + 15;
        int pBotR_x = fX + 55, pBotR_y = fY + 105;

        spr.fillTriangle(pTopL_x, pTopL_y, pTopR_x, pTopR_y, pBotL_x, pBotL_y, COL_DOOR_ALRT);
        spr.fillTriangle(pTopR_x, pTopR_y, pBotR_x, pBotR_y, pBotL_x, pBotL_y, COL_DOOR_ALRT);
        
        spr.drawLine(pTopL_x, pTopL_y, pTopR_x, pTopR_y, COL_RED);
        spr.drawLine(pTopR_x, pTopR_y, pBotR_x, pBotR_y, COL_RED);
        spr.drawLine(pBotR_x, pBotR_y, pBotL_x, pBotL_y, COL_RED);

        // Poignée biaisée
        spr.fillRect(pTopR_x - 10, pTopR_y + 35, 4, 12, TFT_WHITE);

        // Textes Alerte
        spr.setTextColor(COL_RED);
        spr.setFont(&fonts::FreeSansBold9pt7b);
        spr.drawCenterString("ALERTE OUVERTURE", CX, CY + 60);
        
        char openNames[64] = "";
        for (int i = 0; i < 4; i++) {
            if (d[i] == 1) {
                if (strlen(openNames) > 0) strcat(openNames, " - ");
                strcat(openNames, names[i]);
            }
        }
        spr.setFont(&fonts::FreeSans9pt7b);
        spr.setTextColor(COL_ORANGE);
        spr.drawCenterString(openNames, CX, CY + 80);
    }

    // En-tête HUD
    spr.setFont(&fonts::FreeSans9pt7b);
    spr.setTextColor(dyn_color);
    spr.drawCenterString("CAPTEURS", CX, CY - 105);
    spr.drawFastHLine(CX - 30, CY - 88, 60, dyn_color);
}