/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#060d1a',
        panel: '#0b1629',
        panel2: '#0f1e35',
        'gg-cyan': { DEFAULT: '#00cfff', 2: '#00fff7' },
        'gg-green': '#00e676',
        'gg-amber': '#ffab00',
        'gg-red': '#ff3d57',
        'gg-orange': '#ff6d00',
        muted: '#4a7a9b',
        textBase: '#cce8ff',
        'gg-purple': '#7c3aed',
      },
      fontFamily: {
        mono: ['"Share Tech Mono"', 'monospace'],
        sans: ['"IBM Plex Sans Thai"', 'Rajdhani', 'sans-serif'],
        display: ['Rajdhani', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
