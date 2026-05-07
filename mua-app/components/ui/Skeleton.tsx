import React, { useEffect, useRef } from "react";
import { Animated, ViewProps } from "react-native";
import { cn } from "../../lib/utils/cn";

export function Skeleton({ className, ...props }: ViewProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      className={cn("bg-neutral-divider rounded-lg", className)}
      style={[{ opacity }]}
      {...props}
    />
  );
}
