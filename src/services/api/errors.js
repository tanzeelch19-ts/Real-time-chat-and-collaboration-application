const FALLBACK_MESSAGES = {
  400: 'The request was invalid.',
  401: 'Please sign in to continue.',
  403: 'You do not have permission to do that.',
  404: 'We could not find what you were looking for.',
  409: 'This conflicts with existing data.',
  413: 'The file or request is too large.',
  422: 'Please fix the highlighted fields.',
};

export class ApiClientError extends Error {
  constructor({ status = 0, code = 'UNKNOWN', message, details = [] }) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/** Converts any axios or network failure into an ApiClientError with a readable message. */
export function normalizeError(error) {
  if (error instanceof ApiClientError) return error;

  if (error?.response) {
    const { status, data } = error.response;
    const body = data?.error ?? {};
    const fallback =
      status >= 500
        ? 'The server is unavailable. Please try again shortly.'
        : (FALLBACK_MESSAGES[status] ?? 'Something went wrong.');
    return new ApiClientError({
      status,
      code: body.code ?? 'HTTP_ERROR',
      message: body.message ?? fallback,
      details: Array.isArray(body.details) ? body.details : [],
    });
  }

  if (error?.request) {
    return new ApiClientError({
      code: 'NETWORK_ERROR',
      message: 'Cannot reach the server. Check your connection and try again.',
    });
  }

  return new ApiClientError({ code: 'UNKNOWN', message: 'Something went wrong. Please try again.' });
}

/** Plain object that is safe to store in Redux (Error instances are not serializable). */
export function toSerializableError(error) {
  const normalized = normalizeError(error);
  return {
    status: normalized.status,
    code: normalized.code,
    message: normalized.message,
    details: normalized.details,
  };
}
