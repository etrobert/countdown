import Deck from "./Deck.tsx";
import Hand from "./Hand.tsx";
import { CARDS, DECK_SIZE, HAND_SIZE } from "./balance.ts";

export default function App() {
  return (
    <main className="relative grid min-h-screen grid-rows-[1fr_auto] justify-items-center bg-parchment text-ink">
      <h1 className="self-center text-3xl font-bold">Hello, World!</h1>
      <Hand cards={CARDS.slice(0, HAND_SIZE)} />
      <Deck count={DECK_SIZE} />
    </main>
  );
}
