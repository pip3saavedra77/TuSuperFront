import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Role } from '../../core/models/auth.models';
import { 
  CreateUserPayload, 
  UpdateUserPayload, 
  User, 
  UserFilterParams, 
  UserPaginatedResult,
  UpdatePasswordPayload
} from '../../core/models/user.model';
import { buildHttpParams } from '../../core/utils/build-http-params';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/users`;

  getUsers(params: UserFilterParams): Observable<UserPaginatedResult> {
    const httpParams = buildHttpParams(params);
    return this.http.get<UserPaginatedResult>(this.apiUrl, { params: httpParams });
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  createUser(payload: CreateUserPayload): Observable<User> {
    return this.http.post<User>(this.apiUrl, payload);
  }

  updateUser(id: number, payload: UpdateUserPayload): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, payload);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  toggleStatus(id: number): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}/toggle-status`, {});
  }

  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${environment.apiUrl}/roles`);
  }

  updateMyProfile(payload: { firstName: string; lastName: string }): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/me/profile`, payload);
  }

  updateMyPassword(payload: UpdatePasswordPayload): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/me/password`, payload);
  }
}
