import type { Card as CardData } from "./balance.ts";

function SwordIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className="size-4"
    >
      {/* Chunky on purpose: thin strokes turn into an illegible "†" at 16px. */}
      <path d="M12 1l3 5.5V13H9V6.5z" />
      <path d="M4.5 13h15v3.2h-15z" />
      <path d="M10 16.2h4V23h-4z" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className="size-4"
    >
      <path d="M12 21S3 15 3 8.5A5.5 5.5 0 0 1 12 5a5.5 5.5 0 0 1 9 3.5C21 15 12 21 12 21z" />
    </svg>
  );
}

export default function Card({ card }: { card: CardData }) {
  return (
    <article className="grid h-[var(--card-h)] w-[var(--card-w)] grid-rows-[auto_1fr_auto] rounded-md border border-ink bg-face p-2.5 shadow-md">
      <span className="justify-self-start font-bold">{card.cost}</span>
      <h2 className="self-center text-center text-lg font-bold">{card.name}</h2>
      <footer className="flex justify-between font-bold">
        <span
          className="flex items-center gap-1"
          aria-label={`Attack ${card.atk}`}
        >
          <SwordIcon />
          {card.atk}
        </span>
        <span
          className="flex items-center gap-1"
          aria-label={`Health ${card.hp}`}
        >
          <HeartIcon />
          {card.hp}
        </span>
      </footer>
    </article>
  );
}
