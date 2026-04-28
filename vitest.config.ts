import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Resolve Deno-style URL imports usados nas edge functions para os
      // pacotes npm equivalentes, permitindo testar a lógica pura no Vitest.
      "https://esm.sh/zod@3.23.8": "zod",
      "https://esm.sh/@supabase/supabase-js@2.94.0": "@supabase/supabase-js",
    },
  },
});

  },
});
