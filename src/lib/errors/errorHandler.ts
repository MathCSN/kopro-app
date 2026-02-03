import {
  AppError,
  NetworkError,
  APIError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  TimeoutError,
  ErrorType,
  ErrorSeverity,
} from './errorTypes';
import { PostgrestError } from '@supabase/supabase-js';

export function isNetworkError(error: unknown): boolean {
  if (error instanceof NetworkError) return true;
  if (error instanceof Error) {
    return (
      error.message.includes('network') ||
      error.message.includes('fetch') ||
      error.message.includes('Failed to fetch') ||
      error.name === 'NetworkError'
    );
  }
  return false;
}

export function parseSupabaseError(error: PostgrestError): AppError {
  const { code, message, details, hint } = error;

  if (code === 'PGRST301') {
    return new AuthenticationError(message);
  }

  if (code === '42501' || code === 'PGRST301') {
    return new AuthorizationError(message);
  }

  if (code === 'PGRST116') {
    return new NotFoundError('Resource', message);
  }

  if (code === '23505') {
    return new ValidationError('Cette ressource existe déjà.', undefined, {
      code,
      constraint: details,
    });
  }

  if (code === '23503') {
    return new ValidationError('Référence invalide.', undefined, {
      code,
      constraint: details,
    });
  }

  if (code?.startsWith('23')) {
    return new ValidationError(hint || message, undefined, {
      code,
      constraint: details,
    });
  }

  return new APIError(message, 500, undefined, {
    code,
    details: { hint, details },
  });
}

export function parseHttpError(
  response: Response,
  data?: unknown
): AppError {
  const { status, statusText } = response;

  if (status === 401) {
    return new AuthenticationError(statusText);
  }

  if (status === 403) {
    return new AuthorizationError(statusText);
  }

  if (status === 404) {
    return new NotFoundError('Resource');
  }

  if (status === 408) {
    return new TimeoutError();
  }

  if (status === 422) {
    const message = typeof data === 'object' && data && 'message' in data
      ? String(data.message)
      : 'Données invalides';
    return new ValidationError(message);
  }

  if (status >= 500) {
    return new APIError(
      statusText || 'Server error',
      status,
      'Le serveur rencontre des difficultés. Veuillez réessayer plus tard.'
    );
  }

  return new APIError(statusText || 'Request failed', status);
}

export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error && typeof error === 'object' && 'code' in error) {
    return parseSupabaseError(error as PostgrestError);
  }

  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new NetworkError();
  }

  if (error instanceof Error) {
    if (isNetworkError(error)) {
      return new NetworkError(error.message);
    }

    return new AppError(
      error.message,
      ErrorType.UNKNOWN,
      ErrorSeverity.MEDIUM,
      'Une erreur inattendue est survenue.'
    );
  }

  return new AppError(
    'Unknown error',
    ErrorType.UNKNOWN,
    ErrorSeverity.MEDIUM,
    'Une erreur inconnue est survenue.'
  );
}

export function getRetryableErrors(): ErrorType[] {
  return [
    ErrorType.NETWORK,
    ErrorType.TIMEOUT,
    ErrorType.SERVER,
  ];
}

export function isRetryableError(error: AppError): boolean {
  return (
    error.isRecoverable &&
    getRetryableErrors().includes(error.type)
  );
}

export function shouldReportError(error: AppError): boolean {
  return (
    error.severity === ErrorSeverity.HIGH ||
    error.severity === ErrorSeverity.CRITICAL ||
    error.type === ErrorType.SERVER
  );
}
