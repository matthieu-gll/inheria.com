"use client";

import { useRendering } from "@/hooks/useRendering";
import { useEffect, useState, useRef } from "react";

const SPRITE_SIZE = 64;
const SCALE = 2;
const FRAME_COUNT = 12;
const FRAME_DURATION = 100;
const TILE_WIDTH = 64;
const TILE_HEIGHT = 32;

interface PlayerProps {
  gridX: number;
  gridY: number;
  gridWidth: number;
  gridHeight: number;
  lookPointer?: boolean;
}

export const Player = ({
  gridX,
  gridY,
  gridWidth,
  gridHeight,
  lookPointer = false,
}: PlayerProps) => {
  const { register, unregister, ctx } = useRendering();
  const frameRef = useRef(0);
  const lastFrameTime = useRef(0);
  const [sprite, setSprite] = useState<HTMLImageElement | null>(null);
  const [direction, setDirection] = useState("S");
  const currentDirection = useRef("S");

  const loadSprite = (dir: string) => {
    const img = new Image();
    img.src = `/assets/characters/blank/idle/idle_${dir}.png`;
    img.onload = () => setSprite(img);
  };

  useEffect(() => {
    loadSprite(direction);
  }, [direction]);

  useEffect(() => {
    if (!lookPointer) return;
    const updateDirection = (e: MouseEvent) => {
      const { innerWidth: width, innerHeight: height } = window;
      const x = e.clientX;
      const y = e.clientY;

      const distTop = y;
      const distBottom = height - y;
      const distLeft = x;
      const distRight = width - x;

      const vertical = distTop < distBottom ? "N" : "S";
      const horizontal = distLeft < distRight ? "W" : "E";

      const minDist = Math.min(distTop, distBottom, distLeft, distRight);

      let dir = "";
      if (minDist === distTop || minDist === distBottom) {
        if (Math.abs(distLeft - distRight) < width * 0.2) {
          dir = vertical;
        } else {
          dir = vertical + (distLeft < distRight ? "W" : "E");
        }
      } else {
        if (Math.abs(distTop - distBottom) < height * 0.2) {
          dir = horizontal;
        } else {
          dir = (distTop < distBottom ? "N" : "S") + horizontal;
        }
      }

      if (currentDirection.current !== dir) {
        currentDirection.current = dir;
        setDirection(dir);
      }
    };

    window.addEventListener("mousemove", updateDirection);
    return () => window.removeEventListener("mousemove", updateDirection);
  }, []);

  useEffect(() => {
    if (!ctx || !sprite) return;

    const draw = (ctx: CanvasRenderingContext2D) => {
      const now = performance.now();
      if (now - lastFrameTime.current > FRAME_DURATION) {
        frameRef.current = (frameRef.current + 1) % FRAME_COUNT;
        lastFrameTime.current = now;
      }

      const screenW = ctx.canvas.width;
      const screenH = ctx.canvas.height;

      const frameX = frameRef.current * SPRITE_SIZE;
      const frameY = 0;
      const drawWidth = SPRITE_SIZE * SCALE;
      const drawHeight = SPRITE_SIZE * SCALE;

      // Calcul isométrique relatif au centre
      const isoX = (gridX - gridY) * (TILE_WIDTH / 2);
      const isoY = (gridX + gridY) * (TILE_HEIGHT / 2);

      // Position du joueur à l'écran
      const posX = screenW / 2 + isoX - drawWidth / 2;
      const posY = screenH / 2 + isoY - drawHeight + (SPRITE_SIZE / 2) * SCALE;

      // Coordonnées des sommets du losange
      const tilePoints = [
        { x: screenW / 2 + isoX, y: screenH / 2 + isoY },
        {
          x: screenW / 2 + isoX + TILE_WIDTH / 2,
          y: screenH / 2 + isoY + TILE_HEIGHT / 2,
        },
        { x: screenW / 2 + isoX, y: screenH / 2 + isoY + TILE_HEIGHT },
        {
          x: screenW / 2 + isoX - TILE_WIDTH / 2,
          y: screenH / 2 + isoY + TILE_HEIGHT / 2,
        },
      ];

      // Dessiner en rouge la tuile où est le joueur
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tilePoints[0].x, tilePoints[0].y);
      for (let i = 1; i < tilePoints.length; i++) {
        ctx.lineTo(tilePoints[i].x, tilePoints[i].y);
      }
      ctx.closePath();
      ctx.globalAlpha = 0.5;
      ctx.stroke();
      ctx.globalAlpha = 1;

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        sprite,
        frameX,
        frameY,
        SPRITE_SIZE,
        SPRITE_SIZE,
        posX,
        posY,
        drawWidth,
        drawHeight
      );
    };

    register(draw);
    return () => unregister(draw);
  }, [ctx, sprite, gridX, gridY, gridWidth, gridHeight]);

  return null;
};
