import { ProductProvider } from './product.model';

export type { ProductProvider as Provider };

export interface CreateProviderPayload {
  name: string;
  phone?: string;
  email?: string;
}

export type UpdateProviderPayload = Partial<CreateProviderPayload>;

export interface ProviderWithProducts extends ProductProvider {
  _count?: {
    products: number;
  };
}
