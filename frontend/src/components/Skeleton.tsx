import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  style?: ViewStyle;
  variant?: 'box' | 'circle' | 'text';
}

const Skeleton = ({ width, height, style, variant = 'box' }: SkeletonProps) => {
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
    if (variant === 'circle') return typeof width === 'number' ? width / 2 : 100;
    if (variant === 'text') return 4;
    return 12; // default rounded-xl
  };

  return (
    <Animated.View
      style={[
        {
          opacity,
          width: width,
          height: height,
          backgroundColor: '#cbd5e1', // slate-300
          borderRadius: getBorderRadius(),
        },
        style,
      ]}
    />
  );
};

export default Skeleton;
