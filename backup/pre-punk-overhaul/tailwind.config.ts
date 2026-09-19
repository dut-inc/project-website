import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        wall: "#24262A",
        wall2: "#2E3136",
        cream: "#EFE7D2",
        kraft: "#D9C8A0",
        ink: "#2A2620",
        ink2: "#6B6250",
        pinRed: "#C1442D",
        pinTeal: "#2F7A6B",
        pinGold: "#C9A227",
        pinNavy: "#274B6D",
        pinGreen: "#5CE65C",
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
        },
        sports: {
          bg: "#0B0B0D",
          accent: "#FF9552",
        },
        // NBA standings pool — courtside at night: warm charcoal panels,
        // cream court paint, basketball-leather orange accent.
        pool: {
          ink: "#1A1410", // panel base
          ink2: "#251C15", // raised / active panel
          leather: "#3D2412", // modal backdrop wash
          orange: "#E8642F", // basketball leather accent
        },
        market: {
          // Pike Place Market Main Arcade, straight from the reference
          // photo (public/images/pike-place.jpg): the building's painted
          // moss-green wall, a white trim line dotted with green
          // medallions, the red neon sign on its dark iron scaffold, and
          // white storefronts below. The board green itself lives in
          // app/globals.css (.market-board).
          card: "#F7F5EC", // widgets — white storefronts
          cardHover: "#FCFBF4",
          red: "#FF4638", // neon sign
          redSoft: "rgba(255,70,56,0.12)",
          olive: "#4E5A38", // moss — W chips / BSO balls on white
          oliveLight: "#DCE3C7",
          brick: "#8A5A40", // brick — note chips on white
          brickLight: "#EAD9CB",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
        dle: ["var(--font-dle)"],
      },
    },
  },
  plugins: [],
};
export default config;
