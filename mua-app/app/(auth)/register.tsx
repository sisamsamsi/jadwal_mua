import React from "react";
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { authService } from "@/lib/supabase/auth";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { User, Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react-native";

export default function Register() {
  const { control, handleSubmit } = useForm({ defaultValues: { email: "", password: "", fullName: "" } });
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  async function onSubmit(data: any) {
    setIsLoading(true);
    try {
      await authService.signUp(data.email, data.password, data.fullName);
      alert("Registrasi berhasil. Silakan cek email untuk verifikasi jika diperlukan.");
      router.replace("/login");
    } catch (e: any) {
      console.warn("Register failed", e.message ?? e);
      alert("Register failed: " + (e.message ?? String(e)));
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
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-full bg-white border border-divider mb-8"
          >
            <ArrowLeft size={20} color="#1F2937" />
          </TouchableOpacity>

          <View className="mb-10">
            <Text className="text-4xl font-bold text-text-primary mb-3">Daftar Akun</Text>
            <Text className="text-lg text-text-secondary leading-6">Lengkapi data di bawah untuk mulai mengelola bisnis MUA kamu.</Text>
          </View>

          <View className="space-y-2">
            <Controller
              control={control}
              name="fullName"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Nama Lengkap"
                  placeholder="Masukkan nama lengkap"
                  value={value}
                  onChangeText={onChange}
                  leftIcon={<User size={20} color="#9CA3AF" />}
                />
              )}
            />

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
          </View>

          <View className="mt-6">
            <Button 
              label="Buat Akun Sekarang" 
              onPress={handleSubmit(onSubmit)} 
              className="h-14 rounded-2xl"
              loading={isLoading}
            />
          </View>

          <View className="flex-row items-center justify-center mt-10 mb-8">
            <Text className="text-text-secondary text-base">Sudah punya akun? </Text>
            <TouchableOpacity onPress={() => router.push("/login")}>
              <Text className="text-primary font-bold text-base">Masuk Di Sini</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
