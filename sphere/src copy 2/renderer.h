#pragma once
#include "globals.h"

// ==============================================================================
// renderer.h — Moteur de rendu principal (Core 1)
// Sphère 3D, HUD persistant, logique d'animation, tâche FreeRTOS
// ==============================================================================

// Met à jour les variables dynamiques (radius, speed, color) selon l'état courant
// et gère la transition automatique vers le screensaver après 30s d'inactivité
void updateLogic();

// Rendu de la sphère 3D animée (états IDLE, LISTENING, SPEAKING)
void renderOmniSphere();

// HUD persistant : anneau de bord, repères cardinaux, LED clignotante, label texte
// Affiché sur tous les modes sauf le screensaver
void renderPersistentHUD();

// Tâche FreeRTOS épinglée sur Core 1 — boucle de rendu à 30 FPS (15 FPS en veille)
void renderTask(void *pvParameters);
