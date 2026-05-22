import { HttpErrorResponse } from '@angular/common/http';

export function getHttpErrorMessage(
  err: HttpErrorResponse,
  fallback = 'Error al procesar la solicitud',
): string {
  const payload = err.error as { message?: string | string[] } | null;

  if (!payload?.message) {
    return fallback;
  }

  if (Array.isArray(payload.message)) {
    return payload.message.join('. ');
  }

  return payload.message;
}
