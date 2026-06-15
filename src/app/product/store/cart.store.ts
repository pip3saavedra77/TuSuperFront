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

const CART_STORAGE_KEY = 'tusuper_cart';

function loadCartFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item: any) =>
        item?.product?.id != null &&
        typeof item.quantity === 'number' &&
        item.quantity > 0,
    );
  } catch {
    return [];
  }
}

function saveCartToStorage(items: CartItem[]): void {
  try {
    if (items.length === 0) {
      localStorage.removeItem(CART_STORAGE_KEY);
    } else {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  } catch {
    // quota exceeded or private browsing — silently ignore
  }
}

/**
 * Root-level SignalStore — persists across navigation and localStorage.
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
  withState<CartState>({
    ...initialState,
    items: loadCartFromStorage(),
  }),

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
      let next: CartItem[];

      if (idx >= 0) {
        if (items[idx].quantity >= product.stock) return;
        next = items.map((item, j) =>
          j === idx ? { ...item, quantity: item.quantity + 1 } : item,
        );
      } else if (product.stock > 0) {
        next = [...items, { product, quantity: 1 }];
      } else {
        return;
      }

      patchState(store, { items: next });
      saveCartToStorage(next);
    },

    removeItem(productId: number): void {
      const next = store.items().filter(i => i.product.id !== productId);
      patchState(store, { items: next });
      saveCartToStorage(next);
    },

    updateQuantity(productId: number, quantity: number): void {
      let next: CartItem[];
      if (quantity <= 0) {
        next = store.items().filter(i => i.product.id !== productId);
      } else {
        next = store.items().map(i =>
          i.product.id === productId
            ? { ...i, quantity: Math.min(quantity, i.product.stock) }
            : i,
        );
      }
      patchState(store, { items: next });
      saveCartToStorage(next);
    },

    clearCart(): void {
      patchState(store, { items: [], error: null, isOpen: false });
      saveCartToStorage([]);
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
