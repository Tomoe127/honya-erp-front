export interface Customer {
  id: number;
  name: string;
  documentType: string;
  documentNumber: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  active: boolean;
}

export interface CustomerCreateRequest {
  name: string;
  documentType: string;
  documentNumber: string;
  phone: string;
  email: string;
  address: string;
}

export interface CustomerUpdateRequest {
  name: string;
  documentType: string;
  phone: string;
  email: string;
  address: string;
}
