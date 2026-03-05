import typography from "@tailwindcss/typography";
import containerQueries from "@tailwindcss/container-queries";
import animate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["index.html", "src/**/*.{js,ts,jsx,tsx,html,css}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['"Cabinet Grotesk"', "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      colors: {
        border: "oklch(var(--border))",
        input: "oklch(var(--input))",
        ring: "oklch(var(--ring) / <alpha-value>)",
        background: "oklch(var(--background))",
        foreground: "oklch(var(--foreground))",
        primary: {
          DEFAULT: "oklch(var(--primary) / <alpha-value>)",
          foreground: "oklch(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "oklch(var(--secondary) / <alpha-value>)",
          foreground: "oklch(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "oklch(var(--destructive) / <alpha-value>)",
          foreground: "oklch(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "oklch(var(--muted) / <alpha-value>)",
          foreground: "oklch(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "oklch(var(--accent) / <alpha-value>)",
          foreground: "oklch(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "oklch(var(--popover))",
          foreground: "oklch(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "oklch(var(--card))",
          foreground: "oklch(var(--card-foreground))",
        },
        mine: {
          DEFAULT: "oklch(var(--mine) / <alpha-value>)",
          foreground: "oklch(var(--mine-foreground))",
          glow: "oklch(var(--mine-glow) / <alpha-value>)",
        },
        safe: {
          DEFAULT: "oklch(var(--safe) / <alpha-value>)",
          foreground: "oklch(var(--safe-foreground))",
          glow: "oklch(var(--safe-glow) / <alpha-value>)",
        },
        gold: {
          DEFAULT: "oklch(var(--gold) / <alpha-value>)",
          dim: "oklch(var(--gold-dim) / <alpha-value>)",
          bright: "oklch(var(--gold-bright) / <alpha-value>)",
        },
        chart: {
          1: "oklch(var(--chart-1))",
          2: "oklch(var(--chart-2))",
          3: "oklch(var(--chart-3))",
          4: "oklch(var(--chart-4))",
          5: "oklch(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "oklch(var(--sidebar))",
          foreground: "oklch(var(--sidebar-foreground))",
          primary: "oklch(var(--sidebar-primary))",
          "primary-foreground": "oklch(var(--sidebar-primary-foreground))",
          accent: "oklch(var(--sidebar-accent))",
          "accent-foreground": "oklch(var(--sidebar-accent-foreground))",
          border: "oklch(var(--sidebar-border))",
          ring: "oklch(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(0,0,0,0.05)",
        "gold-sm": "0 0 12px oklch(var(--gold) / 0.25)",
        "gold-md": "0 0 24px oklch(var(--gold) / 0.35)",
        "mine-glow": "0 0 20px oklch(var(--mine-glow) / 0.5)",
        "safe-glow": "0 0 18px oklch(var(--safe-glow) / 0.45)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "tile-reveal": {
          "0%": { transform: "scale(0.6) rotateY(90deg)", opacity: "0" },
          "60%": { transform: "scale(1.08) rotateY(-5deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotateY(0deg)", opacity: "1" },
        },
        "pulse-gold": {
          "0%, 100%": { boxShadow: "0 0 8px oklch(var(--gold) / 0.3)" },
          "50%": { boxShadow: "0 0 20px oklch(var(--gold) / 0.6)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "tile-reveal": "tile-reveal 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards",
        "pulse-gold": "pulse-gold 2s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [typography, containerQueries, animate],
};
