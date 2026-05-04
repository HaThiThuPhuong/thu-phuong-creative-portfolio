import React, { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  life: number;
  maxLife: number;
}

export const CanvasBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isModelMode } = useTheme();
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    const createParticle = () => {
      const size = Math.random() * 10 + 5;
      return {
        x: Math.random() * canvas.width,
        y: -size,
        size,
        speedX: (Math.random() - 0.5) * 2,
        speedY: Math.random() * 1 + 0.5,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.05,
        life: 1,
        maxLife: Math.random() * 0.5 + 0.5,
      };
    };

    // Initialize particles
    for (let i = 0; i < 50; i++) {
      particlesRef.current.push(createParticle());
      particlesRef.current[i].y = Math.random() * canvas.height;
    }

    const drawPetal = (ctx: CanvasRenderingContext2D, p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(p.size, -p.size, p.size * 2, 0, 0, p.size);
      ctx.bezierCurveTo(-p.size * 2, 0, -p.size, -p.size, 0, 0);
      ctx.fillStyle = `rgba(255, 182, 193, ${p.life * 0.6})`;
      ctx.fill();
      ctx.restore();
    };

    const drawPixel = (ctx: CanvasRenderingContext2D, p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(Math.PI / 4); // Rotate 45deg for diamond shape
      ctx.fillStyle = `rgba(162, 210, 255, ${p.life * 0.6})`;
      const size = p.size * 0.4;
      ctx.fillRect(-size/2, -size/2, size, size);
      ctx.restore();
    };

    let animationFrame: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((p, i) => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotationSpeed;

        if (p.y > canvas.height) {
          particlesRef.current[i] = createParticle();
        }

        if (isModelMode) {
          drawPetal(ctx, p);
        } else {
          drawPixel(ctx, p);
        }
      });

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrame);
    };
  }, [isModelMode]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 opacity-100"
    />
  );
};
