export interface Author {
  id: number;
  name: string;
  bio: string | null;
}

export interface AuthorRequest {
  name: string;
  bio: string;
}
