import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";

// On Vercel (VERCEL=1 is set during their build) emit the Vercel build output;
// locally and in CI keep the node-server preset so `node .output/server/index.mjs`
// works for smoke tests and previews.
const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process
  ?.env;
const preset = env?.VERCEL ? "vercel" : "node-server";

export default defineConfig({
  ssr: true,
  server: {
    preset,
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
