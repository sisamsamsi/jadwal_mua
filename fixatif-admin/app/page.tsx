"use client";
import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn, ShieldAlert, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const hasError = params.get("error");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/admin/dashboard");
    }
  }, [status, router]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    await signIn("google");
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream">
        <Loader2 className="w-10 h-10 text-brand-rose animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-cream p-6">
      <div className="absolute top-0 left-0 w-full h-1 bg-rose-gold-gradient" />
      
      <div className="bg-white rounded-[40px] shadow-premium p-12 w-full max-w-md text-center border border-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-brand-rose-light rounded-full opacity-30 blur-2xl" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-brand-rose-gold rounded-full opacity-20 blur-2xl" />

        <div className="relative z-10">
          {/* Logo Area */}
          <div className="w-20 h-20 rounded-3xl bg-rose-gold-gradient flex items-center justify-center mx-auto mb-8 shadow-lg shadow-brand-rose/20">
            <span className="text-white font-bold text-4xl tracking-tighter">F</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-800 tracking-tight mb-2">Fixatif Admin</h1>
          <p className="text-sm font-medium text-gray-400 mb-10">Premium Subscription Management</p>

          {/* Error Message */}
          {hasError && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl p-4 mb-8 flex items-center gap-3 animate-shake">
              <ShieldAlert size={18} />
              <p className="font-medium">Akses ditolak. Hanya owner yang diizinkan.</p>
            </div>
          )}

          {/* Login Button */}
          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-4 bg-white border border-gray-100 rounded-2xl px-6 py-4 text-sm font-semibold text-gray-700 hover:bg-brand-cream hover:border-brand-rose-gold/30 transition-all duration-300 group shadow-sm"
          >
            {isLoggingIn ? (
              <Loader2 className="w-5 h-5 animate-spin text-brand-rose" />
            ) : (
              <>
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Masuk dengan Google</span>
              </>
            )}
          </button>

          <div className="mt-12 pt-8 border-t border-gray-50">
            <p className="text-[10px] text-gray-300 font-bold uppercase tracking-[0.2em]">
              Authorized Personnel Only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
