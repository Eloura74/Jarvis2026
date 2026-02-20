#pragma once

#include <Arduino.h>

// Déclarations des tâches FreeRTOS
void commTask(void *pvParameters);
void renderTask(void *pvParameters);
