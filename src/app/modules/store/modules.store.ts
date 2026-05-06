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
import { ModulesHttpService } from '../services/modules-http.service';
import { ModuleModel } from '../models/module.model';

interface ModulesState {
  modules: ModuleModel[];
  loading: boolean;
  error: string | null;
}

const initialState: ModulesState = {
  modules: [],
  loading: false,
  error: null,
};

export const ModulesStore = signalStore(
  { providedIn: 'root' },

  withState<ModulesState>(initialState),

  withComputed(({ modules }) => ({
    totalModules: computed(() => modules().length),
    isEmpty: computed(() => modules().length === 0),
  })),

  withMethods((store) => {
    const httpService = inject(ModulesHttpService);

    return {
      loadAll: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap(() =>
            httpService.getAll().pipe(
              tap((modules) => patchState(store, { modules, loading: false })),
              catchError((err: { status: number }) => {
                patchState(store, {
                  loading: false,
                  error: `Load failed: ${String(err.status)}`,
                });
                return EMPTY;
              })
            )
          )
        )
      ),

      create: rxMethod<ModuleModel>(
        pipe(
          switchMap((newModule) =>
            httpService.create(newModule).pipe(
              tap((created) =>
                patchState(store, ({ modules }) => ({
                  modules: [...modules, created],
                }))
              ),
              catchError((err: { status: number }) => {
                patchState(store, {
                  error: `Create failed: ${String(err.status)}`,
                });
                return EMPTY;
              })
            )
          )
        )
      ),

      update: rxMethod<{ id: number; changes: Partial<ModuleModel> }>(
        pipe(
          switchMap(({ id, changes }) =>
            httpService.update(id, changes).pipe(
              tap((updated) =>
                patchState(store, ({ modules }) => ({
                  modules: modules.map((m) =>
                    m.id === id ? { ...m, ...updated } : m
                  ),
                }))
              ),
              catchError((err: { status: number }) => {
                patchState(store, {
                  error: `Update failed: ${String(err.status)}`,
                });
                return EMPTY;
              })
            )
          )
        )
      ),

      remove: rxMethod<number>(
        pipe(
          switchMap((id) =>
            httpService.delete(id).pipe(
              tap(() =>
                patchState(store, ({ modules }) => ({
                  modules: modules.filter((m) => m.id !== id),
                }))
              ),
              catchError((err: { status: number }) => {
                patchState(store, {
                  error: `Delete failed: ${String(err.status)}`,
                });
                return EMPTY;
              })
            )
          )
        )
      ),

      clearError(): void {
        patchState(store, { error: null });
      },
    };
  }),

  withHooks({
    onInit(store) {
      store.loadAll();
    },
  })
);
