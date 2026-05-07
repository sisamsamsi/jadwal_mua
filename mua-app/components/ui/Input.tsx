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
    <View className={cn("w-full mb-5", className)}>
      {label && (
        <Text className="text-text-secondary text-sm font-semibold mb-2 ml-1">
          {label}
        </Text>
      )}
      <View
        className={cn(
          "flex-row items-center bg-white border border-divider rounded-2xl px-4 min-h-[56px]",
          error && "border-status-error",
          props.editable === false && "bg-neutral-background opacity-60"
        )}
      >
        {leftIcon && <View className="mr-3">{leftIcon}</View>}
        <TextInput
          className="flex-1 text-text-primary text-base py-3.5"
          placeholderTextColor="#9CA3AF"
          textAlignVertical="center"
          {...props}
          style={[{ includeFontPadding: false }, props.style]}
        />
        {rightIcon && <View className="ml-2">{rightIcon}</View>}
      </View>
      {error && (
        <Text className="text-status-error text-xs mt-1.5 ml-1 font-medium">{error}</Text>
      )}
    </View>
  );
}
