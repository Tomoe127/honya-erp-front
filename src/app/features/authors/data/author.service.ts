import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response.model';
import { Page } from '../../../core/models/page.model';
import { Author, AuthorRequest } from './author.model';

@Injectable({ providedIn: 'root' })
export class AuthorService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/authors';

  list(page: number, size: number): Observable<ApiResponse<Page<Author>>> {
    return this.http.get<ApiResponse<Page<Author>>>(this.baseUrl, {
      params: { page, size },
    });
  }

  create(request: AuthorRequest): Observable<ApiResponse<Author>> {
    return this.http.post<ApiResponse<Author>>(this.baseUrl, request);
  }

  update(id: number, request: AuthorRequest): Observable<ApiResponse<Author>> {
    return this.http.put<ApiResponse<Author>>(`${this.baseUrl}/${id}`, request);
  }
}
