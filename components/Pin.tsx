const pinColors: Record<string, { rim: string; face: string; shine: string }> = {
  red: { rim: "#7A2A1A", face: "#D65B3F", shine: "#F3A487" },
  teal: { rim: "#1D4A42", face: "#3F9284", shine: "#8FD3C6" },
  gold: { rim: "#8A6A15", face: "#DDB63A", shine: "#F4DD8C" },
  navy: { rim: "#152E44", face: "#3A6690", shine: "#8FB4D8" },
};

export default function Pin({ color = "red" }: { color?: keyof typeof pinColors }) {
  const c = pinColors[color];
  return (
    <svg
      viewBox="0 0 40 32"
      className="absolute -top-3 left-1/2 z-10 h-7 w-7 -translate-x-1/2"
      style={{ filter: "drop-shadow(0 3px 3px rgba(0,0,0,0.45))" }}
      aria-hidden
    >
      {/* contact shadow on the paper below */}
      <ellipse cx="20" cy="26" rx="6" ry="1.6" fill="rgba(0,0,0,0.3)" />
      {/* rim */}
      <circle cx="20" cy="16" r="10" fill={c.rim} />
      {/* face */}
      <circle cx="20" cy="15" r="8.4" fill={c.face} />
      {/* gloss highlight */}
      <ellipse cx="17" cy="11.5" rx="3" ry="2" fill={c.shine} opacity="0.85" />
    </svg>
  );
}
