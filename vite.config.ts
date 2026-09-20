import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";
import { defineConfig, type Plugin } from "vite";

/**
 * @hugeicons/core-free-icons ships an ESM barrel whose re-exports disagree with
 * the filenames on disk for a handful of icons (`./Grid2x2Icon.js` vs the actual
 * `Grid2X2Icon.js`). That resolves fine on case-insensitive filesystems like
 * Windows and macOS, and fails the build on Linux CI. Fall back to a
 * case-insensitive lookup inside that package only.
 */
function hugeiconsCaseFix(): Plugin {
  const dirCache = new Map<string, Map<string, string>>();

  return {
    name: "hugeicons-case-fix",
    enforce: "pre",
    resolveId(source, importer) {
      if (!importer || !source.startsWith("./")) return null;
      if (!importer.replace(/\\/g, "/").includes("@hugeicons/core-free-icons/"))
        return null;

      const dir = path.dirname(importer);
      let entries = dirCache.get(dir);
      if (!entries) {
        entries = new Map<string, string>();
        for (const name of fs.readdirSync(dir)) {
          entries.set(name, name);
          entries.set(name.toLowerCase(), name);
        }
        dirCache.set(dir, entries);
      }

      const requested = path.basename(source);
      if (entries.get(requested) === requested) return null;

      const actual = entries.get(requested.toLowerCase());
      return actual ? path.join(dir, actual) : null;
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [hugeiconsCaseFix(), react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== "true",
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === "true" ? null : {},
    },
  };
});
