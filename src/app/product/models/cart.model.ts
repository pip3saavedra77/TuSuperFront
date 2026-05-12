import { Product } from '../../core/models/product.model';

export interface CartItem {
  readonly product: Product;
  readonly quantity: number;
}
