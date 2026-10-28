/**
 * Represents an expected application error that can safely be returned
 * to an API client.
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code: string = "APPLICATION_ERROR",
  ) {
    super(message);

    this.name = "AppError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}