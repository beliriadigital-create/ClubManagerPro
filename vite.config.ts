import path from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      // Kill-switch: en dev, el SW se registra solo en build de producción
      devOptions: { enabled: false },
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "icons/*.png"],
      manifest: {
        name:             "ClubManager Pro",
        short_name:       "ClubManager",
        description:      "Gestión integral de clubs deportivos y asesoría",
        theme_color:      "#1e3a8a",
        background_color: "#ffffff",
        display:          "standalone",
        scope:            "/",
        start_url:        "/",
        orientation:      "portrait-primary",
        icons: [
          { src: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any maskable" },
          { src: "/icons/icon-512.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any maskable" },
        ],
        categories: ["productivity", "sports"],
        shortcuts: [
          { name: "Personas",    url: "/personas",    description: "Gestión de personas" },
          { name: "Tareas",      url: "/tareas",      description: "Tablero Kanban" },
          { name: "Subvenciones",url: "/asesoria/subvenciones", description: "Pipeline de subvenciones" },
        ],
      },
      workbox: {
        globPatterns:       ["**/*.{js,css,html,ico,png,svg,woff2}"],
        // No cachear las llamadas a Supabase (datos en tiempo real)
        navigateFallback:   "/index.html",
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.hostname.includes("supabase.co"),
            handler:    "NetworkFirst",
            options:    {
              cacheName:          "supabase-api",
              networkTimeoutSeconds: 10,
              expiration:         { maxEntries: 50, maxAgeSeconds: 300 },
            },
          },
          {
            urlPattern: /\/api\//,
            handler:    "NetworkOnly",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
