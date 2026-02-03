import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AppError } from '@/lib/errors/errorTypes';
import { normalizeError, isRetryableError } from '@/lib/errors/errorHandler';
import { logError } from '@/lib/errors/errorLogger';
import { useAuth } from '@/hooks/useAuth';

interface UseErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  onError?: (error: AppError) => void;
}

interface RetryOptions {
  maxRetries?: number;
  delay?: number;
  backoff?: boolean;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const { showToast = true, logError: shouldLog = true, onError } = options;
  const { toast } = useToast();
  const { user } = useAuth();

  const handleError = useCallback(
    (error: unknown, context?: string) => {
      const appError = normalizeError(error);

      if (shouldLog) {
        logError(appError, user?.id);
      }

      if (showToast) {
        toast({
          title: context || 'Erreur',
          description: appError.userMessage,
          variant: 'destructive',
        });
      }

      if (onError) {
        onError(appError);
      }

      return appError;
    },
    [showToast, shouldLog, onError, toast, user]
  );

  const withErrorHandling = useCallback(
    async <T,>(
      fn: () => Promise<T>,
      context?: string
    ): Promise<T | null> => {
      try {
        return await fn();
      } catch (error) {
        handleError(error, context);
        return null;
      }
    },
    [handleError]
  );

  const retry = useCallback(
    async <T,>(
      fn: () => Promise<T>,
      options: RetryOptions = {}
    ): Promise<T> => {
      const { maxRetries = 3, delay = 1000, backoff = true } = options;
      let lastError: AppError | null = null;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await fn();
        } catch (error) {
          lastError = normalizeError(error);

          if (!isRetryableError(lastError) || attempt === maxRetries) {
            throw lastError;
          }

          const waitTime = backoff ? delay * Math.pow(2, attempt) : delay;
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }

      throw lastError;
    },
    []
  );

  return {
    handleError,
    withErrorHandling,
    retry,
  };
}
