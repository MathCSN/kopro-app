# Comprehensive Error Handling System

A complete error handling strategy for your application with graceful degradation, user-friendly messages, offline support, and error logging.

## Table of Contents

1. [Overview](#overview)
2. [Error Types](#error-types)
3. [Components](#components)
4. [Hooks](#hooks)
5. [Error Logging](#error-logging)
6. [Usage Examples](#usage-examples)
7. [Best Practices](#best-practices)

## Overview

This error handling system provides:

- **Typed Errors**: Structured error types with severity levels
- **Automatic Logging**: Errors are logged to Supabase for analysis
- **User-Friendly Messages**: Clear, actionable error messages in French
- **Retry Logic**: Automatic retry for transient errors
- **Offline Detection**: Network status monitoring with notifications
- **Graceful Degradation**: Fallback UI for error states
- **Error Boundaries**: React error boundaries to catch rendering errors

## Error Types

### Base Error Classes

```typescript
// Available error types
ErrorType {
  NETWORK,        // Network connectivity issues
  API,            // API/server errors
  VALIDATION,     // Data validation errors
  AUTHENTICATION, // Auth required
  AUTHORIZATION,  // Permission denied
  NOT_FOUND,      // Resource not found
  SERVER,         // Server errors (5xx)
  CLIENT,         // Client errors (4xx)
  TIMEOUT,        // Request timeout
  UNKNOWN,        // Unknown errors
}

// Severity levels
ErrorSeverity {
  LOW,      // Minor issues, user can continue
  MEDIUM,   // Moderate issues, some features affected
  HIGH,     // Serious issues, major features affected
  CRITICAL, // Critical failures, app unusable
}
```

### Creating Custom Errors

```typescript
import { AppError, ErrorType, ErrorSeverity } from '@/lib/errors/errorTypes';

// Create a custom error
const error = new AppError(
  'Database connection failed',
  ErrorType.SERVER,
  ErrorSeverity.HIGH,
  'Impossible de se connecter à la base de données. Veuillez réessayer.',
  { code: 'DB_CONNECTION_FAILED' },
  500,
  true // isRecoverable
);

// Or use specific error classes
import { NetworkError, ValidationError, AuthenticationError } from '@/lib/errors/errorTypes';

throw new NetworkError();
throw new ValidationError('Email invalide', 'email');
throw new AuthenticationError();
```

## Components

### ErrorBoundary

Enhanced React error boundary that catches render errors:

```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary
      showDetails={process.env.NODE_ENV === 'development'}
      onError={(error) => {
        // Custom error handling
        console.log('Error occurred:', error);
      }}
    >
      <YourApp />
    </ErrorBoundary>
  );
}
```

Features:
- Automatic error logging
- User-friendly error messages
- Technical details in development mode
- Retry and recovery options
- Multiple error detection

### OfflineIndicator

Shows connection status to users:

```tsx
import { OfflineIndicator } from '@/components/errors/OfflineIndicator';

function Layout() {
  return (
    <>
      <YourContent />
      <OfflineIndicator />
    </>
  );
}
```

Features:
- Automatic offline detection
- Slow connection warnings
- Toast notifications on status change
- Network type detection (2G, 3G, 4G, etc.)

### ErrorFallback

Reusable error fallback component:

```tsx
import { ErrorFallback } from '@/components/errors/ErrorFallback';

<ErrorFallback
  error={error}
  resetError={() => refetch()}
  title="Échec du chargement"
  description="Impossible de charger les données."
/>
```

## Hooks

### useErrorHandler

Main hook for error handling in components:

```typescript
import { useErrorHandler } from '@/hooks/useErrorHandler';

function MyComponent() {
  const { handleError, withErrorHandling, retry } = useErrorHandler({
    showToast: true,
    logError: true,
    onError: (error) => {
      // Custom error callback
    },
  });

  // Method 1: Manual error handling
  const fetchData = async () => {
    try {
      const response = await fetch('/api/data');
      const data = await response.json();
      return data;
    } catch (error) {
      handleError(error, 'Échec du chargement des données');
    }
  };

  // Method 2: Using wrapper
  const fetchDataWithWrapper = async () => {
    const data = await withErrorHandling(
      async () => {
        const response = await fetch('/api/data');
        return response.json();
      },
      'Échec du chargement des données'
    );
    return data;
  };

  // Method 3: With retry logic
  const fetchDataWithRetry = async () => {
    try {
      const data = await retry(
        async () => {
          const response = await fetch('/api/data');
          if (!response.ok) throw new Error('Request failed');
          return response.json();
        },
        {
          maxRetries: 3,
          delay: 1000,
          backoff: true, // Exponential backoff
        }
      );
      return data;
    } catch (error) {
      handleError(error, 'Échec après plusieurs tentatives');
    }
  };

  return <div>{/* Your component */}</div>;
}
```

### useOfflineDetection

Monitor network connectivity:

```typescript
import { useOfflineDetection } from '@/hooks/useOfflineDetection';

function MyComponent() {
  const { isOnline, isSlowConnection, effectiveType } = useOfflineDetection();

  if (!isOnline) {
    return <OfflineMessage />;
  }

  if (isSlowConnection) {
    return <SlowConnectionWarning type={effectiveType} />;
  }

  return <YourContent />;
}
```

## Error Logging

Errors are automatically logged to Supabase's `error_logs` table with:

- Error type and message
- Stack trace
- Severity level
- User ID (if authenticated)
- URL and timestamp
- User agent
- Additional details

### Viewing Error Logs

```typescript
import { supabase } from '@/integrations/supabase/client';

// Get recent errors
const { data: errors } = await supabase
  .from('error_logs')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(50);

// Get critical errors
const { data: criticalErrors } = await supabase
  .from('error_logs')
  .select('*')
  .eq('severity', 'CRITICAL')
  .order('created_at', { ascending: false });

// Get errors for specific user
const { data: userErrors } = await supabase
  .from('error_logs')
  .select('*')
  .eq('user_id', userId);
```

### Error Log Cleanup

```typescript
import { errorLogger } from '@/lib/errors/errorLogger';

// Clear error logs older than 30 days (call periodically)
await errorLogger.clearOldLogs(30);
```

## Usage Examples

### 1. Network Error Handling

```typescript
import { fetchWithErrorHandling } from '@/lib/errors/apiErrorHandler';

const response = await fetchWithErrorHandling('https://api.example.com/data', {
  timeout: 10000,
  retries: 3,
  retryDelay: 1000,
});
```

### 2. API Client Usage

```typescript
import { ApiClient } from '@/lib/errors/apiErrorHandler';

const apiClient = new ApiClient('https://api.example.com', {
  timeout: 30000,
  retries: 2,
  retryDelay: 1000,
});

// GET request
const users = await apiClient.get('/users');

// POST request
const newUser = await apiClient.post('/users', {
  name: 'John Doe',
  email: 'john@example.com',
});
```

### 3. Validation with Zod

```typescript
import { z } from 'zod';
import { formatZodError } from '@/lib/errors/validationHelpers';

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

try {
  const data = userSchema.parse(formData);
} catch (error) {
  if (error instanceof z.ZodError) {
    const validationError = formatZodError(error);
    handleError(validationError);
  }
}
```

### 4. Custom Validation

```typescript
import {
  validateEmail,
  validatePassword,
  validateRequired,
  combineValidationResults,
} from '@/lib/errors/validationHelpers';

const emailResult = validateEmail(email);
const passwordResult = validatePassword(password);
const nameResult = validateRequired(name, 'Nom');

const result = combineValidationResults(
  emailResult,
  passwordResult,
  nameResult
);

if (!result.isValid) {
  setErrors(result.errors);
  return;
}
```

### 5. Supabase Error Handling

```typescript
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { supabase } from '@/integrations/supabase/client';

function MyComponent() {
  const { handleError } = useErrorHandler();

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) {
      handleError(error, 'Erreur lors du chargement des profils');
      return;
    }

    return data;
  };
}
```

## Best Practices

### 1. Always Handle Errors

```typescript
// ❌ Bad: Unhandled errors
const data = await fetch('/api/data').then(r => r.json());

// ✅ Good: Handled errors
try {
  const response = await fetch('/api/data');
  if (!response.ok) throw new Error('Request failed');
  const data = await response.json();
} catch (error) {
  handleError(error);
}
```

### 2. Provide Context

```typescript
// ❌ Bad: Generic error message
handleError(error);

// ✅ Good: Contextual error message
handleError(error, 'Erreur lors du chargement des utilisateurs');
```

### 3. Use Appropriate Error Types

```typescript
// ❌ Bad: Generic Error
throw new Error('User not found');

// ✅ Good: Typed Error
throw new NotFoundError('Utilisateur', 'L\'utilisateur est introuvable.');
```

### 4. Implement Retry Logic for Transient Errors

```typescript
// ✅ Good: Retry network requests
const data = await retry(
  () => fetchData(),
  { maxRetries: 3, delay: 1000, backoff: true }
);
```

### 5. Show Offline State

```typescript
// ✅ Good: Check online status before requests
const { isOnline } = useOfflineDetection();

if (!isOnline) {
  toast({
    title: 'Hors ligne',
    description: 'Connectez-vous à internet pour continuer.',
  });
  return;
}

await fetchData();
```

### 6. Log Important Errors

```typescript
// ✅ Good: Errors are automatically logged with useErrorHandler
const { handleError } = useErrorHandler({ logError: true });

// Manual logging if needed
import { logError } from '@/lib/errors/errorLogger';
logError(appError, userId);
```

### 7. Graceful Degradation

```typescript
// ✅ Good: Provide fallback data
const data = await handleApiRequest(
  () => fetchData(),
  [] // Fallback to empty array
);
```

## Error Message Guidelines

- Use French for user-facing messages
- Be specific about what went wrong
- Provide actionable next steps
- Avoid technical jargon
- Be empathetic and reassuring

### Examples

```typescript
// ❌ Bad
"Error 500"
"Request failed"
"Invalid input"

// ✅ Good
"Le serveur rencontre des difficultés. Veuillez réessayer plus tard."
"Impossible de charger les données. Vérifiez votre connexion internet."
"L'email doit être une adresse valide (exemple: nom@domaine.fr)"
```

## Summary

This error handling system provides comprehensive coverage for all error scenarios in your application. By following these patterns and best practices, you can ensure a robust, user-friendly experience even when things go wrong.
