import React from "react";
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { authService } from "@/lib/supabase/auth";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Mail, Lock, Eye, EyeOff } from "lucide-react-native";
import { showAlert } from "@/lib/utils/alert";


export default function Login() {
  const { control, handleSubmit } = useForm({ defaultValues: { email: "", password: "" } });
  const setSession = useAuthStore((s) => s.setSession);
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [oauthLoading, setOauthLoading] = React.useState<string | null>(null);

  const handleOAuth = async (provider: 'google' | 'facebook') => {
    showAlert(
      "Fitur Segera Hadir",
      `Login via ${provider === 'google' ? 'Google' : 'Facebook'} sedang dalam tahap konfigurasi keamanan. Untuk saat ini, silakan gunakan Email & Password.`
    );
  };


  async function onSubmit(data: any) {
    setIsLoading(true);
    try {
      const res = await authService.signIn(data.email, data.password);
      if (res?.session) {
        setSession(res.session);
        // Redirect dihandle oleh _layout.tsx via onAuthStateChange
        // Tidak perlu router.replace di sini — mencegah triple redirect race condition
      }
    } catch (e: any) {
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
        behavior={Platform.OS === "ios" ? "padding" : "height"}
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
              onPress={handleSubmit(onSubmit)} 
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
                className="flex-row items-center justify-center bg-surface border border-divider h-14 rounded-2xl shadow-sm opacity-60"
              >
                <View className="w-7 h-7 rounded-full items-center justify-center mr-3" style={{ backgroundColor: '#EA4335' }}>
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 13 }}>G</Text>
                </View>
                <Text className="text-text-primary font-semibold text-base">
                  Google (Coming Soon)
                </Text>
              </TouchableOpacity>

              {/* Facebook */}
              <TouchableOpacity 
                onPress={() => handleOAuth('facebook')}
                className="flex-row items-center justify-center h-14 rounded-2xl opacity-60"
                style={{ backgroundColor: '#1877F2' }}
              >
                <View className="w-7 h-7 bg-white rounded-full items-center justify-center mr-3">
                  <Text style={{ color: '#1877F2', fontWeight: 'bold', fontSize: 14 }}>f</Text>
                </View>
                <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
                  Facebook (Coming Soon)
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

