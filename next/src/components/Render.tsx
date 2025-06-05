"use client";

import { RenderingContext } from "@/contexts/CanvasRenderingContext";
import { useZoomStore } from "@/stores/zoomStore";
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
  const { zoom } = useZoomStore();
  console.log(zoom);

  // 1. Initialisation du canvas et du contexte
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    setCtx(context);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);

  // 2. Boucle de rendu, dépendante de `ctx`, `enableZoom`, `zoom`
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

      requestAnimationFrame(render);
    };

    requestAnimationFrame(render);
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
        className="fixed inset-0 w-screen h-screen rendering-pixelated"
      >
        {children}
      </canvas>
      {enableZoom && <ZoomControls />}
    </RenderingContext>
  );
}
