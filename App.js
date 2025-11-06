import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useEffect, useState } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import LoginScreen from './src/screens/LoginScreen';
import { PostProvider } from './src/contexts/PostContext';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import { AdminAuthProvider } from './src/contexts/AdminAuthContext';
import AdminPortalScreen from './src/screens/AdminPortalScreen';

// 🔥 ONE-TIME CLEANUP - 한 번만 실행되는 강력한 cleanup
if (typeof localStorage !== 'undefined') {
  const CLEANUP_VERSION = 'v4_final';
  const lastCleanup = localStorage.getItem('lastCleanupVersion');

  if (lastCleanup !== CLEANUP_VERSION) {
    console.log('🔥 Running one-time cleanup...');

    try {
      // 사용자 정보 백업
      const users = localStorage.getItem('petPhotos_users');
      const currentUser = localStorage.getItem('petPhotos_currentUser');

      // posts 완전 삭제
      localStorage.removeItem('petPhotos_posts');

      // 빈 배열로 초기화
      localStorage.setItem('petPhotos_posts', '[]');

      // 사용자 정보 복원
      if (users) localStorage.setItem('petPhotos_users', users);
      if (currentUser) localStorage.setItem('petPhotos_currentUser', currentUser);

      // cleanup 버전 저장
      localStorage.setItem('lastCleanupVersion', CLEANUP_VERSION);

      console.log('✅ Cleanup complete! All corrupted data removed.');
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }
}

function AppContent() {
  const { currentUser, loading } = useAuth();
  const [isAdminRoute, setIsAdminRoute] = useState(false);

  useEffect(() => {
    // 웹에서만 경로 체크
    if (Platform.OS === 'web') {
      const pathname = window.location.pathname;
      const isAdmin = pathname === '/admin' || pathname === '/admin/';
      console.log('🔍 Route check:', { pathname, isAdmin, Platform: Platform.OS });
      setIsAdminRoute(isAdmin);
    }
  }, []);

  console.log('🎯 AppContent render:', {
    isAdminRoute,
    loading,
    hasCurrentUser: !!currentUser,
    Platform: Platform.OS
  });

  // 관리자 페이지 라우트
  if (Platform.OS === 'web' && isAdminRoute) {
    console.log('✅ Rendering AdminPortalScreen');
    return (
      <AdminAuthProvider>
        <AdminPortalScreen />
      </AdminAuthProvider>
    );
  }

  if (loading) {
    console.log('⏳ Showing loading screen');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF3366" />
      </View>
    );
  }

  console.log('🏠 Rendering main app:', currentUser ? 'AppNavigator' : 'LoginScreen');
  return currentUser ? <AppNavigator /> : <LoginScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <PostProvider>
          <StatusBar style="dark" />
          <AppContent />
        </PostProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFBFC',
  },
});
