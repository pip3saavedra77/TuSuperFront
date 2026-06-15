import { patchState } from '@ngrx/signals';
import { EMPTY, catchError, switchMap, tap, Observable, UnaryFunction, pipe as rxPipe } from 'rxjs';

export function setSearch(store: any, search: string): void {
  patchState(store, { search, offset: 0 });
}

export function setPage(store: any, limit: number, offset: number): void {
  patchState(store, { limit, offset });
}

export function clearError(store: any): void {
  patchState(store, { error: null });
}

function tagError(store: any, err: { status: number }, prefix: string): void {
  patchState(store, { error: `${prefix}: ${String(err.status)}` });
}

export function startLoading(store: any): void {
  patchState(store, { loading: true, error: null });
}

export function stopLoading(store: any): void {
  patchState(store, { loading: false });
}

export function buildLoadAll<T>(
  store: any,
  call: (p: { limit: number; offset: number; search?: string }) => Observable<{ data: T[]; total: number }>,
  onData: (items: T[], total: number) => void,
  errMsg: string,
): UnaryFunction<Observable<{ limit: number; offset: number; search?: string }>, Observable<unknown>> {
  const inner = switchMap((params: { limit: number; offset: number; search?: string }) =>
    call(params).pipe(
      tap((result) => {
        onData(result.data, result.total);
        stopLoading(store);
      }),
      catchError((err: { status: number }) => {
        stopLoading(store);
        tagError(store, err, errMsg);
        return EMPTY;
      }),
    ));
  return rxPipe(
    tap(() => startLoading(store)),
    inner,
  );
}

export function buildCreate<T, P>(
  store: any,
  call: (payload: P) => Observable<T>,
  onSuccess: (created: T) => void,
  errMsg: string,
): UnaryFunction<Observable<P>, Observable<unknown>> {
  return switchMap((payload: P) =>
    call(payload).pipe(
      tap((created) => onSuccess(created)),
      catchError((err: { status: number }) => {
        tagError(store, err, errMsg);
        return EMPTY;
      }),
    ));
}

export function buildUpdate<T>(
  store: any,
  call: (id: number, changes: Partial<T>) => Observable<T>,
  onSuccess: (updated: T) => void,
  errMsg: string,
): UnaryFunction<Observable<{ id: number; changes: Partial<T> }>, Observable<unknown>> {
  return switchMap(({ id, changes }: { id: number; changes: Partial<T> }) =>
    call(id, changes).pipe(
      tap((updated) => onSuccess(updated)),
      catchError((err: { status: number }) => {
        tagError(store, err, errMsg);
        return EMPTY;
      }),
    ));
}

export function buildRemove(
  store: any,
  call: (id: number) => Observable<void>,
  onSuccess: (id: number) => void,
  errMsg: string,
): UnaryFunction<Observable<number>, Observable<unknown>> {
  return switchMap((id: number) =>
    call(id).pipe(
      tap(() => onSuccess(id)),
      catchError((err: { status: number }) => {
        tagError(store, err, errMsg);
        return EMPTY;
      }),
    ));
}
