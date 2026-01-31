
import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";
import colors from "tailwindcss/colors";
import flattenColorPalette from "tailwindcss/lib/util/flattenColorPalette";
import tailwindcssAnimate from "tailwindcss-animate";

function addVariablesForColors({ addBase, theme }: any) {
  const allColors = flattenColorPalette(theme("colors"));
  const newVars = Object.fromEntries(
    Object.entries(allColors).map(([key, val]) => [`--${key}`, val])
  );
 
  addBase({
    ":root": newVars,
  });
}

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
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
        'urae': ['Urae Nium', 'sans-serif'],
        'teko': ['Teko', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#1E2761",
          light: "#408CFF",
          dark: "#0A1033",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#408CFF",
          foreground: "#FFFFFF",
        },
        probain: {
          red: "#FF3B3B",
          yellow: "#FFD93D",
          blue: "#408CFF",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
        slideIn: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "wave-slow": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "wave-medium": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "wave-fast": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
        "float-delayed": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-15px)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-30px) rotate(5deg)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(1.5)", opacity: "0" },
        },
        "confetti": {
          "0%": { transform: "translateY(0) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(100vh) rotate(720deg)", opacity: "0" },
        },
        // --- Animations orbes decoratives (centralisees depuis les <style> inline) ---
        "pulse-glow": {
          "0%, 100%": { opacity: "0.3", transform: "translate(-50%, -50%) scale(1)" },
          "50%": { opacity: "0.5", transform: "translate(-50%, -50%) scale(1.05)" },
        },
        "pulse-glow-flat": {
          "0%, 100%": { opacity: "0.2", transform: "translate(-50%, 0) scale(1)" },
          "50%": { opacity: "0.3", transform: "translate(-50%, 0) scale(1.05)" },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: "0.3", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(1.05)" },
        },
        "pulse-loading": {
          "0%, 100%": { opacity: "0.2", transform: "translate(-50%, -50%) scale(1)" },
          "50%": { opacity: "0.4", transform: "translate(-50%, -50%) scale(1.1)" },
        },
        "shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "wave-landing": {
          "0%, 100%": { transform: "translateX(0)" },
          "50%": { transform: "translateX(-25px)" },
        },
        "wave": {
          "0%, 100%": { transform: "translateX(0)" },
          "50%": { transform: "translateX(-25px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        slideIn: "slideIn 0.3s ease-out",
        "wave-slow": "wave-slow 25s linear infinite",
        "wave-medium": "wave-medium 18s linear infinite",
        "wave-fast": "wave-fast 12s linear infinite",
        "float": "float 6s ease-in-out infinite",
        "float-delayed": "float-delayed 5s ease-in-out infinite 1s",
        "float-slow": "float-slow 8s ease-in-out infinite 0.5s",
        "slide-up": "slide-up 0.5s ease-out",
        "slide-in-right": "slide-in-right 0.4s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        "pulse-ring": "pulse-ring 1.5s ease-out infinite",
        "confetti": "confetti 3s ease-out forwards",
        // --- Animations orbes decoratives ---
        "pulse-glow": "pulse-glow 8s ease-in-out infinite",
        "pulse-glow-flat": "pulse-glow-flat 8s ease-in-out infinite",
        "pulse-slow": "pulse-slow 8s ease-in-out infinite",
        "pulse-loading": "pulse-loading 8s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "wave-landing": "wave-landing 6s ease-in-out infinite",
        "wave": "wave 6s ease-in-out infinite",
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '100%',
            a: {
              color: '#408CFF',
              '&:hover': {
                color: '#1E2761',
              },
            },
            h1: {
              fontSize: '1.5rem',
              fontWeight: '600',
              marginTop: '1rem',
              marginBottom: '0.5rem',
            },
            h2: {
              fontSize: '1.25rem',
              fontWeight: '600',
              marginTop: '1rem',
              marginBottom: '0.5rem',
            },
            h3: {
              fontSize: '1.125rem',
              fontWeight: '600',
              marginTop: '1rem',
              marginBottom: '0.5rem',
            },
            p: {
              marginBottom: '0.75rem',
            },
            ul: {
              paddingLeft: '1.5rem',
              listStyleType: 'disc',
            },
            ol: {
              paddingLeft: '1.5rem',
              listStyleType: 'decimal',
            },
            li: {
              marginBottom: '0.25rem',
            },
            strong: {
              fontWeight: '600',
            },
          },
        },
      },
    },
  },
  plugins: [tailwindcssAnimate, addVariablesForColors],
} satisfies Config;
