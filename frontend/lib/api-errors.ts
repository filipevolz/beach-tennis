export interface ApiErrorBody {
  code?: string;
  message?: string;
  statusCode?: number;
}

export class ApiError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

export function parseApiError(body: unknown, fallbackMessage = 'Request failed'): ApiError {
  if (body && typeof body === 'object') {
    const record = body as ApiErrorBody;
    const code = typeof record.code === 'string' ? record.code : 'UNKNOWN_ERROR';
    const message =
      typeof record.message === 'string' ? record.message : fallbackMessage;
    return new ApiError(code, message);
  }

  return new ApiError('UNKNOWN_ERROR', fallbackMessage);
}

export async function parseApiErrorResponse(
  response: Response,
  fallbackMessage = 'Request failed',
): Promise<ApiError> {
  try {
    const body = await response.json();
    return parseApiError(body, fallbackMessage);
  } catch {
    return new ApiError('UNKNOWN_ERROR', fallbackMessage);
  }
}
