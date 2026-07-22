import { useState } from "react";
import Board from "./Board.tsx";
import Deck from "./Deck.tsx";
import Hand from "./Hand.tsx";
import { draw, initialState, play } from "./state.ts";

export default function App() {
  const [state, setState] = useState(initialState);
  // Which card is selected is a UI concern, not a rule — it stays out of
  // GameState so the sim never has to care about it.
  const [selected, setSelected] = useState<number | null>(null);

  function playInto(lane: number) {
    if (selected === null) return;
    setState((s) => play(s, selected, lane));
    setSelected(null);
  }

  return (
    <main className="relative grid min-h-screen grid-rows-[1fr_auto] justify-items-center bg-parchment text-ink">
      <Board
        minions={state.minions}
        selecting={selected !== null}
        onPlayLane={playInto}
      />
      <Hand cards={state.hand} selected={selected} onSelect={setSelected} />
      <Deck count={state.deck.length} onDraw={() => setState(draw)} />
    </main>
  );
}
