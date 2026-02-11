import React, { useEffect, useRef } from "react";

interface VideoAvatarProps {
  isSpeaking: boolean;
  isListening: boolean;
  size?: number;
  className?: string;
}

export const VideoAvatar: React.FC<VideoAvatarProps> = ({
  isSpeaking,
  isListening,
  size = 300,
  className = "",
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Gestion de la lecture/pause basée sur l'état "speaking"
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isSpeaking) {
      video.play().catch((e) => console.warn("Auto-play prevented:", e));
    } else {
      video.pause();
      // On peut remettre à 0 ou laisser sur la dernière frame
      // video.currentTime = 0;
    }
  }, [isSpeaking]);

  return (
    <div
      className={`relative rounded-full overflow-hidden flex items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
        // Effets de lueur externe globale
        boxShadow: isSpeaking
          ? "0 0 50px rgba(0, 229, 255, 0.4), inset 0 0 20px rgba(0, 229, 255, 0.2)"
          : "0 0 20px rgba(0, 229, 255, 0.1)",
        transition: "box-shadow 0.3s ease",
        background:
          "radial-gradient(circle, rgba(0,0,0,0.8) 0%, transparent 70%)",
      }}
    >
      {/* 
        Le container vidéo.
        mix-blend-mode: screen permet de rendre le noir transparent 
        si le fond de l'app est sombre.
      */}
      <video
        ref={videoRef}
        src="/assets/Video.mp4"
        loop
        muted
        playsInline
        className="object-cover w-full h-full"
        style={{
          mixBlendMode: "screen", // Rend le noir transparent
          filter: `
            hue-rotate(180deg) 
            brightness(${isSpeaking ? 1.2 : 0.8}) 
            contrast(1.2)
            drop-shadow(0 0 10px rgba(0, 229, 255, 0.5))
          `,
          opacity: isSpeaking || isListening ? 0.9 : 0.5,
          transition: "all 0.5s ease",
          transform: "scale(1.2)", // Zoom léger si besoin pour éviter les bords
        }}
      />

      {/* Overlay Scanlines pour effet TV/Holo */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.3,
          backgroundImage:
            "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))",
          backgroundSize: "100% 2px, 3px 100%",
        }}
      />
    </div>
  );
};
