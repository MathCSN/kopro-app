import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface OfflineState {
  isOnline: boolean;
  isSlowConnection: boolean;
  effectiveType?: string;
}

export function useOfflineDetection() {
  const [state, setState] = useState<OfflineState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSlowConnection: false,
    effectiveType: undefined,
  });
  const { toast } = useToast();

  useEffect(() => {
    const updateOnlineStatus = () => {
      const isOnline = navigator.onLine;
      setState((prev) => ({ ...prev, isOnline }));

      if (isOnline) {
        toast({
          title: 'Connexion rétablie',
          description: 'Vous êtes de nouveau en ligne.',
        });
      } else {
        toast({
          title: 'Hors ligne',
          description: 'Vérifiez votre connexion internet.',
          variant: 'destructive',
        });
      }
    };

    const updateConnectionSpeed = () => {
      const connection = (navigator as any).connection ||
                        (navigator as any).mozConnection ||
                        (navigator as any).webkitConnection;

      if (connection) {
        const effectiveType = connection.effectiveType;
        const isSlowConnection = effectiveType === 'slow-2g' || effectiveType === '2g';

        setState((prev) => ({
          ...prev,
          isSlowConnection,
          effectiveType,
        }));

        if (isSlowConnection && state.isOnline) {
          toast({
            title: 'Connexion lente',
            description: 'Votre connexion internet est lente.',
            variant: 'default',
          });
        }
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    const connection = (navigator as any).connection ||
                      (navigator as any).mozConnection ||
                      (navigator as any).webkitConnection;

    if (connection) {
      updateConnectionSpeed();
      connection.addEventListener('change', updateConnectionSpeed);
    }

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);

      if (connection) {
        connection.removeEventListener('change', updateConnectionSpeed);
      }
    };
  }, [toast, state.isOnline]);

  return state;
}
