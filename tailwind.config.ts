import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316", // Warm bento orange
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
        },
        present: {
          light: "#dcfce7",
          DEFAULT: "#22c55e",
          dark: "#15803d",
        },
        absent: {
          light: "#fee2e2",
          DEFAULT: "#ef4444",
          dark: "#b91c1c",
        },
        off: {
          light: "#f1f5f9",
          DEFAULT: "#94a3b8",
          dark: "#475569",
        }
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        subtle: "0 2px 12px -2px rgba(0, 0, 0, 0.05), 0 1px 4px -1px rgba(0, 0, 0, 0.03)",
        card: "0 4px 20px -2px rgba(0, 0, 0, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.04)",
        float: "0 10px 25px -5px rgba(249, 115, 22, 0.25), 0 8px 10px -6px rgba(249, 115, 22, 0.2)",
      }
    },
  },
  plugins: [],
};
export default config;
