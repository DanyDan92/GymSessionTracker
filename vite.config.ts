import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
    },
    plugins: [react()],

    // ✅ Très important sur Cloudflare Pages
    base: "./",

    // ⚠️ Tu n'utilises plus Gemini, mais je laisse tes define au cas où
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
    },

    resolve: {
      // ✅ Fix React double-instance (erreur #310)
      dedupe: ["react", "react-dom"],

      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  };
});
