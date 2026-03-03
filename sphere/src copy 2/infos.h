#ifndef INFOS_H
#define INFOS_H

#include <Arduino.h> // Nécessaire pour les types comme uint32_t

// Déclaration de la fonction
void printDiagnostics();

// Rendre la variable frame_count visible pour le main.cpp
extern int frame_count; 

#endif