/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        // Мягкая зеленая палитра (Emerald)
        primary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981', // Основной цвет кнопок
          600: '#059669', // Ховер эффект
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        gray: {
           50: '#f8fafc',
           100: '#f1f5f9',
           200: '#e2e8f0',
           300: '#cbd5e1',
           400: '#94a3b8',
           500: '#64748b',
           600: '#475569',
           700: '#334155',
           800: '#1e293b',
           900: '#0f172a',
        }
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
        'card': '0 0 0 1px rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.04)',
        'card-hover': '0 0 0 1px rgba(0,0,0,0.03), 0 8px 16px rgba(0,0,0,0.06)',
      }
    },
  },
  plugins: [],
}
