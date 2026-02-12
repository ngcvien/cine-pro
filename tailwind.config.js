/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}", 
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050505",
        surface: "#121212",
        primary: "#00FF41",
        secondary: "#A1A1AA",
      },
      fontFamily: {
        // Nội dung dùng Be Vietnam Pro
        sans: ['var(--font-be-vietnam)', 'ui-sans-serif', 'system-ui'],
        // Tiêu đề dùng Manrope
        display: ['var(--font-manrope)', 'ui-sans-serif', 'system-ui'],
      },
    },
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1rem',
        md: '2rem',
        lg: '2.5rem',
        xl: '3rem',
      },
    },
  },
  plugins: [],
};