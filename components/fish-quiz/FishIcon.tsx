import { FISH_BY_ID, type FishId } from "@/lib/fishQuiz";

// Stylized geometric fish silhouettes — original art, one distinct shape per
// species (salmon bodies, a flat halibut, a spiky lingcod, a long sturgeon).
// Colors come from the species data so icons stay in sync with the quiz.

type FishIconProps = {
  variant: FishId;
  className?: string;
};

export default function FishIcon({ variant, className = "" }: FishIconProps) {
  const color = FISH_BY_ID[variant].color;
  const ink = "#1A1712";

  return (
    <svg viewBox="0 0 120 72" className={className} aria-hidden="true">
      {variant === "chinook" && (
        <>
          <g fill={color}>
            <path d="M8 38 C14 18 58 12 90 26 C105 32 101 48 87 50 C56 62 14 56 8 38 Z" />
            <path d="M88 30 L114 12 L118 36 L112 58 L88 38 Z" />
            <path d="M48 18 C54 7 70 7 76 15 C64 13 54 15 48 18 Z" />
          </g>
          <circle cx="26" cy="33" r="2.6" fill={ink} />
          <circle cx="27.4" cy="31.6" r="1" fill="#fff" />
        </>
      )}
      {variant === "sockeye" && (
        <>
          <g fill={color}>
            <path d="M10 36 C16 22 60 15 88 27 C102 33 100 45 86 48 C56 57 16 50 10 36 Z" />
            <path d="M86 30 L112 16 L116 36 L108 54 L86 36 Z" />
            <path d="M50 20 C56 10 70 11 74 18 C62 17 54 18 50 20 Z" />
          </g>
          <circle cx="24" cy="33" r="2.6" fill={ink} />
          <circle cx="25.4" cy="31.6" r="1" fill="#fff" />
        </>
      )}
      {variant === "steelhead" && (
        <>
          <g fill={color}>
            <path d="M6 36 C14 26 64 14 92 28 C104 34 102 46 90 48 C62 56 16 46 6 36 Z" />
            <path d="M90 30 L114 16 L118 38 L112 54 L90 36 Z" />
          </g>
          <circle cx="46" cy="22" r="1.5" fill="#4A555C" />
          <circle cx="60" cy="20" r="1.5" fill="#4A555C" />
          <circle cx="74" cy="23" r="1.5" fill="#4A555C" />
          <circle cx="54" cy="34" r="1.2" fill="#4A555C" />
          <circle cx="20" cy="33" r="2.6" fill={ink} />
          <circle cx="21.4" cy="31.6" r="1" fill="#fff" />
        </>
      )}
      {variant === "halibut" && (
        <>
          <g fill={color}>
            <path d="M12 36 C20 18 98 18 108 36 C98 54 20 54 12 36 Z" />
            <path d="M104 34 L120 27 L120 45 Z" />
          </g>
          <path d="M16 36 C 22 34 30 34 36 36" stroke="#5E4429" strokeWidth="2" fill="none" strokeLinecap="round" />
          <circle cx="36" cy="21" r="2.4" fill={ink} />
          <circle cx="52" cy="21" r="2.4" fill={ink} />
          <circle cx="37.2" cy="20" r="0.9" fill="#fff" />
          <circle cx="53.2" cy="20" r="0.9" fill="#fff" />
        </>
      )}
      {variant === "lingcod" && (
        <>
          <g fill={color}>
            <path d="M6 42 C18 30 80 26 102 36 C110 40 104 50 90 50 C58 58 18 54 6 42 Z" />
            <path d="M100 34 L118 26 L116 42 Z" />
            <path d="M40 30 L44 15 L52 23 L58 11 L66 21 L72 13 L78 25 L86 21 L90 29 Z" />
          </g>
          <path d="M6 42 L16 39 L10 50 Z" fill="#123A31" />
          <circle cx="24" cy="40" r="2.6" fill={ink} />
          <circle cx="25.4" cy="38.6" r="1" fill="#fff" />
        </>
      )}
      {variant === "sturgeon" && (
        <>
          <g fill={color}>
            <path d="M4 34 C14 24 68 20 100 30 C112 36 106 46 90 46 C62 52 22 48 10 42 Z" />
            <path d="M98 32 L122 12 L118 42 Z" />
          </g>
          <g fill="#56503F">
            <path d="M36 22 l4 7 -4 3 -4 -3 z" />
            <path d="M54 21 l4 6 -4 3 -4 -3 z" />
            <path d="M72 23 l4 6 -4 3 -4 -3 z" />
            <path d="M88 27 l4 6 -4 3 -4 -3 z" />
          </g>
          <path d="M10 40 C 16 38 24 38 30 40" stroke="#56503F" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <circle cx="22" cy="32" r="2.6" fill={ink} />
          <circle cx="23.4" cy="30.6" r="1" fill="#fff" />
        </>
      )}
    </svg>
  );
}
