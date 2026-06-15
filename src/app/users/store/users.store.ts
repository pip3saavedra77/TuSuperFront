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
import { UsersService } from '../services/users.service';
import {
  User,
  CreateUserPayload,
  UpdateUserPayload,
} from '../../core/models/user.model';

interface UsersState {
  users: User[];
  total: number;
  loading: boolean;
  error: string | null;
  limit: number;
  offset: number;
  search: string;
}

const initialState: UsersState = {
  users: [],
  total: 0,
  loading: false,
  error: null,
  limit: 10,
  offset: 0,
  search: '',
};

export const UsersStore = signalStore(
  { providedIn: 'root' },

  withState<UsersState>(initialState),

  withComputed(({ users, total }) => ({
    totalUsers: computed(() => total()),
    isEmpty: computed(() => users().length === 0),
  })),

  withMethods((store) => {
    const service = inject(UsersService);

    return {
      loadAll: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap(() =>
            service
              .getUsers({
                limit: store.limit(),
                offset: store.offset(),
                search: store.search() || undefined,
              })
              .pipe(
                tap((result) =>
                  patchState(store, {
                    users: result.data,
                    total: result.total,
                    loading: false,
                  }),
                ),
                catchError((err: { status: number }) => {
                  patchState(store, {
                    loading: false,
                    error: `Error al cargar usuarios: ${String(err.status)}`,
                  });
                  return EMPTY;
                }),
              ),
          ),
        ),
      ),

      create: rxMethod<CreateUserPayload>(
        pipe(
          switchMap((payload) =>
            service.createUser(payload).pipe(
              tap((created) =>
                patchState(store, ({ users }) => ({
                  users: [...users, created],
                })),
              ),
              catchError((err: { status: number }) => {
                patchState(store, {
                  error: `Error al crear usuario: ${String(err.status)}`,
                });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      update: rxMethod<{ id: number; changes: UpdateUserPayload }>(
        pipe(
          switchMap(({ id, changes }) =>
            service.updateUser(id, changes).pipe(
              tap((updated) =>
                patchState(store, ({ users }) => ({
                  users: users.map((u) =>
                    u.id === id ? { ...u, ...updated } : u,
                  ),
                })),
              ),
              catchError((err: { status: number }) => {
                patchState(store, {
                  error: `Error al actualizar usuario: ${String(err.status)}`,
                });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      toggleStatus: rxMethod<number>(
        pipe(
          switchMap((id) =>
            service.toggleStatus(id).pipe(
              tap((updated) =>
                patchState(store, ({ users }) => ({
                  users: users.map((u) =>
                    u.id === id ? { ...u, ...updated } : u,
                  ),
                })),
              ),
              catchError((err: { status: number }) => {
                patchState(store, {
                  error: `Error al cambiar estado: ${String(err.status)}`,
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
            service.deleteUser(id).pipe(
              tap(() =>
                patchState(store, ({ users }) => ({
                  users: users.filter((u) => u.id !== id),
                })),
              ),
              catchError((err: { status: number }) => {
                patchState(store, {
                  error: `Error al eliminar usuario: ${String(err.status)}`,
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
      store.loadAll();
    },
  }),
);
