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
  isTrail?: boolean;
}

export const ScopedParticles: React.FC<{ type: 'ambient' | 'trail'; isFixed?: boolean }> = ({ type, isFixed = false }) => {
  const { isModelMode, isParticlesEnabled } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isParticlesEnabled) {
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      if (isFixed) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      } else if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (type !== 'trail') return;
      
      const x = isFixed ? e.clientX : (canvas.parentElement ? e.clientX - canvas.parentElement.getBoundingClientRect().left : e.clientX);
      const y = isFixed ? e.clientY : (canvas.parentElement ? e.clientY - canvas.parentElement.getBoundingClientRect().top : e.clientY);
      
      mouseRef.current = { x, y };

      // Add trail particles
      if (particlesRef.current.length < 250) {
        particlesRef.current.push(createTrailParticle(x, y));
        // Add a second particle for more density
        particlesRef.current.push(createTrailParticle(x + (Math.random() - 0.5) * 10, y + (Math.random() - 0.5) * 10));
      }
    };

    window.addEventListener('resize', resize);
    if (type === 'trail') {
      window.addEventListener('mousemove', handleMouseMove);
    }
    resize();

    const createParticle = () => {
      const size = isModelMode ? Math.random() * 8 + 4 : Math.random() * 10 + 5;
      return {
        x: Math.random() * canvas.width,
        y: -size,
        size,
        speedX: (Math.random() - 0.5) * 1.5,
        speedY: Math.random() * 1 + 0.5,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.05,
        life: 1,
      };
    };

    const createTrailParticle = (x: number, y: number) => {
      const size = isModelMode ? Math.random() * 6 + 3 : Math.random() * 6 + 3;
      return {
        x,
        y,
        size,
        speedX: (Math.random() - 0.5) * 2,
        speedY: Math.random() * 2 + 1,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        life: 1,
        isTrail: true
      };
    };

    // Initial seed for ambient
    if (type === 'ambient') {
      particlesRef.current = Array.from({ length: 70 }, createParticle);
      particlesRef.current.forEach(p => p.y = Math.random() * canvas.height);
    } else {
      particlesRef.current = [];
    }

    const drawPetal = (ctx: CanvasRenderingContext2D, p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.life * 0.8;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(p.size, -p.size, p.size * 2, 0, 0, p.size);
      ctx.bezierCurveTo(-p.size * 2, 0, -p.size, -p.size, 0, 0);
      ctx.fillStyle = isModelMode ? `rgba(255, 182, 193, 0.8)` : `rgba(162, 210, 255, 0.8)`;
      ctx.fill();
      ctx.restore();
    };

    const drawDiamond = (ctx: CanvasRenderingContext2D, p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.life * 0.5;
      ctx.fillStyle = `rgba(162, 210, 255, 0.6)`;
      
      // Draw a small square/pixel instead of diamond for BA mode
      const halfSize = p.size / 2;
      ctx.fillRect(-halfSize, -halfSize, p.size, p.size);
      
      ctx.restore();
    };

    let animationFrame: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotationSpeed;

        if (p.isTrail) {
          p.life -= 0.02;
          if (p.life <= 0) {
            particlesRef.current.splice(i, 1);
            continue;
          }
        } else {
          if (p.y > canvas.height) {
            particlesRef.current[i] = createParticle();
          }
        }

        // Apply drawing logic based on mode for ALL particles including trails
        if (isModelMode) drawPetal(ctx, p);
        else drawDiamond(ctx, p);
      }
      
      animationFrame = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrame);
    };
  }, [isModelMode, isParticlesEnabled, type, isFixed]);

  return (
    <canvas 
      ref={canvasRef} 
      className={`pointer-events-none z-[150] ${isFixed ? 'fixed inset-0' : 'absolute inset-0'}`} 
    />
  );
};
