import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response.model';
import { Page } from '../../../core/models/page.model';
import { Book, BookCreateRequest, BookSearchParams, BookStatus, BookUpdateRequest } from './book.model';

@Injectable({ providedIn: 'root' })
export class BookService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/books';

  search(params: BookSearchParams, page: number, size: number): Observable<ApiResponse<Page<Book>>> {
    let httpParams = new HttpParams().set('page', page).set('size', size);
    if (params.q) {
      httpParams = httpParams.set('q', params.q);
    }
    if (params.categoryId) {
      httpParams = httpParams.set('categoryId', params.categoryId);
    }
    if (params.publisherId) {
      httpParams = httpParams.set('publisherId', params.publisherId);
    }
    if (params.authorId) {
      httpParams = httpParams.set('authorId', params.authorId);
    }
    if (params.status) {
      httpParams = httpParams.set('status', params.status);
    }

    return this.http.get<ApiResponse<Page<Book>>>(this.baseUrl, { params: httpParams });
  }

  create(request: BookCreateRequest): Observable<ApiResponse<Book>> {
    return this.http.post<ApiResponse<Book>>(this.baseUrl, request);
  }

  update(id: number, request: BookUpdateRequest): Observable<ApiResponse<Book>> {
    return this.http.put<ApiResponse<Book>>(`${this.baseUrl}/${id}`, request);
  }

  updateStatus(id: number, status: BookStatus): Observable<ApiResponse<Book>> {
    return this.http.patch<ApiResponse<Book>>(`${this.baseUrl}/${id}/status`, { status });
  }
}
