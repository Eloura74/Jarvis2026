// ==============================================================================
// main.cpp — Point d'entrée JARVIS OS V7.2 (ESP32-S3 + GC9A01)
// Contient uniquement : définitions des variables globales + setup()
// Toute la logique est répartie dans :
//   comm.cpp         -> parseur UART (Core 0)
//   renderer.cpp     -> moteur de rendu (Core 1)
//   modes_render.cpp -> renderers des modes spéciaux
//   modes_globe.cpp  -> screensaver Arc Reactor + données PROGMEM globe
//   utils.cpp        -> couleurs, maths, primitives graphiques
// ==============================================================================

#include "globals.h"
#include "utils.h"
#include "comm.h"
#include "renderer.h"

// ==============================================================================
// DÉFINITIONS DES OBJETS ÉCRAN (déclarés extern dans globals.h)
// ==============================================================================
LGFX display;
lgfx::LGFX_Sprite spr(&display);

// ==============================================================================
// ÉTAT PARTAGÉ MULTI-CORE (accès protégé par spinlock FreeRTOS)
// ==============================================================================
JarvisState jarvisData;

// ==============================================================================
// CONSTANTES GÉOMÉTRIQUES
// ==============================================================================
const int CX = 120;
const int CY = 120;

// ==============================================================================
// VARIABLES D'ANIMATION GLOBALES
// ==============================================================================
float    g_phase = 0.0f;
uint32_t ms_time = 0;

// Variables de veille (screensaver)
float         g_sleep_phase       = 0.0f;
uint16_t      g_sleep_color       = 0;
DustParticle  g_dust[8];
bool          g_dust_init         = false;
unsigned long g_screensaver_start = 0;

// ==============================================================================
// MOTEUR 3D — Géométrie de la sphère (distribution de Fibonacci, 450 nœuds)
// ==============================================================================
const int  SPHERE_NODES = 450;
Point3D    sphereBase[SPHERE_NODES];
ProjPoint  renderBuffer[SPHERE_NODES];

// ==============================================================================
// VARIABLES DYNAMIQUES — Interpolation spring (radius, speed, color)
// ==============================================================================
float    dyn_radius = 65.0f;
float    v_radius   = 0.0f;
float    dyn_speed  = 0.05f;
float    v_speed    = 0.0f;
uint16_t dyn_color  = 0; // Initialisé dans setup() après la palette (COL_OMNI_BLUE)

// ==============================================================================
// ÉTAT LOCAL CORE 1 — Copie thread-safe de jarvisData (mise à jour par updateLogic)
// ==============================================================================
OrbState      local_state    = OrbState::IDLE;
AppTheme      local_theme    = AppTheme::CLASSIC;
char          local_text[64] = "STANDBY";
unsigned long idleStartTime  = 0;

// ==============================================================================
// setup — Initialisation de l'écran, de la géométrie 3D et des tâches FreeRTOS
// Appelé une seule fois au démarrage par le framework Arduino/ESP-IDF.
// ==============================================================================
void setup() {
  Serial.begin(115200);
  delay(200);

  // Initialisation de l'écran GC9A01 via LovyanGFX
  display.init();
  display.setRotation(0);

  // Création du sprite double-buffer 240x240 (rendu hors-écran, évite le tearing)
  spr.createSprite(240, 240);
  spr.setSwapBytes(true);

  // Initialisation de la couleur dynamique de départ
  // COL_OMNI_BLUE est une constante définie dans utils.cpp
  dyn_color = COL_OMNI_BLUE;

  // Génération de la géométrie sphérique par distribution de Fibonacci
  // Produit une répartition uniforme des 450 nœuds sur la surface
  init3DGeometry();

  Serial.println("JARVIS OS V7.2 - OPTIMIZED THERMAL RENDERER ONLINE");

  // Création des tâches FreeRTOS sur les deux cœurs
  // Core 0 : parseur UART (priorité 1, stack 4Ko) — commTask dans comm.cpp
  xTaskCreatePinnedToCore(commTask,   "CommTask",   4096, NULL, 1, NULL, 0);
  // Core 1 : moteur de rendu (priorité 2, stack 8Ko) — renderTask dans renderer.cpp
  xTaskCreatePinnedToCore(renderTask, "RenderTask", 8192, NULL, 2, NULL, 1);
}

// loop() vide : FreeRTOS prend le contrôle via les tâches créées dans setup()
void loop() {}
