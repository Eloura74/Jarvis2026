/**
 * GUIDE D'INTÉGRATION - PREMIUM LAYOUT JARVIS
 * 
 * Ce fichier montre comment intégrer le nouveau PremiumLayout 
 * dans votre App.tsx existant
 */

import React, { useState } from 'react';
import { PremiumLayout } from './components/PremiumLayout';
import { Toaster } from 'react-hot-toast';
import { SystemStatus } from './types';

// ============================================================================
// EXEMPLE D'INTÉGRATION SIMPLE
// ============================================================================

export const AppWithPremiumLayout: React.FC = () => {
  // États minimaux requis
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successTrigger, setSuccessTrigger] = useState(0);
  const [commandCount, setCommandCount] = useState(0);
  const [logs, setLogs] = useState<Array<{
    source: string;
    message: string;
    type: 'info' | 'success' | 'error' | 'warning';
  }>>([
    { source: 'SYSTEM', message: 'JARVIS initialized', type: 'success' },
    { source: 'OMNI', message: 'Waiting for commands...', type: 'info' },
  ]);

  // Handlers
  const handleCommand = (command: string) => {
    setCommandCount(prev => prev + 1);
    setLogs(prev => [...prev, {
      source: 'USER',
      message: command,
      type: 'info',
    }]);
    
    // Simuler traitement Gemini
    setStatus('processing');
    setIsProcessing(true);
    
    setTimeout(() => {
      setLogs(prev => [...prev, {
        source: 'SYSTEM',
        message: '✓ Command executed',
        type: 'success',
      }]);
      setStatus('idle');
      setIsProcessing(false);
      setSuccessTrigger(Date.now());
    }, 2000);
  };

  const handleMicrophoneClick = () => {
    setIsListening(!isListening);
    setStatus(isListening ? 'idle' : 'listening');
  };

  // Suggestions contextuelles (exemple)
  const suggestions = [
    { label: 'Ouvrir Chrome', command: 'ouvre chrome', icon: '🌐' },
    { label: 'Rechercher React', command: 'recherche react sur github', icon: '🔍' },
    { label: 'Créer note', command: 'crée une note', icon: '📝' },
  ];

  return (
    <>
      <PremiumLayout
        status={status}
        commandCount={commandCount}
        cpuUsage={23}
        memoryUsage="4.2 GB"
        onCommand={handleCommand}
        onMicrophoneClick={handleMicrophoneClick}
        isListening={isListening}
        logs={logs}
        isProcessing={isProcessing}
        processingMessage="🤖 JARVIS analyse votre demande..."
        successTrigger={successTrigger}
        suggestions={suggestions}
      />
      
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'rgba(15, 23, 42, 0.95)',
            color: '#60a5fa',
            border: '1px solid rgba(96, 165, 250, 0.3)',
            backdropFilter: 'blur(12px)',
            fontFamily: 'monospace',
          },
        }}
      />
    </>
  );
};

// ============================================================================
// INTÉGRATION DANS App.tsx EXISTANT
// ============================================================================

/*

ÉTAPES D'INTÉGRATION :

1. Importer PremiumLayout
   import { PremiumLayout } from './components/PremiumLayout';

2. Préparer les données
   const premiumLayoutProps = {
     status: status as 'idle' | 'listening' | 'processing' | 'speaking',
     commandCount: commandHistory.length,
     cpuUsage: 23, // Vous pouvez récupérer ça via une API système
     memoryUsage: '4.2 GB',
     onCommand: handleCommand, // Votre fonction existante
     onMicrophoneClick: toggleListening, // Votre fonction existante
     isListening: status === SystemStatus.LISTENING,
     logs: logs.map(log => ({
       source: log.source,
       message: log.message,
       type: log.type as 'info' | 'success' | 'error' | 'warning',
     })),
     isProcessing: status === SystemStatus.PROCESSING,
     processingMessage: "🤖 JARVIS analyse...",
     successTrigger: successTrigger,
     suggestions: [
       // Génerer dynamiquement selon contexte
     ],
   };

3. Remplacer le contenu de votre return par :
   return (
     <>
       <PremiumLayout {...premiumLayoutProps} />
       <Toaster {...} />
     </>
   );

4. (Optionnel) Garder vos composants existants
   Vous pouvez combiner PremiumLayout avec vos composants :
   
   return (
     <>
       <PremiumLayout {...premiumLayoutProps} />
       
       {/* Vos overlays existants */}
       <TerminalLog ... />
       <CommandHistoryPanel ... />
       <SettingsPanel ... />
       
       <Toaster {...} />
     </>
   );

*/

// ============================================================================
// PERSONNALISATION
// ============================================================================

/*

COULEURS :
- Modifier dans index.css les variables --cyan-electric, etc.
- Ou passer accentColor aux StatCard individuellement

STATS PERSONNALISÉES :
const customStats = {
  cpuUsage: await getCPUUsage(), // Implémenter via backend
  memoryUsage: await getMemoryUsage(),
  // ...
};

SUGGESTIONS INTELLIGENTES :
// Générer selon dernière commande
const generateContextSuggestions = (lastCommand: string) => {
  if (lastCommand.includes('recherche')) {
    return [
      { label: 'Ouvrir résultat', command: 'ouvre le premier', icon: '🔗' },
      { label: 'Nouvelle recherche', command: 'recherche autre chose', icon: '🔍' },
    ];
  }
  // ...
};

ANIMATIONS :
- Ajuster vitesses dans index.css (spin-slow 8s → 4s pour plus rapide)
- Désactiver particules en mode économie : 
  {!lowPowerMode && <PremiumLayout .../>}

*/

export default AppWithPremiumLayout;
