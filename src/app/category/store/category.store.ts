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
import { CategoryService } from '../services/category.service';
import {
  CategoryWithProducts,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from '../../core/models/category.model';
import {
  setSearch,
  setPage,
  clearError,
  buildLoadAll,
  buildCreate,
  buildUpdate,
  buildRemove,
} from '../../core/store/crud-helpers';

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
    const svc = inject(CategoryService);

    return {
      loadAll: rxMethod<{ limit: number; offset: number; search?: string }>(
        buildLoadAll(store,
          (p) => svc.getAll(p),
          (data, total) => patchState(store, { categories: data, total }),
          'Error al cargar categorias',
        ),
      ),

      create: rxMethod<CreateCategoryPayload>(
        buildCreate(store,
          (p) => svc.create(p),
          (created) => patchState(store, ({ categories }) => ({
            categories: [...categories, { ...created, _count: { products: 0 } }],
          })),
          'Error al crear categoria',
        ),
      ),

      update: rxMethod<{ id: number; changes: UpdateCategoryPayload }>(
        buildUpdate(store,
          (id, changes) => svc.update(id, changes as UpdateCategoryPayload),
          (updated: any) => patchState(store, ({ categories }) => ({
            categories: categories.map((c: any) =>
              c.id === updated.id ? { ...c, ...updated } : c),
          })),
          'Error al actualizar categoria',
        ),
      ),

      remove: rxMethod<number>(
        buildRemove(store,
          (id) => svc.delete(id),
          (id) => patchState(store, ({ categories }) => ({
            categories: categories.filter((c: any) => c.id !== id),
          })),
          'Error al eliminar categoria',
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
