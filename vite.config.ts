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

          // ONLY the React runtime goes here — nothing that depends on another
          // package. An earlier version also put react-router in this chunk,
          // but its dependency @remix-run/router fell through to "vendor", so
          // react imported vendor while vendor (lucide, at module scope) called
          // React.forwardRef. That circular edge between chunks meant one side
          // evaluated with the other's bindings still undefined, and the site
          // rendered a blank page with "Cannot read properties of undefined
          // (reading 'forwardRef')". Keep this chunk a leaf.
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) {
            return "react";
          }
          if (id.includes("@supabase")) return "supabase";
          // Heavy, and used almost entirely by the club and casino screens.
          if (id.includes("framer-motion")) return "motion";
          if (id.includes("@radix-ui")) return "radix";
          if (id.includes("@tanstack")) return "query";
          // The router and everything else share one chunk so no package is
          // ever separated from its own dependencies.
          return "vendor";
        },
      },
    },
    // The remaining warning should mean something. With routes and vendors
    // split, anything over this is worth looking at rather than ignoring.
    chunkSizeWarningLimit: 400,
  },
}));
