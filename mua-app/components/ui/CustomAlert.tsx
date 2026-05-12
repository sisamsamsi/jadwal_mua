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

export function CustomAlert() {
  const { visible, title, message, buttons, options, hideAlert } = useAlertStore();
  
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
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

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
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
          <View className="bg-white p-6 rounded-[28px] shadow-2xl w-full">
            {/* Title */}
            <Text className="text-xl font-bold text-text-primary text-center mb-2">
              {title}
            </Text>
            
            {/* Message */}
            <Text className="text-base text-text-secondary text-center mb-6 leading-6">
              {message}
            </Text>

            {/* Buttons */}
            <View className={cn(
              "flex-col gap-3",
              buttons.length === 2 && "flex-row-reverse"
            )}>
              {buttons.map((btn, index) => {
                const isCancel = btn.style === 'cancel';
                const isDestructive = btn.style === 'destructive';
                
                return (
                  <Button
                    key={index}
                    label={btn.text}
                    variant={isCancel ? "outline" : isDestructive ? "danger" : "primary"}
                    className={cn(
                      "flex-1 h-14 rounded-2xl",
                      buttons.length > 2 && "w-full"
                    )}
                    onPress={() => {
                      hideAlert();
                      if (btn.onPress) {
                        // Delay small for modal closing
                        setTimeout(() => btn.onPress?.(), 100);
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
