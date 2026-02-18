import React, { useEffect, useRef } from "react";

export const NetworkWidget: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resize Handler
    const handleResize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    const nodeCount = 20;
    const nodes: any[] = [];

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 1.5, // Plus rapide
        vy: (Math.random() - 0.5) * 1.5,
        pulse: Math.random(),
        pulseSpeed: 0.02 + Math.random() * 0.03,
      });
    }

    let animationId: number;

    const draw = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 0.5;

      // Update and draw nodes
      nodes.forEach((node, i) => {
        node.x += node.vx;
        node.y += node.vy;

        // Pulse effect
        node.pulse += node.pulseSpeed;
        const radius = 2 + Math.sin(node.pulse) * 1;

        // Bounce off walls
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 229, 255, ${0.5 + Math.sin(node.pulse) * 0.5})`;
        ctx.fill();

        // Connect nearby nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - node.x;
          const dy = nodes[j].y - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Connexion dynamique
          if (dist < 80) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            const opacity = 1 - dist / 80;
            ctx.strokeStyle = `rgba(0, 229, 255, ${opacity * 0.6})`;
            ctx.stroke();

            // Petit packet data qui voyage (simulation rapide)
            if (dist > 20 && Math.random() > 0.98) {
              // Juste un flash blanc sur la ligne pour simuler un paquet
              ctx.beginPath();
              ctx.strokeStyle = "rgba(255,255,255,0.8)";
              ctx.moveTo(node.x, node.y);
              ctx.lineTo(nodes[j].x, nodes[j].y);
              ctx.stroke();
            }
          }
        }
      });

      // Overlay text
      ctx.fillStyle = "rgba(0, 229, 255, 0.8)";
      ctx.font = "10px monospace";
      ctx.fillText("NET.TRAFFIC: ACTIVE", 10, 15);

      // Simuler des valeurs qui changent
      const lat = 10 + Math.floor(Math.sin(Date.now() / 500) * 5);
      ctx.fillText(`LATENCY: ${lat}ms`, 10, canvas.height - 10);

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="w-full h-24 relative rounded-xl border border-cyan-400/30 bg-black/20 backdrop-blur-xl overflow-hidden group hover:border-cyan-400/50 transition-all duration-500 shadow-[0_0_15px_rgba(0,229,255,0.1)]">
      {/* BACKGROUND IMAGE */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop"
          alt="Network Background"
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-cyan-900/10 to-transparent" />
      </div>

      <canvas ref={canvasRef} className="w-full h-full relative z-10" />
    </div>
  );
};
