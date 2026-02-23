import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Search, X } from "lucide-react";
import { StatusOverlayData } from "../types/app.types";

interface SearchResultsOverlayProps {
  data: StatusOverlayData | null;
  isVisible: boolean;
  onClose: () => void;
}

/**
 * Miniature d'un résultat de recherche.
 * Cascade : image réelle → favicon Google du domaine → placeholder SVG coloré.
 */
const SOURCE_COLORS: Record<string, string> = {
  thingiverse: "#248bfb",
  printables: "#fa6831",
  cults3d: "#e63946",
  myminifactory: "#00b4d8",
  google: "#4285f4",
  youtube: "#ff0000",
  wikipedia: "#a8a8a8",
  amazon: "#ff9900",
  github: "#6e40c9",
  web: "#00f3ff",
};

function ResultThumbnail({
  result,
}: {
  result: { title: string; url: string; image: string | null; source: string };
}) {
  const [imgSrc, setImgSrc] = React.useState<string | null>(result.image);
  const [stage, setStage] = React.useState<"image" | "favicon" | "placeholder">(
    result.image ? "image" : "favicon",
  );

  // Extraire le domaine pour le favicon
  let domain = "";
  try {
    domain = new URL(result.url).hostname;
  } catch {
    domain = "";
  }
  const faviconUrl = domain
    ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
    : null;

  const color = SOURCE_COLORS[result.source.toLowerCase()] || "#00f3ff";
  const initial = result.source.charAt(0).toUpperCase();

  const handleError = () => {
    if (stage === "image" && faviconUrl) {
      setImgSrc(faviconUrl);
      setStage("favicon");
    } else {
      setImgSrc(null);
      setStage("placeholder");
    }
  };

  const isFavicon = stage === "favicon";
  const thumbStyle: React.CSSProperties = {
    width: "56px",
    height: "56px",
    borderRadius: "6px",
    border: "1px solid rgba(0,243,255,0.15)",
    flexShrink: 0,
    objectFit: (isFavicon
      ? "contain"
      : "cover") as React.CSSProperties["objectFit"],
    background: isFavicon ? "rgba(0,0,0,0.4)" : undefined,
    padding: isFavicon ? "8px" : undefined,
  };

  if (imgSrc && stage !== "placeholder") {
    return (
      <img
        src={imgSrc}
        alt={result.title}
        style={thumbStyle}
        onError={handleError}
      />
    );
  }

  // Placeholder SVG coloré avec initiale de la source
  return (
    <div
      style={{
        width: "56px",
        height: "56px",
        borderRadius: "6px",
        border: `1px solid ${color}40`,
        flexShrink: 0,
        background: `${color}15`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: "18px",
        fontWeight: 700,
        color,
        letterSpacing: "0",
      }}
    >
      {initial}
    </div>
  );
}

/**
 * Overlay holographique dédié aux résultats de recherche visuelle.
 * Affiche 5 résultats avec titre, source, description et lien cliquable
 * sans ouvrir le navigateur automatiquement.
 */
export const SearchResultsOverlay: React.FC<SearchResultsOverlayProps> = ({
  data,
  isVisible,
  onClose,
}) => {
  const [mounted, setMounted] = useState(false);

  React.useLayoutEffect(() => {
    setMounted(true);
  }, []);

  // Fermeture sur Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isVisible) onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isVisible, onClose]);

  if (!mounted || !data) return null;

  const results = data.searchResults || [];

  const content = (
    <AnimatePresence>
      {isVisible && data && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
              onClose();
            }}
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at center, rgba(0,243,255,0.03), rgba(0,0,0,0.75))",
              backdropFilter: "blur(10px)",
              pointerEvents: "auto",
            }}
          />

          {/* Panneau principal — stopPropagation pour bloquer la remontée vers le backdrop */}
          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20, filter: "blur(10px)" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              pointerEvents: "auto",
              position: "relative",
              width: "700px",
              maxWidth: "95vw",
              background: "rgba(5, 10, 20, 0.97)",
              border: "1px solid rgba(0, 243, 255, 0.35)",
              borderRadius: "12px",
              boxShadow:
                "0 0 40px rgba(0, 243, 255, 0.15), 0 0 80px rgba(0, 0, 0, 0.6)",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 20px",
                borderBottom: "1px solid rgba(0, 243, 255, 0.15)",
                background: "rgba(0, 243, 255, 0.04)",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <Search size={16} color="#00f3ff" />
                <span
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#00f3ff",
                    letterSpacing: "3px",
                    textTransform: "uppercase",
                  }}
                >
                  {data.title}
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    color: "rgba(0,243,255,0.4)",
                    fontFamily: '"JetBrains Mono", monospace',
                    letterSpacing: "1px",
                  }}
                >
                  // {results.length} RÉSULTATS
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                  onClose();
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "rgba(0,243,255,0.5)",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Liste des résultats */}
            <div
              style={{
                padding: "12px 16px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {results.length === 0 ? (
                <p
                  style={{
                    color: "rgba(0,243,255,0.4)",
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: "12px",
                    textAlign: "center",
                    padding: "20px",
                  }}
                >
                  Aucun résultat trouvé.
                </p>
              ) : (
                results.map((result, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    onClick={() => {
                      // Ouvre via le backend pour contourner les blocages popup navigateur
                      fetch("http://localhost:3001/api/web/open-url", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ url: result.url }),
                      }).catch(() => {
                        // Fallback direct si backend indisponible
                        window.open(
                          result.url,
                          "_blank",
                          "noopener,noreferrer",
                        );
                      });
                    }}
                    style={{
                      display: "flex",
                      gap: "14px",
                      padding: "12px 14px",
                      background: "rgba(0, 243, 255, 0.03)",
                      border: "1px solid rgba(0, 243, 255, 0.1)",
                      borderRadius: "8px",
                      textDecoration: "none",
                      cursor: "pointer",
                    }}
                    whileHover={{
                      background: "rgba(0, 243, 255, 0.08)",
                      x: 4,
                      boxShadow: "inset 0 0 0 1px rgba(0, 243, 255, 0.35)",
                    }}
                  >
                    {/* Numéro */}
                    <div
                      style={{
                        minWidth: "24px",
                        height: "24px",
                        borderRadius: "4px",
                        background: "rgba(0, 243, 255, 0.1)",
                        border: "1px solid rgba(0, 243, 255, 0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: "11px",
                        color: "#00f3ff",
                        fontWeight: 700,
                        flexShrink: 0,
                        marginTop: "2px",
                      }}
                    >
                      {idx + 1}
                    </div>

                    {/* Miniature : image réelle → favicon → placeholder thématique */}
                    <ResultThumbnail result={result} />

                    {/* Contenu texte */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "4px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#e0f7ff",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {result.title}
                        </span>
                        <ExternalLink
                          size={11}
                          color="rgba(0,243,255,0.4)"
                          style={{ flexShrink: 0 }}
                        />
                      </div>

                      {/* Source badge */}
                      <span
                        style={{
                          display: "inline-block",
                          fontSize: "9px",
                          fontFamily: '"JetBrains Mono", monospace',
                          color: "#00f3ff",
                          background: "rgba(0,243,255,0.08)",
                          border: "1px solid rgba(0,243,255,0.2)",
                          borderRadius: "3px",
                          padding: "1px 6px",
                          letterSpacing: "1px",
                          marginBottom: "4px",
                        }}
                      >
                        {result.source.toUpperCase()}
                      </span>

                      {/* Description */}
                      {result.description && (
                        <p
                          style={{
                            fontSize: "11px",
                            color: "rgba(224, 247, 255, 0.5)",
                            margin: 0,
                            overflow: "hidden",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            lineHeight: "1.4",
                          }}
                        >
                          {result.description}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "8px 20px",
                borderTop: "1px dashed rgba(0,243,255,0.1)",
                display: "flex",
                justifyContent: "space-between",
                fontSize: "9px",
                fontFamily: '"JetBrains Mono", monospace',
                color: "rgba(0,243,255,0.3)",
                letterSpacing: "1px",
              }}
            >
              <span>JARVIS SEARCH ENGINE</span>
              <span>SYNC: {data.lastUpdate}</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return ReactDOM.createPortal(content, document.body);
};

export default SearchResultsOverlay;
