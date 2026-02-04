/**
 * Public backend configuration.
 *
 * IMPORTANT:
 * - Keep ONLY public values here (URL + publishable/anon key).
 * - Never put server/service-role secrets in the frontend.
 *
 * This project currently runs without a repo-level `.env` file in the Vite dev preview,
 * which can make `import.meta.env.VITE_SUPABASE_URL` undefined and crash the app.
 * We therefore provide stable fallbacks.
 */

const FALLBACK_URL = "https://siotixqzwlfcrseveiwd.supabase.co";
const FALLBACK_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpb3RpeHF6d2xmY3JzZXZlaXdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzNTQzODcsImV4cCI6MjA4MTkzMDM4N30.cFtY_t0-nUHCRrDSjs9iuVwYPolgEf9HXqH24K-mNVw";

// Prefer Vite-exposed env vars when available; treat empty strings as missing.
const envUrl = ((import.meta as any).env?.VITE_SUPABASE_URL as string | undefined) ?? undefined;
const envKey =
  ((import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ?? undefined;

export const BACKEND_PUBLIC_URL: string =
  typeof envUrl === "string" && envUrl.trim().length > 0 ? envUrl : FALLBACK_URL;

export const BACKEND_PUBLIC_PUBLISHABLE_KEY: string =
  typeof envKey === "string" && envKey.trim().length > 0 ? envKey : FALLBACK_PUBLISHABLE_KEY;

export const BACKEND_FUNCTIONS_BASE_URL = `${BACKEND_PUBLIC_URL}/functions/v1`;

export function getFunctionUrl(functionName: string) {
  return `${BACKEND_FUNCTIONS_BASE_URL}/${functionName}`;
}
