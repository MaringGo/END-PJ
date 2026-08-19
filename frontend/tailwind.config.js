export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {}
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        mytheme: {
          "primary": "#ff7a00",
          "secondary": "#ffa755",
          "accent": "#ff5500",
          "neutral": "#3d4451",
          "base-100": "#ffffff",
          "base-200": "#fff5ec", // Very light orange/white
          "base-300": "#ffe8d3",
          "info": "#3abff8",
          "success": "#36d399",
          "warning": "#fbbd23",
          "error": "#f87272",
        },
      },
    ],
  },
};
