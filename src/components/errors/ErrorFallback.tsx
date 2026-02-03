import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AppError } from '@/lib/errors/errorTypes';

interface ErrorFallbackProps {
  error?: AppError;
  resetError?: () => void;
  title?: string;
  description?: string;
  showHomeButton?: boolean;
}

export function ErrorFallback({
  error,
  resetError,
  title = 'Erreur de chargement',
  description,
  showHomeButton = true,
}: ErrorFallbackProps) {
  const handleHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {title}
          </CardTitle>
          <CardDescription>
            {description || error?.userMessage || 'Une erreur est survenue lors du chargement.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            {resetError && (
              <Button onClick={resetError} variant="default">
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer
              </Button>
            )}
            {showHomeButton && (
              <Button onClick={handleHome} variant="outline">
                <Home className="h-4 w-4 mr-2" />
                Accueil
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
