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
import { ProviderService } from '../services/provider.service';
import {
  ProviderWithProducts,
  CreateProviderPayload,
  UpdateProviderPayload,
} from '../../core/models/provider.model';
import {
  setSearch,
  setPage,
  clearError,
  buildLoadAll,
  buildCreate,
  buildUpdate,
  buildRemove,
} from '../../core/store/crud-helpers';

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
    const svc = inject(ProviderService);

    return {
      loadAll: rxMethod<{ limit: number; offset: number; search?: string }>(
        buildLoadAll(store,
          (p) => svc.getAll(p),
          (data, total) => patchState(store, { providers: data, total }),
          'Error al cargar proveedores',
        ),
      ),

      create: rxMethod<CreateProviderPayload>(
        buildCreate(store,
          (p) => svc.create(p),
          (created) => patchState(store, ({ providers }) => ({
            providers: [...providers, { ...created }],
          })),
          'Error al crear proveedor',
        ),
      ),

      update: rxMethod<{ id: number; changes: UpdateProviderPayload }>(
        buildUpdate(store,
          (id, changes) => svc.update(id, changes as UpdateProviderPayload),
          (updated: any) => patchState(store, ({ providers }) => ({
            providers: providers.map((p: any) =>
              p.id === updated.id ? { ...p, ...updated } : p),
          })),
          'Error al actualizar proveedor',
        ),
      ),

      remove: rxMethod<number>(
        buildRemove(store,
          (id) => svc.delete(id),
          (id) => patchState(store, ({ providers }) => ({
            providers: providers.filter((p: any) => p.id !== id),
          })),
          'Error al eliminar proveedor',
        ),
      ),

      setSearch: (s: string) => setSearch(store, s),
      setPage: (l: number, o: number) => setPage(store, l, o),
      clearError: () => clearError(store),
    };
  }),

  withHooks({
    onInit(store) {
      store.loadAll({ limit: store.limit(), offset: store.offset() });
    },
  }),
);
