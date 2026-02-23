#pragma once
#include "globals.h"

// ==============================================================================
// comm.h — Parseur série UART (Core 0)
// Reçoit les commandes STATE/MODE/TEXT depuis le backend Node.js
// ==============================================================================

// Tâche FreeRTOS Core 0 : lit le port série et met à jour jarvisData
void commTask(void *pvParameters);
