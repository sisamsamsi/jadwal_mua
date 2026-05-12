import React, { useEffect } from "react";
import { View, Text, Modal, TouchableOpacity, Pressable, StyleSheet, Dimensions, Platform } from "react-native";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  runOnJS 
} from "react-native-reanimated";
import { useAlertStore } from "@/lib/stores/alert-store";
import { Button } from "./Button";
import { cn } from "@/lib/utils/cn";

const { width } = Dimensions.get("window");

import { AlertCircle, CheckCircle2, Trash2, Info, MessageSquare } from "lucide-react-native";

export function CustomAlert() {
  const { visible, title, message, buttons, options, hideAlert } = useAlertStore();
  
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 250 });
      scale.value = withSpring(1, { damping: 15, stiffness: 100 });
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      scale.value = withTiming(0.9, { duration: 150 });
    }
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!visible) return null;

  // Icon detection based on title or style
  const getIcon = () => {
    const t = title?.toLowerCase() || "";
    if (t.includes("sukses") || t.includes("berhasil")) return <CheckCircle2 size={48} color="#4CAF50" />;
    if (t.includes("error") || t.includes("gagal") || t.includes("tidak valid")) return <AlertCircle size={48} color="#F44336" />;
    if (t.includes("hapus") || t.includes("delete")) return <Trash2 size={48} color="#F44336" />;
    if (t.includes("konfirmasi") || t.includes("tanya")) return <Info size={48} color="#2196F3" />;
    if (t.includes("wa") || t.includes("pesan") || t.includes("whatsapp")) return <MessageSquare size={48} color="#25D366" />;
    return <Info size={48} color="#B76E79" />;
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => {
        if (options?.cancelable) hideAlert();
      }}
    >
      <View style={styles.container}>
        {/* Backdrop Overlay */}
        <Animated.View style={[styles.overlay, overlayStyle]}>
          <Pressable 
            style={{ flex: 1 }} 
            onPress={() => {
              if (options?.cancelable) hideAlert();
            }} 
          />
        </Animated.View>

        {/* Alert Content */}
        <Animated.View style={[styles.content, contentStyle]}>
          <View className="bg-white p-8 rounded-[32px] shadow-2xl w-full items-center">
            {/* Icon Header */}
            <View className="mb-4 bg-gray-50 p-4 rounded-full">
              {getIcon()}
            </View>

            {/* Title */}
            <Text className="text-2xl font-bold text-text-primary text-center mb-3">
              {title}
            </Text>
            
            {/* Message */}
            <Text className="text-base text-text-secondary text-center mb-8 leading-6 px-2">
              {message}
            </Text>

            {/* Buttons */}
            <View className={cn(
              "flex-col gap-3 w-full",
              // Hanya gunakan row-reverse jika 2 tombol dan teks pendek
              buttons.length === 2 && 
              buttons.every(b => b.text.length <= 10) && 
              "flex-row-reverse"
            )}>
              {buttons.map((btn, index) => {
                const isCancel = btn.style === 'cancel';
                const isDestructive = btn.style === 'destructive';
                const isShort = buttons.length === 2 && buttons.every(b => b.text.length <= 10);
                
                return (
                  <Button
                    key={index}
                    label={btn.text}
                    variant={isCancel ? "outline" : isDestructive ? "danger" : "primary"}
                    size={isShort ? "md" : "lg"}
                    className={cn(
                      "h-14 rounded-2xl",
                      isShort ? "flex-1" : "w-full"
                    )}
                    onPress={() => {
                      hideAlert();
                      if (btn.onPress) {
                        // Delay small for modal closing
                        setTimeout(() => btn.onPress?.(), 150);
                      }
                    }}
                  />
                );
              })}
            </View>

          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  content: {
    width: "100%",
    maxWidth: 400,
  },
});
