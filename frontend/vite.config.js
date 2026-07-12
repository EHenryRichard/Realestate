import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // Split heavy third-party libs into their own long-cached chunks so a
        // change in app code doesn't force visitors to re-download vendor code.
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }
          if (id.includes("react-router")) {
            return "router";
          }
          if (id.includes("axios")) {
            return "axios";
          }
          if (id.includes("react-bootstrap-icons")) {
            return "icons";
          }
          if (id.includes("/react/") || id.includes("/react-dom/") || id.includes("/scheduler/")) {
            return "react";
          }
          return "vendor";
        },
      },
    },
  },
});
