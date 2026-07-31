import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response.model';
import { Page } from '../../../core/models/page.model';
import { MinStockUpdateRequest, Stock } from './stock.model';

@Injectable({ providedIn: 'root' })
export class StockService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/inventory/stock';

  list(lowStockOnly: boolean, page: number, size: number): Observable<ApiResponse<Page<Stock>>> {
    const params = new HttpParams().set('lowStock', lowStockOnly).set('page', page).set('size', size);
    return this.http.get<ApiResponse<Page<Stock>>>(this.baseUrl, { params });
  }

  updateMinStock(bookId: number, request: MinStockUpdateRequest): Observable<ApiResponse<Stock>> {
    return this.http.patch<ApiResponse<Stock>>(`${this.baseUrl}/${bookId}/min-stock`, request);
  }
}
