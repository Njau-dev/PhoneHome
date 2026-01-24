import { apiClient } from "./client";
import { User } from "@/lib/types/user";

interface AuthResponse {
  success: boolean;
  data: {
    token: string;
    user: User;
  };
  message: string;
}

interface SignupData {
  username: string;
  email: string;
  phone_number?: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface ForgotPasswordData {
  email: string;
}

interface ResetPasswordData {
  token: string;
  password: string;
}

export const authAPI = {
  signup: async (data: SignupData): Promise<AuthResponse> => {
    return await apiClient.post("/auth/signup", data);
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    return await apiClient.post("/auth/login", data);
  },

  logout: async (): Promise<{ success: boolean; message: string }> => {
    return await apiClient.post("/auth/logout");
  },

  forgotPassword: async (data: ForgotPasswordData): Promise<{ message: string }> => {
    return await apiClient.post("/auth/forgot-password", data);
  },

  resetPassword: async (data: ResetPasswordData): Promise<{ message: string }> => {
    return await apiClient.post("/auth/reset-password", data);
  },

  getProfile: async (): Promise<{ success: boolean; data: { user: User } }> => {
    return await apiClient.get("/auth/profile");
  },

  updateProfile: async (data: Partial<User>): Promise<{ success: boolean; data: { user: User } }> => {
    return await apiClient.patch("/auth/profile", data);
  },
};
