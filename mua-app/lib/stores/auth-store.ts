import { create } from "zustand";

// Supabase types are not available in this environment; use any for now
type Session = any;
type User = any;

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set: any) => ({
  session: null,
  user: null,
  isLoading: true,
  setSession: (session) =>
    set({ session, user: session?.user ?? null, isLoading: false }),
  setLoading: (loading) => set({ isLoading: loading }),
  reset: () => set({ session: null, user: null, isLoading: false }),
}));
