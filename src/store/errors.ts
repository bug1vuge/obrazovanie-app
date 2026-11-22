/** Expected, user-facing failure of a domain operation (message is shown in UI). */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export function errorMessage(error: unknown, fallback = 'Что-то пошло не так'): string {
  if (error instanceof DomainError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
