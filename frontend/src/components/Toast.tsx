import React, { useEffect } from 'react';
import { Text, View, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
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
      }, 3000); // Hilang otomatis setelah 3 detik
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  const isError = type === 'error';
  const Icon = isError ? AlertCircle : CheckCircle;
  const bgClass = isError ? 'bg-red-50' : 'bg-green-50';
  const borderClass = isError ? 'border-red-100' : 'border-green-100';
  const textClass = isError ? 'text-red-600' : 'text-green-600';
  const iconColor = isError ? '#dc2626' : '#16a34a';

  return (
    <Animated.View 
      entering={FadeInUp.springify().damping(15)}
      exiting={FadeOutUp}
      style={{
        position: 'absolute',
        top: 60, // Jarak dari atas (status bar)
        left: 20,
        right: 20,
        zIndex: 100, // Pastikan selalu di atas
        alignItems: 'center'
      }}
    >
      <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={onDismiss}
        className={`flex-row items-center px-4 py-3 rounded-2xl border shadow-sm ${bgClass} ${borderClass}`}
        style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 5,
            width: '100%'
        }}
      >
        <View className={`p-2 rounded-full mr-3 ${isError ? 'bg-red-100' : 'bg-green-100'}`}>
            <Icon size={20} color={iconColor} />
        </View>
        
        <View className="flex-1 mr-2">
            <Text className={`font-bold text-sm ${textClass}`}>
                {isError ? 'Terjadi Kesalahan' : 'Berhasil'}
            </Text>
            <Text className="text-gray-600 text-xs mt-0.5 leading-4">
                {message}
            </Text>
        </View>

        <X size={18} color="#9ca3af" />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default Toast;