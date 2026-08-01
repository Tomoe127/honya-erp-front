export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  active: boolean;
  roles: string[];
}

export interface UserCreateRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
  roleIds: number[];
}

export interface UserUpdateRequest {
  email: string;
  fullName: string;
  roleIds: number[];
}
