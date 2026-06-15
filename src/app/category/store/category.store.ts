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
import { CategoryService } from '../services/category.service';
import {
  CategoryWithProducts,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from '../../core/models/category.model';

interface CategoryState {
  categories: CategoryWithProducts[];
  total: number;
  loading: boolean;
  error: string | null;
  limit: number;
  offset: number;
  search: string;
}

const initialState: CategoryState = {
  categories: [],
  total: 0,
  loading: false,
  error: null,
  limit: 10,
  offset: 0,
  search: '',
};

export const CategoryStore = signalStore(
  { providedIn: 'root' },

  withState<CategoryState>(initialState),

  withComputed(({ categories, total }) => ({
    totalCategories: computed(() => total()),
    isEmpty: computed(() => categories().length === 0),
  })),

  withMethods((store) => {
    const service = inject(CategoryService);

    return {
      loadAll: rxMethod<{ limit: number; offset: number; search?: string }>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap((params) =>
            service.getAll(params).pipe(
              tap((result) =>
                patchState(store, {
                  categories: result.data,
                  total: result.total,
                  loading: false,
                }),
              ),
              catchError((err: { status: number }) => {
                patchState(store, {
                  loading: false,
                  error: `Error al cargar categorias: ${String(err.status)}`,
                });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      create: rxMethod<CreateCategoryPayload>(
        pipe(
          switchMap((payload) =>
            service.create(payload).pipe(
              tap((created) =>
                patchState(store, ({ categories }) => ({
                  categories: [...categories, { ...created, _count: { products: 0 } }],
                })),
              ),
              catchError((err: { status: number }) => {
                patchState(store, {
                  error: `Error al crear categoria: ${String(err.status)}`,
                });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      update: rxMethod<{ id: number; changes: UpdateCategoryPayload }>(
        pipe(
          switchMap(({ id, changes }) =>
            service.update(id, changes).pipe(
              tap((updated) =>
                patchState(store, ({ categories }) => ({
                  categories: categories.map((c) =>
                    c.id === id ? { ...c, ...updated } : c,
                  ),
                })),
              ),
              catchError((err: { status: number }) => {
                patchState(store, {
                  error: `Error al actualizar categoria: ${String(err.status)}`,
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
                patchState(store, ({ categories }) => ({
                  categories: categories.filter((c) => c.id !== id),
                })),
              ),
              catchError((err: { status: number }) => {
                patchState(store, {
                  error: `Error al eliminar categoria: ${String(err.status)}`,
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
