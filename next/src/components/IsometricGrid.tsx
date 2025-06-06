"use client";

import { useRendering } from "@/hooks/useRendering";
import { useEffect } from "react";
import { useGridStore } from "@/stores/useGridStore";

interface Props {
  width: number;
  length: number;
}

export const IsometricGrid = ({ width, length }: Props) => {
  const { register, unregister, ctx } = useRendering();
  const {
    tileSize,
    tileToIso,
    isoToTile,
    hoveredTile,
    setHoveredTile,
    setDimensions,
  } = useGridStore();

  useEffect(() => {
    setDimensions(width, length);
  }, [width, length]);

  useEffect(() => {
    if (!ctx) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = ctx.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - ctx.canvas.width / 2;
      const mouseY = e.clientY - rect.top - ctx.canvas.height / 2;

      const tile = isoToTile({ x: mouseX, y: mouseY });

      if (tile.x >= 0 && tile.y >= 0 && tile.x < width && tile.y < length) {
        setHoveredTile(tile);
      } else {
        setHoveredTile(null);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [ctx, width, length]);

  useEffect(() => {
    if (!ctx) return;

    const draw = (ctx: CanvasRenderingContext2D) => {
      const screenW = ctx.canvas.width;
      const screenH = ctx.canvas.height;

      const offsetX = screenW / 2;
      const offsetY = screenH / 2;

      ctx.save();
      ctx.translate(offsetX, offsetY);

      // Dessin normal de la grille
      ctx.strokeStyle = "#555";
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.2;

      for (let i = 0; i < width; i++) {
        for (let j = 0; j < length; j++) {
          const iso = tileToIso({ x: i, y: j });

          ctx.beginPath();
          ctx.moveTo(iso.x, iso.y);
          ctx.lineTo(iso.x + tileSize.w / 2, iso.y + tileSize.h / 2);
          ctx.lineTo(iso.x, iso.y + tileSize.h);
          ctx.lineTo(iso.x - tileSize.w / 2, iso.y + tileSize.h / 2);
          ctx.closePath();
          ctx.stroke();
        }
      }

      // Dessin de la tuile survolée
      if (hoveredTile) {
        const iso = tileToIso(hoveredTile);
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
        ctx.beginPath();
        ctx.moveTo(iso.x, iso.y);
        ctx.lineTo(iso.x + tileSize.w / 2, iso.y + tileSize.h / 2);
        ctx.lineTo(iso.x, iso.y + tileSize.h);
        ctx.lineTo(iso.x - tileSize.w / 2, iso.y + tileSize.h / 2);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    };

    register(draw);
    return () => unregister(draw);
  }, [ctx, tileSize, width, length, hoveredTile]);

  return null;
};
