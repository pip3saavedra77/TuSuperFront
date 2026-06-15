import { TestBed } from '@angular/core/testing';
import { CartStore } from './cart.store';
import { Product } from '../../core/models/product.model';

const mockProduct = (id: number, overrides: Partial<Product> = {}): Product => ({
  id,
  name: `Product ${id}`,
  description: null,
  price: 1000,
  stock: 10,
  isActive: true,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  category: { id: 1, name: 'Cat', description: '' },
  provider: { id: 1, name: 'Prov', phone: '', email: '' },
  barcode: null,
  imageUrl: null,
  ...overrides,
});

describe('CartStore', () => {
  let store: InstanceType<typeof CartStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(CartStore);
    store.clearCart();
  });

  it('should start empty', () => {
    expect(store.isEmpty()).toBe(true);
    expect(store.totalItems()).toBe(0);
    expect(store.totalAmount()).toBe(0);
  });

  it('should add an item', () => {
    const product = mockProduct(1);
    store.addItem(product);
    expect(store.items().length).toBe(1);
    expect(store.items()[0].quantity).toBe(1);
    expect(store.totalItems()).toBe(1);
  });

  it('should increment quantity when adding same product', () => {
    const product = mockProduct(1);
    store.addItem(product);
    store.addItem(product);
    expect(store.items().length).toBe(1);
    expect(store.items()[0].quantity).toBe(2);
    expect(store.totalItems()).toBe(2);
  });

  it('should not exceed stock', () => {
    const product = mockProduct(1, { stock: 2 });
    store.addItem(product);
    store.addItem(product);
    store.addItem(product);
    expect(store.items()[0].quantity).toBe(2);
  });

  it('should not add out-of-stock product', () => {
    const product = mockProduct(1, { stock: 0 });
    store.addItem(product);
    expect(store.isEmpty()).toBe(true);
  });

  it('should calculate totalAmount correctly', () => {
    store.addItem(mockProduct(1, { price: 1000 }));
    store.addItem(mockProduct(1, { price: 1000 }));
    store.addItem(mockProduct(2, { price: 500 }));
    expect(store.totalAmount()).toBe(2500);
  });

  it('should remove an item', () => {
    store.addItem(mockProduct(1));
    store.addItem(mockProduct(2));
    store.removeItem(1);
    expect(store.items().length).toBe(1);
    expect(store.items()[0].product.id).toBe(2);
  });

  it('should update quantity', () => {
    const product = mockProduct(1, { stock: 10 });
    store.addItem(product);
    store.updateQuantity(1, 5);
    expect(store.items()[0].quantity).toBe(5);
  });

  it('should remove item when quantity is zero or negative', () => {
    store.addItem(mockProduct(1));
    store.updateQuantity(1, 0);
    expect(store.isEmpty()).toBe(true);
  });

  it('should clear cart', () => {
    store.addItem(mockProduct(1));
    store.addItem(mockProduct(2));
    store.clearCart();
    expect(store.isEmpty()).toBe(true);
    expect(store.isOpen()).toBe(false);
  });

  it('should toggle cart open/close', () => {
    expect(store.isOpen()).toBe(false);
    store.toggleCart();
    expect(store.isOpen()).toBe(true);
    store.closeCart();
    expect(store.isOpen()).toBe(false);
    store.openCart();
    expect(store.isOpen()).toBe(true);
  });
});
