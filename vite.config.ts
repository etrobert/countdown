import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Relative asset paths so the build works when served from a subpath (e.g. itch.io)
  base: "./",
  plugins: [react(), tailwindcss()],
});
