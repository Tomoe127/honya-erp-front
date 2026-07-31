export type PurchaseStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface PurchaseDetail {
  bookId: number;
  bookTitle: string;
  bookIsbn: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
}

export interface Purchase {
  id: number;
  supplierId: number;
  supplierName: string;
  purchaseDate: string;
  total: number;
  status: PurchaseStatus;
  details: PurchaseDetail[];
}

export interface PurchaseDetailCreateRequest {
  bookId: number;
  quantity: number;
  unitCost: number;
}

export interface PurchaseCreateRequest {
  supplierId: number;
  details: PurchaseDetailCreateRequest[];
}
