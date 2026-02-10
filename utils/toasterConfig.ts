/**
 * Configuration Toaster react-hot-toast
 */

export const toasterConfig = {
  position: "top-right" as const,
  toastOptions: {
    duration: 3000,
    style: {
      background: "rgba(15, 23, 42, 0.95)",
      color: "#60a5fa",
      border: "1px solid rgba(96, 165, 250, 0.3)",
      backdropFilter: "blur(12px)",
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
      fontFamily: "monospace",
    },
    success: {
      iconTheme: {
        primary: "#10b981",
        secondary: "#fff",
      },
      style: {
        border: "1px solid rgba(16, 185, 129, 0.3)",
      },
    },
    error: {
      iconTheme: {
        primary: "#ef4444",
        secondary: "#fff",
      },
      style: {
        border: "1px solid rgba(239, 68, 68, 0.3)",
      },
    },
    loading: {
      iconTheme: {
        primary: "#3b82f6",
        secondary: "#fff",
      },
    },
  },
};
