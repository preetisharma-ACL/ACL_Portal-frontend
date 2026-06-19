import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";

// On Vercel (VERCEL=1 is set during their build) emit the Vercel build output;
// locally and in CI keep the node-server preset so `node .output/server/index.mjs`
// works for smoke tests and previews.
const preset = process.env.VERCEL ? "vercel" : "node-server";

export default defineConfig({
  ssr: true,
  server: {
    preset,
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
