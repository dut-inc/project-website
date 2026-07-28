import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1A1D19",
        surface: "#23261F",
        raised: "#2B2E24",
        paper: "#E7E3D3",
        paper2: "#B7B29E",
        moss: "#7E9471",
        stamp: "#B8532E",
        gold: "#C4A036",
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
