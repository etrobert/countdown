import { useState } from "react";
import Board from "./Board.tsx";
import Deck from "./Deck.tsx";
import Hand from "./Hand.tsx";
import { initialState } from "./state.ts";

export default function App() {
  const [state] = useState(initialState);

  return (
    <main className="relative grid min-h-screen grid-rows-[1fr_auto] justify-items-center bg-parchment text-ink">
      <Board />
      <Hand cards={state.hand} />
      <Deck count={state.deck.length} />
    </main>
  );
}
