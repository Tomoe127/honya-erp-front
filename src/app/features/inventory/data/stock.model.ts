export interface Stock {
  id: number;
  bookId: number;
  bookTitle: string;
  bookIsbn: string;
  quantity: number;
  minStock: number;
  lowStock: boolean;
}

export interface MinStockUpdateRequest {
  minStock: number;
}
