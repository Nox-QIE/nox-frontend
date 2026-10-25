import { Suspense } from "react";
import { GameView } from "@/components/GameView";

export default function GamePage() {
  return (
    <Suspense>
      <GameView />
    </Suspense>
  );
}
