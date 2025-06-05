import { IsometricGrid } from "@/components/IsometricGrid";
import { Player } from "@/components/Player";
import { Render } from "@/components/Render";
import Image from "next/image";

export default function Home() {
  return (
    <>
      <Image
        src={"/assets/maps/dofus/4-14.avif"}
        width={1920}
        height={1080}
        alt=""
        className="object-cover absolute top-0 leading-0 w-screen h-screen"
      />
      <Render enableZoom>
        <IsometricGrid width={50} length={50} />
        <Player
          lookPointer
          gridX={0}
          gridY={0}
          gridWidth={10}
          gridHeight={10}
        />
      </Render>
    </>
  );
}
