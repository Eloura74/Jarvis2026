#!/usr/bin/env python3
"""Script de réparation de main.cpp - remplace la zone corrompue renderModeMatrix+renderModeScreensaver"""

path = r'A:\02-PROJECTS\Jarvis2026\sphere\src\main.cpp'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Bloc corrompu à remplacer (renderModeMatrix tronquée + renderDefaultLocked mal placée)
OLD = '''void renderModeMatrix() {
  spr.setFont(&fonts::FreeSans12pt7b); spr.setTextColor(COL_GREEN);
  for (int i = 0; i < 18; i++) {
    int x = (i * 20) % 240;
    int y = ((ms_time / 15 + i * 40) % 240);
    char cStr[2] = {(char)(\'0\' + rand() % 2), \'\\0\'};
    spr.drawString(cStr, x, y);
void renderDefaultLocked() {
  drawSegmentedRing(CX, CY, 100, 5, 4, g_phase*50.0f, 0.2f, dyn_color);
  drawSegmentedRing(CX, CY, 80, 3, 8, -g_phase*70.0f, 0.4f, COL_WHITE);
  spr.setFont(&fonts::FreeSans12pt7b); spr.setTextColor(COL_WHITE); 
  spr.drawString("LOCKED", CX - (spr.textWidth("LOCKED")/2), CY);
}'''

NEW = '''void renderModeMatrix() {
  spr.setFont(&fonts::FreeSans12pt7b); spr.setTextColor(COL_GREEN);
  for (int i = 0; i < 18; i++) {
    int x = (i * 20) % 240;
    int y = ((ms_time / 15 + i * 40) % 240);
    char cStr[2] = {(char)(\'0\' + rand() % 2), \'\\0\'};
    spr.drawString(cStr, x, y);
  }
}

void renderModeScreensaver() {
  // SPHERE HOLOGRAMME 3D v3 - Painter\'s Algorithm fill+stroke
  // fillEllipse sombre = volume. drawEllipse neon = contour lumineux.
  // Ordre back->front : meridiens arriere, fill latitudes, contours neon,
  // equateur, meridiens avant, silhouette, reflet, noyau, particules.

  // 1. PHASE & BREATHING
  g_sleep_phase += 0.007f;
  float breath = (sin(g_sleep_phase) + 1.0f) * 0.5f;

  // 2. DRIFT CHROMATIQUE - cycle ~80s cyan -> indigo
  float cc = (sin(g_sleep_phase * 0.08f) + 1.0f) * 0.5f;
  uint8_t cr = (uint8_t)(cc * 80);
  uint8_t cg = (uint8_t)(160 + cc * 60);
  uint8_t cb = (uint8_t)(230 + cc * 25);
  g_sleep_color = rgb565(cr, cg, cb);
  uint16_t colEdge    = lerpColor(g_sleep_color, COL_WHITE, 0.65f + breath * 0.25f);
  uint16_t colEquator = lerpColor(g_sleep_color, COL_WHITE, 0.92f + breath * 0.08f);
  uint16_t colMerB    = lerpColor(COL_BG, g_sleep_color, 0.12f);

  // 3. GEOMETRIE - R=102px, inclinaison camera ~25 deg
  float R    = 102.0f + breath * 4.0f;
  float rotY = g_phase * 0.018f;
  const float cosTX = 0.906f;
  const float sinTX = 0.423f;

  // 4. ANNEAU DE BORD
  spr.drawCircle(CX, CY, 117, lerpColor(COL_BG, g_sleep_color, 0.08f));
  spr.drawCircle(CX, CY, 116, lerpColor(COL_BG, g_sleep_color, 0.20f + breath * 0.10f));
  spr.drawCircle(CX, CY, 115, lerpColor(COL_BG, g_sleep_color, 0.08f));

  // 5. HALO ATMOSPHERIQUE
  for (int rr = (int)(R + 26); rr > (int)(R + 3); rr -= 3) {
    float f = 1.0f - ((float)(rr - R - 3) / 23.0f);
    spr.drawCircle(CX, CY, rr,
      lerpColor(COL_BG, g_sleep_color, f * f * (0.14f + breath * 0.10f)));
  }

  // 6. LATITUDES - 8 bandes, painter back->front
  const int NUM_LAT = 8;
  const float lats[NUM_LAT] = {
    -1.309f, -0.916f, -0.524f, -0.175f,
     0.175f,  0.524f,  0.916f,  1.309f
  };

  // Passe A : fillEllipse (volume - face interieure sombre)
  for (int li = 0; li < NUM_LAT; li++) {
    float phi   = lats[li];
    float r_lat = R * cos(phi);
    float cy_w  = R * sin(phi);
    float cy_c  = cy_w * cosTX;
    float cz_c  = cy_w * sinTX;
    float persp = 220.0f / (220.0f + cz_c);
    int   rx    = (int)(r_lat * persp);
    int   ry    = (int)(r_lat * cosTX * persp);
    int   cy_s  = CY + (int)(cy_c * persp);
    if (rx < 2 || ry < 1) continue;
    float depthF = (cz_c < 0) ? (0.13f + breath * 0.04f) : 0.06f;
    spr.fillEllipse(CX, cy_s, rx, ry, lerpColor(COL_BG, g_sleep_color, depthF));
  }
  spr.fillEllipse(CX, CY, (int)R, (int)(R * cosTX),
    lerpColor(COL_BG, g_sleep_color, 0.16f + breath * 0.06f));

  // Passe B : meridiens face ARRIERE
  const int NUM_MER = 8;
  for (int mi = 0; mi < NUM_MER; mi++) {
    float mA    = rotY + (mi * PI / NUM_MER);
    float cM    = cos(mA);
    float sM    = sin(mA);
    if (cM >= 0.0f) continue;
    float pz_m  = R * sM * sinTX;
    float persp = 220.0f / (220.0f + pz_m);
    int   rx    = (int)(abs(cM) * R * persp);
    int   ry    = (int)(R * cosTX * persp);
    if (rx < 2 || ry < 2) continue;
    spr.drawEllipse(CX, CY, rx, ry, colMerB);
  }

  // Passe C : contours de latitudes (neon lumineux)
  for (int li = 0; li < NUM_LAT; li++) {
    float phi   = lats[li];
    float r_lat = R * cos(phi);
    float cy_w  = R * sin(phi);
    float cy_c  = cy_w * cosTX;
    float cz_c  = cy_w * sinTX;
    float persp = 220.0f / (220.0f + cz_c);
    int   rx    = (int)(r_lat * persp);
    int   ry    = (int)(r_lat * cosTX * persp);
    int   cy_s  = CY + (int)(cy_c * persp);
    if (rx < 2 || ry < 1) continue;
    float zF  = (-cz_c / R + 1.0f) * 0.5f;
    float brt = 0.22f + zF * 0.58f + breath * 0.14f;
    uint16_t col = lerpColor(COL_BG, colEdge, brt);
    spr.drawEllipse(CX, cy_s, rx,     ry, col);
    spr.drawEllipse(CX, cy_s, rx + 1, ry, lerpColor(COL_BG, col, 0.48f));
  }

  // Equateur : contour triple
  {
    int rx = (int)R;
    int ry = (int)(R * cosTX);
    spr.drawEllipse(CX, CY, rx - 1, ry, lerpColor(COL_BG, colEquator, 0.55f));
    spr.drawEllipse(CX, CY, rx,     ry, colEquator);
    spr.drawEllipse(CX, CY, rx + 1, ry, lerpColor(COL_BG, colEquator, 0.55f));
  }

  // Passe D : meridiens face AVANT
  for (int mi = 0; mi < NUM_MER; mi++) {
    float mA    = rotY + (mi * PI / NUM_MER);
    float cM    = cos(mA);
    float sM    = sin(mA);
    if (cM <= 0.0f) continue;
    float pz_m  = R * sM * sinTX;
    float persp = 220.0f / (220.0f + pz_m);
    int   rx    = (int)(cM * R * persp);
    int   ry    = (int)(R * cosTX * persp);
    if (rx < 2 || ry < 2) continue;
    uint16_t c = lerpColor(g_sleep_color, COL_WHITE,
                           0.40f + cM * 0.40f + breath * 0.15f);
    spr.drawEllipse(CX, CY, rx - 1, ry, lerpColor(COL_BG, c, 0.45f));
    spr.drawEllipse(CX, CY, rx,     ry, c);
    spr.drawEllipse(CX, CY, rx + 1, ry, lerpColor(COL_BG, c, 0.45f));
  }

  // 7. CONTOUR SPHERIQUE - silhouette 5px
  int Ri = (int)R;
  spr.drawCircle(CX, CY, Ri - 2, lerpColor(COL_BG, g_sleep_color, 0.28f));
  spr.drawCircle(CX, CY, Ri - 1, lerpColor(COL_BG, g_sleep_color, 0.58f));
  spr.drawCircle(CX, CY, Ri,     lerpColor(g_sleep_color, COL_WHITE, 0.72f + breath * 0.25f));
  spr.drawCircle(CX, CY, Ri + 1, lerpColor(COL_BG, g_sleep_color, 0.58f));
  spr.drawCircle(CX, CY, Ri + 2, lerpColor(COL_BG, g_sleep_color, 0.22f));

  // 8. REFLET SPECULAIRE - source lumineuse haut-gauche
  uint16_t specCol = lerpColor(COL_BG, COL_WHITE, 0.55f + breath * 0.30f);
  spr.drawArc(CX - 14, CY - 14, Ri - 2, Ri - 7, 290, 360, specCol);
  spr.drawArc(CX - 14, CY - 14, Ri - 2, Ri - 7, 0,   40,  specCol);
  spr.drawArc(CX - 14, CY - 14, Ri - 8, Ri - 12, 295, 355,
    lerpColor(COL_BG, COL_WHITE, 0.30f + breath * 0.15f));

  // 9. NOYAU CENTRAL - halo + couronne + point blanc
  int coreR = (int)(7 + breath * 6);
  for (int rr = coreR + 22; rr > coreR + 7; rr -= 3) {
    float f = 1.0f - ((float)(rr - coreR - 7) / 15.0f);
    spr.drawCircle(CX, CY, rr,
      lerpColor(COL_BG, g_sleep_color, f * f * (0.18f + breath * 0.12f)));
  }
  spr.drawCircle(CX, CY, coreR + 7, lerpColor(COL_BG, g_sleep_color, 0.38f + breath * 0.22f));
  spr.drawCircle(CX, CY, coreR + 6, lerpColor(COL_BG, g_sleep_color, 0.62f + breath * 0.28f));
  spr.drawCircle(CX, CY, coreR + 5, lerpColor(COL_BG, g_sleep_color, 0.38f + breath * 0.22f));
  spr.fillCircle(CX, CY, coreR,     lerpColor(g_sleep_color, COL_WHITE, 0.62f + breath * 0.38f));
  spr.fillCircle(CX, CY, (int)(coreR * 0.35f + 1), COL_WHITE);

  // 10. PARTICULES ORBITALES - devant=lumineux+gros, derriere=fantome
  for (int i = 0; i < 8; i++) {
    g_dust[i].angle += g_dust[i].speed * 1.5f;
    float da     = g_dust[i].angle;
    float dr     = g_dust[i].radius;
    float px     =  cos(da) * dr;
    float pz     =  sin(da) * dr * 0.42f;
    float py_cam = -pz * sinTX;
    float pz_cam =  pz * cosTX;
    float persp  = 220.0f / (220.0f + pz_cam);
    int   sx     = CX + (int)(px * persp);
    int   sy     = CY + (int)(py_cam * persp);
    bool  front  = (pz_cam < 0.0f);
    float pb     = front ? (0.60f + breath * 0.25f) : 0.12f;
    int   pr     = front ? (g_dust[i].size + 1) : 1;
    spr.fillCircle(sx, sy, pr, lerpColor(COL_BG, g_sleep_color, pb));
  }
}

void renderModeGhost() {
  spr.fillCircle(CX, CY, 55 + sin(g_phase)*5, COL_DARK);
  spr.fillArc(CX, CY, 110, 108, 0, 360, rgb565(30,30,30));
  for(int x=-60; x<60; x+=3) { int y = CY + sin(x*0.2f + g_phase)*15; spr.drawPixel(CX+x, y, COL_GREY); }
}

void renderModeError() {
  spr.setFont(&fonts::FreeSans18pt7b); spr.setTextColor(COL_RED);
  spr.drawString("ERROR", CX - (spr.textWidth("ERROR")/2) + (rand()%10 - 5), CY + (rand()%10 - 5));
  for(int i=0; i<8; i++) { spr.fillRect(0, rand() % 240, 240, 4, rgb565(150,0,0)); }
}

void renderModeSuccess() {
  drawSegmentedRing(CX, CY, 85, 4, 1, 0, 0, COL_GREEN);
  spr.drawLine(CX-30, CY, CX-5, CY+25, COL_GREEN); spr.drawLine(CX-29, CY, CX-4, CY+25, COL_WHITE);
  spr.drawLine(CX-5, CY+25, CX+40, CY-30, COL_GREEN); spr.drawLine(CX-4, CY+25, CX+41, CY-30, COL_WHITE);
}

void renderDefaultLocked() {
  drawSegmentedRing(CX, CY, 100, 5, 4, g_phase*50.0f, 0.2f, dyn_color);
  drawSegmentedRing(CX, CY, 80, 3, 8, -g_phase*70.0f, 0.4f, COL_WHITE);
  spr.setFont(&fonts::FreeSans12pt7b); spr.setTextColor(COL_WHITE); 
  spr.drawString("LOCKED", CX - (spr.textWidth("LOCKED")/2), CY);
}'''

if OLD in content:
    content = content.replace(OLD, NEW, 1)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("SUCCESS: bloc remplace")
else:
    print("ERREUR: bloc OLD non trouve")
    # Afficher les lignes 589-602 pour debug
    lines = content.split('\n')
    for i, line in enumerate(lines[588:603], start=589):
        print(f"{i}: {repr(line)}")
