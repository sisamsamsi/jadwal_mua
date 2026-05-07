import React from "react";
import { View, ViewProps, TouchableOpacity, TouchableOpacityProps } from "react-native";
import { cn } from "../../lib/utils/cn";

interface CardProps extends ViewProps {
  onPress?: () => void;
}

export function Card({ className, onPress, ...props }: CardProps) {
  const Component = onPress ? TouchableOpacity : View;
  
  return (
    <Component
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      className={cn(
        "bg-surface rounded-2xl shadow-sm border border-divider p-4",
        className
      )}
      {...props as any}
    />
  );
}

export function CardHeader({ className, ...props }: ViewProps) {
  return <View className={cn("mb-4", className)} {...props} />;
}

export function CardContent({ className, ...props }: ViewProps) {
  return <View className={cn("", className)} {...props} />;
}

export function CardFooter({ className, ...props }: ViewProps) {
  return <View className={cn("mt-4 pt-4 border-t border-divider", className)} {...props} />;
}
