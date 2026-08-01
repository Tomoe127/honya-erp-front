import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response.model';
import { Page } from '../../../core/models/page.model';
import { Stock } from '../../inventory/data/stock.model';
import { DashboardSummary, SalesByDate, TopSellingBook } from './report.model';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/reports';

  getDashboard(): Observable<ApiResponse<DashboardSummary>> {
    return this.http.get<ApiResponse<DashboardSummary>>(`${this.baseUrl}/dashboard`);
  }

  getLowStock(page: number, size: number): Observable<ApiResponse<Page<Stock>>> {
    return this.http.get<ApiResponse<Page<Stock>>>(`${this.baseUrl}/low-stock`, {
      params: { page, size },
    });
  }

  getSalesByDate(from: string, to: string, groupBy: 'day' | 'month'): Observable<ApiResponse<SalesByDate[]>> {
    return this.http.get<ApiResponse<SalesByDate[]>>(`${this.baseUrl}/sales`, {
      params: { from, to, groupBy },
    });
  }

  getTopSellingBooks(from: string, to: string, limit: number): Observable<ApiResponse<TopSellingBook[]>> {
    return this.http.get<ApiResponse<TopSellingBook[]>>(`${this.baseUrl}/top-selling-books`, {
      params: { from, to, limit },
    });
  }
}
