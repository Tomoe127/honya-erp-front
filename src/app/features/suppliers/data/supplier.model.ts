export interface Supplier {
  id: number;
  name: string;
  taxId: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  active: boolean;
}

export interface SupplierCreateRequest {
  name: string;
  taxId: string;
  phone: string;
  email: string;
  address: string;
}

export interface SupplierUpdateRequest {
  name: string;
  phone: string;
  email: string;
  address: string;
}
