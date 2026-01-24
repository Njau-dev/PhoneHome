import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authAPI } from "@/lib/api/auth";
import { User } from "@/lib/types/user";
import { STORAGE_KEYS } from "@/lib/utils/constants";
import { toast } from "sonner";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string, phone_number?: string) => Promise<void>;
  logout: () => Promise<void>;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  updateUser: (userData: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authAPI.login({ email, password });
          const { token, user } = response.data;
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });

          // Store in localStorage
          localStorage.setItem(STORAGE_KEYS.TOKEN, token);
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
          
          toast.success("Login successful!");
        } catch (error) {
          set({ isLoading: false });
          const message = error instanceof Error ? error.message : "Login failed";
          toast.error(message);
          throw error;
        }
      },

      signup: async (username: string, email: string, password: string, phone_number?: string) => {
        set({ isLoading: true });
        try {
          const response = await authAPI.signup({
            username,
            email,
            password,
            phone_number,
          });
          const { token, user } = response.data;
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });

          localStorage.setItem(STORAGE_KEYS.TOKEN, token);
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
          
          toast.success("Account created successfully!");
        } catch (error) {
          set({ isLoading: false });
          const message = error instanceof Error ? error.message : "Signup failed";
          toast.error(message);
          throw error;
        }
      },

      logout: async () => {
        try {
          await authAPI.logout();
        } catch (error) {
          console.error("Logout error:", error);
        } finally {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });

          localStorage.removeItem(STORAGE_KEYS.TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER);
          localStorage.removeItem(STORAGE_KEYS.CART);
          
          toast.success("Logged out successfully");
        }
      },

      setAuth: (token: string, user: User) => {
        set({
          user,
          token,
          isAuthenticated: true,
        });
        localStorage.setItem(STORAGE_KEYS.TOKEN, token);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      },

      clearAuth: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...userData };
          set({ user: updatedUser });
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
        }
      },
    }),
    {
      name: STORAGE_KEYS.USER,
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
