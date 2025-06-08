import { Position } from "@/types";
import { create } from "zustand";

interface PlayerState {
  destination: Position | null;
  setDestination: (pos: Position | null) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  destination: null,
  setDestination: (pos) => set({ destination: pos }),
}));
