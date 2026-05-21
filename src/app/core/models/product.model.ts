export interface Category {
  id: number;
  name: string;
  description: string;
}

export interface ProductProvider {
  id: number;
  name: string;
  phone: string;
  email: string;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  imageUrl?: string | null;
  price: number;
  stock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category: Category;
  provider: ProductProvider;
  barcode: string | null;
}

export interface CreateProductPayload {
  name: string;
  description?: string;
  price: number;
  stock: number;
  isActive: boolean;
  categoryId: number;
  providerId: number;
  barcode?: string | null;
}

export type UpdateProductPayload = Partial<CreateProductPayload>;

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface ProductFilterParams {
  limit?: number;
  offset?: number;
  search?: string;
  categoryId?: number;
}
