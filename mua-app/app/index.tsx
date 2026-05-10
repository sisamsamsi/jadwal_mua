import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/lib/stores/auth-store";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const { session, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (session) {
      router.replace("/home");
    } else {
      router.replace("/login");
    }
  }, [session, isLoading]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FAF7F5" }}>
      <ActivityIndicator size="large" color="#B76E79" />
    </View>
  );
}

