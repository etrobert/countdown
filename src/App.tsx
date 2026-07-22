import Deck from "./Deck.tsx";
import Hand from "./Hand.tsx";
import { CARDS, DECK_SIZE, HAND_SIZE } from "./balance.ts";

export default function App() {
  return (
    <main className="board">
      <h1>Hello, World!</h1>
      <Hand cards={CARDS.slice(0, HAND_SIZE)} />
      <Deck count={DECK_SIZE} />
    </main>
  );
}
