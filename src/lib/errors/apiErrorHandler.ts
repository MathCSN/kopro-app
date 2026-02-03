import { AppError, NetworkError, TimeoutError } from './errorTypes';
import { parseHttpError, normalizeError } from './errorHandler';

export interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export async function fetchWithErrorHandling(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const {
    timeout = 30000,
    retries = 0,
    retryDelay = 1000,
    ...fetchOptions
  } = options;

  let lastError: AppError | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let data: unknown;
        try {
          data = await response.json();
        } catch {
          data = await response.text();
        }
        throw parseHttpError(response, data);
      }

      return response;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        lastError = new TimeoutError();
      } else {
        lastError = normalizeError(error);
      }

      if (attempt < retries && lastError.isRecoverable) {
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelay * Math.pow(2, attempt))
        );
        continue;
      }

      throw lastError;
    }
  }

  throw lastError;
}

export async function handleApiRequest<T>(
  request: () => Promise<T>,
  fallback?: T
): Promise<T> {
  try {
    return await request();
  } catch (error) {
    const appError = normalizeError(error);

    if (fallback !== undefined && appError.isRecoverable) {
      return fallback;
    }

    throw appError;
  }
}

export function createApiErrorHandler(baseUrl: string) {
  return {
    async get<T>(endpoint: string, options?: FetchOptions): Promise<T> {
      const response = await fetchWithErrorHandling(
        `${baseUrl}${endpoint}`,
        { ...options, method: 'GET' }
      );
      return response.json();
    },

    async post<T>(
      endpoint: string,
      data?: unknown,
      options?: FetchOptions
    ): Promise<T> {
      const response = await fetchWithErrorHandling(
        `${baseUrl}${endpoint}`,
        {
          ...options,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
          },
          body: JSON.stringify(data),
        }
      );
      return response.json();
    },

    async put<T>(
      endpoint: string,
      data?: unknown,
      options?: FetchOptions
    ): Promise<T> {
      const response = await fetchWithErrorHandling(
        `${baseUrl}${endpoint}`,
        {
          ...options,
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
          },
          body: JSON.stringify(data),
        }
      );
      return response.json();
    },

    async delete<T>(endpoint: string, options?: FetchOptions): Promise<T> {
      const response = await fetchWithErrorHandling(
        `${baseUrl}${endpoint}`,
        { ...options, method: 'DELETE' }
      );
      return response.json();
    },
  };
}

export class ApiClient {
  private baseUrl: string;
  private defaultOptions: FetchOptions;

  constructor(baseUrl: string, defaultOptions: FetchOptions = {}) {
    this.baseUrl = baseUrl;
    this.defaultOptions = {
      timeout: 30000,
      retries: 2,
      retryDelay: 1000,
      ...defaultOptions,
    };
  }

  private async request<T>(
    endpoint: string,
    options: FetchOptions = {}
  ): Promise<T> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    const response = await fetchWithErrorHandling(
      `${this.baseUrl}${endpoint}`,
      mergedOptions
    );
    return response.json();
  }

  async get<T>(endpoint: string, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(
    endpoint: string,
    data?: unknown,
    options?: FetchOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: JSON.stringify(data),
    });
  }

  async put<T>(
    endpoint: string,
    data?: unknown,
    options?: FetchOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string, options?: FetchOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}
