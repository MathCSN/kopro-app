export enum ErrorType {
  NETWORK = 'NETWORK',
  API = 'API',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN',
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface ErrorDetails {
  code?: string;
  field?: string;
  constraint?: string;
  details?: Record<string, unknown>;
}

export class AppError extends Error {
  type: ErrorType;
  severity: ErrorSeverity;
  userMessage: string;
  details?: ErrorDetails;
  statusCode?: number;
  timestamp: string;
  isRecoverable: boolean;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    userMessage?: string,
    details?: ErrorDetails,
    statusCode?: number,
    isRecoverable: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.severity = severity;
    this.userMessage = userMessage || this.getDefaultUserMessage(type);
    this.details = details;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
    this.isRecoverable = isRecoverable;

    Object.setPrototypeOf(this, AppError.prototype);
  }

  private getDefaultUserMessage(type: ErrorType): string {
    const messages: Record<ErrorType, string> = {
      [ErrorType.NETWORK]: 'Problème de connexion réseau. Veuillez vérifier votre connexion internet.',
      [ErrorType.API]: 'Erreur lors de la communication avec le serveur.',
      [ErrorType.VALIDATION]: 'Les données fournies sont invalides.',
      [ErrorType.AUTHENTICATION]: 'Vous devez être connecté pour effectuer cette action.',
      [ErrorType.AUTHORIZATION]: "Vous n'avez pas les permissions nécessaires.",
      [ErrorType.NOT_FOUND]: 'La ressource demandée est introuvable.',
      [ErrorType.SERVER]: 'Une erreur serveur est survenue. Veuillez réessayer plus tard.',
      [ErrorType.CLIENT]: 'Une erreur est survenue. Veuillez réessayer.',
      [ErrorType.TIMEOUT]: 'La requête a expiré. Veuillez réessayer.',
      [ErrorType.UNKNOWN]: 'Une erreur inattendue est survenue.',
    };
    return messages[type];
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      severity: this.severity,
      userMessage: this.userMessage,
      details: this.details,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      isRecoverable: this.isRecoverable,
      stack: this.stack,
    };
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network request failed', userMessage?: string) {
    super(
      message,
      ErrorType.NETWORK,
      ErrorSeverity.HIGH,
      userMessage,
      undefined,
      undefined,
      true
    );
    this.name = 'NetworkError';
  }
}

export class APIError extends AppError {
  constructor(
    message: string,
    statusCode: number,
    userMessage?: string,
    details?: ErrorDetails
  ) {
    const severity = statusCode >= 500 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM;
    super(
      message,
      ErrorType.API,
      severity,
      userMessage,
      details,
      statusCode,
      statusCode < 500
    );
    this.name = 'APIError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string, details?: ErrorDetails) {
    super(
      message,
      ErrorType.VALIDATION,
      ErrorSeverity.LOW,
      message,
      { ...details, field },
      400,
      true
    );
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', userMessage?: string) {
    super(
      message,
      ErrorType.AUTHENTICATION,
      ErrorSeverity.MEDIUM,
      userMessage || 'Veuillez vous connecter pour continuer.',
      undefined,
      401,
      true
    );
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', userMessage?: string) {
    super(
      message,
      ErrorType.AUTHORIZATION,
      ErrorSeverity.MEDIUM,
      userMessage || "Vous n'avez pas l'autorisation d'accéder à cette ressource.",
      undefined,
      403,
      false
    );
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', userMessage?: string) {
    super(
      `${resource} not found`,
      ErrorType.NOT_FOUND,
      ErrorSeverity.LOW,
      userMessage || `${resource} introuvable.`,
      undefined,
      404,
      true
    );
    this.name = 'NotFoundError';
  }
}

export class TimeoutError extends AppError {
  constructor(message: string = 'Request timeout', userMessage?: string) {
    super(
      message,
      ErrorType.TIMEOUT,
      ErrorSeverity.MEDIUM,
      userMessage || 'La requête a expiré. Veuillez réessayer.',
      undefined,
      408,
      true
    );
    this.name = 'TimeoutError';
  }
}
