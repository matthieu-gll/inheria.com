import { create } from "zustand";

export type TileCoords = { x: number; y: number };

interface GridStore {
  width: number;
  length: number;
  tileSize: { w: number; h: number };
  centerOffset: { x: number; y: number };

  setDimensions: (width: number, length: number) => void;
  setTileSize: (w: number, h: number) => void;

  tileToIso: (tile: TileCoords) => { x: number; y: number };
  isoToTile: (iso: { x: number; y: number }) => TileCoords;

  hoveredTile: TileCoords | null;
  setHoveredTile: (tile: TileCoords | null) => void;
}

export const useGridStore = create<GridStore>((set, get) => ({
  width: 10,
  length: 10,
  tileSize: { w: 64, h: 32 },
  centerOffset: { x: 0, y: 0 },

  setDimensions: (width, length) => set({ width, length }),
  setTileSize: (w, h) => set({ tileSize: { w, h } }),

  tileToIso: ({ x, y }) => {
    const { tileSize, width, length } = get();
    return {
      x: (x - y) * (tileSize.w / 2),
      y: (x + y) * (tileSize.h / 2),
    };
  },

  isoToTile: ({ x, y }) => {
    const { tileSize } = get();
    const tx = (x / (tileSize.w / 2) + y / (tileSize.h / 2)) / 2;
    const ty = (y / (tileSize.h / 2) - x / (tileSize.w / 2)) / 2;
    return {
      x: Math.round(tx),
      y: Math.round(ty),
    };
  },

  hoveredTile: null,
  setHoveredTile: (tile) => set({ hoveredTile: tile }),
}));
