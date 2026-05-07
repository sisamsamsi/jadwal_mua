import React from "react";
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { authService } from "@/lib/supabase/auth";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Mail, Lock, Eye, EyeOff } from "lucide-react-native";

export default function Login() {
  const { control, handleSubmit } = useForm({ defaultValues: { email: "", password: "" } });
  const setSession = useAuthStore((s) => s.setSession);
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  async function onSubmit(data: any) {
    setIsLoading(true);
    try {
      const res = await authService.signIn(data.email, data.password);
      if (res?.session) {
        setSession(res.session);
        router.replace("/home");
      }
    } catch (e: any) {
      console.warn("Login failed", e.message ?? e);
      alert("Login failed: " + (e.message ?? String(e)));
    } finally {
      setIsLoading(false);
    }
  }

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

            <TouchableOpacity className="items-end">
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

          <View className="flex-row items-center justify-center mt-10">
            <Text className="text-text-secondary text-base">Belum punya akun? </Text>
            <TouchableOpacity onPress={() => router.push("/register")}>
              <Text className="text-primary font-bold text-base">Daftar Sekarang</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
