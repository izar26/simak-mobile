import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle, View, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  style?: ViewStyle;
  variant?: 'box' | 'circle' | 'text';
  borderRadius?: number;
  className?: string; 
}

const Skeleton = ({ width, height, style, variant = 'box', borderRadius, className }: SkeletonProps) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const getBorderRadius = () => {
    if (borderRadius !== undefined) return borderRadius;
    if (variant === 'circle') return typeof width === 'number' ? width / 2 : 100;
    if (variant === 'text') return 4;
    return 12;
  };

  // Default width fallback for animation
  const width_val = typeof width === 'number' ? width : 300;

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-width_val, width_val], // We need a concrete width for better effect
  });

  return (
    <View
      style={[
        {
          width: width as any,
          height: height as any,
          backgroundColor: '#e2e8f0', // slate-200
          borderRadius: getBorderRadius(),
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [{ translateX: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [-width_val, width_val],
            }) }],
          },
        ]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.5)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
};

export default Skeleton;