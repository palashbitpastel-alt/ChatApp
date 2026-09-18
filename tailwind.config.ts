import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        wa: {
          green: {
            DEFAULT: "#00a884",
            light: "#25d366",
            dark: "#075e54",
            teal: "#128c7e",
          },
          dark: {
            bg: "#0b141a",
            panel: "#111b21",
            header: "#202c33",
            incoming: "#202c33",
            outgoing: "#005c4b",
            hover: "#222e35",
            border: "#222e35",
            text: "#e9edef",
            subtext: "#8696a0",
          },
          light: {
            bg: "#efeae2",
            panel: "#ffffff",
            header: "#f0f2f5",
            incoming: "#ffffff",
            outgoing: "#d9fdd3",
            hover: "#f5f6f6",
            border: "#e9edef",
            text: "#111b21",
            subtext: "#667781",
          },
          blue: {
            tick: "#53bdeb",
          }
        },
      },
    },
  },
  plugins: [],
};

export default config;
