import { Category } from './product.model';

export type { Category };

export interface CreateCategoryPayload {
  name: string;
  description?: string;
}

export type UpdateCategoryPayload = Partial<CreateCategoryPayload>;

export interface CategoryWithProducts extends Category {
  _count?: {
    products: number;
  };
}
