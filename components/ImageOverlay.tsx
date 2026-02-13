import React, { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { DraggablePanel } from "./ui/DraggablePanel";

interface ImageResult {
  url: string;
  title: string;
}

interface ImageOverlayProps {
  query: string | null;
  isVisible: boolean;
  onClose: () => void;
}

export const ImageOverlay: React.FC<ImageOverlayProps> = ({
  query,
  isVisible,
  onClose,
}) => {
  const [images, setImages] = useState<ImageResult[]>([]);
  const [loading, setLoading] = useState(false);

  // console.log("ImageOverlay Render:", { query, isVisible }); // DEBUG

  useEffect(() => {
    if (isVisible && query) {
      console.log("ImageOverlay Fetching for:", query); // DEBUG
      const fetchImages = async () => {
        setLoading(true);
        setImages([]);

        try {
          // SOURCE 1: WIKIPEDIA (Recherche "Fuzzy" type Google)
          // ----------------------------------------
          // Utilisation de generator=search (gsrsearch) au lieu de prefixsearch pour une tolérance aux fautes et mots clés
          const wikiEndpoint = `https://fr.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=5&piprop=thumbnail&pithumbsize=600&origin=*`;
          const wikiRes = await fetch(wikiEndpoint);
          const wikiData = await wikiRes.json();

          let foundImages: ImageResult[] = [];

          if (wikiData.query && wikiData.query.pages) {
            const pages = Object.values(wikiData.query.pages) as any[];
            foundImages = pages
              .filter((p) => p.thumbnail && p.thumbnail.source)
              .map((p) => ({
                url: p.thumbnail.source,
                title: p.title,
              }));
          }

          // SOURCE 2: WIKIMEDIA COMMONS (Fallback)
          const commonsEndpoint = `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=5&gsrnamespace=6&iiprop=url|extmetadata&origin=*`;
          try {
            const commonsRes = await fetch(commonsEndpoint);
            const commonsData = await commonsRes.json();
            if (commonsData.query && commonsData.query.pages) {
              const pages = Object.values(commonsData.query.pages) as any[];
              const commonImages = pages
                .filter(
                  (p) => p.imageinfo && p.imageinfo[0] && p.imageinfo[0].url,
                )
                .map((p) => ({
                  url: p.imageinfo[0].url,
                  title: (p.title || "")
                    .replace("File:", "")
                    .replace(".jpg", ""),
                }));
              foundImages = [...foundImages, ...commonImages];
            }
          } catch (e) {
            console.warn("Commons failed", e);
          }

          // Dédoublonnage
          foundImages = foundImages
            .filter((v, i, a) => a.findIndex((t) => t.url === v.url) === i)
            .slice(0, 6);
          setImages(foundImages);
        } catch (error) {
          console.error("Image fetch error", error);
        } finally {
          setLoading(false);
        }
      };

      fetchImages();
    }
  }, [isVisible, query]);

  return (
    <AnimatePresence>
      {isVisible && query && (
        <DraggablePanel
          title={`WIKI_DATA // ${query.toUpperCase()}`}
          onClose={onClose}
          initialPosition={{ x: 200, y: 150 }}
        >
          {loading ? (
            <div className="flex justify-center items-center h-40 text-cyan-500 font-mono animate-pulse">
              CONNECTING TO SATELLITE...
            </div>
          ) : images.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {images.map((img, index) => (
                <div
                  key={index}
                  className="relative group overflow-hidden rounded border border-cyan-900/50 cursor-pointer bg-black/40"
                >
                  <img
                    src={img.url}
                    alt={img.title}
                    className="w-full h-32 object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1">
                    <p className="text-[10px] font-mono text-cyan-300 truncate">
                      {img.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col justify-center items-center h-40 border border-red-900/30 bg-red-900/10 rounded gap-2">
              <span className="text-red-400 font-mono text-xs">
                NO VISUAL DATA IN LOCAL DATABANKS
              </span>
              <button
                onClick={() =>
                  window.open(
                    `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query || "")}`,
                    "_blank",
                  )
                }
                className="px-3 py-1 bg-cyan-900/30 hover:bg-cyan-800/50 border border-cyan-500/30 rounded text-cyan-300 text-xs font-mono transition-colors flex items-center gap-2"
              >
                <span>🌐</span> OPEN GOOGLE IMAGES
              </button>
            </div>
          )}

          <div className="mt-2 flex justify-between items-center text-[10px] font-mono">
            <div className="flex gap-2">
              <span className="text-cyan-700">SRC: WIKI_NET</span>
              <button
                onClick={() =>
                  window.open(
                    `https://www.youtube.com/results?search_query=${encodeURIComponent(query || "")}`,
                    "_blank",
                  )
                }
                className="text-cyan-600 hover:text-cyan-400 cursor-pointer"
              >
                [ YT LINK ]
              </button>
            </div>
            <span className="text-cyan-600 animate-pulse">
              LIVE FEED ACTIVE
            </span>
          </div>
        </DraggablePanel>
      )}
    </AnimatePresence>
  );
};
