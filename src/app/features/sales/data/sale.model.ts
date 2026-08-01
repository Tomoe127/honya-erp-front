export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'DIGITAL_WALLET';
export type SaleStatus = 'COMPLETED' | 'CANCELLED';

export interface SaleDetail {
  bookId: number;
  bookTitle: string;
  bookIsbn: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

export interface Sale {
  id: number;
  customerId: number | null;
  customerName: string | null;
  saleDate: string;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  details: SaleDetail[];
}

export interface SaleDetailCreateRequest {
  bookId: number;
  quantity: number;
  unitPrice: number | null;
  discount: number | null;
}

export interface SaleCreateRequest {
  customerId: number | null;
  paymentMethod: PaymentMethod;
  details: SaleDetailCreateRequest[];
}
