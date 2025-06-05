"use client";

import { useRendering } from "@/hooks/useRendering";
import { useEffect } from "react";

const TILE_WIDTH = 64;
const TILE_HEIGHT = 32;

interface Props {
  width: number; // en nombre de tuiles
  length: number; // en nombre de tuiles
}

export const IsometricGrid = ({ width, length }: Props) => {
  const { register, unregister, ctx } = useRendering();

  useEffect(() => {
    if (!ctx) return;

    const draw = (ctx: CanvasRenderingContext2D) => {
      const screenW = ctx.canvas.width;
      const screenH = ctx.canvas.height;

      // Taille totale de la grille en pixels
      const gridPixelWidth = (width + length) * (TILE_WIDTH / 2);
      const gridPixelHeight = (width + length) * (TILE_HEIGHT / 2);

      const offsetX = (screenW - gridPixelWidth) / 2;
      const offsetY = (screenH - gridPixelHeight) / 2;

      ctx.save();
      ctx.translate(offsetX, offsetY);

      ctx.strokeStyle = "#555";
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.2;

      for (let i = 0; i < width; i++) {
        for (let j = 0; j < length; j++) {
          const x = (i - j) * (TILE_WIDTH / 2) + gridPixelWidth / 2;
          const y = (i + j) * (TILE_HEIGHT / 2);

          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + TILE_WIDTH / 2, y + TILE_HEIGHT / 2);
          ctx.lineTo(x, y + TILE_HEIGHT);
          ctx.lineTo(x - TILE_WIDTH / 2, y + TILE_HEIGHT / 2);
          ctx.closePath();
          ctx.stroke();
        }
      }

      ctx.restore();
    };

    register(draw);
    return () => unregister(draw);
  }, [ctx, width, length]);

  return null;
};
