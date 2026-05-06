import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ModuleModel } from '../models/module.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ModulesHttpService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/modules`;

  getAll(): Observable<ModuleModel[]> {
    return this.http.get<ModuleModel[]>(this.apiUrl);
  }

  create(module: ModuleModel): Observable<ModuleModel> {
    return this.http.post<ModuleModel>(this.apiUrl, module);
  }

  update(id: number, changes: Partial<ModuleModel>): Observable<ModuleModel> {
    return this.http.patch<ModuleModel>(`${this.apiUrl}/${id}`, changes);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
