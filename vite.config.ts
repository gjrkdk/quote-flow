import "dotenv/config";
import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// Shopify CLI passes PORT for the web process and HMR_SERVER_PORT for HMR
const port = Number(process.env.PORT || 3000);

export default defineConfig({
  define: {
    "process.env.SHOPIFY_API_KEY": JSON.stringify(
      process.env.SHOPIFY_API_KEY ?? ""
    ),
  },
  plugins: [
    remix({
      ignoredRouteFiles: ["**/.*"],
    }),
    tsconfigPaths(),
  ],
  server: {
    port,
    allowedHosts: [process.env.TUNNEL_DOMAIN ?? "localhost"],
    ...(process.env.HMR_SERVER_PORT
      ? { hmr: { port: Number(process.env.HMR_SERVER_PORT) } }
      : {}),
  },
});
