export interface SignupRequest {
  email: string;
  name: string;
  password: string;
  role?: "Admin" | "Instructor" | "Student";
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  id: number;
  email: string;
  name: string;
  role: string;
}

export interface AuthResponseWithToken extends AuthResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}
