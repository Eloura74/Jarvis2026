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

#ifndef MC_DATUM
#define ML_DATUM 3
#define MC_DATUM 4
#define MR_DATUM 5
#endif

// ==============================================================================
// 🌟 JARVIS OS - CORE RENDERER V6.7 (ESP32-S3 + GC9A01)
// ------------------------------------------------------------------------------
// Moteur 3D Haute Densité avec Z-Sorting en 2 passes (Vrai effet de profondeur).
// Génération de vagues organiques lissées façon WebGL.
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

LGFX display;
static lgfx::LGFX_Sprite spr(&display); 

// ================== ÉTATS ET DONNÉES GLOBAUX ==================
enum class OrbState : uint8_t { 
  IDLE, LISTENING, SPEAKING, ERROR,
  MODE_WEATHER, MODE_HOME, MODE_SYSTEM, MODE_MATRIX, MODE_SEARCH,
  MODE_MEDIA, MODE_TIMER, MODE_PRINT, MODE_NOTIFICATION, MODE_SUCCESS,
  MODE_APPS, MODE_VISION, MODE_GHOST, MODE_SECURITY, MODE_SCREENSAVER
};

struct JarvisState {
    OrbState currentState = OrbState::IDLE;
    char textLabel[64] = "STANDBY";
    portMUX_TYPE spinlock = portMUX_INITIALIZER_UNLOCKED; 
};

JarvisState jarvisData;

const int CX = 120;
const int CY = 120;
static float g_phase = 0.0f;
static uint32_t ms_time = 0;

// ================== MOTEUR 3D & BUFFER ==================
struct Point3D { float x, y, z; };
struct ProjPoint { int x, y; float z; }; // Stockage pour le tri Z

const int SPHERE_NODES = 600; // Légèrement réduit pour aérer la géométrie 3D
Point3D sphereBase[SPHERE_NODES]; 
ProjPoint renderBuffer[SPHERE_NODES]; // Buffer global pour les 2 passes de dessin

void init3DGeometry() {
    float phi = PI * (3.0f - sqrt(5.0f)); 
    for (int i = 0; i < SPHERE_NODES; i++) {
        float y = 1.0f - (i / (float)(SPHERE_NODES - 1)) * 2.0f; 
        float radius = sqrt(1.0f - y * y); 
        float theta = phi * i;
        
        sphereBase[i].x = cos(theta) * radius;
        sphereBase[i].y = y;
        sphereBase[i].z = sin(theta) * radius;
    }
}

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

// Palette Couleurs Optimisée (Contraste maximal)
const uint16_t COL_CYAN      = rgb565(0, 240, 255);
const uint16_t COL_BLUE      = rgb565(0, 100, 255);
const uint16_t COL_OMNI_BLUE = rgb565(0, 140, 255);   
const uint16_t COL_OMNI_RED  = rgb565(255, 10, 30);   
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
const uint16_t COL_BG        = rgb565(2, 3, 5); // Faux noir (abyssal)

// Variables dynamiques 
float dyn_radius = 65.0f;
float dyn_speed = 0.05f;
uint16_t dyn_color = COL_OMNI_BLUE;

// ================== CORE 0 : PARSEUR SÉRIE ==================
static void setStateFromStr(String s) {
  s.trim(); 
  s.toUpperCase();

  OrbState newState = jarvisData.currentState;

  if (s == "IDLE" || s == "STANDBY") newState = OrbState::IDLE;
  else if (s == "LISTENING") newState = OrbState::LISTENING;
  else if (s == "SPEAKING" || s == "RECEIVING") newState = OrbState::SPEAKING;
  else if (s == "ERROR") newState = OrbState::ERROR;
  else if (s == "WEATHER") newState = OrbState::MODE_WEATHER;
  else if (s == "HOME") newState = OrbState::MODE_HOME;
  else if (s == "SYSTEM") newState = OrbState::MODE_SYSTEM;
  else if (s == "MATRIX") newState = OrbState::MODE_MATRIX;
  else if (s == "SEARCH") newState = OrbState::MODE_SEARCH;
  else if (s == "MEDIA") newState = OrbState::MODE_MEDIA;
  else if (s == "TIMER") newState = OrbState::MODE_TIMER;
  else if (s == "PRINT") newState = OrbState::MODE_PRINT;
  else if (s == "NOTIF") newState = OrbState::MODE_NOTIFICATION;
  else if (s == "SUCCESS") newState = OrbState::MODE_SUCCESS;
  else if (s == "APPS") newState = OrbState::MODE_APPS;
  else if (s == "VISION") newState = OrbState::MODE_VISION;
  else if (s == "GHOST") newState = OrbState::MODE_GHOST;
  else if (s == "SECURITY") newState = OrbState::MODE_SECURITY;
  
  portENTER_CRITICAL(&jarvisData.spinlock);
  if (jarvisData.currentState != newState) {
    jarvisData.currentState = newState;
    if (newState != OrbState::SPEAKING && newState != OrbState::LISTENING && newState != OrbState::IDLE) {
      strcpy(jarvisData.textLabel, "");
    }
  }
  portEXIT_CRITICAL(&jarvisData.spinlock);
}

static void handleLine(String line) {
  line.trim();
  if (!line.length()) return;
  if (line == "PING") { Serial.println("PONG"); return; }
  
  if (line.startsWith("STATE ") || line.startsWith("MODE ")) { 
    int spaceIndex = line.indexOf(' ');
    if (spaceIndex != -1) {
       String s = line.substring(spaceIndex + 1); 
       setStateFromStr(s);
       Serial.println("OK MODE");
    }
    return;
  }
  
  if (line.startsWith("TEXT ")) {
    String msg = line.substring(5);
    msg.trim();
    if (msg.length() > 63) msg = msg.substring(0, 63);
    
    portENTER_CRITICAL(&jarvisData.spinlock);
    msg.toCharArray(jarvisData.textLabel, sizeof(jarvisData.textLabel));
    portEXIT_CRITICAL(&jarvisData.spinlock);
    
    Serial.println("OK TEXT");
    return;
  }
}

void commTask(void *pvParameters) {
  Serial.println("[Core 0] Tâche UART prête.");
  String line; 
  line.reserve(256); 
  for (;;) {
    while (Serial.available()) {
      char c = (char)Serial.read();
      if (c == '\n') { handleLine(line); line = ""; }
      else if (c != '\r') { line += c; if (line.length() > 200) line = ""; }
    }
    vTaskDelay(pdMS_TO_TICKS(10));
  }
}

// ================== CORE 1 : MOTEUR GRAPHIQUE ==================
static OrbState local_state = OrbState::IDLE;
static char local_text[64] = "STANDBY";
static unsigned long idleStartTime = 0; // Timer pour le screensaver

void drawGlow(int x, int y, int radius, uint16_t color, int intensity) {
  for (int r = radius + intensity; r > radius; r -= 2) {
    float factor = 1.0f - ((float)(r - radius) / intensity);
    uint16_t fadeCol = lerpColor(COL_BG, color, factor * factor); 
    spr.drawCircle(x, y, r, fadeCol);
  }
}

void drawRadialBackground() {
  // Fond affiné : chute très abrupte vers le noir (factor au cube) pour un max de contraste 3D
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

void drawSegmentedRing(int x, int y, int r, int thickness, int segments, float phase, float gapRatio, uint16_t color) {
  float angleStep = 360.0f / segments;
  float gap = angleStep * gapRatio;
  for (int i = 0; i < segments; i++) {
    float startAngle = i * angleStep + phase;
    float endAngle = startAngle + angleStep - gap;
    spr.drawArc(x, y, r, r - thickness, startAngle, endAngle, color);
  }
}

void updateLogic() {
  portENTER_CRITICAL(&jarvisData.spinlock);
  OrbState previous_state = local_state;
  local_state = jarvisData.currentState;
  strncpy(local_text, jarvisData.textLabel, sizeof(local_text));
  portEXIT_CRITICAL(&jarvisData.spinlock);

  // Gestion du Screensaver
  if (local_state == OrbState::IDLE) {
    if (previous_state != OrbState::IDLE && previous_state != OrbState::MODE_SCREENSAVER) {
      idleStartTime = millis(); // Reset timer quand on repasse en IDLE depuis un autre état actif
    } else if (millis() - idleStartTime > 30000) {
      local_state = OrbState::MODE_SCREENSAVER; // Force localement le rendu Screensaver après 30s
    }
  } else {
    idleStartTime = millis(); // Reset si on n'est ni en IDLE ni en SCREENSAVER
  }

  float target_radius = 65.0f;
  float target_speed = 0.03f;
  uint16_t target_color = COL_OMNI_BLUE;

  if (local_state == OrbState::SPEAKING) {
      target_radius = 75.0f + (sin(g_phase * 1.5f) * 12.0f); 
      target_speed = 0.08f; 
      target_color = COL_OMNI_RED; 
  } else if (local_state == OrbState::LISTENING) {
      target_radius = 70.0f + (sin(g_phase * 0.8f) * 6.0f); 
      target_speed = 0.04f; 
      target_color = COL_CYAN; 
  } else if (local_state == OrbState::IDLE) {
      target_radius = 65.0f + (sin(g_phase * 0.5f) * 3.0f); 
      target_speed = 0.02f; 
      target_color = COL_OMNI_BLUE; 
  } else {
      switch (local_state) {
        case OrbState::ERROR:     target_radius = 20.0f; target_speed = 0.0f;  target_color = COL_RED; break;
        case OrbState::MODE_HOME: target_radius = 0.0f;  target_speed = 0.08f; target_color = COL_BLUE; break;
        case OrbState::MODE_VISION:target_radius= 0.0f;  target_speed = 0.10f; target_color = COL_RED; break;
        case OrbState::MODE_GHOST: target_radius= 10.0f; target_speed = 0.01f; target_color = COL_GREY; break;
        case OrbState::MODE_MEDIA: target_radius= 20.0f; target_speed = 0.10f; target_color = COL_PINK; break;
        case OrbState::MODE_SUCCESS:target_radius=0.0f;  target_speed = 0.05f; target_color = COL_GREEN; break;
        case OrbState::MODE_SCREENSAVER: target_radius= 0.0f; target_speed = 0.015f; target_color = COL_CYAN; break;
        default:                  target_radius = 30.0f; target_speed = 0.05f; target_color = COL_CYAN; break;
      }
  }

  dyn_radius += (target_radius - dyn_radius) * 0.1f;
  dyn_speed += (target_speed - dyn_speed) * 0.05f;
  dyn_color = lerpColor(dyn_color, target_color, 0.15f); 
  g_phase += dyn_speed;
}

// -----------------------------------------------------------
// LE RENDU OMNI 3D CORRECTIF (Z-Sorting 2 Passes + Cercles de Profondeur)
// -----------------------------------------------------------
void renderOmniSphere() {
  drawRadialBackground(); 
  drawGlow(CX, CY, dyn_radius * 0.85f, dyn_color, 25);

  float rotY = g_phase * 1.5f; 
  float rotX = sin(g_phase * 0.4f) * 0.4f; 
  
  float cosY = cos(rotY), sinY = sin(rotY);
  float cosX = cos(rotX), sinX = sin(rotX);

  // Mathématique des ondes adoucie pour un look "liquide"
  float freq = (local_state == OrbState::SPEAKING) ? 3.5f : 2.0f; // Vagues plus denses quand elle parle
  float waveAmplitude = (local_state == OrbState::SPEAKING) ? 0.30f : 0.12f;
  float pulsePhase = g_phase * 2.5f;

  // ETAPE 1 : Calcul des coordonnées et projection 3D -> 2D
  for (int i = 0; i < SPHERE_NODES; i++) {
      float bx = sphereBase[i].x;
      float by = sphereBase[i].y;
      float bz = sphereBase[i].z;

      // Génération du bruit 3D lissé
      float n1 = sin(bx * freq + pulsePhase) * cos(by * freq - pulsePhase);
      float n2 = sin(bz * (freq * 1.2f) - pulsePhase * 1.2f);
      float noise = (n1 + n2) * waveAmplitude;
      
      float r = dyn_radius * (1.0f + noise);

      float x = bx * r;
      float y = by * r;
      float z = bz * r;

      // Matrice de Rotation
      float x_rot = x * cosY - z * sinY;
      float z_rot = x * sinY + z * cosY;
      float y_rot = y * cosX - z_rot * sinX;
      z_rot = y * sinX + z_rot * cosX;

      float perspective = 200.0f / (200.0f + z_rot);
      renderBuffer[i].x = CX + (int)(x_rot * perspective);
      renderBuffer[i].y = CY + (int)(y_rot * perspective);
      renderBuffer[i].z = z_rot;
  }

  // ETAPE 2 : Rendu des points ARRIÈRE (Z > 0). Ils sont cachés derrière la masse.
  uint16_t backCol = lerpColor(COL_BG, dyn_color, 0.2f); // Couleur très sombre
  for (int i = 0; i < SPHERE_NODES; i++) {
      if (renderBuffer[i].z > 0.0f) {
          spr.drawPixel(renderBuffer[i].x, renderBuffer[i].y, backCol);
      }
  }

  // ETAPE 3 : Rendu des points AVANT (Z <= 0). Dessinés au-dessus pour occulter l'arrière.
  for (int i = 0; i < SPHERE_NODES; i++) {
      if (renderBuffer[i].z <= 0.0f) {
          float depth = abs(renderBuffer[i].z) / dyn_radius; // 0.0 (Bord) à 1.0 (Nez face caméra)
          if (depth > 1.0f) depth = 1.0f;
          
          uint16_t frontCol = lerpColor(dyn_color, COL_WHITE, depth * 0.8f);

          // Le "Depth-Cueing" géométrique : la particule grossit si elle s'approche de l'écran.
          if (depth > 0.65f) {
              spr.fillCircle(renderBuffer[i].x, renderBuffer[i].y, 2, frontCol);
          } else if (depth > 0.25f) {
              spr.fillCircle(renderBuffer[i].x, renderBuffer[i].y, 1, frontCol);
          } else {
              spr.drawPixel(renderBuffer[i].x, renderBuffer[i].y, frontCol);
          }
      }
  }

  // Interface de l'œil central par-dessus la 3D
  spr.drawCircle(CX, CY, 16, rgb565(20, 50, 80)); 
  spr.drawFastHLine(CX - 5, CY - 4, 11, COL_WHITE);
  spr.drawFastHLine(CX - 5, CY,     11, COL_WHITE);
  spr.drawFastHLine(CX - 5, CY + 4, 11, COL_WHITE);
}

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
  spr.setTextColor(dyn_color); // Sans fond noir
  spr.setFont(&fonts::FreeSans9pt7b); 
  spr.drawString(local_text, CX - (spr.textWidth(local_text) / 2), 210); 
}

void renderModeSystem() {
  drawSegmentedRing(CX, CY, 110, 8, 8, g_phase * 50.0f, 0.1f, COL_CYAN);
  drawSegmentedRing(CX, CY, 95, 2, 36, -g_phase * 80.0f, 0.5f, COL_BLUE);
  spr.setFont(&fonts::FreeSans12pt7b); spr.setTextColor(COL_WHITE); 
  spr.drawString("SYS.OPT", CX - (spr.textWidth("SYS.OPT")/2), CY - 25);
  int load = 40 + sin(g_phase*5.0f)*20;
  spr.drawRect(CX - 40, CY, 80, 12, COL_CYAN); spr.fillRect(CX - 38, CY + 2, (76 * load)/100, 8, COL_CYAN);
  spr.setFont(&fonts::FreeSans9pt7b); spr.setTextColor(COL_GREEN); 
  spr.drawString("RAM: 1.2G", CX - (spr.textWidth("RAM: 1.2G")/2), CY + 30);
}

void renderModeVision() {
  for(int i=-120; i<=120; i+=25) {
     spr.drawFastVLine(CX+i, 0, 240, rgb565(40,0,0)); spr.drawFastHLine(0, CY+i, 240, rgb565(40,0,0));
  }
  int tr = 90 + sin(g_phase*10.0f)*5;
  spr.drawLine(CX-tr, CY-tr/2, CX-tr, CY-tr, COL_RED); spr.drawLine(CX-tr, CY-tr, CX-tr/2, CY-tr, COL_RED);
  spr.drawLine(CX+tr, CY-tr/2, CX+tr, CY-tr, COL_RED); spr.drawLine(CX+tr, CY-tr, CX+tr/2, CY-tr, COL_RED);
  spr.drawLine(CX-tr, CY+tr/2, CX-tr, CY+tr, COL_RED); spr.drawLine(CX-tr, CY+tr, CX-tr/2, CY+tr, COL_RED);
  spr.drawLine(CX+tr, CY+tr/2, CX+tr, CY+tr, COL_RED); spr.drawLine(CX+tr, CY+tr, CX+tr/2, CY+tr, COL_RED);
  int scanY = CY + sin(g_phase * 4.0f) * 115;
  spr.fillRect(CX-110, scanY-2, 220, 4, COL_RED);
  spr.setFont(&fonts::FreeSans9pt7b); spr.setTextColor(COL_RED); 
  spr.drawString("AI_LOCK", CX - (spr.textWidth("AI_LOCK")/2), CY - 40);
}

void renderModeHome() {
  spr.drawArc(CX, CY, 50, 49, 0, 360, COL_BLUE); spr.drawArc(CX, CY, 100, 99, 0, 360, COL_BLUE);
  float scanA = g_phase * 2.0f;
  spr.fillTriangle(CX, CY, CX + cos(scanA)*120, CY + sin(scanA)*120, CX + cos(scanA - 0.2f)*120, CY + sin(scanA - 0.2f)*120, rgb565(0, 50, 100));
  spr.drawLine(CX, CY, CX + cos(scanA)*120, CY + sin(scanA)*120, COL_CYAN);
  struct Pt { float a; float d; const char* nm; };
  Pt nodes[] = { {0.5, 55, "LIV"}, {2.1, 95, "KIT"}, {4.8, 80, "BED"} };
  spr.setFont(&fonts::FreeSans9pt7b);
  for(int i=0; i<3; i++) {
      float x = CX + cos(nodes[i].a)*nodes[i].d; float y = CY + sin(nodes[i].a)*nodes[i].d;
      spr.fillCircle(x, y, 4, COL_CYAN); spr.setTextColor(COL_WHITE); spr.drawString(nodes[i].nm, x, y - 15);
  }
}

void renderModeMedia() {
  int bars = 45; float radius = 55;
  for (int i = 0; i < bars; i++) {
     float angle = (i * 360.0f / bars) * DEG_TO_RAD + g_phase;
     float val = 10 + abs(sin(g_phase * 4.0f + i * 0.4f) * 45.0f) + (sin(i*132.0f)*5.0f);
     uint16_t col = lerpColor(COL_PINK, COL_PURPLE, (float)i/bars);
     spr.drawLine(CX + cos(angle)*radius, CY + sin(angle)*radius, CX + cos(angle)*(radius+val), CY + sin(angle)*(radius+val), col);
     spr.drawLine(CX + cos(angle)*radius+1, CY + sin(angle)*radius+1, CX + cos(angle)*(radius+val)+1, CY + sin(angle)*(radius+val)+1, col); 
  }
  drawGlow(CX, CY, 25 + sin(g_phase*5.0f)*5.0f, COL_PINK, 15);
  spr.fillCircle(CX, CY, 20 + sin(g_phase*5.0f)*5.0f, COL_WHITE);
}

void renderModeTimer() {
  int r = 80; int angleEnd = (int)((ms_time % 60000) / 60000.0f * 360.0f);
  spr.drawArc(CX, CY, r, r-5, 0, 360, rgb565(50, 50, 0)); spr.drawArc(CX, CY, r, r-5, 0, angleEnd, COL_YELLOW);
  for(int i=0; i<12; i++) {
    float a = i * 30 * DEG_TO_RAD; spr.fillCircle(CX + cos(a)*(r+15), CY + sin(a)*(r+15), 3, COL_ORANGE);
  }
  spr.setFont(&fonts::FreeSans18pt7b); spr.setTextColor(COL_WHITE); 
  spr.drawString("TIMER", CX - (spr.textWidth("TIMER")/2), CY); 
}

void renderModeWeather() {
  drawGlow(CX, CY, 40, COL_YELLOW, 20); spr.fillCircle(CX, CY, 40, COL_YELLOW);
  drawSegmentedRing(CX, CY, 60, 4, 8, g_phase * 20.0f, 0.4f, COL_YELLOW);
  spr.setFont(&fonts::FreeSans12pt7b); spr.setTextColor(COL_BG); 
  
  // Dynamic text centering based on local_text instead of hardcoded '24 C'
  int textWidth = spr.textWidth(local_text);
  spr.drawString(local_text, CX - (textWidth/2), CY - 10);
}

void renderModePrint() {
  spr.drawRect(CX - 70, CY - 50, 140, 120, rgb565(40, 45, 50));
  int currentY = CY + 30 - (int)(((sin(g_phase * 0.2f) + 1.0f) / 2.0f) * 60.0f); 
  spr.drawFastHLine(CX - 68, currentY - 20, 136, rgb565(70, 75, 80));
  int bedY = CY + 40; drawGlow(CX, bedY, 50, COL_RED, 10); spr.fillRect(CX - 60, bedY, 120, 6, rgb565(120, 120, 120));
  for (int y = bedY - 2; y >= currentY; y -= 3) { spr.drawFastHLine(CX - 25, y, 50, COL_GREEN); }
  float nozzleX = CX + sin(g_phase * 2.5f) * 35.0f;
  spr.fillRect(nozzleX - 10, currentY - 25, 20, 15, rgb565(180, 180, 190));
  spr.fillTriangle(nozzleX - 4, currentY - 10, nozzleX + 4, currentY - 10, nozzleX, currentY, COL_ORANGE); 
  spr.drawLine(nozzleX, CY - 50, nozzleX, currentY - 25, COL_WHITE); 

  // Parse local_text: "T|B|P" e.g "220|60|45"
  String text = String(local_text);
  String t = "--"; String b = "--"; String p = "--";
  if (text.length() > 0 && text.indexOf('|') != -1) {
    int firstPipe = text.indexOf('|');
    int secondPipe = text.indexOf('|', firstPipe + 1);
    if (firstPipe != -1 && secondPipe != -1) {
      t = text.substring(0, firstPipe);
      b = text.substring(firstPipe + 1, secondPipe);
      p = text.substring(secondPipe + 1);
    }
  } else if (text == "FLOTTE") {
    t = "N/A"; b = "N/A"; p = "FLOTTE";
  }
  
  spr.setFont(&fonts::FreeSans9pt7b); spr.setTextColor(COL_ORANGE); 
  spr.drawString("T: " + t + "C", CX - 65, CY - 65); 
  spr.setTextColor(COL_RED); 
  spr.drawString("B: " + b + "C", CX + 15, CY - 65); 
  
  spr.setTextColor(COL_CYAN);
  String pc = p;
  if (p != "--" && p != "FLOTTE") pc += "%";
  spr.drawString(pc, CX - (spr.textWidth(pc.c_str())/2), CY + 60);
}

void renderModeMatrix() {
  spr.setFont(&fonts::FreeSans12pt7b); spr.setTextColor(COL_GREEN); 
  for(int i=0; i<18; i++) {
      int x = (i * 20) % 240; int y = ((ms_time/15 + i*40) % 240);
      spr.drawString(String((char)('0' + rand()%2)), x, y);
  }
}

void renderModeScreensaver() {
  // Screensaver extrêmement zen : un petit cercle très lent au centre, presque éteint, sans HUD
  float s_phase = g_phase * 0.3f;
  float pulse = (sin(s_phase) + 1.0f) * 0.5f; // 0 à 1
  uint16_t calmColor = lerpColor(COL_BG, COL_CYAN, 0.15f + pulse * 0.1f);
  
  // Quelques étoiles lointaines qui tournent doucement
  for (int i=0; i<8; i++) {
    float a = i * 45 * DEG_TO_RAD + (s_phase * 0.5f);
    float r = 70 + sin(a * 3 + s_phase) * 15;
    spr.drawPixel(CX + cos(a)*r, CY + sin(a)*r, rgb565(30, 50, 70));
  }
  
  // Halo central très doux
  drawGlow(CX, CY, 15 + pulse * 10, calmColor, 20);
  spr.drawCircle(CX, CY, 15 + pulse * 10, lerpColor(calmColor, COL_WHITE, 0.2f));
}

void renderModeGhost() {
  spr.fillCircle(CX, CY, 55 + sin(g_phase)*5, COL_DARK); spr.drawArc(CX, CY, 110, 108, 0, 360, rgb565(30,30,30));
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
}

void renderTask(void *pvParameters) {
  uint32_t lastFrame = 0;
  for (;;) {
    uint32_t now = millis();
    if (now - lastFrame >= 16) {
      ms_time = now;
      lastFrame = now;
      
      updateLogic();
      
      spr.fillScreen(COL_BG); 
      
      switch (local_state) { 
        case OrbState::IDLE:
        case OrbState::LISTENING:
        case OrbState::SPEAKING:  renderOmniSphere(); break;
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
        case OrbState::MODE_SCREENSAVER: renderModeScreensaver(); break;
        default:                    renderDefaultLocked(); break;
      }
      
      if (local_state != OrbState::MODE_SCREENSAVER) {
         renderPersistentHUD();
      }
      spr.pushSprite(0, 0);
    }
    vTaskDelay(pdMS_TO_TICKS(1)); 
  }
}

// ================== BOOTSTRAPPER ==================
void setup() {
  Serial.begin(115200);
  delay(200); 
  
  display.init();
  display.setRotation(0); 
  spr.createSprite(240, 240);
  spr.setSwapBytes(true); 
  
  init3DGeometry(); 
  Serial.println("JARVIS OS V6.7 - DEEP Z-SORTING ENGINE ONLINE");

  xTaskCreatePinnedToCore(commTask, "CommTask", 4096, NULL, 1, NULL, 0);
  xTaskCreatePinnedToCore(renderTask, "RenderTask", 8192, NULL, 2, NULL, 1);
}

void loop() { vTaskDelay(portMAX_DELAY); }