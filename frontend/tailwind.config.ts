import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        positive: "#22c55e", "positive-bg": "#052e16",
        negative: "#ef4444", "negative-bg": "#450a0a",
        critical: "#dc2626", major: "#f97316", minor: "#eab308",
      },
    },
  },
  plugins: [],
};
export default config;
