import type { CapacitorConfig } from '@capacitor/cli';

// Use a remote URL for live-reload ONLY when explicitly provided.
// Default (no env var): load the bundled web assets from /dist (real standalone app).
const LIVE_RELOAD_URL = process.env.CAPACITOR_SERVER_URL || process.env.CAP_SERVER_URL;

const config: CapacitorConfig = {
  appId: 'fr.kopro.app',
  appName: 'Kopro',
  webDir: 'dist',
  ...(LIVE_RELOAD_URL
    ? {
        server: {
          url: LIVE_RELOAD_URL,
          cleartext: true,
        },
      }
    : {}),
};

export default config;
