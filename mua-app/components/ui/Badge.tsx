import React from "react";
import { View, Text, ViewProps } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils/cn";

const badgeVariants = cva(
  "rounded-full px-2.5 py-0.5 items-center justify-center",
  {
    variants: {
      variant: {
        default: "bg-primary-light",
        success: "bg-status-success/10",
        warning: "bg-status-warning/10",
        error: "bg-status-error/10",
        info: "bg-status-info/10",
        outline: "bg-transparent border border-divider",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const textVariants = cva("text-[10px] font-bold uppercase", {
  variants: {
    variant: {
      default: "text-primary-dark",
      success: "text-status-success",
      warning: "text-status-warning",
      error: "text-status-error",
      info: "text-status-info",
      outline: "text-text-secondary",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface BadgeProps extends ViewProps, VariantProps<typeof badgeVariants> {
  label: string;
}

export function Badge({ label, variant, className, ...props }: BadgeProps) {
  return (
    <View className={cn(badgeVariants({ variant }), className)} {...props}>
      <Text className={cn(textVariants({ variant }))}>{label}</Text>
    </View>
  );
}
