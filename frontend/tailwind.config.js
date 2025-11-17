/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      opacity: {
        '80': '0.8',
        '20': '0.2',
        '50': '0.5',
        '40': '0.4',
      },
      boxShadow: {
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      },
      scale: {
        '105': '1.05',
      },
      backdropBlur: {
        'sm': '4px',
        'lg': '16px',
        'xl': '24px',
      }
    },
  },
  plugins: [
    require('daisyui'),
  ],
  daisyui: {
    themes: [
      "dark",
      "light",
      "cupcake",
      "bumblebee",
      "emerald",
      "corporate",
      "synthwave",
      "retro",
      "cyberpunk",
      "valentine",
      "halloween",
      "garden",
      "forest",
      "aqua",
      "lofi",
      "pastel",
      "fantasy",
      "wireframe",
      "black",
      "luxury",
      "dracula",
      "cmyk",
      "autumn",
      "business",
      "acid",
      "lemonade",
      "night",
      "coffee",
      "winter",
    ],
    darkTheme: "dark",
    base: true,
    styled: true,
    utils: true,
    prefix: "",
    logs: true,
    themeRoot: ":root",
  },
}