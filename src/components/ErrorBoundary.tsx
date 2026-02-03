import React, { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppError, ErrorSeverity, ErrorType } from '@/lib/errors/errorTypes';
import { normalizeError } from '@/lib/errors/errorHandler';
import { logError } from '@/lib/errors/errorLogger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: AppError) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: AppError | null;
  errorCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error: normalizeError(error) };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const appError = normalizeError(error);

    logError(appError);

    console.error('Error caught by boundary:', {
      error: appError.toJSON(),
      componentStack: errorInfo.componentStack,
    });

    if (this.props.onError) {
      this.props.onError(appError);
    }

    this.setState((prev) => ({
      errorCount: prev.errorCount + 1,
    }));
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorCount } = this.state;
      const isCritical = error.severity === ErrorSeverity.CRITICAL;
      const tooManyErrors = errorCount > 3;

      return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                {isCritical ? 'Erreur critique' : 'Une erreur est survenue'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                {error.userMessage}
              </p>

              {error.type === ErrorType.NETWORK && (
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <p className="font-medium mb-1">Conseils :</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Vérifiez votre connexion internet</li>
                    <li>Désactivez votre VPN si activé</li>
                    <li>Réessayez dans quelques instants</li>
                  </ul>
                </div>
              )}

              {(this.props.showDetails || process.env.NODE_ENV === 'development') && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Détails techniques
                  </summary>
                  <div className="mt-2 space-y-2">
                    <div className="p-2 bg-muted rounded">
                      <p className="font-mono text-xs">
                        <strong>Type:</strong> {error.type}
                      </p>
                      <p className="font-mono text-xs">
                        <strong>Sévérité:</strong> {error.severity}
                      </p>
                      {error.statusCode && (
                        <p className="font-mono text-xs">
                          <strong>Code:</strong> {error.statusCode}
                        </p>
                      )}
                      <p className="font-mono text-xs">
                        <strong>Timestamp:</strong> {error.timestamp}
                      </p>
                    </div>
                    <pre className="p-2 bg-muted rounded text-xs overflow-auto max-h-40">
                      {error.message}
                      {error.stack && `\n\n${error.stack}`}
                    </pre>
                  </div>
                </details>
              )}

              {tooManyErrors && (
                <div className="p-3 bg-destructive/10 rounded-lg text-sm text-destructive">
                  <p className="font-medium">
                    Erreurs multiples détectées. Un rechargement complet est recommandé.
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {!tooManyErrors && !isCritical && error.isRecoverable && (
                  <Button onClick={this.handleReset}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Réessayer
                  </Button>
                )}

                {(tooManyErrors || isCritical) && (
                  <Button onClick={this.handleReload}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Recharger la page
                  </Button>
                )}

                <Button variant="outline" onClick={this.handleHome}>
                  <Home className="h-4 w-4 mr-2" />
                  Retour à l'accueil
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
