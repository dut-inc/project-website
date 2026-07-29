// Blank placeholder stickers — die-cut shapes with no artwork yet. Swap the
// fill/path in each one for real art whenever you're ready; the dashed line
// is just a placeholder "cut line" so it reads as an editable slot.

export function PennantSticker({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 130" className={className} aria-hidden>
      <g transform="rotate(-8 80 65)">
        <path
          d="M12 14 H130 L100 65 L130 116 H12 Z"
          fill="#2B2E33"
          stroke="#57595E"
          strokeWidth="2"
          strokeDasharray="4 5"
        />
      </g>
    </svg>
  );
}

export function AnchorSticker({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 140 140" className={className} aria-hidden>
      <g transform="rotate(6 70 70)">
        <circle
          cx="70"
          cy="70"
          r="58"
          fill="#2B2E33"
          stroke="#57595E"
          strokeWidth="2"
          strokeDasharray="4 5"
        />
      </g>
    </svg>
  );
}

export function RainDropSticker({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden>
      <g transform="rotate(-4 60 60)">
        <rect
          x="8"
          y="8"
          width="104"
          height="104"
          rx="14"
          fill="#2B2E33"
          stroke="#57595E"
          strokeWidth="2"
          strokeDasharray="4 5"
        />
      </g>
    </svg>
  );
}
