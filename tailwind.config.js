/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FBF5EE',
          100: '#F6E7D7',
          200: '#EBCDAC',
          300: '#E0AB78',
          400: '#D78A48',
          500: '#D2691E',
          600: '#BA5717',
          700: '#98451A',
          800: '#7A391C',
          900: '#65301B',
        },
        // Light surfaces — the same cream stock as the recipe ticket
        paper: {
          50: '#FCF8F1',
          100: '#F7EEDC',
          200: '#EFE3CC',
          300: '#E2D1B0',
          400: '#D6C29E',
          linen: '#EDE6DA',
        },
        // Light text
        ink: {
          DEFAULT: '#2B2622',
          soft: '#5C5048',
          muted: '#8A7863',
        },
        // Dark surfaces + text — warm charcoal instead of cool gray
        char: {
          950: '#141210',
          900: '#1A1714',
          800: '#211D19',
          700: '#27221E',
          600: '#332C26',
          500: '#4A4037',
          400: '#A3927F',
          300: '#D9CCB8',
          100: '#F1E7D6',
        },
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
