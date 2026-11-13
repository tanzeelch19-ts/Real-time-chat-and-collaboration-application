/**
 * Error with an HTTP status and a stable machine-readable code.
 * The error middleware turns it into { error: { code, message, details } }.
 */
export class ApiError extends Error {
  constructor(status, code, message, details = []) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}