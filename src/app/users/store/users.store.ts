import { computed, inject } from '@angular/core';
import {
  signalStore,
  withState,
  withComputed,
  withMethods,
  withHooks,
  patchState,
} from '@ngrx/signals';
import { EMPTY, catchError, switchMap, tap, pipe as rxPipe } from 'rxjs';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { UsersService } from '../services/users.service';
import {
  User,
  CreateUserPayload,
  UpdateUserPayload,
} from '../../core/models/user.model';
import {
  setSearch,
  setPage,
  clearError,
  startLoading,
  stopLoading,
  buildCreate,
  buildUpdate,
  buildRemove,
} from '../../core/store/crud-helpers';

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
    const svc = inject(UsersService);

    const loadOp = switchMap(() =>
      svc.getUsers({
        limit: store.limit(),
        offset: store.offset(),
        search: store.search() || undefined,
      }).pipe(
        tap((result) => {
          patchState(store, { users: result.data, total: result.total });
          stopLoading(store);
        }),
        catchError((err: { status: number }) => {
          stopLoading(store);
          patchState(store, { error: `Error al cargar usuarios: ${String(err.status)}` });
          return EMPTY;
        }),
      ));

    const toggleOp = switchMap((id: number) =>
      svc.toggleStatus(id).pipe(
        tap((updated) => patchState(store, ({ users }) => ({
          users: users.map((u) => (u.id === id ? { ...u, ...updated } : u)),
        }))),
        catchError((err: { status: number }) => {
          patchState(store, { error: `Error al cambiar estado: ${String(err.status)}` });
          return EMPTY;
        }),
      ));

    return {
      loadAll: rxMethod<void>(
        rxPipe(tap(() => startLoading(store)), loadOp),
      ),

      create: rxMethod<CreateUserPayload>(
        buildCreate(store,
          (p) => svc.createUser(p),
          (created) => patchState(store, ({ users }) => ({
            users: [...users, created],
          })),
          'Error al crear usuario',
        ),
      ),

      update: rxMethod<{ id: number; changes: UpdateUserPayload }>(
        buildUpdate(store,
          (id, changes) => svc.updateUser(id, changes as UpdateUserPayload),
          (updated: any) => patchState(store, ({ users }) => ({
            users: users.map((u: any) =>
              u.id === updated.id ? { ...u, ...updated } : u),
          })),
          'Error al actualizar usuario',
        ),
      ),

      toggleStatus: rxMethod<number>(toggleOp),

      remove: rxMethod<number>(
        buildRemove(store,
          (id) => svc.deleteUser(id),
          (id) => patchState(store, ({ users }) => ({
            users: users.filter((u: any) => u.id !== id),
          })),
          'Error al eliminar usuario',
        ),
      ),

      setSearch: (s: string) => setSearch(store, s),
      setPage: (l: number, o: number) => setPage(store, l, o),
      clearError: () => clearError(store),
    };
  }),

  withHooks({
    onInit(store) {
      store.loadAll();
    },
  }),
);
