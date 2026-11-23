import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// GitHub Pages: relative base works at any sub-path (https://<user>.github.io/<repo>/).
// Override with VITE_BASE (e.g. VITE_BASE=/sales-ops-web/) if an absolute base is needed.
// Navigation is hash-based (#/pjp), so no server-side routing is required.
export default defineConfig({
  base: process.env.VITE_BASE || "./",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: { port: 5181, open: false },
});
