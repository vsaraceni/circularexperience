import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";

const CLOUD_BACKEND_URL = "https://gxqrmxhpltfkkhhtqvmh.supabase.co";
const CLOUD_BACKEND_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4cXJteGhwbHRma2toaHRxdm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNzc3MzcsImV4cCI6MjA4NTc1MzczN30.zgz9QZi5sJSWAJbixLzN8EashUIwUfI3_nbm3XbvQJ8";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(process.env.VITE_SUPABASE_URL || CLOUD_BACKEND_URL),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY || CLOUD_BACKEND_PUBLISHABLE_KEY
    ),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
