import { Author } from '../../authors/data/author.model';

export type BookStatus = 'ACTIVE' | 'INACTIVE';

export interface Book {
  id: number;
  isbn: string;
  title: string;
  description: string | null;
  price: number;
  costPrice: number | null;
  categoryId: number;
  categoryName: string;
  publisherId: number | null;
  publisherName: string | null;
  status: BookStatus;
  authors: Author[];
}

export interface BookCreateRequest {
  isbn: string;
  title: string;
  description: string;
  price: number;
  costPrice: number | null;
  categoryId: number;
  publisherId: number | null;
  authorIds: number[];
}

export interface BookUpdateRequest {
  title: string;
  description: string;
  price: number;
  costPrice: number | null;
  categoryId: number;
  publisherId: number | null;
  authorIds: number[];
}

export interface BookSearchParams {
  q?: string;
  categoryId?: number;
  publisherId?: number;
  authorId?: number;
  status?: BookStatus;
}
