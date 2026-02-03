import { ValidationError } from './errorTypes';
import { ZodError, ZodIssue } from 'zod';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function formatZodError(error: ZodError): ValidationError {
  const firstIssue = error.issues[0];
  const field = firstIssue.path.join('.');
  const message = firstIssue.message;

  const allErrors = error.issues.reduce((acc, issue) => {
    const path = issue.path.join('.');
    acc[path] = issue.message;
    return acc;
  }, {} as Record<string, string>);

  return new ValidationError(message, field, {
    details: { errors: allErrors },
  });
}

export function validateEmail(email: string): ValidationResult {
  const errors: Record<string, string> = {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email) {
    errors.email = 'L\'email est requis.';
  } else if (!emailRegex.test(email)) {
    errors.email = 'L\'email n\'est pas valide.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validatePassword(password: string): ValidationResult {
  const errors: Record<string, string> = {};

  if (!password) {
    errors.password = 'Le mot de passe est requis.';
  } else if (password.length < 8) {
    errors.password = 'Le mot de passe doit contenir au moins 8 caractères.';
  } else if (!/[A-Z]/.test(password)) {
    errors.password = 'Le mot de passe doit contenir au moins une majuscule.';
  } else if (!/[a-z]/.test(password)) {
    errors.password = 'Le mot de passe doit contenir au moins une minuscule.';
  } else if (!/[0-9]/.test(password)) {
    errors.password = 'Le mot de passe doit contenir au moins un chiffre.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateRequired(
  value: unknown,
  fieldName: string
): ValidationResult {
  const errors: Record<string, string> = {};

  if (
    value === null ||
    value === undefined ||
    (typeof value === 'string' && value.trim() === '') ||
    (Array.isArray(value) && value.length === 0)
  ) {
    errors[fieldName] = `${fieldName} est requis.`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateLength(
  value: string,
  fieldName: string,
  min?: number,
  max?: number
): ValidationResult {
  const errors: Record<string, string> = {};

  if (min !== undefined && value.length < min) {
    errors[fieldName] = `${fieldName} doit contenir au moins ${min} caractères.`;
  }

  if (max !== undefined && value.length > max) {
    errors[fieldName] = `${fieldName} ne peut pas dépasser ${max} caractères.`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateRange(
  value: number,
  fieldName: string,
  min?: number,
  max?: number
): ValidationResult {
  const errors: Record<string, string> = {};

  if (min !== undefined && value < min) {
    errors[fieldName] = `${fieldName} doit être supérieur ou égal à ${min}.`;
  }

  if (max !== undefined && value > max) {
    errors[fieldName] = `${fieldName} doit être inférieur ou égal à ${max}.`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function combineValidationResults(
  ...results: ValidationResult[]
): ValidationResult {
  const combinedErrors = results.reduce((acc, result) => {
    return { ...acc, ...result.errors };
  }, {});

  return {
    isValid: Object.keys(combinedErrors).length === 0,
    errors: combinedErrors,
  };
}

export function createFieldValidator<T extends Record<string, unknown>>(
  validators: {
    [K in keyof T]?: (value: T[K]) => ValidationResult;
  }
) {
  return (data: T): ValidationResult => {
    const results = Object.entries(validators).map(([field, validator]) => {
      if (validator) {
        return validator(data[field as keyof T]);
      }
      return { isValid: true, errors: {} };
    });

    return combineValidationResults(...results);
  };
}
