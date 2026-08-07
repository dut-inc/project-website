import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        wall: "#24262A",
        wall2: "#2E3136",
        frame: "#3B2A1C",
        frameLight: "#573F29",
        cork: "#7C5A3C",
        corkDark: "#5E4429",
        corkLight: "#8F6B49",
        cream: "#EFE7D2",
        kraft: "#D9C8A0",
        ink: "#2A2620",
        ink2: "#6B6250",
        pinRed: "#C1442D",
        pinTeal: "#2F7A6B",
        pinGold: "#C9A227",
        pinNavy: "#274B6D",
        shelf: {
          walnut: "#3A271C",
          wood: "#62442E",
          woodLight: "#8A6243",
          brass: "#A98245",
          paper: "#E8DCC4",
          paperDark: "#CBB893",
          ink: "#2D241D",
          burgundy: "#7B302E",
          forest: "#4D674D",
          ochre: "#A8793F",
          slate: "#536579",
          charcoal: "#554D48",
          weathered: "#8B7762",
        },
        sports: {
          bg: "#0B0B0D",
          accent: "#FF9552",
        },
        market: {
          // Fir Green — the official heritage green of the Public Market
          // Center sign housing (per Pike Place Market PDA standards).
          green: "#1D2D20",
          deep: "#151E18",
          card: "#2A4534",
          cardHover: "#335A40",
          red: "#FF4638",
          redSoft: "rgba(255,70,56,0.12)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
        sign: ["var(--font-sign)"],
      },
      backgroundImage: {
        grain: "radial-gradient(circle at 1px 1px, rgba(231,227,211,0.05) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
};
export default config;
