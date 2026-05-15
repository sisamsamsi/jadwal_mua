import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Lock, Crown } from "lucide-react-native";
import { useSubscription } from "@/lib/hooks/use-subscription";

interface PremiumGateProps {
  children: React.ReactNode;
  /** Nama fitur yang ditampilkan di overlay, misal "Web Booking Link" */
  featureName?: string;
  /** Jika true, render overlay di atas konten. Jika false, sembunyikan konten sepenuhnya. Default: false */
  showOverlay?: boolean;
}

/**
 * Komponen pembatas fitur premium.
 * - Jika user adalah premium: render children seperti biasa.
 * - Jika user adalah trial: tampilkan banner/overlay upgrade.
 *
 * Contoh penggunaan:
 * <PremiumGate featureName="Web Booking Link">
 *   <BookingLinkCard />
 * </PremiumGate>
 */
export function PremiumGate({ children, featureName = "Fitur ini", showOverlay = false }: PremiumGateProps) {
  const { isPremium, isLoading } = useSubscription();
  const router = useRouter();

  if (isLoading) return null;
  if (isPremium) return <>{children}</>;

  if (showOverlay) {
    return (
      <View style={{ position: "relative" }}>
        <View style={{ opacity: 0.3, pointerEvents: "none" }}>
          {children}
        </View>
        <View
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(255,255,255,0.85)",
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <View
            style={{
              width: 48, height: 48,
              borderRadius: 24,
              backgroundColor: "#B76E7920",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 10,
            }}
          >
            <Lock size={22} color="#B76E79" />
          </View>
          <Text style={{ fontWeight: "bold", color: "#1F2937", fontSize: 15, textAlign: "center", marginBottom: 4 }}>
            {featureName}
          </Text>
          <Text style={{ color: "#6B7280", fontSize: 12, textAlign: "center", marginBottom: 14 }}>
            Tersedia untuk pengguna Premium
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/settings/subscription" as any)}
            style={{
              backgroundColor: "#B76E79",
              paddingHorizontal: 20,
              paddingVertical: 9,
              borderRadius: 20,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Crown size={14} color="white" style={{ marginRight: 6 }} />
            <Text style={{ color: "white", fontWeight: "bold", fontSize: 13 }}>Upgrade ke Premium</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Mode banner: tampilkan card pengganti tanpa overlay
  return (
    <View
      style={{
        backgroundColor: "#FFF9F9",
        borderWidth: 1,
        borderColor: "#B76E7930",
        borderRadius: 16,
        padding: 20,
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: 48, height: 48,
          borderRadius: 24,
          backgroundColor: "#B76E7915",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 10,
        }}
      >
        <Lock size={22} color="#B76E79" />
      </View>
      <Text style={{ fontWeight: "bold", color: "#1F2937", fontSize: 15, textAlign: "center", marginBottom: 4 }}>
        {featureName}
      </Text>
      <Text style={{ color: "#6B7280", fontSize: 12, textAlign: "center", marginBottom: 14 }}>
        Fitur ini hanya tersedia untuk pengguna Premium.{"\n"}Upgrade sekarang untuk mengaktifkannya.
      </Text>
      <TouchableOpacity
        onPress={() => router.push("/settings/subscription" as any)}
        style={{
          backgroundColor: "#B76E79",
          paddingHorizontal: 20,
          paddingVertical: 9,
          borderRadius: 20,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Crown size={14} color="white" style={{ marginRight: 6 }} />
        <Text style={{ color: "white", fontWeight: "bold", fontSize: 13 }}>Upgrade ke Premium</Text>
      </TouchableOpacity>
    </View>
  );
}
