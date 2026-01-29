import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Dimensions } from 'react-native';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import LottieView from 'lottie-react-native';

const { width } = Dimensions.get('window');

interface StatusModalProps {
  visible: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  onClose: () => void;
  buttonText?: string;
  children?: React.ReactNode;
}

const StatusModal = ({ visible, type, title, message, onClose, buttonText = 'Mengerti', children }: StatusModalProps) => {
  if (!visible) return null;

  const configs = {
    success: {
      icon: CheckCircle,
      color: '#10b981',
      bg: 'bg-emerald-50',
      btn: 'bg-emerald-600',
      shadow: 'shadow-emerald-200'
    },
    error: {
      icon: XCircle,
      color: '#ef4444',
      bg: 'bg-red-50',
      btn: 'bg-red-600',
      shadow: 'shadow-red-200'
    },
    warning: {
      icon: AlertCircle,
      color: '#f59e0b',
      bg: 'bg-amber-50',
      btn: 'bg-amber-600',
      shadow: 'shadow-amber-200'
    },
    info: {
      icon: Info,
      color: '#3b82f6',
      bg: 'bg-blue-50',
      btn: 'bg-blue-600',
      shadow: 'shadow-blue-200'
    }
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View 
          entering={ZoomIn.duration(300)}
          className="bg-white w-[85%] rounded-[40px] p-8 items-center shadow-2xl"
        >
          {/* Animated Icon Container */}
          <View className={`${config.bg} w-28 h-28 rounded-full items-center justify-center mb-6 overflow-hidden`}>
             {type === 'success' ? (
                <LottieView
                  source={require('../assets/animations/success.json')}
                  autoPlay
                  loop={false}
                  style={{ width: 140, height: 140 }}
                />
             ) : (
                <Icon size={48} color={config.color} strokeWidth={2.5} />
             )}
          </View>

          {/* Text Content */}
          <Text className="text-slate-800 font-black text-2xl mb-2 text-center tracking-tight">
            {title}
          </Text>
          <Text className="text-slate-500 text-center text-base leading-6 mb-4 px-2 font-medium">
            {message}
          </Text>

          {children && <View className="w-full mb-6">{children}</View>}

          {/* Action Button */}
          <TouchableOpacity 
            onPress={onClose}
            className={`${config.btn} w-full py-4 rounded-[24px] flex-row justify-center items-center shadow-xl ${config.shadow}`}
            activeOpacity={0.8}
          >
            <Text className="text-white font-black text-lg tracking-wider uppercase">
              {buttonText}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)', // Slate-900 with opacity
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default StatusModal;
