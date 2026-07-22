import { useState } from "react";
import Deck from "./Deck.tsx";
import Hand from "./Hand.tsx";
import { initialState } from "./state.ts";

export default function App() {
  const [state] = useState(initialState);

  return (
    <main className="relative grid min-h-screen grid-rows-[1fr_auto] justify-items-center bg-parchment text-ink">
      <h1 className="self-center text-3xl font-bold">Hello, World!</h1>
      <Hand cards={state.hand} />
      <Deck count={state.deck.length} />
    </main>
  );
}
