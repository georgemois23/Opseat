import { UserRole } from "@/types/roles";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  isRestaurantUser?: boolean;
  RestaurantUserNumber?: number;
  isCourrierUser?: boolean;
  first_name?: string;
  last_name?: string;
  /**
   * How the account authenticates. "Google" for Google Sign-In accounts (no
   * password to change), "Auth" for email/password. When the backend omits
   * this we treat the account as password-based so the password form still shows.
   */
  provider?: "Google" | "Auth";
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}