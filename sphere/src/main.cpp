#include <Arduino.h>
#include <WString.h>
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
// 🌟 JARVIS OS - CORE RENDERER V7.2 (ESP32-S3 + GC9A01)
// ------------------------------------------------------------------------------
// Rendu optimisé : Thermal-control (30 FPS, 450 nodes), Screensaver organique,
// Design épuré (retrait du menu central), API LovyanGFX standard.
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
  MODE_APPS, MODE_VISION, MODE_GHOST, MODE_SECURITY, MODE_SCREENSAVER, MODE_WHATSAPP
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
struct ProjPoint { int x, y; float z; };

// OPTIMISATION THERMIQUE : Réduction des nœuds pour soulager la FPU
const int SPHERE_NODES = 450; 
Point3D sphereBase[SPHERE_NODES]; 
ProjPoint renderBuffer[SPHERE_NODES]; 

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

// Palette Couleurs 
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

// Variables dynamiques et vélocités
float dyn_radius = 65.0f;
float v_radius = 0.0f;
float dyn_speed = 0.05f;
float v_speed = 0.0f;
uint16_t dyn_color = COL_OMNI_BLUE;

// ================== CORE 0 : PARSEUR SÉRIE ==================
static void setStateFromStr(const char* s_ptr) {
  String s = String(s_ptr);
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
  else if (s == "WHATSAPP") newState = OrbState::MODE_WHATSAPP;
  
  portENTER_CRITICAL(&jarvisData.spinlock);
  if (jarvisData.currentState != newState) {
    jarvisData.currentState = newState;
    if (newState != OrbState::SPEAKING && newState != OrbState::LISTENING && newState != OrbState::IDLE) {
      strcpy(jarvisData.textLabel, "");
    }
  }
  portEXIT_CRITICAL(&jarvisData.spinlock);
}

static void handleLine(const char* line) {
  if (strlen(line) == 0) return;
  if (strcmp(line, "PING") == 0) { Serial.println("PONG"); return; }
  
  if (strncmp(line, "STATE ", 6) == 0 || strncmp(line, "MODE ", 5) == 0) { 
    const char* s = strchr(line, ' ');
    if (s != nullptr) {
       setStateFromStr(s + 1); // Pass raw C-string and let constructor convert
       Serial.println("OK MODE");
    }
    return;
  }
  
  if (strncmp(line, "TEXT ", 5) == 0) {
    portENTER_CRITICAL(&jarvisData.spinlock);
    strncpy(jarvisData.textLabel, line + 5, sizeof(jarvisData.textLabel) - 1);
    jarvisData.textLabel[sizeof(jarvisData.textLabel) - 1] = '\0';
    portEXIT_CRITICAL(&jarvisData.spinlock);
    Serial.println("OK TEXT");
    return;
  }
}

void commTask(void *pvParameters) {
  Serial.println("[Core 0] Tâche UART prête.");
  char buffer[256];
  uint16_t bufferIdx = 0;
  
  for (;;) {
    while (Serial.available()) {
      char c = (char)Serial.read();
      if (c == '\n') { 
        buffer[bufferIdx] = '\0'; 
        handleLine(buffer); 
        bufferIdx = 0; 
      }
      else if (c != '\r' && bufferIdx < sizeof(buffer) - 1) { 
        buffer[bufferIdx++] = c; 
      }
    }
    vTaskDelay(pdMS_TO_TICKS(10));
  }
}

// ================== CORE 1 : MOTEUR GRAPHIQUE ==================
static OrbState local_state = OrbState::IDLE;
static char local_text[64] = "STANDBY";
static unsigned long idleStartTime = 0; 

void drawGlow(int x, int y, int radius, uint16_t color, int intensity) {
  for (int r = radius + intensity; r > radius; r -= 2) {
    float factor = 1.0f - ((float)(r - radius) / intensity);
    uint16_t fadeCol = lerpColor(COL_BG, color, factor * factor); 
    spr.drawCircle(x, y, r, fadeCol);
  }
}

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

void drawSegmentedRing(int x, int y, int r, int thickness, int segments, float phase, float gapRatio, uint16_t color) {
  float angleStep = 360.0f / segments;
  float gap = angleStep * gapRatio;
  for (int i = 0; i < segments; i++) {
    float startAngle = i * angleStep + phase;
    float endAngle = startAngle + angleStep - gap;
    spr.fillArc(x, y, r, r - thickness, startAngle, endAngle, color);
  }
}

void updateLogic() {
  portENTER_CRITICAL(&jarvisData.spinlock);
  OrbState previous_state = local_state;
  local_state = jarvisData.currentState;
  strncpy(local_text, jarvisData.textLabel, sizeof(local_text));
  portEXIT_CRITICAL(&jarvisData.spinlock);

  if (local_state == OrbState::IDLE) {
    if (previous_state != OrbState::IDLE && previous_state != OrbState::MODE_SCREENSAVER) {
      idleStartTime = millis(); 
    } else if (millis() - idleStartTime > 30000) {
      local_state = OrbState::MODE_SCREENSAVER; 
    }
  } else {
    idleStartTime = millis(); 
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
        case OrbState::MODE_WHATSAPP: target_radius= 10.0f; target_speed = 0.06f; target_color = COL_GREEN; break;
        default:                  target_radius = 30.0f; target_speed = 0.05f; target_color = COL_CYAN; break;
      }
  }

  float tension = 0.08f;  
  float dampening = 0.75f; 
  
  v_radius = (v_radius + (target_radius - dyn_radius) * tension) * dampening;
  dyn_radius += v_radius;

  v_speed = (v_speed + (target_speed - dyn_speed) * tension) * dampening;
  dyn_speed += v_speed;

  dyn_color = lerpColor(dyn_color, target_color, 0.15f); 
  g_phase += dyn_speed;
}

void renderOmniSphere() {
  drawRadialBackground(); 
  
  for (int r = (int)(dyn_radius * 0.85f) + 25; r > (int)(dyn_radius * 0.85f); r -= 3) {
    float factor = 1.0f - ((float)(r - dyn_radius * 0.85f) / 25.0f);
    uint16_t fadeCol = lerpColor(COL_BG, dyn_color, factor * factor); 
    spr.drawCircle(CX, CY, r, fadeCol); 
  }

  float rotY = g_phase * 1.5f; 
  float rotX = sin(g_phase * 0.4f) * 0.4f; 
  
  float cosY = cos(rotY), sinY = sin(rotY);
  float cosX = cos(rotX), sinX = sin(rotX);

  float freq = (local_state == OrbState::SPEAKING) ? 3.5f : 2.0f;
  float waveAmplitude = (local_state == OrbState::SPEAKING) ? 0.30f : 0.12f;
  float pulsePhase = g_phase * 2.5f;

  for (int i = 0; i < SPHERE_NODES; i++) {
      float bx = sphereBase[i].x;
      float by = sphereBase[i].y;
      float bz = sphereBase[i].z;

      float n1 = sin(bx * freq + pulsePhase) * cos(by * freq - pulsePhase);
      float n2 = sin(bz * (freq * 1.2f) - pulsePhase * 1.2f);
      float noise = (n1 + n2) * waveAmplitude;
      
      float r = dyn_radius * (1.0f + noise);

      float x = bx * r;
      float y = by * r;
      float z = bz * r;

      float x_rot = x * cosY - z * sinY;
      float z_rot = x * sinY + z * cosY;
      float y_rot = y * cosX - z_rot * sinX;
      z_rot = y * sinX + z_rot * cosX;

      float perspective = 200.0f / (200.0f + z_rot);
      renderBuffer[i].x = CX + (int)(x_rot * perspective);
      renderBuffer[i].y = CY + (int)(y_rot * perspective);
      renderBuffer[i].z = z_rot;
  }

  uint16_t backCol = lerpColor(COL_BG, dyn_color, 0.15f); 
  for (int i = 0; i < SPHERE_NODES; i++) {
      if (renderBuffer[i].z > 0.0f) {
          spr.fillCircle(renderBuffer[i].x, renderBuffer[i].y, 1, backCol);
      }
  }

  for (int i = 0; i < SPHERE_NODES; i++) {
      if (renderBuffer[i].z <= 0.0f) {
          float depth = abs(renderBuffer[i].z) / dyn_radius; 
          if (depth > 1.0f) depth = 1.0f;
          
          uint16_t baseCol = lerpColor(dyn_color, COL_WHITE, depth * 0.8f);

          float lightFactor = (float)(renderBuffer[i].y - CY) / dyn_radius; 
          if (lightFactor > 0.0f) {
              baseCol = lerpColor(baseCol, COL_BG, lightFactor * 0.6f);
          } else {
              baseCol = lerpColor(baseCol, COL_WHITE, abs(lightFactor) * 0.3f);
          }

          if (depth > 0.65f) {
              spr.fillCircle(renderBuffer[i].x, renderBuffer[i].y, 3, baseCol);
          } else if (depth > 0.25f) {
              spr.fillCircle(renderBuffer[i].x, renderBuffer[i].y, 2, baseCol);
          } else {
              spr.fillCircle(renderBuffer[i].x, renderBuffer[i].y, 1, baseCol);
          }
      }
  }
  
  // Le bloc d'interface central (menu burger) a été retiré ici pour un rendu pur.
}

void renderPersistentHUD() {
  spr.fillArc(CX, CY, 119, 118, 0, 360, COL_DEEP_BLUE);
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
  spr.setTextColor(dyn_color); 
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
  spr.fillArc(CX, CY, 50, 49, 0, 360, COL_BLUE); 
  spr.fillArc(CX, CY, 100, 99, 0, 360, COL_BLUE);
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
  spr.fillArc(CX, CY, r, r-5, 0, 360, rgb565(50, 50, 0)); 
  spr.fillArc(CX, CY, r, r-5, 0, angleEnd, COL_YELLOW);
  for(int i=0; i<12; i++) {
    float a = i * 30 * DEG_TO_RAD; spr.fillCircle(CX + cos(a)*(r+15), CY + sin(a)*(r+15), 3, COL_ORANGE);
  }
  spr.setFont(&fonts::FreeSans18pt7b); spr.setTextColor(COL_WHITE); 
  spr.drawString("TIMER", CX - (spr.textWidth("TIMER")/2), CY); 
}

void renderModeWeather() {
  drawGlow(CX, CY, 40, COL_YELLOW, 20); 
  spr.fillCircle(CX, CY, 40, COL_YELLOW);
  drawSegmentedRing(CX, CY, 60, 4, 8, g_phase * 20.0f, 0.4f, COL_YELLOW);
  spr.setFont(&fonts::FreeSans12pt7b); spr.setTextColor(COL_BG); 
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

  char t[16] = "--"; char b[16] = "--"; char p[16] = "--";
  if (strcmp(local_text, "FLOTTE") == 0) {
    strcpy(t, "N/A"); strcpy(b, "N/A"); strcpy(p, "FLOTTE");
  } else {
    const char* p1 = strchr(local_text, '|');
    if (p1) {
      const char* p2 = strchr(p1 + 1, '|');
      if (p2) {
        strncpy(t, local_text, p1 - local_text); t[p1 - local_text] = '\0';
        strncpy(b, p1 + 1, p2 - p1 - 1); b[p2 - p1 - 1] = '\0';
        strncpy(p, p2 + 1, sizeof(p) - 1);
      }
    }
  }

  char buf[32];
  spr.setFont(&fonts::FreeSans9pt7b); 
  
  spr.setTextColor(COL_ORANGE); 
  snprintf(buf, sizeof(buf), "T: %sC", t);
  spr.drawString(buf, CX - 65, CY - 65); 
  
  spr.setTextColor(COL_RED); 
  snprintf(buf, sizeof(buf), "B: %sC", b);
  spr.drawString(buf, CX + 15, CY - 65); 
  
  spr.setTextColor(COL_CYAN);
  if (strcmp(p, "--") != 0 && strcmp(p, "FLOTTE") != 0) {
      snprintf(buf, sizeof(buf), "%s%%", p);
  } else {
      snprintf(buf, sizeof(buf), "%s", p);
  }
  spr.drawString(buf, CX - (spr.textWidth(buf)/2), CY + 60);
}

void renderModeMatrix() {
  spr.setFont(&fonts::FreeSans12pt7b); spr.setTextColor(COL_GREEN); 
  for(int i=0; i<18; i++) {
      int x = (i * 20) % 240; int y = ((ms_time/15 + i*40) % 240);
      char cStr[2] = {(char)('0' + rand()%2), '\0'};
      spr.drawString(cStr, x, y);
  }
}

void renderModeScreensaver() {
  // 1. Noyau d'énergie central (identique à la vidéo cible)
  float corePulse = (sin(g_phase * 2.0f) + 1.0f) * 0.5f; 
  drawGlow(CX, CY, 15 + corePulse * 5, COL_OMNI_BLUE, 25);
  spr.fillCircle(CX, CY, 4 + corePulse * 2, COL_WHITE);
  spr.fillCircle(CX, CY, 6 + corePulse * 2, lerpColor(COL_CYAN, COL_BG, 0.6f));

  float R = 85.0f;          // Rayon de la sphère
  float tiltX = 0.35f;      // Inclinaison caméra (Pitch) pour voir le volume
  float cosX = cos(tiltX);
  float sinX = sin(tiltX);

  spr.drawCircle(CX, CY, R + 10, rgb565(5, 15, 25)); // Léger halo externe

  // 4 ondes x 110 points = 440 points (Rentrent dans le renderBuffer de 450 sans allocation)
  const int num_waves = 4;
  const int points_per_wave = 110; 

  // ETAPE 1 : Calcul et Projection Mathématique (Entrecroisement)
  int idx = 0;
  for (int w = 0; w < num_waves; w++) {
      float freq = 2.0f + (w * 1.5f);        // Fréquences différentes = entrelacement
      float speed = 0.8f + (w * 0.3f);       // Vitesses différentes
      if (w % 2 == 1) speed = -speed;        // Sens de rotation alterné
      
      float amp = 0.4f + (w * 0.1f);         // Amplitude de la vague (très haute)

      for (int i = 0; i < points_per_wave; i++) {
          float theta = (i / (float)points_per_wave) * 2.0f * PI; 
          float active_theta = theta + g_phase * speed; 

          // Formule clé : toutes les ondes oscillent autour de 0 (équateur)
          float phi = sin(theta * freq + g_phase * (speed * 1.5f)) * amp;

          // Sphérique vers Cartésien
          float bx = R * cos(phi) * cos(active_theta);
          float by = R * sin(phi);
          float bz = R * cos(phi) * sin(active_theta);

          // Application de la caméra
          float y = by * cosX - bz * sinX;
          float z = by * sinX + bz * cosX;
          float x = bx;

          // Projection Perspective
          float perspective = 200.0f / (200.0f + z);
          renderBuffer[idx].x = CX + (int)(x * perspective);
          renderBuffer[idx].y = CY + (int)(y * perspective);
          renderBuffer[idx].z = z;
          idx++;
      }
  }

  // ETAPE 2 : Rendu Arrière (Z > 0)
  // Dessin de pixels sombres isolés (pas de lignes) pour la face arrière, comme la vidéo
  uint16_t backCol = lerpColor(COL_BG, COL_BLUE, 0.3f);
  for (int i = 0; i < num_waves * points_per_wave; i++) {
      if (renderBuffer[i].z > 0) {
          spr.drawPixel(renderBuffer[i].x, renderBuffer[i].y, backCol);
      }
  }

  // ETAPE 3 : Rendu Avant (Z <= 0) - Création du ruban d'énergie dense
  for (int w = 0; w < num_waves; w++) {
      int offset = w * points_per_wave;
      for (int i = 0; i < points_per_wave; i++) {
          int current = offset + i;
          
          if (renderBuffer[current].z <= 0) {
              float depth = abs(renderBuffer[current].z) / R; 
              if (depth > 1.0f) depth = 1.0f;
              
              uint16_t c = lerpColor(COL_CYAN, COL_WHITE, depth);
              
              // Nœud épais
              if (depth > 0.6f) {
                  spr.fillCircle(renderBuffer[current].x, renderBuffer[current].y, 2, c);
              } else {
                  spr.fillCircle(renderBuffer[current].x, renderBuffer[current].y, 1, c);
              }

              // Connecter au point précédent pour créer le ruban d'énergie continu
              if (i > 0) {
                  int prev = current - 1;
                  // Si le point précédent est aussi devant, on trace la ligne
                  if (renderBuffer[prev].z <= 0) {
                      spr.drawLine(renderBuffer[prev].x, renderBuffer[prev].y, renderBuffer[current].x, renderBuffer[current].y, c);
                      // Doubler la ligne au centre pour accentuer l'épaisseur de la vague
                      if (depth > 0.5f) {
                          spr.drawLine(renderBuffer[prev].x, renderBuffer[prev].y+1, renderBuffer[current].x, renderBuffer[current].y+1, c);
                      }
                  }
              }
              // Relier la fin de la boucle au début pour fermer le ruban
              if (i == points_per_wave - 1) {
                  int prev = offset; 
                  if (renderBuffer[prev].z <= 0) {
                      spr.drawLine(renderBuffer[prev].x, renderBuffer[prev].y, renderBuffer[current].x, renderBuffer[current].y, c);
                  }
              }
          }
      }
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
}

void renderModeWhatsapp() {
  drawSegmentedRing(CX, CY, 85, 4, 12, g_phase * 30.0f, 0.3f, COL_GREEN);
  drawGlow(CX, CY, 30 + sin(g_phase * 4.0f) * 5, COL_GREEN, 20);
  spr.fillCircle(CX, CY, 25 + sin(g_phase * 4.0f) * 5, rgb565(10, 80, 20));
  
  spr.setFont(&fonts::FreeSans12pt7b);
  spr.setTextColor(COL_WHITE);
  spr.drawString("MESSAGE", CX - (spr.textWidth("MESSAGE")/2), CY - 45);
  // local_text holds the sender's name
}

void renderTask(void *pvParameters) {
  // OPTIMISATION THERMIQUE : Framerate verrouillé à ~30 FPS (33ms)
  const TickType_t xFrequency = pdMS_TO_TICKS(33); 
  TickType_t xLastWakeTime = xTaskGetTickCount();

  for (;;) {
    ms_time = millis();
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
      case OrbState::MODE_WHATSAPP: renderModeWhatsapp(); break;
      default:                    renderDefaultLocked(); break;
    }
    
    if (local_state != OrbState::MODE_SCREENSAVER) {
       renderPersistentHUD();
    }
    
    spr.pushSprite(0, 0);
    vTaskDelayUntil(&xLastWakeTime, xFrequency); 
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
  Serial.println("JARVIS OS V7.2 - OPTIMIZED THERMAL RENDERER ONLINE");

  xTaskCreatePinnedToCore(commTask, "CommTask", 4096, NULL, 1, NULL, 0);
  xTaskCreatePinnedToCore(renderTask, "RenderTask", 8192, NULL, 2, NULL, 1);
}

void loop() { vTaskDelay(portMAX_DELAY); }