import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  Category, 
  CreateCategoryPayload, 
  UpdateCategoryPayload,
  CategoryWithProducts 
} from '../../core/models/category.model';
import { PaginatedResult } from '../../core/models/product.model';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/inventory/categories`;

  getAll(params: { limit: number; offset: number; search?: string }): Observable<PaginatedResult<CategoryWithProducts>> {
    let httpParams = new HttpParams()
      .set('limit', params.limit.toString())
      .set('offset', params.offset.toString());

    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }

    return this.http.get<PaginatedResult<CategoryWithProducts>>(this.API_URL, { params: httpParams });
  }

  create(payload: CreateCategoryPayload): Observable<Category> {
    return this.http.post<Category>(this.API_URL, payload);
  }

  update(id: number, payload: UpdateCategoryPayload): Observable<Category> {
    return this.http.patch<Category>(`${this.API_URL}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
