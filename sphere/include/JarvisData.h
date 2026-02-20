#pragma once

#include "Config.h"
#include <Arduino.h>

// Structures de données pour des données réelles
struct SystemStats {
    uint8_t cpu_usage = 0;
    float ram_gb = 0.0f;
    bool net_ok = false;
};

struct PrinterStats {
    float nozzle_temp = 0.0f;
    float bed_temp = 0.0f;
    uint8_t progress = 0;
};

struct JarvisState {
    OrbState currentState = OrbState::IDLE;
    char textLabel[64] = "SYS_READY";
    
    SystemStats sys;
    PrinterStats print;
    
    // Mutex pour la protection Multi-Core FreeRTOS
    portMUX_TYPE spinlock = portMUX_INITIALIZER_UNLOCKED; 
};

// Instance Globale Partagée
extern JarvisState jarvisData;
