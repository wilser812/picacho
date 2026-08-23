// Paleta de marca de Picacho (regla 60-30-10). Fuente única para web (Tailwind) y móvil (NativeWind).
export const picachoTheme = {
  colors: {
    background: "#F8F9FA",
    primary: "#0D8A4B",
    accent: "#F97316",
    text: "#1F2937",
  },
} as const;

export type PicachoTheme = typeof picachoTheme;
