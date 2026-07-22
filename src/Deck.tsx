declare module "react" {
  interface CSSProperties {
    /** Position of a back within the stack, 0 at the bottom. */
    "--depth"?: number;
  }
}

export default function Deck({
  count,
  onDraw,
}: {
  count: number;
  onDraw: () => void;
}) {
  return (
    <div className="absolute right-10 bottom-12 grid justify-items-center gap-3">
      <button
        type="button"
        onClick={onDraw}
        disabled={count === 0}
        aria-label={`Draw a card — ${count} left`}
        className="relative h-[var(--card-h)] w-[var(--card-w)] cursor-pointer transition-transform duration-150 hover:-translate-y-1 disabled:cursor-default disabled:hover:translate-y-0"
      >
        {/* Each back sits slightly above and right of the one below, and
            carries a pale edge so the seams read against the dark face —
            otherwise the stack looks like a single flat card. */}
        {Array.from({ length: count }, (_, i) => (
          <div
            key={i}
            className="card-back absolute inset-0 translate-x-[calc(var(--depth)*0.5px)] translate-y-[calc(var(--depth)*-3px)] rounded-md border border-edge"
            style={{ "--depth": i }}
          />
        ))}
      </button>
      <span className="font-bold tabular-nums">{count}</span>
    </div>
  );
}
