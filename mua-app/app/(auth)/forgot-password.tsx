import React, { useState } from "react";
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Mail, ChevronLeft } from "lucide-react-native";
import { authService } from "@/lib/supabase/auth";
import { showAlert } from "@/lib/utils/alert";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      showAlert("Error", "Silakan masukkan alamat email Anda.");
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPasswordForEmail(email);
      showAlert("Berhasil", "Link untuk mengatur ulang password telah dikirim ke email Anda.");
      router.back();
    } catch (error: any) {
      showAlert("Gagal", error.message || "Gagal mengirim link reset password.");
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
          <TouchableOpacity onPress={() => router.back()} className="mb-8">
            <ChevronLeft size={28} color="#2D2D2D" />
          </TouchableOpacity>

          <View className="mb-10">
            <Text className="text-4xl font-bold text-text-primary mb-3">Lupa Password</Text>
            <Text className="text-lg text-text-secondary leading-6">Masukkan email yang terdaftar. Kami akan mengirimkan link untuk mereset password Anda.</Text>
          </View>

          <View className="space-y-4">
            <Input
              label="Email"
              placeholder="nama@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Mail size={20} color="#9CA3AF" />}
            />
          </View>

          <View className="mt-10">
            <Button 
              label="Kirim Link Reset" 
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
