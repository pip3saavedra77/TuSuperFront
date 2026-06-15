import { DestroyRef, inject } from '@angular/core';
import { signal } from '@angular/core';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { PageEvent } from '@angular/material/paginator';

interface ListStore {
  setSearch: (s: string) => void;
  setPage: (l: number, o: number) => void;
  loadAll: (p: { limit: number; offset: number; search?: string }) => void;
  limit: () => number;
  offset: () => number;
}

export function useListSearch(store: ListStore) {
  const destroyRef = inject(DestroyRef);
  const searchQuery = signal('');

  toObservable(searchQuery)
    .pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(destroyRef),
    )
    .subscribe((query) => {
      store.setSearch(query);
      store.loadAll({ limit: store.limit(), offset: 0, search: query || undefined });
    });

  return {
    searchQuery,
    onSearchInput(event: Event): void {
      const input = event.target as HTMLInputElement;
      searchQuery.set(input.value);
    },
    clearSearch(): void {
      searchQuery.set('');
    },
    onPageChange(event: PageEvent): void {
      store.setPage(event.pageSize, event.pageIndex * event.pageSize);
      store.loadAll({
        limit: event.pageSize,
        offset: event.pageIndex * event.pageSize,
        search: searchQuery().trim() || undefined,
      });
    },
  };
}
