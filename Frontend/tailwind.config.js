/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors:{
        background:{
          'green':'#012426',
          'lightGreen-500':'#7FC344',
          'lightGreen-300':'#9FD76E'
        }
      },
    },
  },
  plugins: [],
}

