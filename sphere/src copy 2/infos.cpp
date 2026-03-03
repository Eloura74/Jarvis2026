#include "infos.h"
#include <Arduino.h> // <--- INDISPENSABLE pour Serial, millis(), delay()
#include <WiFi.h>    // <--- INDISPENSABLE pour WiFi.RSSI()

// Initialisation des variables
unsigned long last_diag_time = 0;
int frame_count = 0;

void printDiagnostics() {
    // Exécuter seulement toutes les 2 secondes
    if (millis() - last_diag_time < 2000) return;
    
    // --- 1. Température Interne (CPU) ---
    float temp = temperatureRead(); 

    // --- 2. Mémoire (RAM) ---
    uint32_t freeHeap = ESP.getFreeHeap();
    uint32_t minFreeHeap = ESP.getMinFreeHeap(); 
    uint32_t totalHeap = ESP.getHeapSize();
    
    // --- 3. Wi-Fi (RSSI) ---
    // On vérifie si le Wifi est connecté avant de demander le RSSI pour éviter des bugs
    int8_t rssi = 0;
    if(WiFi.status() == WL_CONNECTED) {
        rssi = WiFi.RSSI();
    }
    
    // --- 4. Performance Graphique (FPS) ---
    float fps = frame_count / ((millis() - last_diag_time) / 1000.0f);
    
    // --- 5. Affichage ---
    Serial.println("\n=== JARVIS DIAGNOSTICS ===");
    Serial.printf("[CPU] Temp: %.1f C\n", temp);
    Serial.printf("[MEM] Free: %d KB / %d KB (Min: %d KB)\n", 
                  freeHeap / 1024, totalHeap / 1024, minFreeHeap / 1024);
    
    if(WiFi.status() == WL_CONNECTED) {
        Serial.printf("[NET] Signal: %d dBm (IP: %s)\n", 
                  rssi, WiFi.localIP().toString().c_str());
    } else {
        Serial.println("[NET] WiFi not connected");
    }
                  
    Serial.printf("[GPU] FPS: %.1f\n", fps);
    Serial.printf("[SYS] Uptime: %lu s\n", millis() / 1000);
    Serial.println("==========================\n");

    // Reset des compteurs
    last_diag_time = millis();
    frame_count = 0;
}