import { IsometricGrid } from "@/components/IsometricGrid";
import { Player } from "@/components/Player";
import { Render } from "@/components/Render";

export default function Home() {
  return (
    <>
      <Render enableZoom>
        <IsometricGrid width={10} length={10} />
        <Player lookPointer position={{ x: 0, y: 0 }} />
      </Render>
    </>
  );
}
