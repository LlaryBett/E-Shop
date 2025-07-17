/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}", // 👈 scan all components/pages
  ],
  theme: {
    extend: {},
  },
  darkMode: "class", // 👈 needed for dark mode toggle
  plugins: [],
};
