"use client";

import { useRendering } from "@/hooks/useRendering";
import { useEffect, useState, useRef } from "react";
import { useGridStore } from "@/stores/useGridStore";

const SPRITE_SIZE = 64;
const SCALE = 2;
const FRAME_COUNT = 12;
const FRAME_DURATION = 100;
const TILE_WIDTH = 64;
const TILE_HEIGHT = 32;

type PlayerPosition = {
  x: number;
  y: number;
};

interface PlayerProps {
  position: PlayerPosition;
  lookPointer?: boolean;
}

export const Player = ({ position, lookPointer = false }: PlayerProps) => {
  const { register, unregister, ctx } = useRendering();
  const frameRef = useRef(0);
  const lastFrameTime = useRef(0);
  const [sprite, setSprite] = useState<HTMLImageElement | null>(null);
  const [direction, setDirection] = useState("S");
  const currentDirection = useRef("S");

  const [destination, setDestination] = useState<PlayerPosition | null>(null);
  const positionRef = useRef<PlayerPosition>(position);

  // On récupère les helpers et infos de la grille
  const { tileToIso, isoToTile, tileSize, width, length } = useGridStore();

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

      const frameX = frameRef.current * SPRITE_SIZE;
      const frameY = 0;
      const drawWidth = SPRITE_SIZE * SCALE;
      const drawHeight = SPRITE_SIZE * SCALE;

      const screenW = ctx.canvas.width;
      const screenH = ctx.canvas.height;

      // Position actuelle du player en iso
      const isoX = positionRef.current.x;
      const isoY = positionRef.current.y;

      // Centrer le dessin sur le canvas + ajuster le sprite
      const posX = screenW / 2 + isoX - drawWidth / 2;
      const posY = screenH / 2 + isoY - drawHeight + (SPRITE_SIZE / 2) * SCALE;

      // Déplacement vers destination (si définie)
      if (destination) {
        const speed = 2; // pixels/frame
        const dx = destination.x - positionRef.current.x;
        const dy = destination.y - positionRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < speed) {
          positionRef.current = destination;
          setDestination(null);
        } else {
          positionRef.current = {
            x: positionRef.current.x + (dx / dist) * speed,
            y: positionRef.current.y + (dy / dist) * speed,
          };
        }
      }

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

      // Optionnel: dessiner la tuile cible
      if (destination) {
        const px = screenW / 2 + destination.x;
        const py = screenH / 2 + destination.y;

        const halfW = TILE_WIDTH / 2;
        const halfH = TILE_HEIGHT / 2;

        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + halfW, py + halfH);
        ctx.lineTo(px, py + TILE_HEIGHT);
        ctx.lineTo(px - halfW, py + halfH);
        ctx.closePath();
        ctx.stroke();
      }
    };

    register(draw);
    return () => unregister(draw);
  }, [ctx, sprite, destination]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!ctx) return;
      const rect = ctx.canvas.getBoundingClientRect();

      // Coordonnées souris relative au canvas
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const canvasCenterX = ctx.canvas.width / 2;
      const canvasCenterY = ctx.canvas.height / 2;

      // Calcul offset relatif au centre (car ta grille est centrée)
      const offsetX = clickX - canvasCenterX;
      const offsetY = clickY - canvasCenterY;

      // Conversion offset -> tuile iso (dans coordonnées de ta grille)
      const tileCoords = isoToTile({ x: offsetX, y: offsetY });

      // Vérifier limites de la grille
      if (
        tileCoords.x >= 0 &&
        tileCoords.y >= 0 &&
        tileCoords.x < width &&
        tileCoords.y < length
      ) {
        // Conversion tuile -> coords iso
        const isoPos = tileToIso(tileCoords);

        setDestination(isoPos);
      }
    };

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [ctx, isoToTile, tileToIso, width, length]);

  return null;
};
