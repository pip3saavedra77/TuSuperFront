import { computed } from '@angular/core';
import {
  signalStore,
  withState,
  withComputed,
  withMethods,
  patchState,
} from '@ngrx/signals';
import { Product } from '../../core/models/product.model';
import { CartItem } from '../models/cart.model';

interface CartState {
  items: CartItem[];
  loading: boolean;
  error: string | null;
  isOpen: boolean;
}

const initialState: CartState = {
  items: [],
  loading: false,
  error: null,
  isOpen: false,
};

/**
 * Root-level SignalStore — persists across navigation.
 *
 * Complexity per operation:
 *   addItem      O(N)  findIndex + map
 *   removeItem   O(N)  filter
 *   updateQty    O(N)  map
 *   totalItems   O(N)  reduce  (computed, memoised)
 *   totalAmount  O(N)  reduce  (computed, memoised)
 *   N = distinct cart items, expected < 50
 */
export const CartStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  withComputed(store => ({
    totalItems: computed(() =>
      store.items().reduce((sum, i) => sum + i.quantity, 0),
    ),
    totalAmount: computed(() =>
      store.items().reduce(
        (sum, i) => sum + i.product.price * i.quantity,
        0,
      ),
    ),
    isEmpty: computed(() => store.items().length === 0),
  })),

  withMethods(store => ({
    addItem(product: Product): void {
      const items = store.items();
      const idx = items.findIndex(i => i.product.id === product.id);

      if (idx >= 0) {
        if (items[idx].quantity >= product.stock) return;
        const updated = items.map((item, j) =>
          j === idx ? { ...item, quantity: item.quantity + 1 } : item,
        );
        patchState(store, { items: updated });
      } else if (product.stock > 0) {
        patchState(store, {
          items: [...items, { product, quantity: 1 }],
        });
      }
    },

    removeItem(productId: number): void {
      patchState(store, {
        items: store.items().filter(i => i.product.id !== productId),
      });
    },

    updateQuantity(productId: number, quantity: number): void {
      if (quantity <= 0) {
        patchState(store, {
          items: store.items().filter(i => i.product.id !== productId),
        });
        return;
      }
      patchState(store, {
        items: store.items().map(i =>
          i.product.id === productId
            ? { ...i, quantity: Math.min(quantity, i.product.stock) }
            : i,
        ),
      });
    },

    clearCart(): void {
      patchState(store, { items: [], error: null, isOpen: false });
    },

    toggleCart(): void {
      patchState(store, { isOpen: !store.isOpen() });
    },

    openCart(): void {
      patchState(store, { isOpen: true });
    },

    closeCart(): void {
      patchState(store, { isOpen: false });
    },

    setLoading(loading: boolean): void {
      patchState(store, { loading });
    },

    setError(error: string | null): void {
      patchState(store, { error });
    },
  })),
);
