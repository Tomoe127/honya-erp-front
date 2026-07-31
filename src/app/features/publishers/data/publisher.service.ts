import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response.model';
import { Page } from '../../../core/models/page.model';
import { Publisher, PublisherRequest } from './publisher.model';

@Injectable({ providedIn: 'root' })
export class PublisherService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/publishers';

  list(page: number, size: number): Observable<ApiResponse<Page<Publisher>>> {
    return this.http.get<ApiResponse<Page<Publisher>>>(this.baseUrl, {
      params: { page, size },
    });
  }

  create(request: PublisherRequest): Observable<ApiResponse<Publisher>> {
    return this.http.post<ApiResponse<Publisher>>(this.baseUrl, request);
  }

  update(id: number, request: PublisherRequest): Observable<ApiResponse<Publisher>> {
    return this.http.put<ApiResponse<Publisher>>(`${this.baseUrl}/${id}`, request);
  }
}
