import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const BACKEND_URL = process.env.VITE_BACKEND_URL || "http://localhost:3000";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      // tudo que começar com /api vai pro backend
      "/api": {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,

        // mantém o prefixo /api
        // se seu backend NÃO tiver /api, descomente a linha abaixo
        // rewrite: (path) => path.replace(/^\/api/, ""),

        // útil pra websocket (se tiver)
        ws: true,

        // log básico pra debug do proxy
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req) => {

            console.log(`[proxy] ${req.method} ${req.url} -> ${BACKEND_URL}`);
          });
        },
      },
    },
  },
});
