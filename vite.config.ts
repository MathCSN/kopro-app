import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Explicitly load env + map Lovable Cloud-provided env vars to the Vite-exposed ones.
  // This prevents runtime blank screens like: "supabaseUrl is required".
  const env = loadEnv(mode, process.cwd(), "");

  const projectId =
    env.VITE_SUPABASE_PROJECT_ID ??
    process.env.VITE_SUPABASE_PROJECT_ID ??
    process.env.SUPABASE_PROJECT_ID;

  const derivedUrl = projectId ? `https://${projectId}.supabase.co` : undefined;
  const fallbackUrl = "https://siotixqzwlfcrseveiwd.supabase.co";
  const fallbackPublishableKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpb3RpeHF6d2xmY3JzZXZlaXdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzNTQzODcsImV4cCI6MjA4MTkzMDM4N30.cFtY_t0-nUHCRrDSjs9iuVwYPolgEf9HXqH24K-mNVw";

  const supabaseUrl =
    env.VITE_SUPABASE_URL ??
    process.env.VITE_SUPABASE_URL ??
    process.env.SUPABASE_URL ??
    env.SUPABASE_URL ??
    derivedUrl ??
    fallbackUrl;

  const supabasePublishableKey =
    env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    env.SUPABASE_PUBLISHABLE_KEY ??
    env.SUPABASE_ANON_KEY ??
    fallbackPublishableKey;

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: [
        // Override the auto-generated backend client to avoid runtime crashes when env vars are missing.
        {
          find: /^@\/integrations\/supabase\/client$/,
          replacement: path.resolve(__dirname, "./src/lib/supabaseClient.ts"),
        },
        // Standard @/ alias
        {
          find: /^@\//,
          replacement: `${path.resolve(__dirname, "./src")}/`,
        },
      ],
    },
    // Only define the PUBLIC client-side values we actually need.
    // (Never expose service-role keys.)
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(supabaseUrl),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(supabasePublishableKey),
    },
  };
});
