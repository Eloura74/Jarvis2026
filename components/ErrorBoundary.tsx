import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * ErrorBoundary — Capture les erreurs React non gérées
 * Empêche le crash complet de l'app et affiche un écran de récupération.
 * Sans ce composant, toute exception dans un composant enfant
 * détruit l'arbre React entier et Vite recharge la page.
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("🔴 [ErrorBoundary] Crash React intercepté:", error);
    console.error("🔴 [ErrorBoundary] Component stack:", info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.95)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#00e5ff",
            fontFamily: '"JetBrains Mono", monospace',
            zIndex: 999999,
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
          <h1 style={{ fontSize: "20px", letterSpacing: "4px", marginBottom: "8px" }}>
            SYSTÈME — ERREUR CRITIQUE
          </h1>
          <p style={{ fontSize: "12px", color: "rgba(0,229,255,0.5)", marginBottom: "32px" }}>
            {this.state.error?.message || "Erreur inconnue"}
          </p>
          <button
            onClick={this.handleReset}
            style={{
              padding: "12px 32px",
              background: "rgba(0,229,255,0.1)",
              border: "1px solid rgba(0,229,255,0.4)",
              color: "#00e5ff",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "13px",
              letterSpacing: "2px",
            }}
          >
            RÉINITIALISER
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
