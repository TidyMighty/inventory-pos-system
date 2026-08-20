import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Proxies /api calls to the Django backend during local development so you
// don't need to configure CORS twice or hardcode localhost URLs everywhere.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});
