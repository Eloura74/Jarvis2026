#include "Tasks.h"
#include "JarvisData.h"
#include "DisplayCore.h"

// Variables chronos et particules locales
static uint32_t ms_time = 0;
static float g_phase = 0.0f;
static Object obj_state; // On stocke une copie locale pour thread safety
static OrbState local_state = OrbState::IDLE;

static float dyn_radius = 10.0f;
static float dyn_speed = 0.05f;
static uint16_t dyn_color = COL_CYAN;

struct Particle {
  float x, y, vx, vy;
  int life;
  uint16_t color;
};
std::vector<Particle> particles;
const int MAX_PARTICLES = 35;

// ================== PRIMITIVES VECTORIELLES AVANCÉES ==================

static void drawGlow(int x, int y, int radius, uint16_t color, int intensity) {
  for (int r = radius + intensity; r > radius; r -= 2) {
    float factor = 1.0f - ((float)(r - radius) / intensity);
    uint16_t fadeCol = lerpColor(COL_BG, color, factor * factor); 
    spr.drawCircle(x, y, r, fadeCol);
  }
}

static void drawSegmentedRing(int x, int y, int r, int thickness, int segments, float phase, float gapRatio, uint16_t color) {
  float angleStep = 360.0f / segments;
  float gap = angleStep * gapRatio;
  for (int i = 0; i < segments; i++) {
    float startAngle = i * angleStep + phase;
    float endAngle = startAngle + angleStep - gap;
    spr.drawArc(x, y, r, r - thickness, startAngle, endAngle, color);
  }
}

// ================== MODULES DE RENDU VISUEL ==================

static void renderPersistentHUD() {
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
  // Lecture du texte partagé de manière sécurisée (Mutexe déjà effectuée plus bas)
  spr.drawString(jarvisData.textLabel, CX, 210);
}

static void renderCoreJarvis() {
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
  
  if (local_state == OrbState::SPEAKING) {
    int points = 72;
    float base_r = dyn_radius + 20.0f;
    float last_x = -1, last_y = -1;
    
    for (int i = 0; i <= points; i++) {
        float a = (i % points) * (PI * 2.0f) / points;
        float wave = sin(a * 4.0f + g_phase * 2.5f) * 8.0f + 
                     cos(a * 6.0f - g_phase * 1.5f) * 4.0f;
                     
        float r = base_r + wave;
        float x = CX + cos(a) * r;
        float y = CY + sin(a) * r;
        
        if (i > 0) {
            spr.drawLine(last_x, last_y, x, y, dyn_color);
            spr.drawLine(last_x+1, last_y, x+1, y, dyn_color); 
        }
        last_x = x; last_y = y;
    }
  } else {
    drawSegmentedRing(CX, CY, dyn_radius + 40, 1, 36, g_phase * 30.0f, 0.8f, dyn_color);
  }
}

static void renderModeSystem() {
  drawSegmentedRing(CX, CY, 110, 8, 8, g_phase * 50.0f, 0.1f, COL_CYAN);
  drawSegmentedRing(CX, CY, 95, 2, 36, -g_phase * 80.0f, 0.5f, COL_BLUE);
  
  spr.setTextColor(COL_WHITE);
  spr.drawString("SYS.OPT", CX, CY - 25);
  
  int load = 40 + sin(g_phase*5.0f)*20; // Plus tard: jarvisData.sys.cpu_usage
  spr.drawRect(CX - 40, CY, 80, 12, COL_CYAN);
  spr.fillRect(CX - 38, CY + 2, (76 * load)/100, 8, COL_CYAN);

  spr.setTextColor(COL_GREEN); 
  spr.drawString("RAM: 1.2G", CX, CY + 30);
}

static void renderModeVision() {
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
  
  spr.setTextColor(COL_RED);
  spr.drawString("AI_LOCK", CX, CY - 40);
}

static void renderModeHome() {
  spr.drawArc(CX, CY, 50, 49, 0, 360, COL_BLUE);
  spr.drawArc(CX, CY, 100, 99, 0, 360, COL_BLUE);

  float scanA = g_phase * 2.0f;
  spr.fillTriangle(CX, CY, CX + cos(scanA)*120, CY + sin(scanA)*120, CX + cos(scanA - 0.2f)*120, CY + sin(scanA - 0.2f)*120, rgb565(0, 50, 100));
  spr.drawLine(CX, CY, CX + cos(scanA)*120, CY + sin(scanA)*120, COL_CYAN);
  
  struct Pt { float a; float d; const char* nm; };
  Pt nodes[] = { {0.5, 55, "LIV"}, {2.1, 95, "KIT"}, {4.8, 80, "BED"} };
  
  for(int i=0; i<3; i++) {
      float x = CX + cos(nodes[i].a)*nodes[i].d;
      float y = CY + sin(nodes[i].a)*nodes[i].d;
      spr.fillCircle(x, y, 4, COL_CYAN);
      spr.setTextColor(COL_WHITE); 
      spr.drawString(nodes[i].nm, x, y - 15);
  }
}

static void renderModeMedia() {
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

static void renderModeTimer() {
  int r = 80;
  int angleEnd = (int)((ms_time % 60000) / 60000.0f * 360.0f);
  
  spr.drawArc(CX, CY, r, r-5, 0, 360, rgb565(50, 50, 0));
  spr.drawArc(CX, CY, r, r-5, 0, angleEnd, COL_YELLOW);
  
  for(int i=0; i<12; i++) {
    float a = i * 30 * DEG_TO_RAD;
    spr.fillCircle(CX + cos(a)*(r+15), CY + sin(a)*(r+15), 3, COL_ORANGE);
  }
  
  spr.setTextColor(COL_WHITE);
  spr.drawString("TIMER", CX, CY); 
}

static void renderModeWeather() {
  drawGlow(CX, CY, 40, COL_YELLOW, 20);
  spr.fillCircle(CX, CY, 40, COL_YELLOW);
  drawSegmentedRing(CX, CY, 60, 4, 8, g_phase * 20.0f, 0.4f, COL_YELLOW);

  spr.setTextColor(COL_BG); 
  spr.drawString("24 C", CX, CY);
}

static void renderModePrint() {
  spr.drawRect(CX - 70, CY - 50, 140, 120, rgb565(40, 45, 50));
  
  int currentY = CY + 30 - (int)(((sin(g_phase * 0.2f) + 1.0f) / 2.0f) * 60.0f); 
  spr.drawFastHLine(CX - 68, currentY - 20, 136, rgb565(70, 75, 80));

  int bedY = CY + 40;
  drawGlow(CX, bedY, 50, COL_RED, 10);
  spr.fillRect(CX - 60, bedY, 120, 6, rgb565(120, 120, 120));

  for (int y = bedY - 2; y >= currentY; y -= 3) {
      spr.drawFastHLine(CX - 25, y, 50, COL_GREEN);
  }

  float nozzleX = CX + sin(g_phase * 2.5f) * 35.0f;
  spr.fillRect(nozzleX - 10, currentY - 25, 20, 15, rgb565(180, 180, 190));
  spr.fillTriangle(nozzleX - 4, currentY - 10, nozzleX + 4, currentY - 10, nozzleX, currentY, COL_ORANGE);
  spr.drawLine(nozzleX, CY - 50, nozzleX, currentY - 25, COL_WHITE);

  spr.setTextDatum(ML_DATUM);
  spr.setTextColor(COL_ORANGE);
  spr.drawString("T: 220C", CX - 65, CY - 65);
  
  spr.setTextDatum(MR_DATUM);
  spr.setTextColor(COL_RED);
  spr.drawString("B: 60C", CX + 65, CY - 65);

  spr.setTextDatum(MC_DATUM);
  spr.setTextColor(COL_CYAN);
  int percent = (int)(((sin(g_phase * 0.2f) + 1.0f) / 2.0f) * 100);
  // Plus tard: utiliser -> jarvisData.print.progress
  spr.drawString(String(percent) + "%", CX, CY + 60);
}

static void renderModeMatrix() {
  spr.setTextColor(COL_GREEN); 
  for(int i=0; i<18; i++) {
      int x = (i * 20) % 240;
      int y = ((ms_time/15 + i*40) % 240);
      spr.drawString(String((char)('0' + rand()%2)), x, y);
  }
}

static void renderModeGhost() {
  spr.fillCircle(CX, CY, 55 + sin(g_phase)*5, COL_DARK);
  spr.drawArc(CX, CY, 110, 108, 0, 360, rgb565(30,30,30));
  for(int x=-60; x<60; x+=3) {
      int y = CY + sin(x*0.2f + g_phase)*15;
      spr.drawPixel(CX+x, y, COL_GREY);
  }
}

static void renderModeError() {
  int shiftX = (rand()%10) - 5;
  int shiftY = (rand()%10) - 5;
  spr.setTextColor(COL_RED); 
  spr.drawString("ERROR", CX + shiftX, CY + shiftY);
  
  for(int i=0; i<8; i++) {
    int y = rand() % 240;
    spr.fillRect(0, y, 240, 4, rgb565(150,0,0));
  }
}

static void renderModeSuccess() {
  drawSegmentedRing(CX, CY, 85, 4, 1, 0, 0, COL_GREEN);
  spr.drawLine(CX-30, CY, CX-5, CY+25, COL_GREEN);
  spr.drawLine(CX-29, CY, CX-4, CY+25, COL_WHITE);
  spr.drawLine(CX-5, CY+25, CX+40, CY-30, COL_GREEN);
  spr.drawLine(CX-4, CY+25, CX+41, CY-30, COL_WHITE);
}

static void renderDefaultLocked() {
  drawSegmentedRing(CX, CY, 100, 5, 4, g_phase*50.0f, 0.2f, dyn_color);
  drawSegmentedRing(CX, CY, 80, 3, 8, -g_phase*70.0f, 0.4f, COL_WHITE);
  spr.setTextColor(COL_WHITE);
  spr.drawString("LOCKED", CX, CY);
}

// ================== LOGIQUE ==================
static void updateLogic() {
  // Capture de l'état asynchrone protégé par Mutex
  portENTER_CRITICAL(&jarvisData.spinlock);
  local_state = jarvisData.currentState;
  portEXIT_CRITICAL(&jarvisData.spinlock);

  float target_radius = 35.0f;
  float target_speed = 0.03f;
  uint16_t target_color = COL_CYAN;

  switch (local_state) {
    case OrbState::IDLE:      
        target_radius = 35.0f; target_speed = 0.02f; target_color = COL_CYAN; 
        break;
    case OrbState::LISTENING: 
        target_radius = 45.0f; target_speed = 0.05f; target_color = COL_GREEN; 
        break;
    case OrbState::SPEAKING:  
        target_radius = 42.0f + (sin(ms_time * 0.002f) * 6.0f); 
        target_speed = 0.04f; 
        target_color = COL_AI_VOICE; 
        break;
    case OrbState::ERROR:     target_radius = 20.0f; target_speed = 0.0f;  target_color = COL_RED; break;
    case OrbState::MODE_HOME: target_radius = 0.0f;  target_speed = 0.08f; target_color = COL_BLUE; break;
    case OrbState::MODE_VISION:target_radius= 0.0f;  target_speed = 0.10f; target_color = COL_RED; break;
    case OrbState::MODE_GHOST: target_radius= 10.0f; target_speed = 0.01f; target_color = COL_GREY; break;
    case OrbState::MODE_MEDIA: target_radius= 20.0f; target_speed = 0.10f; target_color = COL_PINK; break;
    case OrbState::MODE_SUCCESS:target_radius=0.0f;  target_speed = 0.05f; target_color = COL_GREEN; break;
    default:                  target_radius = 30.0f; target_speed = 0.05f; target_color = COL_CYAN; break;
  }

  dyn_radius += (target_radius - dyn_radius) * 0.1f;
  dyn_speed += (target_speed - dyn_speed) * 0.05f;
  dyn_color = lerpColor(dyn_color, target_color, 0.1f);
  g_phase += dyn_speed;

  if (local_state == OrbState::IDLE || local_state == OrbState::LISTENING || local_state == OrbState::SPEAKING) {
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

    if (local_state == OrbState::SPEAKING || local_state == OrbState::LISTENING) {
        float pull = (local_state == OrbState::SPEAKING) ? 0.015f : 0.01f;
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

// ================== CORE 1 : RENDER TASK ==================
void renderTask(void *pvParameters) {
  uint32_t lastFrame = 0;
  
  for (;;) {
    uint32_t now = millis();
    if (now - lastFrame >= 16) { // ~60 FPS MAX CAP
      ms_time = now;
      lastFrame = now;
      
      updateLogic();
      
      spr.fillScreen(COL_BG); 
      renderPersistentHUD();

      switch (local_state) {
        case OrbState::IDLE:
        case OrbState::LISTENING:
        case OrbState::SPEAKING:    renderCoreJarvis(); break;
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

      spr.pushSprite(0, 0); // Envoi DMA vers le TFT
    }
    
    // Libération CPU ultra courte pour watchdog
    vTaskDelay(pdMS_TO_TICKS(1)); 
  }
}
