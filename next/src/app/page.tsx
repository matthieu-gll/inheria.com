import { IsometricGrid } from "@/components/IsometricGrid";
import { Player } from "@/components/Player";
import { Render } from "@/components/Render";

export default function Home() {
  return (
    <>
      <Render>
        <IsometricGrid width={30} length={30} />
        <Player position={{ x: 0, y: 0 }} />
      </Render>
    </>
  );
}
