#include <Arduino.h>
#include <LovyanGFX.hpp>
#include <vector>

// ================== CONFIG GC9A01 ==================
class LGFX : public lgfx::LGFX_Device {
  lgfx::Panel_GC9A01 _panel;
  lgfx::Bus_SPI      _bus;

public:
  LGFX() {
    { // BUS
      auto cfg = _bus.config();
      cfg.spi_host   = SPI2_HOST;
      cfg.spi_mode   = 0;
      cfg.freq_write = 80000000;
      cfg.freq_read  = 0;
      cfg.spi_3wire  = true;
      cfg.use_lock   = true;
      cfg.dma_channel = SPI_DMA_CH_AUTO;

      cfg.pin_sclk = 12;
      cfg.pin_mosi = 11;
      cfg.pin_miso = -1;
      cfg.pin_dc   = 9;

      _bus.config(cfg);
      _panel.setBus(&_bus);
    }

    { // PANEL
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

// ================== TYPES & CONSTANTS ==================
enum class OrbState : uint8_t { 
  IDLE, LISTENING, SPEAKING, ERROR,
  MODE_WEATHER, MODE_HOME, MODE_SYSTEM, MODE_MATRIX, MODE_SEARCH,
  MODE_MEDIA, MODE_TIMER, MODE_PRINT, MODE_NOTIFICATION, MODE_SUCCESS
};
static OrbState g_state = OrbState::IDLE;
static OrbState g_lastState = OrbState::IDLE;

static char g_text[64] = "JARVIS";
static uint32_t g_lastFrame = 0;
static float g_phase = 0.0f;

// ================== UTILS ==================
uint16_t rgb565(uint8_t r, uint8_t g, uint8_t b) {
  return ((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3);
}

uint16_t lerpColor(uint16_t c1, uint16_t c2, float t) {
  int r1 = (c1 >> 11) & 0x1F; int g1 = (c1 >> 5) & 0x3F; int b1 = c1 & 0x1F;
  int r2 = (c2 >> 11) & 0x1F; int g2 = (c2 >> 5) & 0x3F; int b2 = c2 & 0x1F;
  int r = r1 + (int)((r2 - r1) * t);
  int g = g1 + (int)((g2 - g1) * t);
  int b = b1 + (int)((b2 - b1) * t);
  return (r << 11) | (g << 5) | b;
}

// Colors
const uint16_t COL_CYAN   = rgb565(0, 255, 255);
const uint16_t COL_BLUE   = rgb565(0, 100, 255);
const uint16_t COL_ORANGE = rgb565(255, 140, 0);
const uint16_t COL_RED    = rgb565(255, 50, 50);
const uint16_t COL_WHITE  = rgb565(255, 255, 255);
const uint16_t COL_GREEN  = rgb565(50, 255, 50);
const uint16_t COL_YELLOW = rgb565(255, 255, 0);
const uint16_t COL_PURPLE = rgb565(180, 0, 255);
const uint16_t COL_PINK   = rgb565(255, 0, 127);

// Animation Variables
float currentAmplitude = 10.0f;
float targetAmplitude = 10.0f;
float currentSpeed = 0.05f;
float targetSpeed = 0.05f;
uint16_t currentColor = COL_BLUE;

// Particles
struct Particle {
  float x, y;
  float vx, vy;
  uint8_t life;
  uint8_t size;
  uint16_t color;
  
  Particle(float _x, float _y, float _vx, float _vy, uint8_t _life, uint8_t _size, uint16_t _color)
    : x(_x), y(_y), vx(_vx), vy(_vy), life(_life), size(_size), color(_color) {}
};
std::vector<Particle> particles;
const int MAX_PARTICLES = 40;

// ================== SERIAL ==================
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

// ================== LOGIC UPDATE ==================
void updateLogic() {
  switch (g_state) {
    case OrbState::IDLE:
      targetAmplitude = 10.0f; targetSpeed = 0.04f; currentColor = lerpColor(currentColor, COL_CYAN, 0.05f);
      break;
    case OrbState::LISTENING:
      targetAmplitude = 20.0f; targetSpeed = 0.12f; currentColor = lerpColor(currentColor, COL_GREEN, 0.1f);
      break;
    case OrbState::SPEAKING:
      targetAmplitude = 50.0f + (sin(millis() * 0.01) * 20.0f); targetSpeed = 0.25f; currentColor = lerpColor(currentColor, COL_ORANGE, 0.1f);
      break;
    case OrbState::ERROR:
      targetAmplitude = 5.0f; targetSpeed = 0.0f; currentColor = lerpColor(currentColor, COL_RED, 0.2f);
      break;
    case OrbState::MODE_WEATHER:
      targetAmplitude = 15.0f; targetSpeed = 0.02f; currentColor = lerpColor(currentColor, COL_YELLOW, 0.05f);
      break;
    case OrbState::MODE_HOME:
      targetAmplitude = 10.0f; targetSpeed = 0.05f; currentColor = lerpColor(currentColor, COL_PURPLE, 0.05f);
      break;
    case OrbState::MODE_SYSTEM:
      targetAmplitude = 5.0f; targetSpeed = 0.5f; currentColor = lerpColor(currentColor, COL_WHITE, 0.05f);
      break;
    case OrbState::MODE_MATRIX:
      targetAmplitude = 0.0f; targetSpeed = 0.0f; currentColor = lerpColor(currentColor, COL_GREEN, 0.1f);
      break;
    case OrbState::MODE_SEARCH:
      targetAmplitude = 25.0f; targetSpeed = 0.1f; currentColor = lerpColor(currentColor, COL_BLUE, 0.1f);
      break;
    case OrbState::MODE_MEDIA:
      targetAmplitude = 40.0f; targetSpeed = 0.15f; currentColor = lerpColor(currentColor, COL_PINK, 0.1f);
      break;
    case OrbState::MODE_TIMER:
      targetAmplitude = 5.0f; targetSpeed = 0.1f; currentColor = lerpColor(currentColor, COL_YELLOW, 0.1f);
      break;
    case OrbState::MODE_PRINT:
      targetAmplitude = 10.0f; targetSpeed = 0.02f; currentColor = lerpColor(currentColor, COL_GREEN, 0.1f);
      break;
    case OrbState::MODE_NOTIFICATION:
      targetAmplitude = 30.0f; targetSpeed = 0.2f; currentColor = lerpColor(currentColor, COL_CYAN, 0.2f);
      break;
    case OrbState::MODE_SUCCESS:
      targetAmplitude = 0.0f; targetSpeed = 0.0f; currentColor = lerpColor(currentColor, COL_GREEN, 0.2f);
      break;
  }

  currentAmplitude += (targetAmplitude - currentAmplitude) * 0.1f;
  currentSpeed += (targetSpeed - currentSpeed) * 0.05f;
  g_phase += currentSpeed;

  // Particle Logic per mode
  float cx = 120, cy = 120;
  
  if (g_state == OrbState::MODE_MATRIX) {
      if (particles.size() < MAX_PARTICLES && rand() % 5 == 0) 
        particles.push_back(Particle((float)(rand() % 240), 0, 0, (float)(rand()%3 + 2), 255, 2, COL_GREEN));
  } 
  else if (g_state == OrbState::MODE_WEATHER) {
      if (particles.size() < MAX_PARTICLES && rand() % 10 == 0) 
        particles.push_back(Particle((float)(rand() % 240), 0, 0, 2.0f, 255, 2, COL_WHITE));
  }
  else if (g_state == OrbState::MODE_MEDIA) {
      // Particles emitting from center
      if (particles.size() < MAX_PARTICLES && rand() % 5 == 0) {
        float angle = (float)(rand()%360) * PI / 180.0f;
        float speed = 2.0f + (rand()%10)*0.2f;
        particles.push_back(Particle(cx, cy, cos(angle)*speed, sin(angle)*speed, 255, 3, COL_PINK));
      }
  }
  else if (g_state == OrbState::MODE_NOTIFICATION) {
       // Pulsing burst logic could go here, for now simple ambient
  }
  else if (g_state == OrbState::MODE_SUCCESS) {
       // Starburst
       if (particles.size() < 20 && rand() % 2 == 0) {
           float angle = (float)(rand()%360) * PI / 180.0f;
           float speed = 4.0f;
           particles.push_back(Particle(cx, cy, cos(angle)*speed, sin(angle)*speed, 200, 4, COL_GREEN));
       }
  }
  else {
    // Ambient floating particles
    if (particles.size() < MAX_PARTICLES && rand() % 10 == 0) {
      particles.push_back(Particle(
        120.0f, 120.0f,
        (float)(rand()%100 - 50) * 0.05f, (float)(rand()%100 - 50) * 0.05f,
        255, (uint8_t)(rand()%3 + 1), currentColor
      ));
    }
  }

  for (auto it = particles.begin(); it != particles.end();) {
    it->x += it->vx;
    it->y += it->vy;
    it->life -= 2;

    // Attraction specific logic
    if (g_state == OrbState::SPEAKING) {
        it->x += (120 - it->x) * 0.02f;
        it->y += (120 - it->y) * 0.02f;
    }
    
    // Bounds check
    if (it->life <= 0 || it->x < 0 || it->x > 240 || it->y < 0 || it->y > 240) {
      it = particles.erase(it);
    } else {
      ++it;
    }
  }
}

// ================== DRAWING ==================
void draw() {
  spr.fillScreen(TFT_BLACK);

  // 1. Draw Particles
  for (const auto& p : particles) {
    uint16_t pCol = p.color;
    if (g_state == OrbState::MODE_MATRIX) pCol = COL_GREEN;
    else if (g_state == OrbState::MODE_WEATHER) pCol = COL_WHITE;
    // Fade out
    pCol = rgb565(
       ((pCol >> 11) & 0x1F) * p.life / 255 * 8,
       ((pCol >> 5) & 0x3F) * p.life / 255 * 4,
       (pCol & 0x1F) * p.life / 255 * 8
    );
    spr.fillRect((int)p.x, (int)p.y, p.size, p.size, pCol);
  }

  // 2. Main Visual Element
  int cx = 120, cy = 120;
  
  if (g_state == OrbState::MODE_SYSTEM) {
    // Rotating Gear / Rings
    int r = 40;
    for (int i=0; i<3; i++) {
        int radius = r + i*15;
        float ang = g_phase * (i%2==0 ? 1 : -1) + i;
        int x = cx + cos(ang)*radius;
        int y = cy + sin(ang)*radius;
        spr.drawCircle(cx, cy, radius, currentColor);
        spr.fillCircle(x, y, 4, COL_WHITE);
    }
  } 
  else if (g_state == OrbState::MODE_HOME) {
    // House shape pulsing
    int size = 40 + (int)(sin(g_phase)*5);
    spr.drawRect(cx-size, cy-size/2, size*2, size*2, currentColor);
    spr.drawTriangle(cx-size, cy-size/2, cx+size, cy-size/2, cx, cy-size*1.5, currentColor);
  }
  else if (g_state == OrbState::MODE_WEATHER) {
    // Sun
    spr.fillCircle(cx, cy, 30, COL_YELLOW);
    for (int i=0; i<8; i++) {
        float a = g_phase + i * (PI/4);
        spr.drawLine(cx + cos(a)*35, cy + sin(a)*35, cx + cos(a)*50, cy + sin(a)*50, COL_YELLOW);
    }
  }
  else if (g_state == OrbState::MODE_MEDIA) {
    // Audio Visualizer (Circular Spectrum)
    int bars = 24;
    float radius = 40;
    for (int i = 0; i < bars; i++) {
       float angle = (i * 360.0f / bars) * DEG_TO_RAD + g_phase;
       float val = 10 + abs(sin(g_phase * 3.0f + i * 0.5f) * 30.0f) + (sin(i*132.0f)*5.0f);
       
       float x1 = cx + cos(angle) * radius;
       float y1 = cy + sin(angle) * radius;
       float x2 = cx + cos(angle) * (radius + val);
       float y2 = cy + sin(angle) * (radius + val);
       
       uint16_t col = lerpColor(COL_PINK, COL_PURPLE, (float)i/bars);
       spr.drawLine((int)x1, (int)y1, (int)x2, (int)y2, col);
       spr.drawLine((int)x1+1, (int)y1+1, (int)x2+1, (int)y2+1, col); // Thicker
    }
    // Pulsing center core
    spr.fillCircle(cx, cy, 10 + sin(g_phase*5)*3, COL_WHITE);
  }
  else if (g_state == OrbState::MODE_TIMER) {
     // Sci-Fi Countdown Ring
     int r = 60;
     int angleEnd = (int)((millis() % 60000) / 60000.0f * 360.0f);
     
     // Background ring (dim)
     spr.drawCircle(cx, cy, r, rgb565(50, 50, 0));
     spr.drawCircle(cx, cy, r-5, rgb565(50, 50, 0));

     // Progress Arc
     spr.drawArc(cx, cy, r, r-5, 0, angleEnd, COL_YELLOW);
     
     // Digital ticks
     for(int i=0; i<12; i++) {
       float a = i * 30 * DEG_TO_RAD;
       int tx = cx + cos(a)*(r+10);
       int ty = cy + sin(a)*(r+10);
       spr.fillCircle(tx, ty, 2, COL_ORANGE);
     }
     
     spr.setTextColor(COL_WHITE);
     spr.setTextSize(2);
     spr.setTextDatum(MC_DATUM);
     spr.drawString("TIMER", cx, cy); 
  }
  else if (g_state == OrbState::MODE_PRINT) {
     // 3D Printer Animation
     // Nozzle moving
     float nozzleX = cx + sin(g_phase*2.0f) * 30;
     spr.fillTriangle(nozzleX-10, cy-30, nozzleX+10, cy-30, nozzleX, cy, COL_ORANGE);
     
     // Layer being printed
     int layerY = cy + 10;
     spr.fillRect(cx-40, layerY, 80, 5, COL_BLUE); // Bed
     
     // Object growing
     int height = 10 + (int)(abs(sin(g_phase*0.5f))*20);
     spr.fillRect(cx-15, layerY-height, 30, height, COL_GREEN);
     
     // Sparks
     if (rand()%10==0) spr.drawPixel(nozzleX, cy, COL_WHITE);
  }
  else if (g_state == OrbState::MODE_NOTIFICATION) {
      // Hexagon Alert
      int r = 50 + sin(g_phase*10)*5;
      for(int i=0; i<6; i++) {
         float a1 = i * 60 * DEG_TO_RAD + g_phase;
         float a2 = (i+1) * 60 * DEG_TO_RAD + g_phase;
         spr.drawLine(cx + cos(a1)*r, cy + sin(a1)*r, cx + cos(a2)*r, cy + sin(a2)*r, COL_CYAN);
      }
      spr.setTextSize(3);
      spr.setTextColor(COL_WHITE);
      spr.setTextDatum(MC_DATUM);
      spr.drawString("!", cx, cy);
  }
  else if (g_state == OrbState::MODE_SUCCESS) {
     // Victory Burst
     float progress = fmod(g_phase, 4.0f) / 4.0f; // 0 to 1 loop
     int r = (int)(progress * 100);
     spr.drawCircle(cx, cy, r, COL_GREEN);
     spr.drawCircle(cx, cy, r/2, COL_WHITE);
     
     // Checkmark static
     spr.drawLine(cx-20, cy, cx-5, cy+20, COL_GREEN);
     spr.drawLine(cx-21, cy, cx-6, cy+20, COL_GREEN); // Thicker
     spr.drawLine(cx-5, cy+20, cx+30, cy-15, COL_GREEN);
     spr.drawLine(cx-6, cy+20, cx+29, cy-15, COL_GREEN); // Thicker
  }
  else {
    // Default Waveform (IDLE, SPEAKING, LISTENING, SEARCH)
    int centerY = 120;
    int numLines = (g_state == OrbState::SPEAKING) ? 5 : 3;

    for (int l = 0; l < numLines; l++) {
      float offset = l * 0.5f;
      uint16_t col = currentColor;
      if (l > 0) col = rgb565(
         (col >> 11 & 0x1F) * 4, 
         (col >> 5 & 0x3F) * 4, 
         (col & 0x1F) * 4
      );

      for (int x = 0; x < 240; x+=3) {
        float nx = (x - 120) / 120.0f;
        float envelope = 1.0f - (nx * nx);
        
        float wave = sin(g_phase + x * 0.03f + offset) 
                   + sin(g_phase * 0.5f + x * 0.08f) * 0.5f;
        
        int y = centerY + (int)(wave * currentAmplitude * envelope);
        spr.drawPixel(x, y, col);
        spr.drawPixel(x+1, y, col);
        if (g_state == OrbState::SPEAKING) spr.drawPixel(x, y+1, col); 
      }
    }
  }

  // 3. UI
  spr.setTextDatum(MC_DATUM);
  spr.setTextColor(TFT_WHITE, TFT_BLACK);
  spr.drawString(g_text, 120, 200);

  if (g_state == OrbState::LISTENING) {
     spr.fillCircle(120, 15, 3, COL_RED);
  }

  spr.pushSprite(0, 0);
}

void setup() {
  Serial.begin(115200);
  delay(200);
  display.init();
  display.setRotation(0);
  spr.createSprite(240, 240);
  spr.setSwapBytes(true);
  Serial.println("READY");
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
    g_lastFrame = now;
    updateLogic();
    draw();
  }
}
