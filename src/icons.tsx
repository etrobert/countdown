export function SwordIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      {/* Chunky on purpose: thin strokes turn into an illegible "†" at 16px. */}
      <path d="M12 1l3 5.5V13H9V6.5z" />
      <path d="M4.5 13h15v3.2h-15z" />
      <path d="M10 16.2h4V23h-4z" />
    </svg>
  );
}

export function BootIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M8 2h7v9H8z" />
      <path d="M8 11v10h13v-4l-6-3v-3z" />
    </svg>
  );
}

export function HeartIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M12 21S3 15 3 8.5A5.5 5.5 0 0 1 12 5a5.5 5.5 0 0 1 9 3.5C21 15 12 21 12 21z" />
    </svg>
  );
}
