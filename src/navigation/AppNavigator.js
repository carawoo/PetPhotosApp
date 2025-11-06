import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Animated, View, StyleSheet, Platform } from 'react-native';

// Screens
import FeedScreen from '../screens/FeedScreen';
import CameraScreen from '../screens/CameraScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

// 커스텀 아이콘 컴포넌트 (애니메이션 추가)
function AnimatedTabIcon({ focused, iconName, color }) {
  const scaleAnim = useRef(new Animated.Value(focused ? 1 : 0.85)).current;
  const opacityAnim = useRef(new Animated.Value(focused ? 1 : 0.6)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: focused ? 1.1 : 0.85,
        friction: 3,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: focused ? 1 : 0.6,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
        opacity: opacityAnim,
      }}
    >
      <Ionicons name={iconName} size={26} color={color} />
    </Animated.View>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color }) => {
            let iconName;

            if (route.name === 'Feed') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Camera') {
              iconName = focused ? 'camera' : 'camera-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person' : 'person-outline';
            }

            return <AnimatedTabIcon focused={focused} iconName={iconName} color={color} />;
          },
          tabBarActiveTintColor: '#FF3366',
          tabBarInactiveTintColor: '#AEAEB2',
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(10px)',
            borderTopWidth: 0.5,
            borderTopColor: 'rgba(229, 229, 234, 0.6)',
            height: 80,
            paddingBottom: 12,
            paddingTop: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 20,
          },
          tabBarItemStyle: {
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: 4,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: 4,
            marginBottom: 0,
          },
          tabBarIconStyle: {
            marginBottom: 0,
            marginTop: 0,
          },
        })}
      >
        <Tab.Screen
          name="Feed"
          component={FeedScreen}
          options={{ tabBarLabel: '피드' }}
        />
        <Tab.Screen
          name="Camera"
          component={CameraScreen}
          options={{ tabBarLabel: '촬영' }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ tabBarLabel: '프로필' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
