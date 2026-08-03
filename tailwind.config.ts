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
        sports: {
          bg: "#0B0B0D",
          accent: "#FF9552",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      backgroundImage: {
        grain: "radial-gradient(circle at 1px 1px, rgba(231,227,211,0.05) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
};
export default config;
