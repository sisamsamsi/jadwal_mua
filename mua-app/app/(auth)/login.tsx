import React from "react";
import { View, Text, ScrollView } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { authService } from "@/lib/supabase/auth";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Login() {
  const { control, handleSubmit, formState: { isSubmitting } } = useForm({ defaultValues: { email: "", password: "" } });
  const setSession = useAuthStore((s) => s.setSession);
  const router = useRouter();

  async function onSubmit(data: any) {
    try {
      const res = await authService.signIn(data.email, data.password);
      if (res?.session) {
        setSession(res.session);
        router.replace("/(tabs)");
      }
    } catch (e: any) {
      console.warn("Login failed", e.message ?? e);
      alert("Login failed: " + (e.message ?? String(e)));
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}>
        <View className="mb-10">
          <Text className="text-4xl font-bold text-text-primary mb-2">Selamat Datang</Text>
          <Text className="text-lg text-text-secondary">Silahkan masuk ke akun MUA kamu</Text>
        </View>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <Input
              label="Email"
              placeholder="nama@email.com"
              value={value}
              onChangeText={onChange}
              error={error?.message}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <Input
              label="Password"
              placeholder="••••••••"
              value={value}
              onChangeText={onChange}
              error={error?.message}
              secureTextEntry
            />
          )}
        />

        <Button 
          label="Masuk" 
          onPress={handleSubmit(onSubmit)} 
          loading={isSubmitting}
          className="mt-4"
        />

        <View className="flex-row items-center justify-center mt-8">
          <Text className="text-text-secondary">Belum punya akun? </Text>
          <Button 
            variant="ghost" 
            size="sm" 
            label="Daftar Sekarang" 
            onPress={() => router.push("/(auth)/register")} 
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


