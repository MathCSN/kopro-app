import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

export type AppEnvironment = 'mobile-native' | 'mobile-web' | 'desktop-web';

export interface AppEnvironmentInfo {
  environment: AppEnvironment;
  isMobile: boolean;
  isNative: boolean;
  isWeb: boolean;
  isDesktop: boolean;
  userAgent: string;
  platform: string;
}

/**
 * Hook to detect the current app environment
 * - mobile-native: Running inside Capacitor (iOS/Android app)
 * - mobile-web: Mobile browser (responsive web)
 * - desktop-web: Desktop browser
 */
export function useAppEnvironment(): AppEnvironmentInfo {
  const [info, setInfo] = useState<AppEnvironmentInfo>(() => getEnvironmentInfo());

  useEffect(() => {
    // Re-check on window resize for responsive detection
    const handleResize = () => {
      setInfo(getEnvironmentInfo());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return info;
}

function getEnvironmentInfo(): AppEnvironmentInfo {
  const isNative = Capacitor.isNativePlatform();
  const userAgent = navigator.userAgent || '';
  const platform = Capacitor.getPlatform();
  
  // Check if mobile based on viewport or user agent
  const isMobileViewport = window.innerWidth < 768;
  const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isMobile = isNative || isMobileViewport || isMobileUserAgent;
  
  let environment: AppEnvironment;
  
  if (isNative) {
    environment = 'mobile-native';
  } else if (isMobile) {
    environment = 'mobile-web';
  } else {
    environment = 'desktop-web';
  }

  return {
    environment,
    isMobile,
    isNative,
    isWeb: !isNative,
    isDesktop: !isMobile,
    userAgent,
    platform,
  };
}

/**
 * Get device info for bug reports
 */
export function getDeviceInfo(): {
  userAgent: string;
  platform: string;
  deviceModel: string;
  osVersion: string;
  screenWidth: number;
  screenHeight: number;
  appVersion: string;
} {
  const userAgent = navigator.userAgent || '';
  const platform = Capacitor.getPlatform();
  
  // Extract OS version from user agent
  let osVersion = 'Unknown';
  if (/Android/.test(userAgent)) {
    const match = userAgent.match(/Android\s([\d.]+)/);
    osVersion = match ? `Android ${match[1]}` : 'Android';
  } else if (/iPhone|iPad|iPod/.test(userAgent)) {
    const match = userAgent.match(/OS\s([\d_]+)/);
    osVersion = match ? `iOS ${match[1].replace(/_/g, '.')}` : 'iOS';
  } else if (/Windows/.test(userAgent)) {
    osVersion = 'Windows';
  } else if (/Mac OS X/.test(userAgent)) {
    const match = userAgent.match(/Mac OS X\s([\d_]+)/);
    osVersion = match ? `macOS ${match[1].replace(/_/g, '.')}` : 'macOS';
  } else if (/Linux/.test(userAgent)) {
    osVersion = 'Linux';
  }

  // Extract device model
  let deviceModel = 'Unknown';
  if (/iPhone/.test(userAgent)) {
    deviceModel = 'iPhone';
  } else if (/iPad/.test(userAgent)) {
    deviceModel = 'iPad';
  } else if (/Android/.test(userAgent)) {
    const match = userAgent.match(/;\s*([^;)]+)\s*Build/);
    deviceModel = match ? match[1].trim() : 'Android Device';
  } else {
    deviceModel = 'Desktop';
  }

  return {
    userAgent,
    platform,
    deviceModel,
    osVersion,
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    appVersion: '1.0.0', // Could be from package.json or env
  };
}
