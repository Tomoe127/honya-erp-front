export interface Publisher {
  id: number;
  name: string;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
}

export interface PublisherRequest {
  name: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
}
