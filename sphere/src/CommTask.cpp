#include "Tasks.h"
#include "JarvisData.h"

static void setStateFromStr(const String& s) {
  portENTER_CRITICAL(&jarvisData.spinlock);
  
  if (s == "IDLE") jarvisData.currentState = OrbState::IDLE;
  else if (s == "LISTENING") jarvisData.currentState = OrbState::LISTENING;
  else if (s == "SPEAKING") jarvisData.currentState = OrbState::SPEAKING;
  else if (s == "ERROR") jarvisData.currentState = OrbState::ERROR;
  else if (s == "WEATHER") jarvisData.currentState = OrbState::MODE_WEATHER;
  else if (s == "HOME") jarvisData.currentState = OrbState::MODE_HOME;
  else if (s == "SYSTEM") jarvisData.currentState = OrbState::MODE_SYSTEM;
  else if (s == "MATRIX") jarvisData.currentState = OrbState::MODE_MATRIX;
  else if (s == "SEARCH") jarvisData.currentState = OrbState::MODE_SEARCH;
  else if (s == "PRINT") jarvisData.currentState = OrbState::MODE_PRINT;
  else if (s == "TIMER") jarvisData.currentState = OrbState::MODE_TIMER;
  else if (s == "MEDIA") jarvisData.currentState = OrbState::MODE_MEDIA;
  else if (s == "SUCCESS") jarvisData.currentState = OrbState::MODE_SUCCESS;
  else if (s == "VISION") jarvisData.currentState = OrbState::MODE_VISION;
  else if (s == "GHOST") jarvisData.currentState = OrbState::MODE_GHOST;
  else if (s == "SECURITY") jarvisData.currentState = OrbState::MODE_SECURITY;

  portEXIT_CRITICAL(&jarvisData.spinlock);
}

static void handleLine(String line) {
  line.trim();
  if (!line.length()) return;

  if (line.startsWith("STATE ")) {
    setStateFromStr(line.substring(6));
  }
  else if (line.startsWith("TEXT ")) {
    portENTER_CRITICAL(&jarvisData.spinlock);
    String t = line.substring(5);
    t.toCharArray(jarvisData.textLabel, sizeof(jarvisData.textLabel));
    portEXIT_CRITICAL(&jarvisData.spinlock);
  }
}

// ================== CORE 0 : COMMUNICATION TASK ==================
void commTask(void *pvParameters) {
  Serial.println("[Core 0] CommTask started.");
  String line;
  line.reserve(256);

  for (;;) {
    // 1. GESTION DES COMMANDES UART
    while (Serial.available()) {
      char c = (char)Serial.read();
      if (c == '\n') { 
          handleLine(line); 
          line = ""; 
      }
      else if (c != '\r') { 
          line += c; 
          if (line.length() > 200) line = ""; 
      }
    }
    
    // 2. SIMULATION DE DONNEES POUR LE FUTUR (Exemple)
    // Ici, vous pourriez interroger le WiFi, lire du MQTT, parser du JSON,
    // sans JAMAIS bloquer le rafraîchissement d'écran du Core 1.

    // On rend la main au processeur pendant 10ms (Économie d'énergie)
    vTaskDelay(pdMS_TO_TICKS(10));
  }
}
