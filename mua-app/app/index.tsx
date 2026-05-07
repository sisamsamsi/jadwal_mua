import React from "react";
import { Redirect } from "expo-router";
import { useAuthStore } from "@/lib/stores/auth-store";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const { session, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#B76E79" />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}

