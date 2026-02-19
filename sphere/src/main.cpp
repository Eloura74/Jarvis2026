#include <Arduino.h>
#include <LovyanGFX.hpp>

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
      cfg.freq_write = 40000000;
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

// ================== ORB STATES ==================
enum class OrbState : uint8_t { IDLE, LISTENING, SPEAKING, ERROR };
static OrbState g_state = OrbState::IDLE;

static char g_text[64] = "JARVIS";
static uint32_t g_lastFrame = 0;
static float g_phase = 0.0f;

// util: clamp
static int clampi(int v, int lo, int hi) { return v < lo ? lo : (v > hi ? hi : v); }

// ================== SERIAL PROTOCOL ==================
// Commands (one per line):
//  STATE IDLE|LISTENING|SPEAKING|ERROR
//  TEXT <message...>
//  PING
//  HELP
static void setStateFromStr(const String& s) {
  if (s == "IDLE") g_state = OrbState::IDLE;
  else if (s == "LISTENING") g_state = OrbState::LISTENING;
  else if (s == "SPEAKING") g_state = OrbState::SPEAKING;
  else if (s == "ERROR") g_state = OrbState::ERROR;
}

static void handleLine(String line) {
  line.trim();
  if (!line.length()) return;

  if (line == "PING") { Serial.println("PONG"); return; }
  if (line == "HELP") {
    Serial.println("CMD: STATE IDLE|LISTENING|SPEAKING|ERROR");
    Serial.println("CMD: TEXT <message>");
    Serial.println("CMD: PING");
    return;
  }

  if (line.startsWith("STATE ")) {
    String s = line.substring(6);
    s.trim();
    s.toUpperCase();
    setStateFromStr(s);
    Serial.print("OK STATE "); Serial.println(s);
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

  Serial.println("ERR UNKNOWN");
}

// ================== RENDER ==================
static uint16_t colorForState(OrbState st) {
  switch (st) {
    case OrbState::IDLE:      return display.color888(40, 160, 255); // bleu
    case OrbState::LISTENING: return display.color888(60, 255, 140); // vert
    case OrbState::SPEAKING:  return display.color888(255, 120, 40); // orange
    case OrbState::ERROR:     return display.color888(255, 60, 60);  // rouge
  }
  return TFT_WHITE;
}

static void drawOrbFrame() {
  const int cx = 120, cy = 120;
  const uint16_t base = colorForState(g_state);

  // animation : pulsation + légère onde
  float speed = 0.06f;
  if (g_state == OrbState::LISTENING) speed = 0.10f;
  if (g_state == OrbState::SPEAKING)  speed = 0.16f;
  if (g_state == OrbState::ERROR)     speed = 0.08f;

  g_phase += speed;
  if (g_phase > 100000.0f) g_phase = 0.0f;

  float pulse = 0.5f + 0.5f * sinf(g_phase);
  int r0 = 58 + (int)(pulse * 10.0f);        // rayon orb
  int glow = 22 + (int)(pulse * 12.0f);      // halo

  spr.fillScreen(TFT_BLACK);

  // halo (plusieurs cercles alpha-like via dégradé)
  for (int i = glow; i >= 1; --i) {
    int a = (i * 220) / glow;                // pseudo alpha
    int rr = r0 + i;

    int cr = clampi(((base >> 11) & 0x1F) * 8, 0, 255);
    int cg = clampi(((base >> 5)  & 0x3F) * 4, 0, 255);
    int cb = clampi(( base        & 0x1F) * 8, 0, 255);

    // atténuation
    cr = (cr * a) / 255;
    cg = (cg * a) / 255;
    cb = (cb * a) / 255;

    spr.drawCircle(cx, cy, rr, spr.color888(cr, cg, cb));
  }

  // orb pleine
  spr.fillCircle(cx, cy, r0, base);

  // “reflet” pour effet sphère
  spr.fillCircle(cx - 18, cy - 20, 14, spr.color888(255, 255, 255));
  spr.fillCircle(cx - 18, cy - 20, 14, TFT_WHITE);
  spr.fillCircle(cx - 18, cy - 20, 12, spr.color888(220, 220, 220));

  // texte
  spr.setTextDatum(MC_DATUM);
  spr.setTextColor(TFT_WHITE, TFT_BLACK);
  spr.setTextSize(1);
  spr.drawString(g_text, cx, 200);

  spr.pushSprite(0, 0);
}

// ================== SETUP/LOOP ==================
void setup() {
  Serial.begin(115200);
  delay(400);

  display.init();
  display.setRotation(0);

  spr.createSprite(240, 240);
  spr.setSwapBytes(true);

  Serial.println("READY");
  Serial.println("Type HELP");
}

void loop() {
  // lecture série non bloquante
  static String line;
  while (Serial.available()) {
    char c = (char)Serial.read();
    if (c == '\n') { handleLine(line); line = ""; }
    else if (c != '\r') { line += c; if (line.length() > 200) line = ""; }
  }

  // rendu ~60 FPS
  uint32_t now = millis();
  if (now - g_lastFrame >= 16) {
    g_lastFrame = now;
    drawOrbFrame();
  }
}
