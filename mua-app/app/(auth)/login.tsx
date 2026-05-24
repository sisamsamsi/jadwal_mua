import React from "react";
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, Image, ActivityIndicator } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { authService } from "@/lib/supabase/auth";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Mail, Lock, Eye, EyeOff } from "lucide-react-native";
import { showAlert } from "@/lib/utils/alert";
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase/client';

WebBrowser.maybeCompleteAuthSession();


export default function Login() {
  const { control, handleSubmit, formState: { errors } } = useForm({ defaultValues: { email: "", password: "" } });
  const setSession = useAuthStore((s) => s.setSession);
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [oauthLoading, setOauthLoading] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.log("DEBUG: useForm validation errors =", JSON.stringify(errors));
    }
  }, [errors]);

  const handleOAuth = async (provider: 'google') => {
    setOauthLoading(provider);
    try {
      const redirectUrl = Linking.createURL('login');
      if (__DEV__) console.log("OAuth Redirect URL:", redirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (data?.url) {
        const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
        
        if (res.type === 'success' && res.url) {
          // Parse access_token from hash fragment (#) or query string (?)
          const hashIndex = res.url.indexOf('#');
          const tokenString = hashIndex >= 0 
            ? res.url.slice(hashIndex + 1) 
            : res.url.split('?')[1] ?? '';
            
          const params = new URLSearchParams(tokenString);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (sessionError) throw sessionError;
          }
        }
      }
    } catch (e: any) {
      showAlert("Login Gagal", e.message ?? String(e));
    } finally {
      setOauthLoading(null);
    }
  };


  async function onSubmit(data: any) {
    console.log("DEBUG: onSubmit called with email =", data.email);
    setIsLoading(true);
    try {
      const res = await authService.signIn(data.email, data.password);
      console.log("DEBUG: signIn success, res.session =", !!res?.session);
      if (res?.session) {
        setSession(res.session);
        // Redirect dihandle oleh _layout.tsx via onAuthStateChange
        // Tidak perlu router.replace di sini — mencegah triple redirect race condition
      } else {
        console.log("DEBUG: signIn success but no session returned");
      }
    } catch (e: any) {
      console.error("DEBUG: signIn failed with error =", e);
      showAlert("Login Gagal", e.message ?? String(e));
    } finally {
      setIsLoading(false);
    }
  }

  const handleForgotPassword = () => {
    router.push("/(auth)/forgot-password" as any);
  };


  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, padding: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="mt-10 mb-10">
            <Text className="text-4xl font-bold text-text-primary mb-3">Selamat Datang</Text>
            <Text className="text-lg text-text-secondary leading-6">Masuk ke akun MUA kamu untuk mengelola jadwal dan klien.</Text>
          </View>

          <View className="space-y-4">
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Email"
                  placeholder="nama@email.com"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon={<Mail size={20} color="#9CA3AF" />}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Password"
                  placeholder="••••••••"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry={!showPassword}
                  leftIcon={<Lock size={20} color="#9CA3AF" />}
                  rightIcon={
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      {showPassword ? (
                        <EyeOff size={20} color="#9CA3AF" />
                      ) : (
                        <Eye size={20} color="#9CA3AF" />
                      )}
                    </TouchableOpacity>
                  }
                />
              )}
            />

            <TouchableOpacity 
              className="items-end" 
              onPress={handleForgotPassword}
            >
              <Text className="text-primary font-semibold text-base">Lupa Password?</Text>
            </TouchableOpacity>
          </View>

          <View className="mt-10">
            <Button 
              label="Masuk Ke Aplikasi" 
              onPress={() => {
                console.log("DEBUG: Masuk Ke Aplikasi button pressed!");
                handleSubmit(onSubmit)();
              }} 
              loading={isLoading}
              className="h-14 rounded-2xl"
            />
          </View>

          <View className="mt-8">
            <View className="flex-row items-center mb-6">
              <View className="flex-1 h-[1] bg-divider" />
              <Text className="mx-4 text-text-hint text-sm">Atau masuk dengan</Text>
              <View className="flex-1 h-[1] bg-divider" />
            </View>

            <View className="flex-col gap-3">
              {/* Google */}
              <TouchableOpacity 
                onPress={() => handleOAuth('google')}
                disabled={oauthLoading !== null}
                className={`flex-row items-center justify-center bg-surface border border-divider h-14 rounded-2xl shadow-sm ${oauthLoading === 'google' ? 'opacity-70' : 'opacity-100'}`}
              >
                <Image 
                  source={require("@/assets/images/google-logo.png")}
                  style={{ width: 24, height: 24, marginRight: 12 }}
                />
                {oauthLoading === 'google' ? (
                  <ActivityIndicator color="#4B5563" className="mr-2" />
                ) : null}
                <Text className="text-text-primary font-semibold text-base">
                  {oauthLoading === 'google' ? 'Menghubungkan...' : 'Masuk dengan Google'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-row items-center justify-center mt-10">
            <Text className="text-text-secondary text-base">Belum punya akun? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/register" as any)}>
              <Text className="text-primary font-bold text-base">Daftar Sekarang</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

