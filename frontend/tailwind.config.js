/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cores principais do BoletoXCrypto (Shadcn UI)
        primary: "#16a34a",       // green-600
        secondary: "#84cc16",     // lime-500
        background: "#ecfccb",    // lime-200
        foreground: "#525252",    // neutral-600
        destructive: "#dc2626",   // red-600
        
        // Tons de verde
        greenPrimary: "#16a34a",  // green-600
        greenSecondary: "#84cc16", // lime-500
        greenLight: "#ecfccb",    // lime-200
        greenDark: "#15803d",     // green-700
        
        // Tons de cinza
        grayDark: "#525252",      // neutral-600
        grayMedium: "#737373",    // neutral-500
        grayLight: "#e5e5e5",     // neutral-200
        
        // Cores de status
        error: "#dc2626",         // red-600
        success: "#16a34a",       // green-600
        warning: "#ca8a04",       // yellow-600
        info: "#2563eb",          // blue-600
        
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        
        // Shadcn UI cores
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        popover: "hsl(var(--popover))",
        "popover-foreground": "hsl(var(--popover-foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        accent: "hsl(var(--accent))",
        "accent-foreground": "hsl(var(--accent-foreground))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        "secondary-foreground": "hsl(var(--secondary-foreground))",
        "destructive-foreground": "hsl(var(--destructive-foreground))",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
