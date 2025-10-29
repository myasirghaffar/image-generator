/**
 * Error types for better error categorization
 */
export enum ErrorType {
  API_KEY_INVALID = 'API_KEY_INVALID',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  CONTENT_BLOCKED = 'CONTENT_BLOCKED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  API_NOT_CONFIGURED = 'API_NOT_CONFIGURED'
}

export interface ApiError {
  type: ErrorType;
  message: string;
  userFriendlyMessage: string;
}

/**
 * Parses API errors and returns user-friendly messages
 */
export const parseApiError = (error: unknown): ApiError => {
  // Check if it's already a parsed error
  if (error && typeof error === 'object' && 'type' in error && 'userFriendlyMessage' in error) {
    return error as ApiError;
  }

  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorString = errorMessage.toLowerCase();

  // Check for API key errors
  if (
    errorString.includes('api key') ||
    errorString.includes('invalid api key') ||
    errorString.includes('unauthorized') ||
    errorString.includes('401') ||
    errorString.includes('403') ||
    errorString.includes('authentication') ||
    errorString.includes('permission denied')
  ) {
    return {
      type: ErrorType.API_KEY_INVALID,
      message: errorMessage,
      userFriendlyMessage: 'API key is invalid or has been revoked. Please check your API_KEY in the .env file and ensure it\'s correct.'
    };
  }

  // Check for rate limit errors
  if (
    errorString.includes('rate limit') ||
    errorString.includes('429') ||
    errorString.includes('too many requests') ||
    errorString.includes('request rate')
  ) {
    return {
      type: ErrorType.RATE_LIMIT_EXCEEDED,
      message: errorMessage,
      userFriendlyMessage: 'Rate limit exceeded. Please wait a few moments and try again. Too many requests were made in a short time.'
    };
  }

  // Check for quota exceeded errors
  if (
    errorString.includes('quota') ||
    errorString.includes('quota exceeded') ||
    errorString.includes('billing') ||
    errorString.includes('payment') ||
    errorString.includes('resource exhausted')
  ) {
    return {
      type: ErrorType.QUOTA_EXCEEDED,
      message: errorMessage,
      userFriendlyMessage: 'API quota has been exceeded. Your API key has reached its usage limit. Please check your billing and quota limits, or wait until the quota resets.'
    };
  }

  // Check for network errors
  if (
    errorString.includes('network') ||
    errorString.includes('fetch') ||
    errorString.includes('connection') ||
    errorString.includes('timeout') ||
    errorString.includes('econnrefused') ||
    errorString.includes('enotfound')
  ) {
    return {
      type: ErrorType.NETWORK_ERROR,
      message: errorMessage,
      userFriendlyMessage: 'Network error. Please check your internet connection and try again. If the problem persists, the API service may be temporarily unavailable.'
    };
  }

  // Check for service unavailable
  if (
    errorString.includes('503') ||
    errorString.includes('service unavailable') ||
    errorString.includes('temporarily unavailable') ||
    errorString.includes('maintenance')
  ) {
    return {
      type: ErrorType.SERVICE_UNAVAILABLE,
      message: errorMessage,
      userFriendlyMessage: 'Service is temporarily unavailable. The API service is down or under maintenance. Please try again later.'
    };
  }

  // Check for content blocked
  if (
    errorString.includes('blocked') ||
    errorString.includes('safety') ||
    errorString.includes('content policy') ||
    errorString.includes('not allowed')
  ) {
    return {
      type: ErrorType.CONTENT_BLOCKED,
      message: errorMessage,
      userFriendlyMessage: 'Request blocked. The content violates the API\'s safety policies. Please try rephrasing your request.'
    };
  }

  // Default unknown error
  return {
    type: ErrorType.UNKNOWN_ERROR,
    message: errorMessage,
    userFriendlyMessage: `An unexpected error occurred: ${errorMessage}. Please try again or contact support if the issue persists.`
  };
};

/**
 * Creates a custom error with user-friendly message
 */
export const createApiError = (type: ErrorType, message: string, userFriendlyMessage: string): Error & ApiError => {
  const error = new Error(message) as Error & ApiError;
  error.type = type;
  error.userFriendlyMessage = userFriendlyMessage;
  return error;
};

/**
 * Extracts user-friendly error message from an error object
 * Use this in React components to display errors
 */
export const getUserFriendlyErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object' && 'userFriendlyMessage' in error) {
    return (error as ApiError).userFriendlyMessage;
  }
  const apiError = parseApiError(error);
  return apiError.userFriendlyMessage;
};

/**
 * Checks if error is a specific error type
 */
export const isErrorType = (error: unknown, type: ErrorType): boolean => {
  if (error && typeof error === 'object' && 'type' in error) {
    return (error as ApiError).type === type;
  }
  return parseApiError(error).type === type;
};

