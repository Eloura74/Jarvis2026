// ==============================================================================
// modes_globe.cpp — Screensaver : Arc Reactor Voxel-Slicing (Hologramme Jarvis)
// Moteur 3D complet par projection perspective + tri de profondeur (Algorithme du Peintre).
// Remplace l'ancien globe PROGMEM. Compatible LovyanGFX + système de thèmes.
// Matériel cible : ESP32-S3 + GC9A01 240x240
// ==============================================================================

#include "globals.h"
#include "modes.h"
#include "utils.h"
#include <vector>
#include <algorithm>

// Accès au sprite partagé (défini dans main.cpp)
extern lgfx::LGFX_Sprite spr;

// Variables de veille partagées (définies dans main.cpp)
extern float     g_sleep_phase;
extern uint16_t  g_sleep_color;   // Couleur accent du thème actif

// ==============================================================================
// PALETTE FIXE — Cuivre + Carbone
// Complète la palette dynamique g_sleep_color sans la remplacer.
// ==============================================================================
#define COL_COPPER_BRIGHT  rgb565(253, 100, 50)   // Cuivre très éclairé (reflet)
#define COL_COPPER_MID     rgb565(180,  80, 30)   // Cuivre neutre
#define COL_COPPER_DARK    rgb565( 80,  35,  5)   // Cuivre dans l'ombre
#define COL_CARBON_MID     rgb565( 30,  35, 40)   // Gris carbone lumineux
#define COL_CARBON_SHADOW  rgb565(  5,   6,  8)   // Carbone sombre
#define COL_METAL_HL       rgb565( 60,  75, 90)   // Reflet aluminium brossé
#define SS_BG              rgb565(  2,   3,  5)   // Fond noir quasi-pur

// ==============================================================================
// TYPES DE COMPOSANTS DU RÉACTEUR
// ==============================================================================
enum PartType {
    PT_BASE,      // Radiateur de base (disque plein, gravure laser)
    PT_PLAIN,     // Anneau intermédiaire simple
    PT_TORUS,     // Tore avec bobines de cuivre animées
    PT_GLOWRING,  // Anneau néon thématisé
    PT_CORE,      // Noyau plasma (glow multicouche)
    PT_LASER      // Câble d'énergie central (visible à l'état éclaté)
};

// ==============================================================================
// STRUCTURE DE TRANCHE 3D (Voxel Slice)
// Unité de rendu du moteur : représente une coupe horizontale d'un composant.
// ==============================================================================
struct Slice {
    float    z;           // Profondeur sur l'axe vertical du réacteur
    float    r_out;       // Rayon extérieur
    float    r_in;        // Rayon intérieur (0 = disque plein)
    uint16_t col;         // Couleur pré-calculée (ombrage AO inclus)
    bool     isTop;       // Vrai pour la dernière tranche du composant
    PartType type;        // Type pour rendu spécialisé
    float    spin;        // Angle de rotation propre (bobines du tore)
    float    depthAlpha;  // Facteur d'ambiance stocké pour ombrage du cuivre
};

// Limites Z de la scène — servent au calcul de l'Ambient Occlusion
static const float Z_MIN = -80.0f;
static const float Z_MAX =  50.0f;

// ==============================================================================
// clamp01 — Borne un float entre 0.0 et 1.0
// ==============================================================================
static inline float clamp01(float x) {
    return x < 0.0f ? 0.0f : (x > 1.0f ? 1.0f : x);
}

// ==============================================================================
// drawThickEllipse — Trace un anneau elliptique épais par interpolation de rayons.
// Contourne l'absence de primitive anneau native dans LovyanGFX.
// Paramètres rx_out/ry_out : demi-axes extérieurs, rx_in/ry_in : demi-axes intérieurs.
// ==============================================================================
static void drawThickEllipse(int cx, int cy,
                              float rx_out, float ry_out,
                              float rx_in,  float ry_in,
                              uint16_t col) {
    float drx   = rx_out - rx_in;
    float dry   = ry_out - ry_in;
    // Nombre de pas = épaisseur max + 1 pour combler tous les pixels
    int   steps = (int)max(drx, dry) + 1;
    for (int i = 0; i <= steps; i++) {
        float f = (float)i / (float)steps;
        spr.drawEllipse(cx, cy,
                        (int)(rx_in + drx * f),
                        (int)(ry_in + dry * f),
                        col);
    }
}

// ==============================================================================
// addCylinder — Génère les tranches (slices) d'un composant cylindrique.
// Applique l'Ambient Occlusion : les couches hautes (Z grand) sont plus lumineuses.
// Paramètres :
//   slices   : vecteur de sortie (accumulation)
//   zCenter  : centre Z du composant
//   thick    : épaisseur totale sur Z
//   r_out/in : rayons extérieur/intérieur (r_in=0 pour disque plein)
//   steps    : résolution (nombre de tranches intermédiaires)
//   colSide  : couleur des tranches intermédiaires
//   colTop   : couleur de la tranche de tête
//   type     : type de composant (rendu spécialisé)
//   spin     : angle de rotation propre (tore uniquement)
// ==============================================================================
static void addCylinder(std::vector<Slice>& slices,
                        float zCenter, float thick,
                        float r_out,  float r_in,
                        int steps, uint16_t colSide, uint16_t colTop,
                        PartType type, float spin = 0.0f) {
    float dz     = thick / (float)steps;
    float startZ = zCenter - thick * 0.5f;
    for (int i = 0; i <= steps; i++) {
        float currentZ = startZ + (float)i * dz;
        // AO : puissance 0.7 pour un dégradé plus doux dans les ombres
        float ao = powf(clamp01((currentZ - Z_MIN) / (Z_MAX - Z_MIN)), 0.7f);
        // La tranche de tête reçoit colTop, les autres reçoivent colSide
        uint16_t raw     = (i == steps) ? colTop : colSide;
        uint16_t shaded  = lerpColor(SS_BG, raw, ao);
        Slice s;
        s.z          = currentZ;
        s.r_out      = r_out;
        s.r_in       = r_in;
        s.col        = shaded;
        s.isTop      = (i == steps);
        s.type       = type;
        s.spin       = spin;
        s.depthAlpha = ao;
        slices.push_back(s);
    }
}

// ==============================================================================
// renderModeScreensaver — Moteur Arc Reactor Holographique (Voxel-Slicing)
// Pipeline : modélisation → tri Z → projection → rendu spécialisé par type.
// Utilise g_sleep_phase comme temps et g_sleep_color comme couleur du thème actif.
// ==============================================================================
void renderModeScreensaver() {

    // ── 0. TEMPS ─────────────────────────────────────────────────────────────
    g_sleep_phase += 0.015f;
    float t = g_sleep_phase;

    // ── 1. PALETTE THÉMATISÉE ─────────────────────────────────────────────────
    // colNeon  : couleur vive du thème (ex. cyan Classic, rouge Ironman…)
    // colCore  : mélange thème + blanc pur pour le noyau plasma
    // colDark  : version sombre du thème pour les ombres / câbles
    uint16_t colNeon = g_sleep_color;
    uint16_t colCore = lerpColor(g_sleep_color, rgb565(240, 248, 255), 0.5f);
    uint16_t colDark = lerpColor(SS_BG, g_sleep_color, 0.25f);

    // ── 2. ANIMATION ET PARAMÈTRES CAMÉRA ────────────────────────────────────
    // Facteur d'éclatement : oscillation sinusoïdale lente (0 → 1 → 0)
    float explode = (sinf(t * 1.5f) + 1.0f) * 0.5f;
    float camYaw  = t * 0.3f;               // Rotation continue du tore
    // Inclinaison caméra oscillante (perspective variable)
    float pitch   = 0.5f + sinf(t * 0.5f) * 0.12f;
    float fov     = 450.0f;                  // Distance focale (projection perspective)

    // ── 3. MODÉLISATION 3D ───────────────────────────────────────────────────
    std::vector<Slice> slices;
    slices.reserve(90); // Pré-allocation pour éviter les copies mémoire

    // Composant 1 : Base radiateur (disque plein, gravure laser animée)
    float zBase = -40.0f - 50.0f * explode;
    addCylinder(slices, zBase, 8, 88, 0, 8,
                COL_CARBON_SHADOW, COL_CARBON_MID, PT_BASE);

    // Composant 2 : Anneau de support intermédiaire
    float zRing1 = -22.0f - 25.0f * explode;
    addCylinder(slices, zRing1, 4, 76, 58, 4,
                COL_CARBON_SHADOW, COL_METAL_HL, PT_PLAIN);

    // Composant 3 : Tore avec bobines de cuivre (spin = camYaw)
    addCylinder(slices, 0.0f, 18, 68, 46, 18,
                COL_CARBON_SHADOW, COL_CARBON_MID, PT_TORUS, camYaw);

    // Composant 4 : Anneau de confinement néon (couleur du thème)
    float zRing2 = 14.0f + 20.0f * explode;
    addCylinder(slices, zRing2, 6, 42, 35, 6, colDark, colNeon, PT_GLOWRING);

    // Composant 5 : Noyau plasma (disque plein, glow multicouche)
    float zCore = 24.0f + 45.0f * explode;
    addCylinder(slices, zCore, 12, 24, 0, 12, colCore, rgb565(240, 248, 255), PT_CORE);

    // Composant 6 : Câble d'énergie central (seulement quand le réacteur est éclaté)
    if (explode > 0.05f) {
        float tetherLen = (zCore - 6.0f) - (zBase + 4.0f);
        int   steps     = max(2, (int)(tetherLen / 2.0f));
        addCylinder(slices,
                    zBase + 4.0f + tetherLen * 0.5f,
                    tetherLen, 3, 0, steps,
                    colDark, colNeon, PT_LASER);
    }

    // ── 4. TRI DE PROFONDEUR (Algorithme du Peintre) ─────────────────────────
    // Tri croissant sur Z : les tranches les plus basses sont peintes en premier
    std::sort(slices.begin(), slices.end(),
              [](const Slice& a, const Slice& b) { return a.z < b.z; });

    // ── 5. PROJECTION ET RENDU ────────────────────────────────────────────────
    float cosPitch = cosf(pitch);
    float sinPitch = sinf(pitch);

    for (const Slice& s : slices) {
        // Projection perspective : Z → Y écran + facteur d'échelle
        float py    = -s.z * sinPitch;
        float pz    =  s.z * cosPitch;
        float scale = fov / (fov + pz);
        py          *= scale;

        // Demi-axes projetés (sY aplati par cosPitch = effet ellipse 3D)
        float rx = s.r_out * scale;
        float ry = s.r_out * cosPitch * scale;

        if (s.r_in > 0.0f) {
            // ═══ RENDU ANNEAU ════════════════════════════════════════════════
            float rxIn = s.r_in * scale;
            float ryIn = s.r_in * cosPitch * scale;
            drawThickEllipse(CX, CY + (int)py, rx, ry, rxIn, ryIn, s.col);

            // Bobines de cuivre sur le Tore — cercles positionnés en coordonnées polaires
            if (s.type == PT_TORUS) {
                float rMid    = (s.r_out + s.r_in) * 0.5f;
                float rxMid   = rMid * scale;
                float ryMid   = rMid * cosPitch * scale;
                float strokeW = (s.r_out - s.r_in) * scale;

                for (int c = 0; c < 10; c++) {
                    float baseAngle = c * (2.0f * PI / 10.0f) + s.spin;
                    // 5 fils par bobine : fil central plus brillant
                    for (int wire = -2; wire <= 2; wire++) {
                        float    angle   = baseAngle + wire * 0.04f;
                        bool     isCtr   = (wire == 0);
                        uint16_t wireCol = (isCtr && s.isTop) ? COL_COPPER_BRIGHT
                                         : (s.isTop           ? COL_COPPER_MID
                                                               : COL_COPPER_DARK);
                        // Ombrage global de la bobine = même AO que la tranche parente
                        uint16_t shadedWire = lerpColor(SS_BG, wireCol, s.depthAlpha);
                        float wx = rxMid * cosf(angle);
                        float wy = ryMid * sinf(angle);
                        spr.fillCircle((int)(CX + wx),
                                       (int)(CY + py + wy),
                                       (int)(strokeW * 0.5f) + 1,
                                       shadedWire);
                    }
                }
            }

            // Diffuseur néon sur la tranche de tête du Glow Ring
            if (s.type == PT_GLOWRING && s.isTop) {
                float rxM = ((s.r_out + s.r_in) * 0.5f) * scale;
                float ryM = ((s.r_out + s.r_in) * 0.5f) * cosPitch * scale;
                spr.drawEllipse(CX, (int)(CY + py), (int)rxM, (int)ryM, colCore);
            }

        } else {
            // ═══ RENDU DISQUE PLEIN ══════════════════════════════════════════
            spr.fillEllipse(CX, CY + (int)py, (int)rx, (int)ry, s.col);

            // Gravure laser sur la base radiateur (tourne lentement)
            if (s.type == PT_BASE && s.isTop) {
                spr.drawEllipse(CX, CY + (int)py,
                                (int)(rx * 0.75f), (int)(ry * 0.75f), COL_CARBON_SHADOW);
                spr.drawEllipse(CX, CY + (int)py,
                                (int)(rx * 0.35f), (int)(ry * 0.35f), COL_CARBON_SHADOW);
                // 8 lignes radiales formant la grille de dissipation
                for (int i = 0; i < 8; i++) {
                    float a  = i * (PI * 0.25f) - t * 0.05f;
                    float hx = cosf(a) * (rx * 0.65f);
                    float hy = sinf(a) * (ry * 0.65f);
                    spr.drawLine(CX, CY + (int)py,
                                 CX + (int)hx, CY + (int)(py + hy),
                                 COL_CARBON_SHADOW);
                }
            }

            // Effet plasma photométrique du noyau (couches concentriques alpha-blended)
            if (s.type == PT_CORE && s.isTop) {
                // Halo externe — teinté par le thème, très transparent
                spr.fillCircle(CX, CY + (int)py,
                               (int)(rx * 2.5f),
                               lerpColor(SS_BG, colNeon, 0.18f));
                // Halo intermédiaire — thème vers blanc
                spr.fillCircle(CX, CY + (int)py,
                               (int)(rx * 1.5f),
                               lerpColor(colNeon, colCore, 0.6f));
                // Noyau brillant blanc pur
                spr.fillCircle(CX, CY + (int)py,
                               (int)(rx * 0.8f),
                               rgb565(240, 248, 255));
            }
        }
    }

    // ── 6. HUD : SCANNER ARC TOURNANT (Overlay UI) ───────────────────────────
    // Arc lumineux de 35° tournant en continu autour du réacteur
    float scanDeg = fmodf(g_sleep_phase * 1.5f * (180.0f / PI), 360.0f);
    spr.drawArc(CX, CY, 116, 114, (int)scanDeg, (int)(scanDeg + 35.0f), colCore);
    spr.drawCircle(CX, CY, 116, colDark); // Anneau externe fixe (cadre délicat)
}
