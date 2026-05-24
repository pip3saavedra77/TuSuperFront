export interface Module {
  id: number;
  name: string;
  description: string;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  modules: Module[];
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  docType: string;
  docNumber: string;
  email: string;
  isActive: boolean;
  roles: Role[];
  avatarUrl?: string | null;
  displayName?: string | null;
  googleId?: string | null;
  isEmailVerified?: boolean;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}
