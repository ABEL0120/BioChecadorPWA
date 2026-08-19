// vite.config.ts
import legacy from "file:///C:/Users/lujan/OneDrive/Documentos/IOP/VS%20CODE/BioChecadorPWA/node_modules/@vitejs/plugin-legacy/dist/index.mjs";
import react from "file:///C:/Users/lujan/OneDrive/Documentos/IOP/VS%20CODE/BioChecadorPWA/node_modules/@vitejs/plugin-react/dist/index.js";
import { defineConfig } from "file:///C:/Users/lujan/OneDrive/Documentos/IOP/VS%20CODE/BioChecadorPWA/node_modules/vite/dist/node/index.js";
import tailwindcss from "file:///C:/Users/lujan/OneDrive/Documentos/IOP/VS%20CODE/BioChecadorPWA/node_modules/@tailwindcss/vite/dist/index.mjs";
import { VitePWA } from "file:///C:/Users/lujan/OneDrive/Documentos/IOP/VS%20CODE/BioChecadorPWA/node_modules/vite-plugin-pwa/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    legacy(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png"],
      manifest: {
        name: "BioChecador PWA",
        short_name: "BioChecador",
        description: "Sistema de Control de Asistencia Biom\xE9trica y GPS",
        theme_color: "#2563eb",
        background_color: "#f8fafc",
        display: "standalone",
        orientation: "portrait",
        start_url: "/?mode=pwa",
        icons: [
          {
            src: "favicon.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "favicon.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      }
    })
  ],
  server: {
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "https://localhost:7259",
        changeOrigin: true,
        secure: false
      }
    }
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts"
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxsdWphblxcXFxPbmVEcml2ZVxcXFxEb2N1bWVudG9zXFxcXElPUFxcXFxWUyBDT0RFXFxcXEJpb0NoZWNhZG9yUFdBXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxsdWphblxcXFxPbmVEcml2ZVxcXFxEb2N1bWVudG9zXFxcXElPUFxcXFxWUyBDT0RFXFxcXEJpb0NoZWNhZG9yUFdBXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9sdWphbi9PbmVEcml2ZS9Eb2N1bWVudG9zL0lPUC9WUyUyMENPREUvQmlvQ2hlY2Fkb3JQV0Evdml0ZS5jb25maWcudHNcIjsvLy8gPHJlZmVyZW5jZSB0eXBlcz1cInZpdGVzdFwiIC8+XG5cbmltcG9ydCBsZWdhY3kgZnJvbSBcIkB2aXRlanMvcGx1Z2luLWxlZ2FjeVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCB0YWlsd2luZGNzcyBmcm9tIFwiQHRhaWx3aW5kY3NzL3ZpdGVcIjtcbmltcG9ydCB7IFZpdGVQV0EgfSBmcm9tIFwidml0ZS1wbHVnaW4tcHdhXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLFxuICAgIGxlZ2FjeSgpLFxuICAgIHRhaWx3aW5kY3NzKCksXG4gICAgVml0ZVBXQSh7XG4gICAgICByZWdpc3RlclR5cGU6IFwiYXV0b1VwZGF0ZVwiLFxuICAgICAgaW5jbHVkZUFzc2V0czogW1wiZmF2aWNvbi5wbmdcIl0sXG4gICAgICBtYW5pZmVzdDoge1xuICAgICAgICBuYW1lOiBcIkJpb0NoZWNhZG9yIFBXQVwiLFxuICAgICAgICBzaG9ydF9uYW1lOiBcIkJpb0NoZWNhZG9yXCIsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBcIlNpc3RlbWEgZGUgQ29udHJvbCBkZSBBc2lzdGVuY2lhIEJpb21cdTAwRTl0cmljYSB5IEdQU1wiLFxuICAgICAgICB0aGVtZV9jb2xvcjogXCIjMjU2M2ViXCIsXG4gICAgICAgIGJhY2tncm91bmRfY29sb3I6IFwiI2Y4ZmFmY1wiLFxuICAgICAgICBkaXNwbGF5OiBcInN0YW5kYWxvbmVcIixcbiAgICAgICAgb3JpZW50YXRpb246IFwicG9ydHJhaXRcIixcbiAgICAgICAgc3RhcnRfdXJsOiBcIi8/bW9kZT1wd2FcIixcbiAgICAgICAgaWNvbnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzcmM6IFwiZmF2aWNvbi5wbmdcIixcbiAgICAgICAgICAgIHNpemVzOiBcIjE5MngxOTJcIixcbiAgICAgICAgICAgIHR5cGU6IFwiaW1hZ2UvcG5nXCIsXG4gICAgICAgICAgICBwdXJwb3NlOiBcImFueSBtYXNrYWJsZVwiLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgc3JjOiBcImZhdmljb24ucG5nXCIsXG4gICAgICAgICAgICBzaXplczogXCI1MTJ4NTEyXCIsXG4gICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxuICAgICAgICAgICAgcHVycG9zZTogXCJhbnkgbWFza2FibGVcIixcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfSxcbiAgICB9KSxcbiAgXSxcbiAgc2VydmVyOiB7XG4gICAgYWxsb3dlZEhvc3RzOiB0cnVlLFxuICAgIHByb3h5OiB7XG4gICAgICBcIi9hcGlcIjoge1xuICAgICAgICB0YXJnZXQ6IFwiaHR0cHM6Ly9sb2NhbGhvc3Q6NzI1OVwiLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG4gIHRlc3Q6IHtcbiAgICBnbG9iYWxzOiB0cnVlLFxuICAgIGVudmlyb25tZW50OiBcImpzZG9tXCIsXG4gICAgc2V0dXBGaWxlczogXCIuL3NyYy9zZXR1cFRlc3RzLnRzXCIsXG4gIH0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFFQSxPQUFPLFlBQVk7QUFDbkIsT0FBTyxXQUFXO0FBQ2xCLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8saUJBQWlCO0FBQ3hCLFNBQVMsZUFBZTtBQUV4QixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixPQUFPO0FBQUEsSUFDUCxZQUFZO0FBQUEsSUFDWixRQUFRO0FBQUEsTUFDTixjQUFjO0FBQUEsTUFDZCxlQUFlLENBQUMsYUFBYTtBQUFBLE1BQzdCLFVBQVU7QUFBQSxRQUNSLE1BQU07QUFBQSxRQUNOLFlBQVk7QUFBQSxRQUNaLGFBQWE7QUFBQSxRQUNiLGFBQWE7QUFBQSxRQUNiLGtCQUFrQjtBQUFBLFFBQ2xCLFNBQVM7QUFBQSxRQUNULGFBQWE7QUFBQSxRQUNiLFdBQVc7QUFBQSxRQUNYLE9BQU87QUFBQSxVQUNMO0FBQUEsWUFDRSxLQUFLO0FBQUEsWUFDTCxPQUFPO0FBQUEsWUFDUCxNQUFNO0FBQUEsWUFDTixTQUFTO0FBQUEsVUFDWDtBQUFBLFVBQ0E7QUFBQSxZQUNFLEtBQUs7QUFBQSxZQUNMLE9BQU87QUFBQSxZQUNQLE1BQU07QUFBQSxZQUNOLFNBQVM7QUFBQSxVQUNYO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixjQUFjO0FBQUEsSUFDZCxPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsUUFDTixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxRQUFRO0FBQUEsTUFDVjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxNQUFNO0FBQUEsSUFDSixTQUFTO0FBQUEsSUFDVCxhQUFhO0FBQUEsSUFDYixZQUFZO0FBQUEsRUFDZDtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
