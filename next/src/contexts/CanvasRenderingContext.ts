import { RenderCallback } from "@/types";
import { createContext } from "react";

export const RenderingContext = createContext<{
  register: (fn: RenderCallback) => void;
  unregister: (fn: RenderCallback) => void;
  ctx: CanvasRenderingContext2D | null;
} | null>(null);
