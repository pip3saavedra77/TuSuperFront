import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { ModuleModel } from '../models/module.model';
import { Observable, tap, EMPTY, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ModulesService {

  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/modules`;

  private readonly modulesSignal = signal<ModuleModel[]>([]);

  public modules = this.modulesSignal.asReadonly();

  public totalModules = computed(() => this.modulesSignal().length);

  constructor() {
    this.loadModules();
  }

  loadModules(): void {
    this.http.get<ModuleModel[]>(this.apiUrl).pipe(
      catchError((err: HttpErrorResponse) => {
        console.error(`[ModulesService] loadModules failed: ${err.status}`);
        return EMPTY;
      }),
    ).subscribe(data => {
      this.modulesSignal.set(data);
    });
  }

  createModule(newModule: ModuleModel): Observable<ModuleModel> {
    return this.http.post<ModuleModel>(this.apiUrl, newModule).pipe(
      tap((createdModule) => {
        this.modulesSignal.update(modules => [...modules, createdModule]);
      }),
    );
  }

  updateModule(id: number, updatedModule: Partial<ModuleModel>): Observable<ModuleModel> {
    return this.http.patch<ModuleModel>(`${this.apiUrl}/${id}`, updatedModule).pipe(
      tap((updatedData) => {
        this.modulesSignal.update(modules =>
          modules.map(mod => mod.id === id ? { ...mod, ...updatedData } : mod)
        );
      }),
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.modulesSignal.update(modules =>
          modules.filter(module => module.id !== id)
        );
      }),
    );
  }
}
