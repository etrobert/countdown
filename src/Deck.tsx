declare module "react" {
  interface CSSProperties {
    /** Position of a back within the stack, 0 at the bottom. */
    "--depth"?: number;
  }
}

export default function Deck({ count }: { count: number }) {
  return (
    <div className="deck">
      <div className="deck-stack" aria-label={`${count} cards left`}>
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="deck-back" style={{ "--depth": i }} />
        ))}
      </div>
      <span className="deck-count">{count}</span>
    </div>
  );
}
