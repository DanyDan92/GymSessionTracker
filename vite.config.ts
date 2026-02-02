import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",

  // ✅ Force Vite à ne garder qu'une seule instance de React
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },

  // ✅ Force le prebundle unique côté dev/build
  optimizeDeps: {
    include: ["react", "react-dom"],
  },

  // (optionnel mais aide parfois sur certaines stacks)
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});
