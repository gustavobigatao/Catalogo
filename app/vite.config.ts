import path from "path";
const __dirname = import.meta.dirname;
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const isGitHubPages = process.env.DEPLOY_TARGET === "gh-pages";

export default defineConfig({
  base: isGitHubPages ? "/Catalogo_Generico/" : "/",
  plugins: [react()],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
