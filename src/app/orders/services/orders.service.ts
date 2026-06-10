import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Order,
  OrderFilterParams,
  OrderStatus,
  PaginatedResult,
  PaginationParams,
  CreateOrderPayload,
} from '../../core/models/order.model';
import { buildHttpParams } from '../../core/utils/build-http-params';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/orders`;

  createOrder(payload: CreateOrderPayload): Observable<Order> {
    return this.http.post<Order>(this.API_URL, payload);
  }

  getAllOrders(
    filters: OrderFilterParams,
  ): Observable<PaginatedResult<Order>> {
    const params = buildHttpParams(filters);
    return this.http.get<PaginatedResult<Order>>(this.API_URL, { params });
  }

  getMyOrders(
    pagination: PaginationParams,
  ): Observable<PaginatedResult<Order>> {
    const params = buildHttpParams(pagination);
    return this.http.get<PaginatedResult<Order>>(
      `${this.API_URL}/my-orders`,
      { params },
    );
  }

  updateOrderStatus(
    id: number,
    status: OrderStatus,
  ): Observable<Order> {
    return this.http.patch<Order>(
      `${this.API_URL}/${id}/status`,
      { status },
    );
  }

  cancelOrder(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}/cancel`);
  }
}

