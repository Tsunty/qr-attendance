/** @type {import('tailwindcss').Config} */
module.exports = {
  // Указываем пути ко всем файлам, где будем использовать классы
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
}