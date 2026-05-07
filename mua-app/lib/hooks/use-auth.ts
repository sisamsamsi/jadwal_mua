import { useMutation } from "@tanstack/react-query";
import { authService } from "../supabase/auth";

export function useSignIn() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authService.signIn(email, password),
  });
}

export function useSignUp() {
  return useMutation({
    mutationFn: ({
      email,
      password,
      fullName,
    }: {
      email: string;
      password: string;
      fullName?: string;
    }) => authService.signUp(email, password, fullName),
  });
}

