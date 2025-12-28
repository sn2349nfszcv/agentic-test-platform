// Error handling utilities - Added by APEXDEV Error Handling Injector
import { NextResponse } from 'next/server';

export class APIError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public details: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = 'APIError';
  }

  toJSON() {
    return {
      error: true,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: new Date().toISOString()
    };
  }
}

export class ValidationError extends APIError {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message, 400, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends APIError {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message, 404, details);
    this.name = 'NotFoundError';
  }
}

export class AuthenticationError extends APIError {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message, 401, details);
    this.name = 'AuthenticationError';
  }
}

export function handleAPIError(error: unknown): NextResponse {
  console.error('API Error:', error);

  if (error instanceof APIError) {
    return NextResponse.json(error.toJSON(), { status: error.statusCode });
  }

  return NextResponse.json(
    {
      error: true,
      message: 'An unexpected error occurred',
      statusCode: 500,
      timestamp: new Date().toISOString()
    },
    { status: 500 }
  );
}

export function withErrorHandler<T>(
  handler: () => Promise<T>
): Promise<T | NextResponse> {
  return handler().catch(handleAPIError);
}