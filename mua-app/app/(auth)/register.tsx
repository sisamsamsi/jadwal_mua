import React from "react";
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { authService } from "@/lib/supabase/auth";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { User, Mail, Lock, Eye, EyeOff, ArrowLeft, Phone } from "lucide-react-native";

export default function Register() {
  const { control, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" }
  });
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const passwordValue = watch("password");

  async function onSubmit(data: any) {
    setIsLoading(true);
    try {
      await authService.signUp(data.email, data.password, data.fullName);
      Alert.alert(
        "Registrasi Berhasil! 🎉",
        "Akun kamu berhasil dibuat. Silakan masuk sekarang.",
        [{ text: "Masuk", onPress: () => router.replace("/(auth)/login" as any) }]
      );
    } catch (e: any) {
      const msg = e.message ?? String(e);
      // Terjemahkan error Supabase yang umum ke bahasa yang lebih ramah
      let friendlyMsg = msg;
      if (msg.includes("already registered")) friendlyMsg = "Email ini sudah terdaftar. Coba masuk langsung.";
      if (msg.includes("invalid email")) friendlyMsg = "Format email tidak valid.";
      Alert.alert("Registrasi Gagal", friendlyMsg);
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
            <Text className="text-lg text-text-secondary leading-6">
              Lengkapi data di bawah untuk mulai mengelola bisnis MUA kamu.
            </Text>
          </View>

          <View className="space-y-4">
            {/* Nama Lengkap */}
            <Controller
              control={control}
              name="fullName"
              rules={{ required: "Nama lengkap wajib diisi" }}
              render={({ field: { onChange, value } }) => (
                <View className="mb-4">
                  <Input
                    label="Nama Lengkap"
                    placeholder="Contoh: Siti Rahayu"
                    value={value}
                    onChangeText={onChange}
                    leftIcon={<User size={20} color="#9CA3AF" />}
                  />
                  {errors.fullName && (
                    <Text className="text-status-error text-xs mt-1 ml-1">{errors.fullName.message as string}</Text>
                  )}
                </View>
              )}
            />

            {/* Email */}
            <Controller
              control={control}
              name="email"
              rules={{
                required: "Email wajib diisi",
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Format email tidak valid" }
              }}
              render={({ field: { onChange, value } }) => (
                <View className="mb-4">
                  <Input
                    label="Email"
                    placeholder="nama@email.com"
                    value={value}
                    onChangeText={onChange}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    leftIcon={<Mail size={20} color="#9CA3AF" />}
                  />
                  {errors.email && (
                    <Text className="text-status-error text-xs mt-1 ml-1">{errors.email.message as string}</Text>
                  )}
                </View>
              )}
            />

            {/* Password */}
            <Controller
              control={control}
              name="password"
              rules={{
                required: "Password wajib diisi",
                minLength: { value: 8, message: "Password minimal 8 karakter" }
              }}
              render={({ field: { onChange, value } }) => (
                <View className="mb-4">
                  <Input
                    label="Password"
                    placeholder="Minimal 8 karakter"
                    value={value}
                    onChangeText={onChange}
                    secureTextEntry={!showPassword}
                    leftIcon={<Lock size={20} color="#9CA3AF" />}
                    rightIcon={
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff size={20} color="#9CA3AF" /> : <Eye size={20} color="#9CA3AF" />}
                      </TouchableOpacity>
                    }
                  />
                  {errors.password && (
                    <Text className="text-status-error text-xs mt-1 ml-1">{errors.password.message as string}</Text>
                  )}
                </View>
              )}
            />

            {/* Konfirmasi Password */}
            <Controller
              control={control}
              name="confirmPassword"
              rules={{
                required: "Konfirmasi password wajib diisi",
                validate: (val) => val === passwordValue || "Password tidak cocok"
              }}
              render={({ field: { onChange, value } }) => (
                <View className="mb-4">
                  <Input
                    label="Konfirmasi Password"
                    placeholder="Ulangi password kamu"
                    value={value}
                    onChangeText={onChange}
                    secureTextEntry={!showConfirm}
                    leftIcon={<Lock size={20} color="#9CA3AF" />}
                    rightIcon={
                      <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                        {showConfirm ? <EyeOff size={20} color="#9CA3AF" /> : <Eye size={20} color="#9CA3AF" />}
                      </TouchableOpacity>
                    }
                  />
                  {errors.confirmPassword && (
                    <Text className="text-status-error text-xs mt-1 ml-1">{errors.confirmPassword.message as string}</Text>
                  )}
                </View>
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
            <TouchableOpacity onPress={() => router.push("/(auth)/login" as any)}>
              <Text className="text-primary font-bold text-base">Masuk Di Sini</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
