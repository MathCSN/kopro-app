# Error Handling Quick Start Guide

Get started with the comprehensive error handling system in 5 minutes.

## 1. Basic Setup (Already Done)

The error handling system is already integrated:
- ✓ ErrorBoundary wrapping your app
- ✓ ThemeProvider for dark mode support
- ✓ Error logging database table created
- ✓ All utilities and hooks available

## 2. Quick Usage Patterns

### Pattern 1: Simple Error Handling (Recommended)

```tsx
import { useErrorHandler } from '@/hooks/useErrorHandler';

function MyComponent() {
  const { handleError } = useErrorHandler();

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from('my_table')
        .select('*');

      if (error) throw error;
      return data;
    } catch (error) {
      handleError(error, 'Erreur de chargement');
    }
  };
}
```

### Pattern 2: With Wrapper (No Try/Catch)

```tsx
import { useErrorHandler } from '@/hooks/useErrorHandler';

function MyComponent() {
  const { withErrorHandling } = useErrorHandler();

  const fetchData = async () => {
    const data = await withErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from('my_table')
          .select('*');

        if (error) throw error;
        return data;
      },
      'Erreur de chargement'
    );

    return data;
  };
}
```

### Pattern 3: With Automatic Retry

```tsx
import { useErrorHandler } from '@/hooks/useErrorHandler';

function MyComponent() {
  const { retry, handleError } = useErrorHandler();

  const fetchData = async () => {
    try {
      return await retry(
        async () => {
          const { data, error } = await supabase
            .from('my_table')
            .select('*');

          if (error) throw error;
          return data;
        },
        { maxRetries: 3, delay: 1000, backoff: true }
      );
    } catch (error) {
      handleError(error, 'Échec après 3 tentatives');
    }
  };
}
```

## 3. Offline Detection

```tsx
import { useOfflineDetection } from '@/hooks/useOfflineDetection';

function MyComponent() {
  const { isOnline, isSlowConnection } = useOfflineDetection();

  if (!isOnline) {
    return <OfflineMessage />;
  }

  return <YourContent />;
}

// Or add the indicator to your layout
import { OfflineIndicator } from '@/components/errors/OfflineIndicator';

function Layout() {
  return (
    <>
      <YourContent />
      <OfflineIndicator /> {/* Shows toast when offline */}
    </>
  );
}
```

## 4. Form Validation

```tsx
import {
  validateEmail,
  validatePassword,
  combineValidationResults
} from '@/lib/errors/validationHelpers';

function MyForm() {
  const handleSubmit = (e) => {
    e.preventDefault();

    const emailResult = validateEmail(email);
    const passwordResult = validatePassword(password);

    const result = combineValidationResults(
      emailResult,
      passwordResult
    );

    if (!result.isValid) {
      setErrors(result.errors);
      return;
    }

    // Submit form
  };
}
```

## 5. API Calls with Error Handling

```tsx
import { ApiClient } from '@/lib/errors/apiErrorHandler';

// Create client once
const api = new ApiClient('https://api.example.com', {
  timeout: 10000,
  retries: 2,
});

// Use in components
function MyComponent() {
  const { handleError } = useErrorHandler();

  const fetchUsers = async () => {
    try {
      const users = await api.get('/users');
      return users;
    } catch (error) {
      handleError(error);
    }
  };

  const createUser = async (userData) => {
    try {
      const user = await api.post('/users', userData);
      return user;
    } catch (error) {
      handleError(error);
    }
  };
}
```

## 6. Custom Error Boundaries

Wrap specific sections that might fail:

```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ErrorFallback } from '@/components/errors/ErrorFallback';

function MyPage() {
  return (
    <div>
      <SafeSection />

      <ErrorBoundary
        fallback={
          <ErrorFallback
            title="Widget failed to load"
            description="The widget couldn't load. Continue using the rest of the app."
          />
        }
      >
        <RiskyWidget />
      </ErrorBoundary>
    </div>
  );
}
```

## 7. Custom Error Types

Create specific errors for your use case:

```tsx
import { AppError, ErrorType, ErrorSeverity } from '@/lib/errors/errorTypes';

// Throw custom errors
throw new AppError(
  'Payment processing failed',
  ErrorType.API,
  ErrorSeverity.HIGH,
  'Le paiement a échoué. Veuillez réessayer.',
  { paymentId: '123' },
  402,
  true // isRecoverable
);
```

## 8. Viewing Error Logs (Admin)

```tsx
import { supabase } from '@/integrations/supabase/client';

async function getRecentErrors() {
  const { data } = await supabase
    .from('error_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  return data;
}

async function getCriticalErrors() {
  const { data } = await supabase
    .from('error_logs')
    .select('*')
    .eq('severity', 'CRITICAL')
    .order('created_at', { ascending: false });

  return data;
}
```

## 9. What Gets Logged Automatically

Every error handled through `useErrorHandler` automatically logs:
- Error type and message
- Stack trace
- Severity level
- User ID (if authenticated)
- Current URL
- User agent
- Timestamp
- Additional details

## 10. Best Practices Checklist

✓ **Always use `handleError`** instead of console.error
✓ **Provide context** in error messages ("Erreur de chargement des utilisateurs")
✓ **Check online status** before network requests
✓ **Use retry logic** for transient errors
✓ **Validate user input** before submission
✓ **Handle Supabase errors** by checking the error object
✓ **Show user-friendly messages** in French
✓ **Test error states** during development

## Common Mistakes to Avoid

❌ **Don't forget to handle errors**
```tsx
// Bad
const { data } = await supabase.from('table').select('*');

// Good
const { data, error } = await supabase.from('table').select('*');
if (error) throw error;
```

❌ **Don't use generic error messages**
```tsx
// Bad
handleError(error, 'Error');

// Good
handleError(error, 'Impossible de charger les profils utilisateurs');
```

❌ **Don't ignore offline state**
```tsx
// Bad
await fetch('/api/data');

// Good
if (!isOnline) {
  toast({ title: 'Hors ligne' });
  return;
}
await fetch('/api/data');
```

## Need More Help?

- See full documentation: `src/lib/errors/README.md`
- View examples: `src/lib/errors/examples/`
- Test complete setup: Import `CompleteExample` component

## Summary

1. Use `useErrorHandler()` hook in your components
2. Wrap async operations with try/catch + `handleError()`
3. Or use `withErrorHandling()` wrapper to avoid try/catch
4. Add `<OfflineIndicator />` to your layout
5. Validate forms with validation helpers
6. Check error logs in Supabase for debugging

That's it! Your app now has production-ready error handling.
