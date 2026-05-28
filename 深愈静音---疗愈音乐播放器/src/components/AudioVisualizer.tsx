import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  isPlaying: boolean;
  color?: string;
  speedMultiplier?: number;
  waveCount?: number;
}

export default function AudioVisualizer({
  isPlaying,
  color = 'rgba(56, 189, 248, 0.6)', // Sky blue-ish
  speedMultiplier = 1,
  waveCount = 3
}: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fluid responsive sizing
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth * window.devicePixelRatio;
        canvas.height = container.clientHeight * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let offset = 0;

    const render = () => {
      const w = canvas.width / window.devicePixelRatio;
      const h = canvas.height / window.devicePixelRatio;

      ctx.clearRect(0, 0, w, h);

      if (isPlaying) {
        offset += 0.02 * speedMultiplier;
      } else {
        offset += 0.003; // Very slow calm motion even when idle
      }

      // Draw elegant concentric wavy rings or standard sine wave lines
      for (let i = 0; i < waveCount; i++) {
        ctx.beginPath();
        ctx.lineWidth = i === 0 ? 2 : 1.2;
        
        // Vary opacity for depth
        const opacity = (1 - (i / waveCount)) * (isPlaying ? 0.45 : 0.2);
        ctx.strokeStyle = color.replace('0.6', opacity.toString());

        const amplitude = isPlaying 
          ? (25 + Math.sin(offset * 2 + i) * 10) * (1 - i * 0.2)
          : (8 + Math.cos(offset + i) * 3);
          
        const frequency = 0.008 + i * 0.003;

        for (let x = 0; x < w; x++) {
          const y = h / 2 + Math.sin(x * frequency + offset + i * Math.PI / 4) * amplitude;
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, color, speedMultiplier, waveCount]);

  return (
    <div className="w-full h-full relative overflow-hidden" id="viz_container">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
