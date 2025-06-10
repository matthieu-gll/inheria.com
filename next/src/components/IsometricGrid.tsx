"use client";

import { useRendering } from "@/hooks/useRendering";
import { useEffect } from "react";
import { useGridStore } from "@/stores/useGridStore";
import { usePlayerStore } from "@/stores/usePlayerStore";

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

  const { setDestination } = usePlayerStore();

  useEffect(() => {
    setDimensions(width, length);
  }, [width, length, setDimensions]);

  const getGridOffset = (canvasWidth: number, canvasHeight: number) => {
    const gridWidth = ((width + length) * tileSize.w) / 2;
    const gridHeight = ((width + length) * tileSize.h) / 2;

    const offsetX = (canvasWidth - gridWidth) / 2 + gridWidth / 2;
    const offsetY = (canvasHeight - gridHeight) / 2;

    return { offsetX, offsetY };
  };

  useEffect(() => {
    if (!ctx) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = ctx.canvas.getBoundingClientRect();
      const rawX = e.clientX - rect.left;
      const rawY = e.clientY - rect.top;

      const screenW = ctx.canvas.width;
      const screenH = ctx.canvas.height;
      const { offsetX, offsetY } = getGridOffset(screenW, screenH);

      const adjustedX = rawX - offsetX;
      const adjustedY = rawY - offsetY;

      const tile = isoToTile({ x: adjustedX, y: adjustedY });

      if (tile.x >= 0 && tile.y >= 0 && tile.x < width && tile.y < length) {
        setHoveredTile(tile);
      } else {
        setHoveredTile(null);
      }
    };

    const handleClick = (e: MouseEvent) => {
      const rect = ctx.canvas.getBoundingClientRect();
      const rawX = e.clientX - rect.left;
      const rawY = e.clientY - rect.top;

      const screenW = ctx.canvas.width;
      const screenH = ctx.canvas.height;
      const { offsetX, offsetY } = getGridOffset(screenW, screenH);

      const adjustedX = rawX - offsetX;
      const adjustedY = rawY - offsetY;

      const tile = isoToTile({ x: adjustedX, y: adjustedY });

      if (tile.x >= 0 && tile.y >= 0 && tile.x < width && tile.y < length) {
        setDestination(tile);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick);
    };
  }, [ctx, width, length, tileSize, isoToTile, setHoveredTile, setDestination]);

  useEffect(() => {
    if (!ctx) return;

    const draw = (ctx: CanvasRenderingContext2D) => {
      const screenW = ctx.canvas.width;
      const screenH = ctx.canvas.height;
      const { offsetX, offsetY } = getGridOffset(screenW, screenH);

      ctx.save();
      ctx.translate(offsetX, offsetY);

      // Grille de fond
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

      // Tuile survolée
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
  }, [
    ctx,
    tileSize,
    width,
    length,
    hoveredTile,
    tileToIso,
    register,
    unregister,
  ]);

  return null;
};
