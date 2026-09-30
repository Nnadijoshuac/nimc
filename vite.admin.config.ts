import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { assertPublicSupabaseKey, hugeiconsCaseFix } from "./vite.config";

/**
 * Build config for the staff back office, a separate app from the public site.
 *
 *   npm run dev:admin     -> http://localhost:3001
 *   npm run build:admin   -> dist-admin/  (deploy to e.g. admin.ninsupportatalanta.com)
 *
 * It shares components and env files with the public site but ships as its
 * own bundle on its own address; the public site contains none of its code.
 */
export default defineConfig(({ mode }) => {
  assertPublicSupabaseKey(mode, __dirname);
  return {
    root: path.resolve(__dirname, "admin"),
    envDir: __dirname, // read the same .env.local as the public site
    publicDir: path.resolve(__dirname, "public"),
    plugins: [hugeiconsCaseFix(), react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    server: {
      port: 3001,
      host: "0.0.0.0",
      fs: { allow: [__dirname] },
    },
    preview: { port: 3001 },
    build: {
      outDir: path.resolve(__dirname, "dist-admin"),
      emptyOutDir: true,
    },
  };
});
