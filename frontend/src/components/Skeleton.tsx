import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle, View } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  style?: ViewStyle;
  variant?: 'box' | 'circle' | 'text';
  borderRadius?: number;
  className?: string; // Support Tailwind classes
}

const Skeleton = ({ width, height, style, variant = 'box', borderRadius, className }: SkeletonProps) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
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
    );
    loop.start();

    return () => loop.stop();
  }, []);

  const getBorderRadius = () => {
    if (borderRadius !== undefined) return borderRadius;
    if (variant === 'circle') return typeof width === 'number' ? width / 2 : 100;
    if (variant === 'text') return 4;
    return 12; // default rounded-xl
  };

  // Helper untuk menggabungkan style dari props width/height dan tailwind className
  // Note: className handling depends on the environment (nativewind), 
  // but here we just pass it to the View if supported or ignore if not using a specific HOC.
  // Assuming the user uses 'nativewind' or similar, we might need to wrap it differently 
  // OR just trust that the parent passes style via className which is compiled to style prop.
  // BUT standard React Native View doesn't accept className directly without processing.
  // Since the project uses 'className' in other files, it likely uses NativeWind/StyledComponent.
  // However, Animated.View might need explicit handling.
  // Let's stick to style prop primarily for dimensions if passed explicitly.

  return (
    <Animated.View
      className={className} // Pass className for NativeWind to pick up if configured
      style={[
        {
          opacity,
          width: width,
          height: height,
          backgroundColor: '#cbd5e1', // slate-300 default
          borderRadius: getBorderRadius(),
        },
        style,
      ]}
    />
  );
};

export default Skeleton;