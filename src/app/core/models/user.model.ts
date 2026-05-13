import { Role } from './auth.models';
import { PaginatedResult, PaginationParams } from './order.model';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  roles: Role[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  roleIds: number[];
}

export interface UpdateUserPayload extends Partial<CreateUserPayload> {}

export interface UserFilterParams extends PaginationParams {
  search?: string;
}

export type UserPaginatedResult = PaginatedResult<User>;
