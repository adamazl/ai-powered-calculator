import path from "node:path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

// GitHub Pages serves the site from /<repo>/, so built asset URLs need that
// prefix. The dev server stays at the root.
const REPO = "/ai-powered-calculator/"

export default defineConfig(({ command }) => ({
  base: command === "build" ? REPO : "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
}))
