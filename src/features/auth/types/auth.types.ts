import { UserRole } from "@/types/roles";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  isRestaurantUser?: boolean; 
  first_name?: string;
  last_name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}