type SupabaseLikeError = {
  code?: string;
  message?: string;
};

export class AppServiceError extends Error {
  readonly code: string;

  constructor(message: string, code = "UNKNOWN") {
    super(message);
    this.name = "AppServiceError";
    this.code = code;
  }
}

export function toServiceError(error: SupabaseLikeError | null, fallback: string) {
  if (!error) return new AppServiceError(fallback);
  return new AppServiceError(fallback, error.code || "SUPABASE_ERROR");
}

export function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}
