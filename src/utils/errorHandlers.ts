export interface FirestoreErrorInfo {
  code: string;
  message: string;
  timestamp: string;
  retryable: boolean;
  recoveryStep: string;
}

export function handleFirestoreError(error: unknown): never {
  const errAny = error as Record<string, unknown>;
  const code = typeof errAny?.code === 'string' ? errAny.code : 'unknown';
  let message = 'An unexpected database error occurred.';
  let retryable = false;
  let recoveryStep = 'Please refresh the page and try again.';

  if (code === 'permission-denied') {
    message = 'You do not have permission to perform this action. Your request violated database security constraints.';
    retryable = false;
    recoveryStep = 'Please verify that you are signed in and have ownership of the resource you are trying to modify.';
  } else if (code === 'unauthenticated') {
    message = 'Authentication is required. Please sign in to continue.';
    retryable = true;
    recoveryStep = 'Please log in via the Google Sign-In button and try your request again.';
  } else if (code === 'resource-exhausted') {
    message = 'The database service is currently busy or quota limits have been exceeded.';
    retryable = true;
    recoveryStep = 'The database is temporarily rate-limiting requests. Please wait a few moments before retrying.';
  } else if (code === 'unavailable') {
    message = 'The database service is temporarily offline.';
    retryable = true;
    recoveryStep = 'Your internet connection may have dropped or the service is restarting. Please retry shortly.';
  } else if (errAny?.message && typeof errAny.message === 'string') {
    message = errAny.message;
  }

  const errorInfo: FirestoreErrorInfo = {
    code,
    message,
    timestamp: new Date().toISOString(),
    retryable,
    recoveryStep
  };

  throw new Error(JSON.stringify(errorInfo));
}
