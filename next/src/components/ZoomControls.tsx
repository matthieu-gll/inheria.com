"use client";

import { useZoomStore } from "@/stores/zoomStore";
import { useControls } from "leva";

export const ZoomControls = () => {
  const { zoom, setZoom } = useZoomStore();

  useControls({
    zoom: {
      value: zoom,
      min: 0,
      max: 1000,
      step: 1,
      onChange: (val) => setZoom(val),
    },
  });

  return null;
};
