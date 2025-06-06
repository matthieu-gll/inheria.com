"use client";

import { RenderingContext } from "@/contexts/CanvasRenderingContext";
import { useZoomStore } from "@/stores/useZoomStore";
import { RenderCallback } from "@/types";
import { useRef, useState, useEffect, PropsWithChildren } from "react";
import { ZoomControls } from "./ZoomControls";

interface RenderProps extends PropsWithChildren {
  enableZoom?: boolean;
}

export function Render({ children, enableZoom = false }: RenderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const callbacks = useRef<Set<RenderCallback>>(new Set());
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const animationFrameId = useRef<number>(null);
  const { zoom } = useZoomStore();

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Largeur = largeur fenêtre
    const width = window.innerWidth;

    // Hauteur = largeur / (16/9)
    const height = width / (16 / 9);

    canvas.width = width;
    canvas.height = height;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    setCtx(context);
    resizeCanvas();

    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  useEffect(() => {
    if (!ctx) return;

    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      ctx.save();
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      if (enableZoom) {
        ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
        ctx.scale(zoom / 100, zoom / 100);
        ctx.translate(-ctx.canvas.width / 2, -ctx.canvas.height / 2);
      }

      for (const cb of callbacks.current) {
        cb(ctx, dt);
      }

      ctx.restore();

      animationFrameId.current = requestAnimationFrame(render);
    };

    animationFrameId.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [ctx, enableZoom, zoom]);

  const value = {
    register: (fn: RenderCallback) => callbacks.current.add(fn),
    unregister: (fn: RenderCallback) => callbacks.current.delete(fn),
    ctx,
  };

  return (
    <RenderingContext value={value}>
      <canvas
        ref={canvasRef}
        className="fixed rendering-pixelated inset-1/2 -translate-x-1/2 -translate-y-1/2 bg-neutral-900"
      >
        {children}
      </canvas>
      {enableZoom && <ZoomControls />}
    </RenderingContext>
  );
}
