#include <Arduino.h>
#include <LovyanGFX.hpp>
#include <vector>
#include <cmath>

#ifndef PI
#define PI 3.14159265358979323846f
#endif

#ifndef DEG_TO_RAD
#define DEG_TO_RAD 0.0174532925f
#endif

// ==============================================================================
// 🌟 JARVIS OS - CORE RENDERER V4.1 (ESP32-S3 + GC9A01)
// ------------------------------------------------------------------------------
// Architecture modulaire.
// Améliorations : Voix réaliste lente (Bleue) & Impression 3D (CoreXY).
// ==============================================================================

// ================== CLASSE ÉCRAN GC9A01 (ESP32-S3) ==================
class LGFX : public lgfx::LGFX_Device {
  lgfx::Panel_GC9A01 _panel;
  lgfx::Bus_SPI      _bus;

public:
  LGFX() {
    {
      auto cfg = _bus.config();
      cfg.spi_host    = SPI2_HOST; 
      cfg.spi_mode    = 0;
      cfg.freq_write  = 80000000; // 80 MHz
      cfg.spi_3wire   = true;
      cfg.use_lock    = true;
      cfg.dma_channel = SPI_DMA_CH_AUTO;

      // PINS SPI 
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

LGFX display;
static lgfx::LGFX_Sprite spr(&display); 

// ================== ÉTATS GLOBAUX DU NOYAU ==================
enum class OrbState : uint8_t { 
  IDLE, LISTENING, SPEAKING, ERROR,
  MODE_WEATHER, MODE_HOME, MODE_SYSTEM, MODE_MATRIX, MODE_SEARCH,
  MODE_MEDIA, MODE_TIMER, MODE_PRINT, MODE_NOTIFICATION, MODE_SUCCESS,
  MODE_APPS, MODE_VISION, MODE_GHOST, MODE_SECURITY
};

static OrbState g_state = OrbState::IDLE;
static OrbState g_lastState = OrbState::IDLE;
static char g_text[64] = "SYS_READY";

// Chronométrie et cinématique
static uint32_t g_lastFrame = 0;
static float g_phase = 0.0f;
static uint32_t ms_time = 0;

const int CX = 120;
const int CY = 120;

// ================== OUTILS COULEURS / MATHS ==================
uint16_t rgb565(uint8_t r, uint8_t g, uint8_t b) {
  return ((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3);
}

uint16_t lerpColor(uint16_t c1, uint16_t c2, float t) {
  if (t <= 0.0f) return c1;
  if (t >= 1.0f) return c2;
  int r1 = (c1 >> 11) & 0x1F; int g1 = (c1 >> 5) & 0x3F; int b1 = c1 & 0x1F;
  int r2 = (c2 >> 11) & 0x1F; int g2 = (c2 >> 5) & 0x3F; int b2 = c2 & 0x1F;
  return (((r1 + (int)((r2 - r1) * t)) & 0x1F) << 11) | 
         (((g1 + (int)((g2 - g1) * t)) & 0x3F) << 5) | 
          ((b1 + (int)((b2 - b1) * t)) & 0x1F);
}

// Palette Cyberpunk
const uint16_t COL_CYAN      = rgb565(0, 240, 255);
const uint16_t COL_BLUE      = rgb565(0, 100, 255);
const uint16_t COL_AI_VOICE  = rgb565(0, 150, 255); // Bleu clair profond pour la voix
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

// Variables dynamiques lissées pour le noyau
float dyn_radius = 10.0f;
float dyn_speed = 0.05f;
uint16_t dyn_color = COL_CYAN;

// Système de particules
struct Particle {
  float x, y, vx, vy;
  int life;
  uint16_t color;
};
std::vector<Particle> particles;
const int MAX_PARTICLES = 35;

// ================== PARSEUR SÉRIE (UART) ==================
static void setStateFromStr(const String& s) {
  g_lastState = g_state;
  if (s == "IDLE") g_state = OrbState::IDLE;
  else if (s == "LISTENING") g_state = OrbState::LISTENING;
  else if (s == "SPEAKING") g_state = OrbState::SPEAKING;
  else if (s == "ERROR") g_state = OrbState::ERROR;
  else if (s == "WEATHER") g_state = OrbState::MODE_WEATHER;
  else if (s == "HOME") g_state = OrbState::MODE_HOME;
  else if (s == "SYSTEM") g_state = OrbState::MODE_SYSTEM;
  else if (s == "MATRIX") g_state = OrbState::MODE_MATRIX;
  else if (s == "SEARCH") g_state = OrbState::MODE_SEARCH;
  else if (s == "MEDIA") g_state = OrbState::MODE_MEDIA;
  else if (s == "TIMER") g_state = OrbState::MODE_TIMER;
  else if (s == "PRINT") g_state = OrbState::MODE_PRINT;
  else if (s == "NOTIF") g_state = OrbState::MODE_NOTIFICATION;
  else if (s == "SUCCESS") g_state = OrbState::MODE_SUCCESS;
  else if (s == "APPS") g_state = OrbState::MODE_APPS;
  else if (s == "VISION") g_state = OrbState::MODE_VISION;
  else if (s == "GHOST") g_state = OrbState::MODE_GHOST;
  else if (s == "SECURITY") g_state = OrbState::MODE_SECURITY;
}

static void handleLine(String line) {
  line.trim();
  if (!line.length()) return;
  if (line == "PING") { Serial.println("PONG"); return; }
  
  if (line.startsWith("STATE ") || line.startsWith("MODE ")) { 
    String s = line.substring(line.indexOf(' ')+1); 
    s.trim(); s.toUpperCase();
    setStateFromStr(s);
    Serial.println("OK STATE");
    return;
  }
  if (line.startsWith("TEXT ")) {
    String msg = line.substring(5);
    msg.trim();
    if (msg.length() > 63) msg = msg.substring(0, 63);
    msg.toCharArray(g_text, sizeof(g_text));
    Serial.println("OK TEXT");
    return;
  }
}

// ================== PRIMITIVES VECTORIELLES AVANCÉES ==================

void drawGlow(int x, int y, int radius, uint16_t color, int intensity) {
  for (int r = radius + intensity; r > radius; r -= 2) {
    float factor = 1.0f - ((float)(r - radius) / intensity);
    uint16_t fadeCol = lerpColor(COL_BG, color, factor * factor); 
    spr.drawCircle(x, y, r, fadeCol);
  }
}

void drawSegmentedRing(int x, int y, int r, int thickness, int segments, float phase, float gapRatio, uint16_t color) {
  float angleStep = 360.0f / segments;
  float gap = angleStep * gapRatio;
  for (int i = 0; i < segments; i++) {
    float startAngle = i * angleStep + phase;
    float endAngle = startAngle + angleStep - gap;
    spr.drawArc(x, y, r, r - thickness, startAngle, endAngle, color);
  }
}

// ================== MOTEUR PHYSIQUE & LOGIQUE ==================
void updateLogic() {
  float target_radius = 35.0f;
  float target_speed = 0.03f;
  uint16_t target_color = COL_CYAN;

  switch (g_state) {
    case OrbState::IDLE:      
        target_radius = 35.0f; 
        target_speed = 0.02f; 
        target_color = COL_CYAN; 
        break;
    case OrbState::LISTENING: 
        target_radius = 45.0f; 
        target_speed = 0.05f; 
        target_color = COL_GREEN; 
        break;
    case OrbState::SPEAKING:  
        // Respiration organique ample et très lente
        target_radius = 42.0f + (sin(ms_time * 0.002f) * 6.0f); 
        target_speed = 0.04f; // Vitesse d'évolution drastiquement ralentie
        target_color = COL_AI_VOICE; // Bleu IA holographique au lieu de orange
        break;
    case OrbState::ERROR:     target_radius = 20.0f; target_speed = 0.0f;  target_color = COL_RED; break;
    case OrbState::MODE_HOME: target_radius = 0.0f;  target_speed = 0.08f; target_color = COL_BLUE; break;
    case OrbState::MODE_VISION:target_radius= 0.0f;  target_speed = 0.10f; target_color = COL_RED; break;
    case OrbState::MODE_GHOST: target_radius= 10.0f; target_speed = 0.01f; target_color = COL_GREY; break;
    case OrbState::MODE_MEDIA: target_radius= 20.0f; target_speed = 0.10f; target_color = COL_PINK; break;
    case OrbState::MODE_SUCCESS:target_radius=0.0f;  target_speed = 0.05f; target_color = COL_GREEN; break;
    default:                  target_radius = 30.0f; target_speed = 0.05f; target_color = COL_CYAN; break;
  }

  // Application de l'accélération inertielle (Smoothing)
  dyn_radius += (target_radius - dyn_radius) * 0.1f;
  dyn_speed += (target_speed - dyn_speed) * 0.05f;
  dyn_color = lerpColor(dyn_color, target_color, 0.1f);
  g_phase += dyn_speed;

  // Gestion des Particules
  if (g_state == OrbState::IDLE || g_state == OrbState::LISTENING || g_state == OrbState::SPEAKING) {
    if (particles.size() < MAX_PARTICLES && rand() % 3 == 0) {
      float angle = (float)(rand() % 360) * DEG_TO_RAD;
      float speed = (float)(rand() % 20 + 5) * 0.05f;
      float spawn_r = 115.0f;
      particles.push_back({CX + cos(angle)*spawn_r, CY + sin(angle)*spawn_r, 
                           cos(angle + PI)*speed, sin(angle + PI)*speed, 
                           255, dyn_color});
    }
  }

  for (auto it = particles.begin(); it != particles.end();) {
    it->x += it->vx; 
    it->y += it->vy;
    it->life -= 4;

    if (g_state == OrbState::SPEAKING || g_state == OrbState::LISTENING) {
        float pull = (g_state == OrbState::SPEAKING) ? 0.015f : 0.01f; // Aspiration plus douce en mode Voix
        it->x += (CX - it->x) * pull;
        it->y += (CY - it->y) * pull;
    }

    if (it->life <= 0 || (pow(it->x - CX, 2) + pow(it->y - CY, 2) < dyn_radius*dyn_radius)) {
      it = particles.erase(it);
    } else {
      ++it;
    }
  }
}

// ================== MODULES DE RENDU VISUEL ==================

void renderPersistentHUD() {
  spr.drawArc(CX, CY, 119, 118, 0, 360, COL_DEEP_BLUE);
  
  spr.fillRect(CX - 1, 0, 2, 6, COL_GREY);
  spr.fillRect(CX - 1, 234, 2, 6, COL_GREY);
  spr.fillRect(0, CY - 1, 6, 2, COL_GREY);
  spr.fillRect(234, CY - 1, 6, 2, COL_GREY);

  bool blink = (sin(g_phase * 5.0f) > 0);
  uint16_t ledCol = blink ? COL_GREEN : rgb565(0, 40, 0);
  spr.fillRect(115, 6, 4, 3, ledCol);
  spr.fillRect(121, 6, 4, 3, ledCol);
  spr.fillRect(127, 6, 4, 3, rgb565(20, 20, 20));

  spr.setTextDatum(MC_DATUM);
  spr.setTextColor(COL_CYAN, COL_BG);
  spr.setFont(&fonts::FreeSans9pt7b); 
  spr.drawString(g_text, CX, 210);
}

void renderCoreJarvis() {
  for (const auto& p : particles) {
    spr.drawLine(p.x, p.y, p.x - p.vx*2, p.y - p.vy*2, p.color);
    spr.drawPixel(p.x, p.y, COL_WHITE);
  }

  drawGlow(CX, CY, dyn_radius, dyn_color, 15);
  spr.fillCircle(CX, CY, dyn_radius, dyn_color);
  spr.fillCircle(CX, CY, dyn_radius * 0.4f, COL_WHITE); 

  float a1 = g_phase * 100.0f;
  float a2 = -g_phase * 120.0f;
  
  drawSegmentedRing(CX, CY, dyn_radius + 15, 3, 3, a1, 0.4f, dyn_color);
  drawSegmentedRing(CX, CY, dyn_radius + 25, 1, 12, a2, 0.5f, COL_WHITE);
  
  if (g_state == OrbState::SPEAKING) {
    // Rendu Onde Vocale Fluide et Réaliste (Type Cortana/Siri)
    int points = 72;
    float base_r = dyn_radius + 20.0f;
    float last_x = -1, last_y = -1;
    
    for (int i = 0; i <= points; i++) {
        float a = (i % points) * (PI * 2.0f) / points;
        
        // Déformation mathématique fluide combinant 2 fréquences
        float wave = sin(a * 4.0f + g_phase * 2.5f) * 8.0f + 
                     cos(a * 6.0f - g_phase * 1.5f) * 4.0f;
                     
        float r = base_r + wave;
        float x = CX + cos(a) * r;
        float y = CY + sin(a) * r;
        
        if (i > 0) {
            spr.drawLine(last_x, last_y, x, y, dyn_color);
            spr.drawLine(last_x+1, last_y, x+1, y, dyn_color); // Antialiasing / Épaisseur
        }
        last_x = x; last_y = y;
    }
  } else {
    drawSegmentedRing(CX, CY, dyn_radius + 40, 1, 36, g_phase * 30.0f, 0.8f, dyn_color);
  }
}

void renderModeSystem() {
  drawSegmentedRing(CX, CY, 110, 8, 8, g_phase * 50.0f, 0.1f, COL_CYAN);
  drawSegmentedRing(CX, CY, 95, 2, 36, -g_phase * 80.0f, 0.5f, COL_BLUE);
  
  spr.setFont(&fonts::FreeSans12pt7b);
  spr.setTextColor(COL_WHITE);
  spr.drawString("SYS.OPT", CX, CY - 25);
  
  int load = 40 + sin(g_phase*5.0f)*20;
  spr.drawRect(CX - 40, CY, 80, 12, COL_CYAN);
  spr.fillRect(CX - 38, CY + 2, (76 * load)/100, 8, COL_CYAN);

  spr.setFont(&fonts::FreeSans9pt7b);
  spr.setTextColor(COL_GREEN); 
  spr.drawString("RAM: 1.2G", CX, CY + 30);
}

void renderModeVision() {
  for(int i=-120; i<=120; i+=25) {
     spr.drawFastVLine(CX+i, 0, 240, rgb565(40,0,0));
     spr.drawFastHLine(0, CY+i, 240, rgb565(40,0,0));
  }
  
  int tr = 90 + sin(g_phase*10.0f)*5;
  spr.drawLine(CX-tr, CY-tr/2, CX-tr, CY-tr, COL_RED); spr.drawLine(CX-tr, CY-tr, CX-tr/2, CY-tr, COL_RED);
  spr.drawLine(CX+tr, CY-tr/2, CX+tr, CY-tr, COL_RED); spr.drawLine(CX+tr, CY-tr, CX+tr/2, CY-tr, COL_RED);
  spr.drawLine(CX-tr, CY+tr/2, CX-tr, CY+tr, COL_RED); spr.drawLine(CX-tr, CY+tr, CX-tr/2, CY+tr, COL_RED);
  spr.drawLine(CX+tr, CY+tr/2, CX+tr, CY+tr, COL_RED); spr.drawLine(CX+tr, CY+tr, CX+tr/2, CY+tr, COL_RED);

  int scanY = CY + sin(g_phase * 4.0f) * 115;
  spr.fillRect(CX-110, scanY-2, 220, 4, COL_RED);
  
  spr.setFont(&fonts::FreeSans9pt7b);
  spr.setTextColor(COL_RED);
  spr.drawString("AI_LOCK", CX, CY - 40);
}

void renderModeHome() {
  spr.drawArc(CX, CY, 50, 49, 0, 360, COL_BLUE);
  spr.drawArc(CX, CY, 100, 99, 0, 360, COL_BLUE);

  float scanA = g_phase * 2.0f;
  spr.fillTriangle(CX, CY, CX + cos(scanA)*120, CY + sin(scanA)*120, CX + cos(scanA - 0.2f)*120, CY + sin(scanA - 0.2f)*120, rgb565(0, 50, 100));
  spr.drawLine(CX, CY, CX + cos(scanA)*120, CY + sin(scanA)*120, COL_CYAN);
  
  struct Pt { float a; float d; const char* nm; };
  Pt nodes[] = { {0.5, 55, "LIV"}, {2.1, 95, "KIT"}, {4.8, 80, "BED"} };
  
  spr.setFont(&fonts::FreeSans9pt7b);
  for(int i=0; i<3; i++) {
      float x = CX + cos(nodes[i].a)*nodes[i].d;
      float y = CY + sin(nodes[i].a)*nodes[i].d;
      spr.fillCircle(x, y, 4, COL_CYAN);
      spr.setTextColor(COL_WHITE); 
      spr.drawString(nodes[i].nm, x, y - 15);
  }
}

void renderModeMedia() {
  int bars = 45;
  float radius = 55;
  for (int i = 0; i < bars; i++) {
     float angle = (i * 360.0f / bars) * DEG_TO_RAD + g_phase;
     float val = 10 + abs(sin(g_phase * 4.0f + i * 0.4f) * 45.0f) + (sin(i*132.0f)*5.0f);
     
     float x1 = CX + cos(angle) * radius;
     float y1 = CY + sin(angle) * radius;
     float x2 = CX + cos(angle) * (radius + val);
     float y2 = CY + sin(angle) * (radius + val);
     
     uint16_t col = lerpColor(COL_PINK, COL_PURPLE, (float)i/bars);
     spr.drawLine((int)x1, (int)y1, (int)x2, (int)y2, col);
     spr.drawLine((int)x1+1, (int)y1+1, (int)x2+1, (int)y2+1, col); 
  }
  drawGlow(CX, CY, 25 + sin(g_phase*5.0f)*5.0f, COL_PINK, 15);
  spr.fillCircle(CX, CY, 20 + sin(g_phase*5.0f)*5.0f, COL_WHITE);
}

void renderModeTimer() {
  int r = 80;
  int angleEnd = (int)((ms_time % 60000) / 60000.0f * 360.0f);
  
  spr.drawArc(CX, CY, r, r-5, 0, 360, rgb565(50, 50, 0));
  spr.drawArc(CX, CY, r, r-5, 0, angleEnd, COL_YELLOW);
  
  for(int i=0; i<12; i++) {
    float a = i * 30 * DEG_TO_RAD;
    spr.fillCircle(CX + cos(a)*(r+15), CY + sin(a)*(r+15), 3, COL_ORANGE);
  }
  
  spr.setFont(&fonts::FreeSans18pt7b);
  spr.setTextColor(COL_WHITE);
  spr.drawString("TIMER", CX, CY); 
}

void renderModeWeather() {
  drawGlow(CX, CY, 40, COL_YELLOW, 20);
  spr.fillCircle(CX, CY, 40, COL_YELLOW);
  drawSegmentedRing(CX, CY, 60, 4, 8, g_phase * 20.0f, 0.4f, COL_YELLOW);

  spr.setFont(&fonts::FreeSans12pt7b);
  spr.setTextColor(COL_BG); 
  spr.drawString("24 C", CX, CY);
}

void renderModePrint() {
  // 1. Cadre Klipper / CoreXY
  spr.drawRect(CX - 70, CY - 50, 140, 120, rgb565(40, 45, 50));
  
  // Axe X mobile (Gantry)
  int currentY = CY + 30 - (int)(((sin(g_phase * 0.2f) + 1.0f) / 2.0f) * 60.0f); 
  spr.drawFastHLine(CX - 68, currentY - 20, 136, rgb565(70, 75, 80));

  // 2. Plateau chauffant avec effet thermique
  int bedY = CY + 40;
  drawGlow(CX, bedY, 50, COL_RED, 10);
  spr.fillRect(CX - 60, bedY, 120, 6, rgb565(120, 120, 120));

  // 3. Rendu d'objet par couches striées (Slicer effect)
  for (int y = bedY - 2; y >= currentY; y -= 3) {
      spr.drawFastHLine(CX - 25, y, 50, COL_GREEN);
  }

  // 4. Bloc Hotend / Buse
  float nozzleX = CX + sin(g_phase * 2.5f) * 35.0f; // Balayage fluide X
  spr.fillRect(nozzleX - 10, currentY - 25, 20, 15, rgb565(180, 180, 190)); // Radiateur
  spr.fillTriangle(nozzleX - 4, currentY - 10, nozzleX + 4, currentY - 10, nozzleX, currentY, COL_ORANGE); // Buse
  spr.drawLine(nozzleX, CY - 50, nozzleX, currentY - 25, COL_WHITE); // Filament PTFE

  // 5. Télémétrie HUD
  spr.setFont(&fonts::FreeSans9pt7b);
  spr.setTextDatum(ML_DATUM);
  spr.setTextColor(COL_ORANGE);
  spr.drawString("T: 220C", CX - 65, CY - 65);
  
  spr.setTextDatum(MR_DATUM);
  spr.setTextColor(COL_RED);
  spr.drawString("B: 60C", CX + 65, CY - 65);

  spr.setTextDatum(MC_DATUM);
  spr.setTextColor(COL_CYAN);
  int percent = (int)(((sin(g_phase * 0.2f) + 1.0f) / 2.0f) * 100);
  spr.drawString(String(percent) + "%", CX, CY + 60);
}

void renderModeMatrix() {
  spr.setFont(&fonts::FreeSans12pt7b);
  spr.setTextColor(COL_GREEN); 
  for(int i=0; i<18; i++) {
      int x = (i * 20) % 240;
      int y = ((ms_time/15 + i*40) % 240);
      spr.drawString(String((char)('0' + rand()%2)), x, y);
  }
}

void renderModeGhost() {
  spr.fillCircle(CX, CY, 55 + sin(g_phase)*5, COL_DARK);
  spr.drawArc(CX, CY, 110, 108, 0, 360, rgb565(30,30,30));
  for(int x=-60; x<60; x+=3) {
      int y = CY + sin(x*0.2f + g_phase)*15;
      spr.drawPixel(CX+x, y, COL_GREY);
  }
}

void renderModeError() {
  int shiftX = (rand()%10) - 5;
  int shiftY = (rand()%10) - 5;
  spr.setFont(&fonts::FreeSans18pt7b);
  spr.setTextColor(COL_RED); 
  spr.drawString("ERROR", CX + shiftX, CY + shiftY);
  
  for(int i=0; i<8; i++) {
    int y = rand() % 240;
    spr.fillRect(0, y, 240, 4, rgb565(150,0,0));
  }
}

void renderModeSuccess() {
  drawSegmentedRing(CX, CY, 85, 4, 1, 0, 0, COL_GREEN);
  spr.drawLine(CX-30, CY, CX-5, CY+25, COL_GREEN);
  spr.drawLine(CX-29, CY, CX-4, CY+25, COL_WHITE);
  spr.drawLine(CX-5, CY+25, CX+40, CY-30, COL_GREEN);
  spr.drawLine(CX-4, CY+25, CX+41, CY-30, COL_WHITE);
}

void renderDefaultLocked() {
  drawSegmentedRing(CX, CY, 100, 5, 4, g_phase*50.0f, 0.2f, dyn_color);
  drawSegmentedRing(CX, CY, 80, 3, 8, -g_phase*70.0f, 0.4f, COL_WHITE);
  spr.setFont(&fonts::FreeSans12pt7b);
  spr.setTextColor(COL_WHITE);
  spr.drawString("LOCKED", CX, CY);
}

// ================== MOTEUR DE DESSIN PRINCIPAL ==================
void draw() {
  spr.fillScreen(COL_BG); 

  renderPersistentHUD();

  switch (g_state) {
    case OrbState::IDLE:
    case OrbState::LISTENING:
    case OrbState::SPEAKING:  renderCoreJarvis(); break;
    case OrbState::MODE_SYSTEM: renderModeSystem(); break;
    case OrbState::MODE_VISION: renderModeVision(); break;
    case OrbState::MODE_HOME:   renderModeHome(); break;
    case OrbState::MODE_GHOST:  renderModeGhost(); break;
    case OrbState::ERROR:       renderModeError(); break;
    case OrbState::MODE_SUCCESS:renderModeSuccess(); break;
    case OrbState::MODE_MEDIA:  renderModeMedia(); break;
    case OrbState::MODE_WEATHER:renderModeWeather(); break;
    case OrbState::MODE_TIMER:  renderModeTimer(); break;
    case OrbState::MODE_PRINT:  renderModePrint(); break;
    case OrbState::MODE_MATRIX: renderModeMatrix(); break;
    default:                    renderDefaultLocked(); break;
  }

  spr.pushSprite(0, 0);
}

// ================== BOOT & LOOP ==================
void setup() {
  Serial.begin(115200);
  delay(200); 
  
  display.init();
  display.setRotation(0); 

  spr.createSprite(240, 240);
  spr.setSwapBytes(true); 
  
  Serial.println("JARVIS OS V4.1 - ONLINE");
}

void loop() {
  static String line;
  while (Serial.available()) {
    char c = (char)Serial.read();
    if (c == '\n') { handleLine(line); line = ""; }
    else if (c != '\r') { line += c; if (line.length() > 200) line = ""; }
  }
  
  uint32_t now = millis();
  if (now - g_lastFrame >= 16) {
    ms_time = now;
    g_lastFrame = now;
    
    updateLogic();
    draw();
  }
}