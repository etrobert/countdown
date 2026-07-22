declare module "react" {
  interface CSSProperties {
    /** Position of a back within the stack, 0 at the bottom. */
    "--depth"?: number;
  }
}

export default function Deck({ count }: { count: number }) {
  return (
    <div className="absolute right-10 bottom-12 grid justify-items-center gap-3">
      <div
        className="relative h-[var(--card-h)] w-[var(--card-w)]"
        aria-label={`${count} cards left`}
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
      </div>
      <span className="font-bold tabular-nums">{count}</span>
    </div>
  );
}
