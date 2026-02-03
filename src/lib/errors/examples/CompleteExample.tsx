import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useOfflineDetection } from '@/hooks/useOfflineDetection';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { OfflineIndicator } from '@/components/errors/OfflineIndicator';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

function DataFetcher() {
  const { handleError, withErrorHandling, retry } = useErrorHandler();
  const { isOnline } = useOfflineDetection();
  const [data, setData] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProfiles = async () => {
    if (!isOnline) {
      handleError(
        new Error('No connection'),
        'Vous êtes hors ligne. Connectez-vous pour continuer.'
      );
      return;
    }

    setLoading(true);
    setData([]);

    const result = await withErrorHandling(async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .limit(10);

      if (error) throw error;
      return profiles || [];
    }, 'Impossible de charger les profils');

    if (result) {
      setData(result);
    }

    setLoading(false);
  };

  const fetchWithRetry = async () => {
    if (!isOnline) {
      handleError(
        new Error('No connection'),
        'Vous êtes hors ligne. Connectez-vous pour continuer.'
      );
      return;
    }

    setLoading(true);
    setData([]);

    try {
      const result = await retry(
        async () => {
          const { data: profiles, error } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email')
            .limit(10);

          if (error) throw error;
          return profiles || [];
        },
        {
          maxRetries: 3,
          delay: 1000,
          backoff: true,
        }
      );

      setData(result);
    } catch (error) {
      handleError(error, 'Échec après plusieurs tentatives');
    } finally {
      setLoading(false);
    }
  };

  const triggerError = () => {
    throw new Error('Test error from button click');
  };

  return (
    <div className="space-y-4 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Complete Error Handling Example</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={fetchProfiles}
              disabled={loading || !isOnline}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Fetch Profiles
            </Button>

            <Button
              onClick={fetchWithRetry}
              disabled={loading || !isOnline}
              variant="outline"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Fetch with Retry (3x)
            </Button>

            <Button
              onClick={triggerError}
              variant="destructive"
            >
              Trigger Error Boundary
            </Button>
          </div>

          {loading && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {!loading && data.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Loaded {data.length} profiles:
              </p>
              <div className="bg-muted p-4 rounded-lg max-h-60 overflow-auto">
                <pre className="text-xs">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {!loading && data.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No data loaded. Click a button to fetch data.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Error Handling Features</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>Automatic error logging to Supabase</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>User-friendly error messages with toast notifications</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>Offline detection with automatic warnings</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>Retry logic with exponential backoff</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>Error boundaries for render errors</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>Graceful degradation with fallback UI</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>Typed errors with severity levels</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>Network status monitoring</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

export function CompleteExample() {
  return (
    <ErrorBoundary showDetails={true}>
      <DataFetcher />
      <OfflineIndicator />
    </ErrorBoundary>
  );
}
