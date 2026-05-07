import React from "react";
import { View, TextInput, Text, TextInputProps } from "react-native";
import { cn } from "../../lib/utils/cn";

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  className,
  ...props
}: InputProps) {
  return (
    <View className={cn("w-full mb-4", className)}>
      {label && (
        <Text className="text-text-secondary text-sm font-medium mb-1.5 ml-1">
          {label}
        </Text>
      )}
      <View
        className={cn(
          "flex-row items-center bg-white border border-divider rounded-xl px-4 py-3 h-14",
          error && "border-status-error",
          props.editable === false && "bg-neutral-background opacity-60"
        )}
      >
        {leftIcon && <View className="mr-3">{leftIcon}</View>}
        <TextInput
          className="flex-1 text-text-primary text-base"
          placeholderTextColor="#BDBDBD"
          {...props}
        />
        {rightIcon && <View className="ml-3">{rightIcon}</View>}
      </View>
      {error && (
        <Text className="text-status-error text-xs mt-1 ml-1">{error}</Text>
      )}
    </View>
  );
}
