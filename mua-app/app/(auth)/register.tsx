import React from "react";
import { View, Text, TextInput, Button } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { authService } from "@/lib/supabase/auth";
import { useRouter } from "expo-router";

export default function Register() {
  const { control, handleSubmit } = useForm({ defaultValues: { email: "", password: "", fullName: "" } });
  const router = useRouter();

  async function onSubmit(data: any) {
    try {
      await authService.signUp(data.email, data.password, data.fullName);
      alert("Registrasi berhasil. Silakan cek email untuk verifikasi jika diperlukan.");
      router.replace("/(auth)/login");
    } catch (e: any) {
      console.warn("Register failed", e.message ?? e);
      alert("Register failed: " + (e.message ?? String(e)));
    }
  }

  return (
    <View style={{ flex: 1, padding: 16, justifyContent: "center" }}>
      <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: 24 }}>Daftar</Text>

      <Controller
        control={control}
        name="fullName"
        render={({ field: { onChange, value } }) => (
          <TextInput
            placeholder="Nama lengkap"
            value={value}
            onChangeText={onChange}
            style={{ borderWidth: 1, padding: 8, marginBottom: 12, borderRadius: 6 }}
          />
        )}
      />

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <TextInput
            placeholder="Email"
            value={value}
            onChangeText={onChange}
            style={{ borderWidth: 1, padding: 8, marginBottom: 12, borderRadius: 6 }}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, value } }) => (
          <TextInput
            placeholder="Password"
            value={value}
            onChangeText={onChange}
            secureTextEntry
            style={{ borderWidth: 1, padding: 8, marginBottom: 12, borderRadius: 6 }}
          />
        )}
      />

      <Button title="Daftar" onPress={handleSubmit(onSubmit)} />
    </View>
  );
}

