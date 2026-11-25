/** Errors that map to an HTTP status. Route handlers turn them into a safe JSON response. */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Sign in required") {
    super(401, "unauthorized", message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Not allowed") {
    super(403, "forbidden", message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(404, "not_found", message);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(409, "conflict", message);
  }
}

/** Body for an error response: never includes stack traces or personal data. */
export function errorBody(error: unknown, correlationId: string) {
  if (error instanceof AppError) {
    return { status: error.status, body: { error: error.code, message: error.message, correlationId } };
  }
  return { status: 500, body: { error: "internal_error", message: "Something went wrong", correlationId } };
}
