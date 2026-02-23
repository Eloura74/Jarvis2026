#include "globals.h"
#include "utils.h"
#include "renderer.h"
#include "modes.h"

// ==============================================================================
// renderer.cpp — Moteur de rendu principal (Core 1)
// ==============================================================================

// ==============================================================================
// updateLogic — Interpolation spring des paramètres dynamiques
// Lit l'état partagé (thread-safe), calcule les cibles et applique
// une physique de ressort amorti pour les transitions fluides.
// ==============================================================================
void updateLogic() {
  // Copie thread-safe de l'état partagé vers les variables locales Core 1
  portENTER_CRITICAL(&jarvisData.spinlock);
  OrbState previous_state = local_state;
  local_state = jarvisData.currentState;
  strncpy(local_text, jarvisData.textLabel, sizeof(local_text));
  portEXIT_CRITICAL(&jarvisData.spinlock);

  // Gestion de la transition automatique vers le screensaver après 30s d'IDLE
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

  // Calcul des paramètres cibles selon l'état courant
  float target_radius = 65.0f;
  float target_speed  = 0.03f;
  uint16_t target_color = COL_OMNI_BLUE;

  if (local_state == OrbState::SPEAKING) {
    target_radius = 75.0f + (sin(g_phase * 1.5f) * 12.0f);
    target_speed  = 0.08f;
    target_color  = COL_OMNI_RED;
  } else if (local_state == OrbState::LISTENING) {
    target_radius = 70.0f + (sin(g_phase * 0.8f) * 6.0f);
    target_speed  = 0.04f;
    target_color  = COL_CYAN;
  } else if (local_state == OrbState::IDLE) {
    target_radius = 65.0f + (sin(g_phase * 0.5f) * 3.0f);
    target_speed  = 0.02f;
    target_color  = COL_OMNI_BLUE;
  } else {
    switch (local_state) {
      case OrbState::ERROR:            target_radius = 20.0f; target_speed = 0.0f;   target_color = COL_RED;   break;
      case OrbState::MODE_HOME:        target_radius = 0.0f;  target_speed = 0.08f;  target_color = COL_BLUE;  break;
      case OrbState::MODE_VISION:      target_radius = 0.0f;  target_speed = 0.10f;  target_color = COL_RED;   break;
      case OrbState::MODE_GHOST:       target_radius = 10.0f; target_speed = 0.01f;  target_color = COL_GREY;  break;
      case OrbState::MODE_MEDIA:       target_radius = 20.0f; target_speed = 0.10f;  target_color = COL_PINK;  break;
      case OrbState::MODE_SUCCESS:     target_radius = 0.0f;  target_speed = 0.05f;  target_color = COL_GREEN; break;
      case OrbState::MODE_SCREENSAVER: target_radius = 0.0f;  target_speed = 0.012f; target_color = COL_CYAN;  break;
      case OrbState::MODE_WHATSAPP:    target_radius = 10.0f; target_speed = 0.06f;  target_color = COL_GREEN; break;
      case OrbState::MODE_GMAIL:       target_radius = 5.0f;  target_speed = 0.07f;  target_color = COL_RED;   break;
      case OrbState::MODE_CALENDAR:    target_radius = 5.0f;  target_speed = 0.05f;  target_color = COL_CYAN;  break;
      default:                         target_radius = 30.0f; target_speed = 0.05f;  target_color = COL_CYAN;  break;
    }
  }

  // Physique de ressort amorti : tension=0.08, dampening=0.75
  // Donne des transitions fluides sans oscillation excessive
  const float tension   = 0.08f;
  const float dampening = 0.75f;

  v_radius = (v_radius + (target_radius - dyn_radius) * tension) * dampening;
  dyn_radius += v_radius;

  v_speed = (v_speed + (target_speed - dyn_speed) * tension) * dampening;
  dyn_speed += v_speed;

  dyn_color = lerpColor(dyn_color, target_color, 0.15f);
  g_phase  += dyn_speed;
}

// ==============================================================================
// renderOmniSphere — Sphère 3D animée (IDLE, LISTENING, SPEAKING)
// Projection perspective avec déformation de surface par bruit sinusoïdal
// ==============================================================================
void renderOmniSphere() {
  drawRadialBackground();

  // Halo externe autour de la sphère
  for (int r = (int)(dyn_radius * 0.85f) + 25; r > (int)(dyn_radius * 0.85f); r -= 3) {
    float factor = 1.0f - ((float)(r - dyn_radius * 0.85f) / 25.0f);
    uint16_t fadeCol = lerpColor(COL_BG, dyn_color, factor * factor);
    spr.drawCircle(CX, CY, r, fadeCol);
  }

  // Rotation 3D : axe Y continu + axe X oscillant lentement
  float rotY = g_phase * 1.5f;
  float rotX = sin(g_phase * 0.4f) * 0.4f;
  float cosY = cos(rotY), sinY = sin(rotY);
  float cosX = cos(rotX), sinX = sin(rotX);

  // Déformation de surface plus prononcée en mode SPEAKING
  float freq          = (local_state == OrbState::SPEAKING) ? 3.5f : 2.0f;
  float waveAmplitude = (local_state == OrbState::SPEAKING) ? 0.30f : 0.12f;
  float pulsePhase    = g_phase * 2.5f;

  // Projection de chaque nœud de la sphère
  for (int i = 0; i < SPHERE_NODES; i++) {
    float bx = sphereBase[i].x;
    float by = sphereBase[i].y;
    float bz = sphereBase[i].z;

    // Bruit de surface sinusoïdal pour l'effet organique
    float n1    = sin(bx * freq + pulsePhase) * cos(by * freq - pulsePhase);
    float n2    = sin(bz * (freq * 1.2f) - pulsePhase * 1.2f);
    float noise = (n1 + n2) * waveAmplitude;
    float r     = dyn_radius * (1.0f + noise);

    float x = bx * r, y = by * r, z = bz * r;

    // Rotation Y puis X
    float x_rot = x * cosY - z * sinY;
    float z_rot = x * sinY + z * cosY;
    float y_rot = y * cosX - z_rot * sinX;
    z_rot       = y * sinX + z_rot * cosX;

    float perspective    = 200.0f / (200.0f + z_rot);
    renderBuffer[i].x    = CX + (int)(x_rot * perspective);
    renderBuffer[i].y    = CY + (int)(y_rot * perspective);
    renderBuffer[i].z    = z_rot;
  }

  // Passe 1 : nœuds arrière (z > 0) — couleur atténuée
  uint16_t backCol = lerpColor(COL_BG, dyn_color, 0.15f);
  for (int i = 0; i < SPHERE_NODES; i++) {
    if (renderBuffer[i].z > 0.0f) {
      spr.fillCircle(renderBuffer[i].x, renderBuffer[i].y, 1, backCol);
    }
  }

  // Passe 2 : nœuds avant (z <= 0) — taille et couleur selon profondeur
  for (int i = 0; i < SPHERE_NODES; i++) {
    if (renderBuffer[i].z <= 0.0f) {
      float depth = abs(renderBuffer[i].z) / dyn_radius;
      if (depth > 1.0f) depth = 1.0f;

      uint16_t baseCol = lerpColor(dyn_color, COL_WHITE, depth * 0.8f);

      // Éclairage directionnel simulé (haut = plus clair, bas = plus sombre)
      float lightFactor = (float)(renderBuffer[i].y - CY) / dyn_radius;
      if (lightFactor > 0.0f) {
        baseCol = lerpColor(baseCol, COL_BG, lightFactor * 0.6f);
      } else {
        baseCol = lerpColor(baseCol, COL_WHITE, abs(lightFactor) * 0.3f);
      }

      // Taille du point selon la profondeur (plus grand = plus proche)
      if      (depth > 0.65f) spr.fillCircle(renderBuffer[i].x, renderBuffer[i].y, 3, baseCol);
      else if (depth > 0.25f) spr.fillCircle(renderBuffer[i].x, renderBuffer[i].y, 2, baseCol);
      else                    spr.fillCircle(renderBuffer[i].x, renderBuffer[i].y, 1, baseCol);
    }
  }
}

// ==============================================================================
// renderPersistentHUD — Éléments d'interface permanents
// Anneau de bord, repères cardinaux, LED d'activité, label texte bas
// ==============================================================================
void renderPersistentHUD() {
  // Anneau de bord bleu profond
  spr.fillArc(CX, CY, 119, 118, 0, 360, COL_DEEP_BLUE);

  // Repères cardinaux (4 petits traits)
  spr.fillRect(CX - 1, 0,   2, 6, COL_GREY);
  spr.fillRect(CX - 1, 234, 2, 6, COL_GREY);
  spr.fillRect(0,   CY - 1, 6, 2, COL_GREY);
  spr.fillRect(234, CY - 1, 6, 2, COL_GREY);

  // LED d'activité clignotante (vert si actif, vert sombre sinon)
  bool blink = (sin(g_phase * 5.0f) > 0);
  uint16_t ledCol = blink ? COL_GREEN : rgb565(0, 40, 0);
  spr.fillRect(115, 6, 4, 3, ledCol);
  spr.fillRect(121, 6, 4, 3, ledCol);
  spr.fillRect(127, 6, 4, 3, rgb565(20, 20, 20));

  // Label texte centré en bas (local_text mis à jour par commTask)
  spr.setTextDatum(MC_DATUM);
  spr.setTextColor(dyn_color);
  spr.setFont(&fonts::FreeSans9pt7b);
  spr.drawString(local_text, CX - (spr.textWidth(local_text) / 2), 210);
}

// ==============================================================================
// renderTask — Boucle de rendu FreeRTOS (Core 1)
// 30 FPS nominal, 15 FPS en veille profonde (>2 min en screensaver)
// ==============================================================================
void renderTask(void *pvParameters) {
  TickType_t xLastWakeTime = xTaskGetTickCount();

  for (;;) {
    ms_time = millis();
    updateLogic();

    // Framerate adaptatif : 15 FPS en veille profonde pour réduire la chaleur
    bool deepSleep = (local_state == OrbState::MODE_SCREENSAVER)
                     && (millis() - g_screensaver_start > 120000UL);
    TickType_t xFrequency = pdMS_TO_TICKS(deepSleep ? 66 : 33);

    spr.fillScreen(COL_BG);

    // Dispatch vers le renderer du mode actif
    switch (local_state) {
      case OrbState::IDLE:
      case OrbState::LISTENING:
      case OrbState::SPEAKING:         renderOmniSphere();      break;
      case OrbState::MODE_SYSTEM:      renderModeSystem();      break;
      case OrbState::MODE_VISION:      renderModeVision();      break;
      case OrbState::MODE_HOME:        renderModeHome();        break;
      case OrbState::MODE_GHOST:       renderModeGhost();       break;
      case OrbState::ERROR:            renderModeError();       break;
      case OrbState::MODE_SUCCESS:     renderModeSuccess();     break;
      case OrbState::MODE_MEDIA:       renderModeMedia();       break;
      case OrbState::MODE_WEATHER:     renderModeWeather();     break;
      case OrbState::MODE_TIMER:       renderModeTimer();       break;
      case OrbState::MODE_PRINT:       renderModePrint();       break;
      case OrbState::MODE_MATRIX:      renderModeMatrix();      break;
      case OrbState::MODE_SCREENSAVER: renderModeScreensaver(); break;
      case OrbState::MODE_WHATSAPP:    renderModeWhatsapp();    break;
      case OrbState::MODE_GMAIL:       renderModeGmail();       break;
      case OrbState::MODE_CALENDAR:    renderModeCalendar();    break;
      case OrbState::MODE_MAP:          renderModeMap();         break;
      default:                         renderDefaultLocked();   break;
    }

    // HUD persistant sur tous les modes sauf screensaver
    if (local_state != OrbState::MODE_SCREENSAVER) {
      renderPersistentHUD();
    }

    spr.pushSprite(0, 0);
    vTaskDelayUntil(&xLastWakeTime, xFrequency);
  }
}
