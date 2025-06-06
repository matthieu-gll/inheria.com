"use client";

import { useRendering } from "@/hooks/useRendering";
import { useEffect, useState, useRef } from "react";

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

      const isoX = position.x;
      const isoY = position.y;

      // Centrage + correction padding sprite
      const posX = screenW / 2 + isoX - drawWidth / 2;
      const posY = screenH / 2 + isoY - drawHeight + (SPRITE_SIZE / 2) * SCALE;

      // Déplacement vers destination
      if (destination) {
        const speed = 2; // pixels/frame
        const dx = destination.x - position.x;
        const dy = destination.y - position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < speed) {
          position.x = destination.x;
          position.y = destination.y;
          setDestination(null);
        } else {
          position.x += (dx / dist) * speed;
          position.y += (dy / dist) * speed;
        }

        positionRef.current = position;
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

      // 🔴 Dessin tuile cible
      if (destination) {
        const tileX = destination.x - position.x + isoX;
        const tileY = destination.y - position.y + isoY;

        const px = screenW / 2 + destination.x;
        const py = screenH / 2 + destination.y;

        const halfW = TILE_WIDTH / 2;
        const halfH = TILE_HEIGHT / 2;

        const points = [
          { x: px, y: py },
          { x: px + halfW, y: py + halfH },
          { x: px, y: py + TILE_HEIGHT },
          { x: px - halfW, y: py + halfH },
        ];

        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        points.forEach((p, i) => {
          if (i > 0) ctx.lineTo(p.x, p.y);
        });
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
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const canvasCenterX = ctx.canvas.width / 2;
      const canvasCenterY = ctx.canvas.height / 2;

      const offsetX = clickX - canvasCenterX;
      const offsetY = clickY - canvasCenterY;

      const tileY =
        (offsetY / (TILE_HEIGHT / 2) + offsetX / (TILE_WIDTH / 2)) / 2;
      const tileX =
        (offsetX / (TILE_WIDTH / 2) - offsetY / (TILE_HEIGHT / 2)) / 2;

      const snappedX = Math.round(tileX);
      const snappedY = Math.round(tileY);

      const isoX = (snappedX - snappedY) * (TILE_WIDTH / 2);
      const isoY = (snappedX + snappedY) * (TILE_HEIGHT / 2);

      setDestination({ x: isoX, y: isoY });
    };

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [ctx]);

  return null;
};
