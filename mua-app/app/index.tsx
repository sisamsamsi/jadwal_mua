import React from "react";
import { View, ActivityIndicator } from "react-native";

// Halaman index hanya menampilkan spinner.
// Navigasi (redirect ke /login atau /home) sepenuhnya dihandle oleh _layout.tsx
// via onAuthStateChange. Ini mencegah triple redirect race condition.
export default function Index() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FAF7F5" }}>
      <ActivityIndicator size="large" color="#B76E79" />
    </View>
  );
}
