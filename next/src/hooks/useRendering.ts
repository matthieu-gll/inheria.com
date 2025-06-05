import { RenderingContext } from "@/contexts/CanvasRenderingContext";
import { useContext } from "react";

export const useRendering = () => {
  const context = useContext(RenderingContext);
  if (!context) throw new Error("RenderingContext not found");
  return context;
};
