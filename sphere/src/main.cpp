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
  MODE_APPS, MODE_VISION, MODE_GHOST, MODE_SECURITY, MODE_SCREENSAVER, MODE_WHATSAPP,
  MODE_GMAIL, MODE_CALENDAR
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

// ================== VARIABLES VEILLE ==================
// Phase lente indépendante pour le breathing du screensaver (~8s par cycle)
static float g_sleep_phase = 0.0f;
// Couleur de drift chromatique propre à la veille (évolue très lentement)
static uint16_t g_sleep_color = 0;
// Positions des particules de poussière flottantes (8 particules)
struct DustParticle { float angle; float radius; float speed; float size; };
static DustParticle g_dust[8];
static bool g_dust_init = false;
// Timestamp d'entrée en screensaver (pour le framerate adaptatif)
static unsigned long g_screensaver_start = 0;

// ================== MOTEUR 3D & BUFFER ==================
struct Point3D { float x, y, z; };
struct ProjPoint { int x, y; float z; };

// OPTIMISATION THERMIQUE : Réduction des nœuds pour soulager la FPU
const int SPHERE_NODES = 450; 
Point3D sphereBase[SPHERE_NODES]; 
ProjPoint renderBuffer[SPHERE_NODES]; 

// Initialise les particules de poussière flottantes avec des positions pseudo-aléatoires
// Appelé une seule fois au premier passage en MODE_SCREENSAVER
void initDustParticles() {
  // Positions distribuées uniformément autour de la sphère
  for (int i = 0; i < 8; i++) {
    g_dust[i].angle  = (i / 8.0f) * 2.0f * PI + (i * 0.37f); // Décalage pseudo-aléatoire
    g_dust[i].radius = 92.0f + (i % 3) * 8.0f;               // Orbites légèrement différentes
    g_dust[i].speed  = 0.0008f + (i % 4) * 0.0003f;          // Vitesses très lentes
    g_dust[i].size   = (i % 2 == 0) ? 1 : 2;                 // Taille alternée
  }
}

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
  else if (s == "GMAIL")    newState = OrbState::MODE_GMAIL;
  else if (s == "CALENDAR") newState = OrbState::MODE_CALENDAR;
  
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
      // Première entrée en screensaver : initialiser les variables de veille
      if (previous_state == OrbState::IDLE) {
        g_screensaver_start = millis();
        g_sleep_color = COL_CYAN;
        if (!g_dust_init) { initDustParticles(); g_dust_init = true; }
      }
      local_state = OrbState::MODE_SCREENSAVER; 
    }
  } else {
    // Retour d'activité : réinitialiser le flag pour la prochaine veille
    if (previous_state == OrbState::MODE_SCREENSAVER) {
      g_dust_init = false;
    }
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
        // En veille : vitesse de base très lente, la sphère 3D est éteinte (radius=0)
        // Le breathing est géré indépendamment dans renderModeScreensaver()
        case OrbState::MODE_SCREENSAVER: target_radius= 0.0f; target_speed = 0.012f; target_color = COL_CYAN; break;
        case OrbState::MODE_WHATSAPP: target_radius= 10.0f; target_speed = 0.06f; target_color = COL_GREEN; break;
        case OrbState::MODE_GMAIL:    target_radius= 5.0f;  target_speed = 0.07f; target_color = COL_RED; break;
        case OrbState::MODE_CALENDAR: target_radius= 5.0f;  target_speed = 0.05f; target_color = COL_CYAN; break;
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
  // ══════════════════════════════════════════════════════════════════════════
  // SPHÈRE FILAIRE 3D HOLOGRAPHIQUE — VEILLE INTELLIGENTE
  // ──────────────────────────────────────────────────────────────────────────
  // Principe : sphère filaire avec latitudes + longitudes elliptiques projetées
  // en perspective, rotation lente sur Y, inclinaison caméra fixe sur X.
  // Coût CPU : ~9 drawEllipse + 2 drawCircle + quelques drawLine = très léger.
  // ══════════════════════════════════════════════════════════════════════════

  // ── 1. PHASE & BREATHING ──────────────────────────────────────────────────
  // g_sleep_phase avance indépendamment de g_phase (pas d'accélération au réveil)
  g_sleep_phase += 0.006f;
  // breath : 0.0 (expire, ~4s) → 1.0 (inspire, ~4s), sinusoïde douce
  float breath = (sin(g_sleep_phase) + 1.0f) * 0.5f;

  // ── 2. DRIFT CHROMATIQUE LENT ─────────────────────────────────────────────
  // Cycle ~90s : cyan glacial → bleu roi → indigo → retour
  float cc = (sin(g_sleep_phase * 0.07f) + 1.0f) * 0.5f;
  // Couleur principale : cyan froid (veille) → bleu profond (veille profonde)
  uint8_t cr = (uint8_t)(cc * 40);
  uint8_t cg = (uint8_t)(120 + cc * 80);
  uint8_t cb = (uint8_t)(200 + cc * 55);
  g_sleep_color = rgb565(cr, cg, cb);
  // Variante lumineuse pour les éléments au premier plan
  uint16_t colBright = lerpColor(g_sleep_color, COL_WHITE, 0.35f + breath * 0.25f);
  // Variante sombre pour la face arrière (effet de profondeur)
  uint16_t colDark   = lerpColor(COL_BG, g_sleep_color, 0.18f);
  // Couleur de l'anneau équatorial (toujours plus lumineuse)
  uint16_t colEquator = lerpColor(g_sleep_color, COL_WHITE, 0.55f + breath * 0.3f);

  // ── 3. PARAMÈTRES GÉOMÉTRIQUES ────────────────────────────────────────────
  // Rayon 3D de la sphère, pulsé par la respiration (80 → 88px)
  float R = 80.0f + breath * 8.0f;
  // Angle de rotation Y lent (1 tour en ~210s à 30FPS)
  float rotY = g_phase * 0.012f;
  // Inclinaison caméra X fixe : on voit le pôle nord à ~20°
  const float cosTX  = 0.928f;  // cos(0.38) précalculé
  const float sinTX  = 0.371f;  // sin(0.38) précalculé

  // ── 4. OMBRE PORTÉE AU SOL ────────────────────────────────────────────────
  // Ellipse sombre sous la sphère — donne instantanément l'impression de volume
  // Rayon X = R, rayon Y = R * 0.18 (très aplati), décalé vers le bas
  int shadowY  = CY + (int)(R * 0.72f);
  int shadowRx = (int)(R * 0.88f);
  int shadowRy = (int)(R * 0.13f);
  // Dégradé de l'ombre : 3 ellipses concentriques de plus en plus sombres
  spr.drawEllipse(CX, shadowY, shadowRx + 4, shadowRy + 2, lerpColor(COL_BG, g_sleep_color, 0.06f));
  spr.drawEllipse(CX, shadowY, shadowRx + 2, shadowRy + 1, lerpColor(COL_BG, g_sleep_color, 0.10f));
  spr.drawEllipse(CX, shadowY, shadowRx,     shadowRy,     lerpColor(COL_BG, g_sleep_color, 0.14f));

  // ── 5. HALO ATMOSPHÉRIQUE DE FOND ─────────────────────────────────────────
  // Lueur très douce derrière la sphère, pulse avec la respiration
  // 4 cercles concentriques du bord vers le centre (dégradé radial)
  for (int r = (int)(R + 22); r > (int)(R + 4); r -= 6) {
    float f = 1.0f - ((float)(r - R - 4) / 18.0f);
    spr.drawCircle(CX, CY, r, lerpColor(COL_BG, g_sleep_color, f * f * (0.06f + breath * 0.05f)));
  }

  // ── 6. SPHÈRE FILAIRE : LATITUDES (cercles horizontaux) ───────────────────
  // 7 latitudes de -60° à +60° (pas de pôles pour garder l'aspect épuré).
  // Chaque latitude est projetée en ellipse via la caméra inclinée.
  // Formule : un cercle à latitude phi_lat a rayon r_lat = R*cos(phi_lat)
  // et centre Y décalé de R*sin(phi_lat) sur l'axe Y monde.
  // Après rotation caméra X : centre_y_proj = R*sin(phi_lat)*cosTX
  //                            demi-axe_y    = r_lat * cosTX (raccourcissement)
  //                            demi-axe_x    = r_lat (inchangé, rotation Y pure)
  // La perspective est approximée par un facteur global au centre de la latitude.
  const int NUM_LAT = 7;
  // Latitudes en radians : -60°, -40°, -20°, 0°(équateur), +20°, +40°, +60°
  const float lats[NUM_LAT] = { -1.047f, -0.698f, -0.349f, 0.0f, 0.349f, 0.698f, 1.047f };

  for (int li = 0; li < NUM_LAT; li++) {
    float phi_lat = lats[li];
    float cosL = cos(phi_lat);
    float sinL = sin(phi_lat);

    // Rayon du cercle à cette latitude
    float r_lat = R * cosL;

    // Centre Y monde de cette latitude après inclinaison caméra X
    float cy_world = R * sinL;
    float cy_cam   = cy_world * cosTX;  // composante Y après rotation caméra
    float cz_cam   = cy_world * sinTX;  // composante Z (profondeur) après rotation

    // Facteur de perspective au centre de cette latitude
    float persp = 200.0f / (200.0f + cz_cam);

    // Demi-axes de l'ellipse projetée
    int rx = (int)(r_lat * persp);                  // axe X inchangé par la rotation Y
    int ry = (int)(r_lat * cosTX * persp);          // axe Y raccourci par l'inclinaison
    int cy_screen = CY + (int)(cy_cam * persp);     // centre Y à l'écran

    if (rx < 2 || ry < 1) continue;  // trop petit, skip

    // Luminosité : équateur = max, pôles = min + modulation breathing
    float latBright = 1.0f - abs(phi_lat) / 1.2f;
    float bright = latBright * (0.45f + breath * 0.35f);

    bool isEquator = (li == 3);
    uint16_t latCol = isEquator
      ? colEquator
      : lerpColor(colDark, colBright, bright);

    if (isEquator) {
      // Équateur triple trait : effet néon holographique
      spr.drawEllipse(CX, cy_screen, rx,     ry,     latCol);
      spr.drawEllipse(CX, cy_screen, rx + 1, ry,     lerpColor(COL_BG, latCol, 0.6f));
      spr.drawEllipse(CX, cy_screen, rx - 1, ry - 1, lerpColor(COL_BG, latCol, 0.5f));
    } else {
      spr.drawEllipse(CX, cy_screen, rx, ry, latCol);
    }
  }

  // ── 7. MÉRIDIENS ──────────────────────────────────────────────────────────
  // 6 méridiens espacés de 30°, tournent avec rotY.
  // Face avant (cosinus > 0) = lumineux, face arrière = très sombre → volume.
  const int NUM_MER = 6;
  for (int mi = 0; mi < NUM_MER; mi++) {
    float merAngle = rotY + (mi * PI / NUM_MER);
    float cosMer = cos(merAngle);
    float sinMer = sin(merAngle);
    // Demi-axe X : largeur apparente selon l'angle de vue + perspective
    float pz_mer = R * sinMer * sinTX;
    float persp_mer = 200.0f / (200.0f + pz_mer);
    int rx = (int)(abs(cosMer) * R * persp_mer);
    int ry = (int)(R * cosTX * persp_mer);
    if (rx < 1 || ry < 1) continue;

    bool isFront = (cosMer > 0.0f);
    float merBright = isFront
      ? (0.28f + abs(cosMer) * 0.38f) * (0.5f + breath * 0.3f)
      : 0.07f;
    spr.drawEllipse(CX, CY, rx, ry, lerpColor(COL_BG, g_sleep_color, merBright));
  }

  // ── 8. CONTOUR SPHÉRIQUE + REFLET SPÉCULAIRE ──────────────────────────────
  // Silhouette = cercle parfait. Double trait pour l'épaisseur.
  int Ri = (int)R;
  spr.drawCircle(CX, CY, Ri,     lerpColor(COL_BG, g_sleep_color, 0.55f + breath * 0.25f));
  spr.drawCircle(CX, CY, Ri + 1, lerpColor(COL_BG, g_sleep_color, 0.22f + breath * 0.10f));
  // Reflet spéculaire haut-gauche (source lumière fictive) : arc très fin
  uint16_t specCol = lerpColor(COL_BG, COL_WHITE, 0.20f + breath * 0.15f);
  spr.drawArc(CX - 8, CY - 8, Ri - 2, Ri - 4, 300, 360, specCol);
  spr.drawArc(CX - 8, CY - 8, Ri - 2, Ri - 4, 0,   30,  specCol);

  // ── 9. NOYAU CENTRAL PULSANT ──────────────────────────────────────────────
  int coreR = (int)(2 + breath * 3);
  spr.drawCircle(CX, CY, coreR + 6, lerpColor(COL_BG, g_sleep_color, 0.18f + breath * 0.14f));
  spr.drawCircle(CX, CY, coreR + 3, lerpColor(COL_BG, g_sleep_color, 0.32f + breath * 0.18f));
  spr.fillCircle(CX, CY, coreR,     lerpColor(g_sleep_color, COL_WHITE, breath * 0.80f));

  // ── 10. PARTICULES ORBITALES ───────────────────────────────────────────────
  // 8 particules sur orbite elliptique inclinée — coût : 8 × fillCircle(r≤2)
  for (int i = 0; i < 8; i++) {
    g_dust[i].angle += g_dust[i].speed;
    float da = g_dust[i].angle;
    float dr = g_dust[i].radius;
    float px =  cos(da) * dr;
    float pz =  sin(da) * dr * 0.4f;
    float py_cam = -pz * sinTX;
    float pz_cam =  pz * cosTX;
    float persp  = 200.0f / (200.0f + pz_cam);
    int sx = CX + (int)(px * persp);
    int sy = CY + (int)(py_cam * persp);
    float pBright = (pz_cam < 0) ? (0.28f + breath * 0.18f) : 0.07f;
    spr.fillCircle(sx, sy, g_dust[i].size, lerpColor(COL_BG, g_sleep_color, pBright));
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

// ================== MODE GMAIL ==================
void renderModeGmail() {
  // Anneau externe tournant — rouge Gmail
  drawSegmentedRing(CX, CY, 90, 5, 12, g_phase * 35.0f, 0.25f, COL_RED);
  drawSegmentedRing(CX, CY, 75, 2, 24, -g_phase * 55.0f, 0.5f, rgb565(180, 30, 30));

  // Enveloppe centrale animée
  float pulse = sin(g_phase * 4.0f) * 0.5f + 0.5f;
  uint16_t envCol = lerpColor(rgb565(60, 5, 5), COL_RED, pulse);
  drawGlow(CX, CY, 32, COL_RED, 18);

  // Corps de l'enveloppe (rectangle arrondi simulé)
  spr.fillRect(CX - 30, CY - 18, 60, 36, envCol);
  spr.drawRect(CX - 30, CY - 18, 60, 36, COL_WHITE);

  // Rabat de l'enveloppe (V)
  spr.drawLine(CX - 30, CY - 18, CX, CY + 2, COL_WHITE);
  spr.drawLine(CX, CY + 2, CX + 30, CY - 18, COL_WHITE);

  // Label
  spr.setFont(&fonts::FreeSans9pt7b);
  spr.setTextColor(COL_WHITE);
  spr.drawString("GMAIL", CX - (spr.textWidth("GMAIL") / 2), CY - 45);

  // Compteur de mails non lus (depuis local_text si dispo)
  if (strlen(local_text) > 0) {
    spr.setTextColor(COL_RED);
    spr.drawString(local_text, CX - (spr.textWidth(local_text) / 2), CY + 40);
  }
}

// ================== MODE CALENDAR ==================
void renderModeCalendar() {
  // Anneau externe tournant — cyan agenda
  drawSegmentedRing(CX, CY, 90, 5, 8, g_phase * 20.0f, 0.15f, COL_CYAN);
  drawSegmentedRing(CX, CY, 72, 2, 32, -g_phase * 40.0f, 0.5f, COL_BLUE);

  // Corps du calendrier
  drawGlow(CX, CY, 38, COL_CYAN, 15);
  spr.fillRect(CX - 32, CY - 28, 64, 56, rgb565(5, 20, 35));
  spr.drawRect(CX - 32, CY - 28, 64, 56, COL_CYAN);

  // Barre de titre du calendrier
  spr.fillRect(CX - 32, CY - 28, 64, 14, COL_CYAN);
  spr.setFont(&fonts::FreeSans9pt7b);
  spr.setTextColor(COL_BG);
  spr.drawString("CAL", CX - (spr.textWidth("CAL") / 2), CY - 23);

  // Grille de jours (3x3 points)
  uint16_t dotCol = lerpColor(COL_BLUE, COL_WHITE, (sin(g_phase * 3.0f) + 1.0f) * 0.5f);
  for (int row = 0; row < 3; row++) {
    for (int col = 0; col < 4; col++) {
      int dx = CX - 22 + col * 15;
      int dy = CY - 8 + row * 14;
      // Mettre en surbrillance un "rendez-vous" animé
      bool highlight = (row == 1 && col == 2);
      spr.fillCircle(dx, dy, highlight ? 4 : 2,
                     highlight ? lerpColor(COL_CYAN, COL_WHITE, (sin(g_phase * 6.0f) + 1.0f) * 0.5f) : dotCol);
    }
  }

  // Label
  spr.setFont(&fonts::FreeSans9pt7b);
  spr.setTextColor(COL_WHITE);
  spr.drawString("AGENDA", CX - (spr.textWidth("AGENDA") / 2), CY - 48);

  // Texte de l'événement (depuis local_text si dispo)
  if (strlen(local_text) > 0) {
    spr.setTextColor(COL_CYAN);
    spr.drawString(local_text, CX - (spr.textWidth(local_text) / 2), CY + 40);
  }
}

void renderTask(void *pvParameters) {
  // OPTIMISATION THERMIQUE : Framerate verrouillé à ~30 FPS (33ms)
  // Framerate de base : 30 FPS (33ms). En veille profonde (>2min), réduit à 15 FPS
  // pour diminuer la charge thermique de l'ESP32-S3
  TickType_t xLastWakeTime = xTaskGetTickCount();

  for (;;) {
    ms_time = millis();
    updateLogic();

    // Framerate adaptatif : 15 FPS en veille profonde (>2 min), 30 FPS sinon
    // Réduit la dissipation thermique sans impacter la fluidité en mode actif
    bool deepSleep = (local_state == OrbState::MODE_SCREENSAVER)
                     && (millis() - g_screensaver_start > 120000UL);
    TickType_t xFrequency = pdMS_TO_TICKS(deepSleep ? 66 : 33);

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
      case OrbState::MODE_GMAIL:    renderModeGmail(); break;
      case OrbState::MODE_CALENDAR: renderModeCalendar(); break;
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