import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, View } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils/cn";

const buttonVariants = cva(
  "flex-row items-center justify-center rounded-xl px-4 py-3 active:opacity-80",
  {
    variants: {
      variant: {
        primary: "bg-primary",
        secondary: "bg-secondary",
        outline: "bg-transparent border border-primary",
        ghost: "bg-transparent",
        danger: "bg-status-error",
      },
      size: {
        sm: "py-2 px-3",
        md: "py-3 px-4",
        lg: "py-4 px-6",
        icon: "p-3 w-12 h-12",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

const textVariants = cva("font-semibold text-center", {
  variants: {
    variant: {
      primary: "text-white",
      secondary: "text-white",
      outline: "text-primary",
      ghost: "text-primary",
      danger: "text-white",
    },
    size: {
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
      icon: "text-base",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});

export interface ButtonProps
  extends React.ComponentPropsWithoutRef<typeof TouchableOpacity>,
    VariantProps<typeof buttonVariants> {
  label?: string;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  textClassName?: string;
}

export function Button({
  className,
  variant,
  size,
  label,
  loading,
  leftIcon,
  rightIcon,
  textClassName,
  children,
  ...props
}: ButtonProps) {
  return (
    <TouchableOpacity
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === "outline" ? "#B76E79" : "white"} />
      ) : (
        <View className="flex-row items-center">
          {leftIcon && <View className="mr-2">{leftIcon}</View>}
          {label ? (
            <Text className={cn(textVariants({ variant, size }), textClassName)}>{label}</Text>
          ) : (
            children
          )}
          {rightIcon && <View className="ml-2">{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
}
