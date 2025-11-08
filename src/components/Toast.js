import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Toast({ visible, message, onHide, type = 'success', duration = 3000 }) {
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (visible) {
      console.log('🎨 Toast visible:', message, 'duration:', duration);
      // Show animation
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide
      const timer = setTimeout(() => {
        console.log('⏱️ Toast hiding after', duration, 'ms');
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -20,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  if (!visible) return null;

  const iconName = type === 'success' ? 'checkmark-circle' : 'alert-circle';
  const iconColor = type === 'success' ? '#4CAF50' : '#FF3366';

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.toast,
          type === 'error' && styles.toastError,
          {
            opacity,
            transform: [{ translateY }],
          },
        ]}
      >
        <Ionicons name={iconName} size={24} color={iconColor} />
        <Text style={styles.message}>{message}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 80 : 60,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    maxWidth: 400,
    marginHorizontal: 20,
  },
  toastError: {
    borderLeftColor: '#FF3366',
  },
  message: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 12,
    flex: 1,
  },
});
