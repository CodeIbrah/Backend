export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public errorCode: string;
  public timestamp: string;

  constructor(message: string, statusCode: number, errorCode: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errorCode = errorCode;
    this.timestamp = new Date().toISOString();

    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function createError(message: string, statusCode: number, errorCode: string): AppError {
  return new AppError(message, statusCode, errorCode);
}

export function isAppError(error: unknown): boolean {
  return error instanceof AppError;
}
