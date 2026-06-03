/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Montserrat', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Montserrat', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        widest: '0.2em',
      },
      colors: {
        // Star Luxury Group palette
        gold: {
          DEFAULT: '#D8B11B',
          50:  '#FBF7E6',
          100: '#F6EEC1',
          200: '#EDDC83',
          300: '#E4CA45',
          400: '#D8B11B',
          500: '#B89614',
          600: '#937711',
          700: '#6E590D',
          800: '#4A3C09',
          900: '#251E04',
        },
        ink: {
          DEFAULT: '#0A0A0A',
          900: '#0A0A0A',
          800: '#1A1A1A',
          700: '#2A2A2A',
        },
        cream: {
          DEFAULT: '#F5F2EC',
          50:  '#FBFAF7',
          100: '#F5F2EC',
          200: '#EDE7DA',
        },
        slate: {
          ardoise: '#273341',
        },
        // Charte SLG — couleurs sémantiques fonctionnelles (UI states only,
        // NOT à utiliser comme couleur de marque). Plus retenues / luxe que
        // les couleurs vives de data-viz précédentes.
        ui: {
          success: '#5C7C5A',
          warning: '#B8902E',
          danger:  '#A23B2D',
        },
        // Backwards-compatible aliases — existing components using "brand-*" or "accent-*"
        // keep rendering, but in SLG colors.
        brand: {
          DEFAULT: '#D8B11B',
          50:  '#FBF7E6',
          100: '#F6EEC1',
          200: '#EDDC83',
          300: '#E4CA45',
          400: '#D8B11B',
          500: '#B89614',
          600: '#937711',
          700: '#6E590D',
          800: '#4A3C09',
          900: '#251E04',
        },
        accent: {
          DEFAULT: '#273341',
          50:  '#EEF1F4',
          100: '#D5DCE3',
          200: '#AAB8C6',
          300: '#7F94A9',
          400: '#54708C',
          500: '#3D5670',
          600: '#273341',
          700: '#1F2934',
          800: '#171E27',
          900: '#0F141A',
        },
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(10 10 10 / 0.04), 0 8px 24px -12px rgb(10 10 10 / 0.10)',
        'card-hover': '0 2px 4px 0 rgb(10 10 10 / 0.06), 0 16px 40px -16px rgb(10 10 10 / 0.18)',
        gold: '0 0 0 4px rgb(216 177 27 / 0.18)',
      },
      // Charte SLG : « square corners » — toute l'app est en coins droits 2px,
      // sauf `rounded-full` qu'on garde pour les pastilles parfaitement rondes
      // (status dots, avatars circulaires).
      borderRadius: {
        none: '0',
        sm: '2px',
        DEFAULT: '2px',
        md: '2px',
        lg: '2px',
        xl: '2px',
        '2xl': '2px',
        '3xl': '2px',
        full: '9999px',
      },
      backgroundImage: {
        'gold-line': 'linear-gradient(90deg, transparent 0%, #D8B11B 50%, transparent 100%)',
      },
    },
  },
  plugins: [],
}
