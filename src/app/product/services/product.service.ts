import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Product,
  Category,
  ProductProvider,
  CreateProductPayload,
  UpdateProductPayload,
  PaginatedResult,
  ProductFilterParams,
} from '../../core/models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/inventory/products`;
  private readonly CATEGORIES_URL = `${environment.apiUrl}/inventory/categories`;
  private readonly PROVIDERS_URL = `${environment.apiUrl}/inventory/providers`;

  getAll(filters: ProductFilterParams): Observable<PaginatedResult<Product>> {
    const params = this.buildParams(filters);
    return this.http.get<PaginatedResult<Product>>(this.API_URL, { params });
  }

  getById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.API_URL}/${id}`);
  }

  create(payload: CreateProductPayload): Observable<Product> {
    return this.http.post<Product>(this.API_URL, payload);
  }

  update(id: number, payload: UpdateProductPayload): Observable<Product> {
    return this.http.patch<Product>(`${this.API_URL}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.API_URL}/${id}`,
      { responseType: 'text' as 'json' },
    );
  }

  getCategories(): Observable<PaginatedResult<Category>> {
    const params = new HttpParams().set('limit', '999').set('offset', '0');
    return this.http.get<PaginatedResult<Category>>(this.CATEGORIES_URL, { params });
  }

  getProviders(): Observable<PaginatedResult<ProductProvider>> {
    const params = new HttpParams().set('limit', '999').set('offset', '0');
    return this.http.get<PaginatedResult<ProductProvider>>(this.PROVIDERS_URL, { params });
  }

  private buildParams(filters: ProductFilterParams): HttpParams {
    let params = new HttpParams();
    if (filters.limit !== undefined) {
      params = params.set('limit', String(filters.limit));
    }
    if (filters.offset !== undefined) {
      params = params.set('offset', String(filters.offset));
    }
    if (filters.search) {
      params = params.set('search', filters.search);
    }
    return params;
  }
}
