import { HttpParams } from '@angular/common/http';

type QueryParamValue = string | number | boolean | undefined | null;

/**
 * Construye HttpParams a partir de un objeto de filtros,
 * omitiendo keys con valor undefined o null.
 *
 * Complejidad: O(k) donde k = número de keys del objeto.
 */
export function buildHttpParams(
  filters: { [key: string]: QueryParamValue },
): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null) {
      params = params.set(key, String(value));
    }
  }
  return params;
}
