import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Route chunks are split in App.tsx; this splits the libraries so a content
    // deploy does not invalidate the cached vendor payload. Every product edit
    // used to ship a fresh 1.2 MB file to returning visitors.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;

          // React and the router change rarely and are needed on every page,
          // so they get the longest-lived chunk.
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) {
            return "react";
          }
          // Only the pages that talk to the database need this.
          if (id.includes("@supabase")) return "supabase";
          // Heavy, and used almost entirely by the club and casino screens.
          if (id.includes("framer-motion")) return "motion";
          if (id.includes("@radix-ui")) return "radix";
          if (id.includes("@tanstack")) return "query";
          return "vendor";
        },
      },
    },
    // The remaining warning should mean something. With routes and vendors
    // split, anything over this is worth looking at rather than ignoring.
    chunkSizeWarningLimit: 400,
  },
}));
