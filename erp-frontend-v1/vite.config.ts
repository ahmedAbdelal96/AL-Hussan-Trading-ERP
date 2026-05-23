import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import svgr from "vite-plugin-svgr";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        exportType: "named",
        ref: true,
        svgo: false,
        titleProp: true,
      },
      include: "**/*.svg?react",
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    modulePreload: {
      /**
       * Keep initial HTML preloads focused on critical runtime chunks.
       * Heavy chart/export chunks are still fetched on-demand when their routes/features are opened.
       */
      resolveDependencies: (_url, deps, context) => {
        if (context.hostType !== "html") return deps;

        return deps.filter((dep) => {
          return !(
            dep.includes("vendor-charts") ||
            dep.includes("vendor-export-pdf") ||
            dep.includes("vendor-export-xlsx") ||
            dep.includes("vendor-export-utils")
          );
        });
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          // Keep export stack isolated and split by concern.
          // This reduces the largest on-demand chunk size without changing runtime behavior.
          if (id.includes("xlsx")) {
            return "vendor-export-xlsx";
          }
          if (id.includes("jspdf") || id.includes("jspdf-autotable")) {
            return "vendor-export-pdf";
          }
          if (id.includes("html2canvas") || id.includes("arabic-reshaper")) {
            return "vendor-export-utils";
          }

          // Charts runtime stays isolated as lazy-loaded code.
          // We only chunk it separately; chart rendering logic remains unchanged.
          if (id.includes("react-apexcharts") || id.includes("apexcharts")) {
            return "vendor-charts";
          }

          // i18n runtime libraries are shared widely, so isolate for better cache hit rate.
          if (
            id.includes("i18next") ||
            id.includes("react-i18next") ||
            id.includes("i18next-browser-languagedetector") ||
            id.includes("i18next-http-backend")
          ) {
            return "vendor-i18n";
          }

          if (id.includes("react-router")) {
            return "vendor-router";
          }

          if (id.includes("@tanstack/react-query")) {
            return "vendor-query";
          }

          // UI ecosystem chunks.
          if (id.includes("@radix-ui/")) {
            return "vendor-radix";
          }

          if (id.includes("lucide-react") || id.includes("@radix-ui/react-icons")) {
            return "vendor-icons";
          }

          // General-purpose libs with broad usage.
          if (
            id.includes("axios") ||
            id.includes("zod") ||
            id.includes("zustand") ||
            id.includes("date-fns") ||
            id.includes("immer")
          ) {
            return "vendor-utils";
          }
        },
      },
    },
  },
  esbuild: {
    // Strip console.log and debugger in production builds
    drop: process.env.NODE_ENV === "production" ? ["console", "debugger"] : [],
  },
});
