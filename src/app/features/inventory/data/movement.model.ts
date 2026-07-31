export type MovementType = 'ENTRADA' | 'SALIDA' | 'AJUSTE';
export type ReferenceType = 'PURCHASE' | 'SALE' | 'MANUAL';

export interface Movement {
  id: number;
  bookId: number;
  bookTitle: string;
  movementType: MovementType;
  quantity: number;
  reason: string | null;
  referenceType: ReferenceType;
  referenceId: number | null;
  createdAt: string;
  createdBy: string | null;
}

export interface MovementCreateRequest {
  bookId: number;
  movementType: MovementType;
  quantity: number;
  reason: string;
}

export interface MovementSearchParams {
  bookId?: number | null;
  type?: MovementType | null;
  from?: string;
  to?: string;
}
