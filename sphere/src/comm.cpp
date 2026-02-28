#include "globals.h"
#include "comm.h"

// ==============================================================================
// comm.cpp — Parseur série UART (Core 0)
// Protocole : une commande par ligne, terminée par \n
//   STATE <NOM>  ou  MODE <NOM>  → change l'état de l'orb
//   THEME <NOM>                  → change le thème de la sphère
//   TEXT <texte>                 → met à jour le label affiché
//   PING                         → répond PONG (test de connexion)
// ==============================================================================

// Convertit un nom d'état (string) en OrbState enum
// Appelé depuis handleLine(), protégé par spinlock avant écriture
static void setStateFromStr(const char* s_ptr) {
  String s = String(s_ptr);
  s.trim();
  s.toUpperCase();

  OrbState newState = jarvisData.currentState;

  if      (s == "IDLE"     || s == "STANDBY")   newState = OrbState::IDLE;
  else if (s == "LISTENING")                     newState = OrbState::LISTENING;
  else if (s == "SPEAKING" || s == "RECEIVING")  newState = OrbState::SPEAKING;
  else if (s == "ERROR")                         newState = OrbState::ERROR;
  else if (s == "WEATHER")                       newState = OrbState::MODE_WEATHER;
  else if (s == "HOME")                          newState = OrbState::MODE_HOME;
  else if (s == "SYSTEM")                        newState = OrbState::MODE_SYSTEM;
  else if (s == "MATRIX")                        newState = OrbState::MODE_MATRIX;
  else if (s == "SEARCH")                        newState = OrbState::MODE_SEARCH;
  else if (s == "MEDIA")                         newState = OrbState::MODE_MEDIA;
  else if (s == "TIMER")                         newState = OrbState::MODE_TIMER;
  else if (s == "PRINT")                         newState = OrbState::MODE_PRINT;
  else if (s == "NOTIF")                         newState = OrbState::MODE_NOTIFICATION;
  else if (s == "SUCCESS")                       newState = OrbState::MODE_SUCCESS;
  else if (s == "APPS")                          newState = OrbState::MODE_APPS;
  else if (s == "VISION")                        newState = OrbState::MODE_VISION;
  else if (s == "GHOST")                         newState = OrbState::MODE_GHOST;
  else if (s == "SECURITY")                      newState = OrbState::MODE_SECURITY;
  else if (s == "WHATSAPP")                      newState = OrbState::MODE_WHATSAPP;
  else if (s == "GMAIL")                         newState = OrbState::MODE_GMAIL;
  else if (s == "CALENDAR")                      newState = OrbState::MODE_CALENDAR;
  else if (s == "MAP"     || s == "TRAJET")      newState = OrbState::MODE_MAP;

  // Écriture thread-safe : le Core 1 lit jarvisData en permanence
  portENTER_CRITICAL(&jarvisData.spinlock);
  if (jarvisData.currentState != newState) {
    jarvisData.currentState = newState;
    // Effacer le label sauf pour les états vocaux (IDLE/SPEAKING/LISTENING)
    if (newState != OrbState::SPEAKING &&
        newState != OrbState::LISTENING &&
        newState != OrbState::IDLE) {
      strcpy(jarvisData.textLabel, "");
    }
  }
  portEXIT_CRITICAL(&jarvisData.spinlock);
}

// Convertit un nom de thème en AppTheme enum
static void setThemeFromStr(const char* s_ptr) {
  String s = String(s_ptr);
  s.trim();
  s.toUpperCase();

  AppTheme newTheme = jarvisData.currentTheme;

  if      (s == "CLASSIC")   newTheme = AppTheme::CLASSIC;
  else if (s == "IRONMAN")   newTheme = AppTheme::IRONMAN;
  else if (s == "MATRIX")    newTheme = AppTheme::MATRIX;
  else if (s == "COPPER")    newTheme = AppTheme::COPPER;
  else if (s == "WOOD")      newTheme = AppTheme::WOOD;

  portENTER_CRITICAL(&jarvisData.spinlock);
  if (jarvisData.currentTheme != newTheme) {
    jarvisData.currentTheme = newTheme;
  }
  portEXIT_CRITICAL(&jarvisData.spinlock);
}

// Traite une ligne complète reçue sur le port série
static void handleLine(const char* line) {
  if (strlen(line) == 0) return;

  // Test de connexion
  if (strcmp(line, "PING") == 0) {
    Serial.println("PONG");
    return;
  }

  // Changement d'état : "STATE LISTENING" ou "MODE PRINT"
  if (strncmp(line, "STATE ", 6) == 0) {
    setStateFromStr(line + 6);
    Serial.println("OK MODE");
    return;
  }
  
  if (strncmp(line, "MODE ", 5) == 0) {
    setStateFromStr(line + 5);
    Serial.println("OK MODE");
    return;
  }

  // Changement de thème : "THEME WOOD"
  if (strncmp(line, "THEME ", 6) == 0) {
    setThemeFromStr(line + 6);
    Serial.println("OK THEME");
    return;
  }

  // Mise à jour du label texte : "TEXT 22°C" ou "TEXT JARVIS"
  if (strncmp(line, "TEXT ", 5) == 0) {
    portENTER_CRITICAL(&jarvisData.spinlock);
    strncpy(jarvisData.textLabel, line + 5, sizeof(jarvisData.textLabel) - 1);
    jarvisData.textLabel[sizeof(jarvisData.textLabel) - 1] = '\0';
    portEXIT_CRITICAL(&jarvisData.spinlock);
    Serial.println("OK TEXT");
    return;
  }
}

// Tâche FreeRTOS épinglée sur Core 0 — lit le port série en continu
// Accumule les caractères dans un buffer jusqu'au \n, puis traite la ligne
void commTask(void *pvParameters) {
  Serial.println("[Core 0] Tâche UART prête.");
  char buffer[256];
  uint16_t bufferIdx = 0;

  for (;;) {
    while (Serial.available()) {
      char c = (char)Serial.read();
      if (c == '\n') {
        // Ligne complète : traiter et vider le buffer
        buffer[bufferIdx] = '\0';
        handleLine(buffer);
        bufferIdx = 0;
      } else if (c != '\r' && bufferIdx < sizeof(buffer) - 1) {
        buffer[bufferIdx++] = c;
      }
    }
    // Céder le CPU 10ms pour ne pas saturer le Core 0
    vTaskDelay(pdMS_TO_TICKS(10));
  }
}
