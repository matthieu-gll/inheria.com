import { DEFAULT_ZOOM } from "@/constants/zoom";
import { create } from "zustand";

interface ZoomState {
  zoom: number;
  setZoom: (z: number) => void;
}

export const useZoomStore = create<ZoomState>((set) => ({
  zoom: DEFAULT_ZOOM,
  setZoom: (z) => set({ zoom: z }),
}));
