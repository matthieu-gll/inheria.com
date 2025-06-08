"use client";

import { useRendering } from "@/hooks/useRendering";
import { useEffect, useState, useRef } from "react";
import { usePlayerStore } from "@/stores/usePlayerStore";

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

const getDirectionFromVector = (dx: number, dy: number): string => {
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  if (angle >= -22.5 && angle < 22.5) return "E";
  if (angle >= 22.5 && angle < 67.5) return "SE";
  if (angle >= 67.5 && angle < 112.5) return "S";
  if (angle >= 112.5 && angle < 157.5) return "SW";
  if (angle >= 157.5 || angle < -157.5) return "W";
  if (angle >= -157.5 && angle < -112.5) return "NW";
  if (angle >= -112.5 && angle < -67.5) return "N";
  if (angle >= -67.5 && angle < -22.5) return "NE";

  return "S"; // fallback
};

export const Player = ({ position, lookPointer = false }: PlayerProps) => {
  const { register, unregister, ctx } = useRendering();
  const frameRef = useRef(0);
  const lastFrameTime = useRef(0);
  const [sprite, setSprite] = useState<HTMLImageElement | null>(null);
  const [direction, setDirection] = useState("S");
  const currentDirection = useRef("S");

  const spriteCache = useRef<Record<string, HTMLImageElement>>({});

  const { destination, setDestination } = usePlayerStore();
  const positionRef = useRef<PlayerPosition>(position);

  const [animationType, setAnimationType] = useState<"idle" | "walk">("idle");

  useEffect(() => {
    const animations = ["idle", "walk"];
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

    animations.forEach((anim) => {
      directions.forEach((dir) => {
        const key = `${anim}_${dir}`;
        const img = new Image();
        img.src = `/assets/characters/blank/${anim}/${anim}_${dir}.png`;
        img.onload = () => {
          spriteCache.current[key] = img;
          if (key === `${animationType}_${direction}`) {
            setSprite(img); // affichage immédiat si c'est celle actuelle
          }
        };
      });
    });
  }, []);

  useEffect(() => {
    const key = `${animationType}_${direction}`;
    const img = spriteCache.current[key];
    if (img) {
      setSprite(img);
    }
  }, [direction, animationType]);

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
        const speed = 1;
        const dx = destination.x - positionRef.current.x;
        const dy = destination.y - positionRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < speed) {
          positionRef.current = destination;
          setDestination(null);
          setAnimationType("idle");
        } else {
          positionRef.current = {
            x: positionRef.current.x + (dx / dist) * speed,
            y: positionRef.current.y + (dy / dist) * speed,
          };
          const newDir = getDirectionFromVector(dx, dy);
          if (direction !== newDir) {
            setDirection(newDir);
          }
          if (animationType !== "walk") setAnimationType("walk");
        }
      } else {
        if (animationType !== "idle") setAnimationType("idle");
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

      // === Debug : cadre autour du sprite dessiné ===
      ctx.save();
      ctx.strokeStyle = "rgba(255, 0, 0, 0.6)";
      ctx.lineWidth = 1;
      ctx.strokeRect(posX, posY, drawWidth, drawHeight);
      ctx.restore();

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

  return null;
};
