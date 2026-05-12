import React, { useState } from "react";
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Lock, Eye, EyeOff } from "lucide-react-native";
import { authService } from "@/lib/supabase/auth";
import { showAlert } from "@/lib/utils/alert";

export default function ResetPassword() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      showAlert("Error", "Silakan lengkapi semua kolom.");
      return;
    }

    if (password !== confirmPassword) {
      showAlert("Error", "Password tidak cocok.");
      return;
    }

    if (password.length < 6) {
      showAlert("Error", "Password harus terdiri dari minimal 6 karakter.");
      return;
    }

    setIsLoading(true);
    try {
      await authService.updateUserPassword(password);
      showAlert("Berhasil", "Password Anda telah berhasil diubah.");
      router.replace("/(auth)/login");
    } catch (error: any) {
      showAlert("Gagal", error.message || "Gagal mengubah password.");
    } finally {
      setIsLoading(false);
    }
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
            <Text className="text-4xl font-bold text-text-primary mb-3">Password Baru</Text>
            <Text className="text-lg text-text-secondary leading-6">Silakan masukkan password baru Anda.</Text>
          </View>

          <View className="space-y-4">
            <Input
              label="Password Baru"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
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

            <Input
              label="Konfirmasi Password Baru"
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              leftIcon={<Lock size={20} color="#9CA3AF" />}
              rightIcon={
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? (
                    <EyeOff size={20} color="#9CA3AF" />
                  ) : (
                    <Eye size={20} color="#9CA3AF" />
                  )}
                </TouchableOpacity>
              }
            />
          </View>

          <View className="mt-10">
            <Button 
              label="Simpan Password Baru" 
              onPress={handleResetPassword} 
              loading={isLoading}
              className="h-14 rounded-2xl"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
