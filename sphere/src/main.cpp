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
enum class OrbState : uint8_t { IDLE, LISTENING, SPEAKING, ERROR };
static OrbState g_state = OrbState::IDLE;
static OrbState g_lastState = OrbState::IDLE;

static char g_text[64] = "JARVIS";
static uint32_t g_lastFrame = 0;
static float g_phase = 0.0f;

// Colors
const uint16_t COL_CYAN   = display.color888(0, 255, 255);
const uint16_t COL_BLUE   = display.color888(0, 100, 255);
const uint16_t COL_ORANGE = display.color888(255, 140, 0);
const uint16_t COL_RED    = display.color888(255, 50, 50);
const uint16_t COL_WHITE  = display.color888(255, 255, 255);
const uint16_t COL_GREEN  = display.color888(50, 255, 50);

// Animation Variables (Smooth Transitions)
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
};
std::vector<Particle> particles;
const int MAX_PARTICLES = 30;

// ================== UTILS ==================
uint16_t lerpColor(uint16_t c1, uint16_t c2, float t) {
  int r1 = (c1 >> 11) & 0x1F;
  int g1 = (c1 >> 5) & 0x3F;
  int b1 = c1 & 0x1F;
  
  int r2 = (c2 >> 11) & 0x1F;
  int g2 = (c2 >> 5) & 0x3F;
  int b2 = c2 & 0x1F;
  
  int r = r1 + (int)((r2 - r1) * t);
  int g = g1 + (int)((g2 - g1) * t);
  int b = b1 + (int)((b2 - b1) * t);
  
  return (r << 11) | (g << 5) | b;
}

// ================== SERIAL ==================
static void setStateFromStr(const String& s) {
  g_lastState = g_state;
  if (s == "IDLE") g_state = OrbState::IDLE;
  else if (s == "LISTENING") g_state = OrbState::LISTENING;
  else if (s == "SPEAKING") g_state = OrbState::SPEAKING;
  else if (s == "ERROR") g_state = OrbState::ERROR;
}

static void handleLine(String line) {
  line.trim();
  if (!line.length()) return;
  if (line == "PING") { Serial.println("PONG"); return; }
  
  if (line.startsWith("STATE ")) {
    String s = line.substring(6); 
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
  // 1. Target Setting
  switch (g_state) {
    case OrbState::IDLE:
      targetAmplitude = 10.0f;
      targetSpeed = 0.04f;
      // Interpolation lente vers bleu/cyan
      currentColor = lerpColor(currentColor, COL_CYAN, 0.05f);
      break;
    case OrbState::LISTENING:
      targetAmplitude = 20.0f;
      targetSpeed = 0.12f;
      currentColor = lerpColor(currentColor, COL_GREEN, 0.1f);
      break;
    case OrbState::SPEAKING:
      targetAmplitude = 50.0f + (sin(millis() * 0.01) * 20.0f); // Variation dynamique
      targetSpeed = 0.25f;
      currentColor = lerpColor(currentColor, COL_ORANGE, 0.1f);
      break;
    case OrbState::ERROR:
      targetAmplitude = 5.0f;
      targetSpeed = 0.0f;
      currentColor = lerpColor(currentColor, COL_RED, 0.2f);
      break;
  }

  // 2. Smooth Interpolation (LERP)
  currentAmplitude += (targetAmplitude - currentAmplitude) * 0.1f;
  currentSpeed += (targetSpeed - currentSpeed) * 0.05f;
  
  g_phase += currentSpeed;

  // 3. Particles Logic (Background)
  if (particles.size() < MAX_PARTICLES && rand() % 10 == 0) {
    particles.push_back({
      120.0f, 120.0f,
      (float)(rand()%100 - 50) * 0.05f, (float)(rand()%100 - 50) * 0.05f,
      255,
      (uint8_t)(rand()%3 + 1)
    });
  }

  for (auto it = particles.begin(); it != particles.end();) {
    it->x += it->vx;
    it->y += it->vy;
    it->life -= 2;
    
    // Attraction vers le centre si SPEAKING
    if (g_state == OrbState::SPEAKING) {
        it->x += (120 - it->x) * 0.01f;
        it->y += (120 - it->y) * 0.01f;
    }

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

  // 1. Draw Particles (Background depth)
  for (const auto& p : particles) {
    uint16_t pCol = spr.color888(
      (p.life), 
      (p.life * (currentColor >> 5 & 0x3F)) / 64, 
      (p.life * (currentColor & 0x1F)) / 32
    );
    spr.fillRect((int)p.x, (int)p.y, p.size, p.size, pCol);
  }

  // 2. Draw Waveform
  int centerY = 120;
  int numLines = (g_state == OrbState::SPEAKING) ? 5 : 3;

  for (int l = 0; l < numLines; l++) {
    float offset = l * 0.5f;
    uint16_t col = currentColor;
    if (l > 0) col = display.color888(
       (col >> 11 & 0x1F) * 4, 
       (col >> 5 & 0x3F) * 4, 
       (col & 0x1F) * 4
    ); // Darker copies

    for (int x = 0; x < 240; x+=2) {
      float nx = (x - 120) / 120.0f;
      float envelope = 1.0f - (nx * nx); // Start/End at 0
      
      float wave = sin(g_phase + x * 0.03f + offset) 
                 + sin(g_phase * 0.5f + x * 0.08f) * 0.5f;
      
      int y = centerY + (int)(wave * currentAmplitude * envelope);
      
      // Draw vertical segment (Bar style) or Line style
      // Let's do connected lines for smoother look would need prevX/prevY
      // Pixel style is faster and looks "digital"
      spr.drawPixel(x, y, col);
      spr.drawPixel(x+1, y, col);
      if (g_state == OrbState::SPEAKING) {
         spr.drawPixel(x, y+1, col); // Thicker line
      }
    }
  }

  // 3. Glitch Effect (Random displacement)
  if (g_state == OrbState::SPEAKING && rand() % 50 == 0) {
      int y = rand() % 240;
      int h = rand() % 20 + 5;
      int shift = rand() % 10 - 5;
      spr.setScrollRect(0, y, 240, h);
      spr.scroll(shift, 0);
      spr.setScrollRect(0, 0, 240, 240); // Reset
  }

  // 4. UI Elements
  spr.setTextDatum(MC_DATUM);
  spr.setTextColor(TFT_WHITE, TFT_BLACK);
  
  // Status Text
  spr.drawString(g_text, 120, 200);

  // Small Top Indicator
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
  // Serial Read
  static String line;
  while (Serial.available()) {
    char c = (char)Serial.read();
    if (c == '\n') { handleLine(line); line = ""; }
    else if (c != '\r') { line += c; if (line.length() > 200) line = ""; }
  }

  // Render loop
  uint32_t now = millis();
  if (now - g_lastFrame >= 16) {
    g_lastFrame = now;
    updateLogic();
    draw();
  }
}
