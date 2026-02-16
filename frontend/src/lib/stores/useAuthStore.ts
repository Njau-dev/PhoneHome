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
  hasHydrated: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string, phone_number?: string) => Promise<void>;
  logout: () => Promise<void>;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  updateUser: (userData: Partial<User>) => void;
  setHasHydrated: (value: boolean) => void;
}

const setAuthCookie = (token: string) => {
  if (typeof document === "undefined") return;
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  document.cookie = `${STORAGE_KEYS.TOKEN}=${encodeURIComponent(token)}; Path=/; SameSite=Lax${secure}`;
};

const clearAuthCookie = () => {
  if (typeof document === "undefined") return;
  document.cookie = `${STORAGE_KEYS.TOKEN}=; Path=/; Max-Age=0; SameSite=Lax`;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      hasHydrated: false,

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
          setAuthCookie(token);
          
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
          setAuthCookie(token);
          
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
          clearAuthCookie();
          
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
        setAuthCookie(token);
      },

      clearAuth: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        clearAuthCookie();
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...userData };
          set({ user: updatedUser });
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
        }
      },

      setHasHydrated: (value: boolean) => {
        set({ hasHydrated: value });
      },
    }),
    {
      name: STORAGE_KEYS.AUTH,
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
