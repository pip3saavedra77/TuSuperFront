import { computed, inject } from '@angular/core';
import {
  signalStore,
  withState,
  withComputed,
  withMethods,
  withHooks,
  patchState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY } from 'rxjs';
import { ProviderService } from '../services/provider.service';
import {
  ProviderWithProducts,
  CreateProviderPayload,
  UpdateProviderPayload,
} from '../../core/models/provider.model';

interface ProviderState {
  providers: ProviderWithProducts[];
  total: number;
  loading: boolean;
  error: string | null;
  limit: number;
  offset: number;
  search: string;
}

const initialState: ProviderState = {
  providers: [],
  total: 0,
  loading: false,
  error: null,
  limit: 10,
  offset: 0,
  search: '',
};

export const ProviderStore = signalStore(
  { providedIn: 'root' },

  withState<ProviderState>(initialState),

  withComputed(({ providers, total }) => ({
    totalProviders: computed(() => total()),
    isEmpty: computed(() => providers().length === 0),
  })),

  withMethods((store) => {
    const service = inject(ProviderService);

    return {
      loadAll: rxMethod<{ limit: number; offset: number; search?: string }>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap((params) =>
            service.getAll(params).pipe(
              tap((result) =>
                patchState(store, {
                  providers: result.data,
                  total: result.total,
                  loading: false,
                }),
              ),
              catchError((err: { status: number }) => {
                patchState(store, {
                  loading: false,
                  error: `Error al cargar proveedores: ${String(err.status)}`,
                });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      create: rxMethod<CreateProviderPayload>(
        pipe(
          switchMap((payload) =>
            service.create(payload).pipe(
              tap((created) =>
                patchState(store, ({ providers }) => ({
                  providers: [...providers, { ...created } as ProviderWithProducts],
                })),
              ),
              catchError((err: { status: number }) => {
                patchState(store, {
                  error: `Error al crear proveedor: ${String(err.status)}`,
                });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      update: rxMethod<{ id: number; changes: UpdateProviderPayload }>(
        pipe(
          switchMap(({ id, changes }) =>
            service.update(id, changes).pipe(
              tap((updated) =>
                patchState(store, ({ providers }) => ({
                  providers: providers.map((p) =>
                    p.id === id ? { ...p, ...updated } : p,
                  ),
                })),
              ),
              catchError((err: { status: number }) => {
                patchState(store, {
                  error: `Error al actualizar proveedor: ${String(err.status)}`,
                });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      remove: rxMethod<number>(
        pipe(
          switchMap((id) =>
            service.delete(id).pipe(
              tap(() =>
                patchState(store, ({ providers }) => ({
                  providers: providers.filter((p) => p.id !== id),
                })),
              ),
              catchError((err: { status: number }) => {
                patchState(store, {
                  error: `Error al eliminar proveedor: ${String(err.status)}`,
                });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      setSearch(search: string): void {
        patchState(store, { search, offset: 0 });
      },

      setPage(limit: number, offset: number): void {
        patchState(store, { limit, offset });
      },

      clearError(): void {
        patchState(store, { error: null });
      },
    };
  }),

  withHooks({
    onInit(store) {
      store.loadAll({ limit: store.limit(), offset: store.offset() });
    },
  }),
);
