import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  Provider, 
  CreateProviderPayload, 
  UpdateProviderPayload,
  ProviderWithProducts 
} from '../../core/models/provider.model';
import { PaginatedResult } from '../../core/models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProviderService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/inventory/providers`;

  getAll(params: { limit: number; offset: number; search?: string }): Observable<PaginatedResult<ProviderWithProducts>> {
    let httpParams = new HttpParams()
      .set('limit', params.limit.toString())
      .set('offset', params.offset.toString());

    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }

    return this.http.get<PaginatedResult<ProviderWithProducts>>(this.API_URL, { params: httpParams });
  }

  create(payload: CreateProviderPayload): Observable<Provider> {
    return this.http.post<Provider>(this.API_URL, payload);
  }

  update(id: number, payload: UpdateProviderPayload): Observable<Provider> {
    return this.http.patch<Provider>(`${this.API_URL}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
