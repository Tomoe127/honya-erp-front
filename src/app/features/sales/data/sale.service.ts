import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response.model';
import { Page } from '../../../core/models/page.model';
import { Sale, SaleCreateRequest } from './sale.model';

@Injectable({ providedIn: 'root' })
export class SaleService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/sales';

  list(page: number, size: number): Observable<ApiResponse<Page<Sale>>> {
    return this.http.get<ApiResponse<Page<Sale>>>(this.baseUrl, {
      params: { page, size, sort: 'id,desc' },
    });
  }

  create(request: SaleCreateRequest): Observable<ApiResponse<Sale>> {
    return this.http.post<ApiResponse<Sale>>(this.baseUrl, request);
  }

  cancel(id: number): Observable<ApiResponse<Sale>> {
    return this.http.patch<ApiResponse<Sale>>(`${this.baseUrl}/${id}/cancel`, {});
  }
}
