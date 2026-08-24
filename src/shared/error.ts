export class AppError extends Error {
  constructor(
    msg: string,
    public code: number,
  ) {
    super(msg);
    this.name = "AppError";
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}
