// A base error for all API-related issues
export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// For 429 - Rate Limit Exceeded errors
export class RateLimitError extends ApiError {
  constructor(message = 'API request limit reached. This can happen on the free tier. Please wait a moment and try again.') {
    super(message);
    this.name = 'RateLimitError';
  }
}

// For 400 - Bad Request errors (e.g., invalid image)
export class InvalidInputError extends ApiError {
  constructor(message = 'There was an issue with one of the uploaded images. Please try using a different, clear image.') {
    super(message);
    this.name = 'InvalidInputError';
  }
}

// For 5xx - Server errors
export class ServerError extends ApiError {
  constructor(message = 'The AI service is currently unavailable. Please try again later.') {
    super(message);
    this.name = 'ServerError';
  }
}
