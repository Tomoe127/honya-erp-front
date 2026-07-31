import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response.model';
import { Page } from '../../../core/models/page.model';
import { Movement, MovementCreateRequest, MovementSearchParams } from './movement.model';

@Injectable({ providedIn: 'root' })
export class MovementService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/inventory/movements';

  list(params: MovementSearchParams, page: number, size: number): Observable<ApiResponse<Page<Movement>>> {
    let httpParams = new HttpParams().set('page', page).set('size', size).set('sort', 'id,desc');
    if (params.bookId) {
      httpParams = httpParams.set('bookId', params.bookId);
    }
    if (params.type) {
      httpParams = httpParams.set('type', params.type);
    }
    if (params.from) {
      httpParams = httpParams.set('from', params.from);
    }
    if (params.to) {
      httpParams = httpParams.set('to', params.to);
    }
    return this.http.get<ApiResponse<Page<Movement>>>(this.baseUrl, { params: httpParams });
  }

  create(request: MovementCreateRequest): Observable<ApiResponse<Movement>> {
    return this.http.post<ApiResponse<Movement>>(this.baseUrl, request);
  }
}
