import React, { useEffect } from 'react';
import { Text, View, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { FadeInUp, FadeOutUp, Layout } from 'react-native-reanimated';
import { AlertCircle, CheckCircle, X } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error';
  onDismiss: () => void;
}

const Toast = ({ visible, message, type = 'error', onDismiss }: ToastProps) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  const isError = type === 'error';
  
  // Theme Gelo (Bouncy Pill)
  const bgClass = isError ? 'bg-rose-600' : 'bg-emerald-600';
  const iconColor = 'white';

  return (
    <Animated.View 
      entering={FadeInUp.springify().damping(12).mass(0.8)}
      exiting={FadeOutUp}
      layout={Layout.springify()}
      style={{
        position: 'absolute',
        top: 60,
        left: 20,
        right: 20,
        zIndex: 9999, // Super Top
        alignItems: 'center',
      }}
    >
      <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={onDismiss}
        className={`flex-row items-center px-5 py-4 rounded-full shadow-2xl ${bgClass}`}
        style={{
            shadowColor: isError ? "#e11d48" : "#059669",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 8,
            width: '100%',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.2)'
        }}
      >
        <View className="bg-white/20 p-2 rounded-full mr-3">
            {isError ? (
                <AlertCircle size={20} color={iconColor} strokeWidth={3} />
            ) : (
                <CheckCircle size={20} color={iconColor} strokeWidth={3} />
            )}
        </View>
        
        <View className="flex-1 mr-2">
            <Text className="font-black text-white text-base tracking-tight mb-0.5">
                {isError ? 'Oops!' : 'Berhasil!'}
            </Text>
            <Text className="text-white/90 text-xs font-medium leading-4">
                {message}
            </Text>
        </View>

        <View className="bg-black/10 p-1.5 rounded-full">
            <X size={14} color="white" strokeWidth={3} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default Toast;
