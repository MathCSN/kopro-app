import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'fr.kopro.app',
  appName: 'Kopro',
  webDir: 'dist',
  server: {
    url: 'https://9d5dfd07-d9a8-43f3-806b-f51a903cf5a3.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;
