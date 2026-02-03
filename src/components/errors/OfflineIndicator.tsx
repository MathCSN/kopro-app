import { useOfflineDetection } from '@/hooks/useOfflineDetection';
import { WifiOff, Wifi } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function OfflineIndicator() {
  const { isOnline, isSlowConnection, effectiveType } = useOfflineDetection();

  if (isOnline && !isSlowConnection) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      {!isOnline && (
        <Alert variant="destructive" className="shadow-lg">
          <WifiOff className="h-4 w-4" />
          <AlertTitle>Hors ligne</AlertTitle>
          <AlertDescription>
            Vous êtes actuellement hors ligne. Certaines fonctionnalités peuvent être limitées.
          </AlertDescription>
        </Alert>
      )}

      {isOnline && isSlowConnection && (
        <Alert className="shadow-lg border-warning bg-warning/10">
          <Wifi className="h-4 w-4 text-warning" />
          <AlertTitle className="text-warning">Connexion lente</AlertTitle>
          <AlertDescription className="text-warning-foreground">
            Connexion {effectiveType} détectée. Le chargement peut être plus lent.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
