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

function AppContent() {
  const { currentUser, loading, useFirebase } = useAuth();
  const [isAdminRoute, setIsAdminRoute] = useState(false);
  const [isPublicRoute, setIsPublicRoute] = useState(false);

  useEffect(() => {
    // 웹에서만 경로 체크
    if (Platform.OS === 'web') {
      const pathname = window.location.pathname;
      const isAdmin = pathname === '/admin' || pathname === '/admin/';
      // 프로필 경로는 로그인 없이도 접근 가능 (공개 경로)
      const isPublic = pathname.startsWith('/profile/');
      console.log('🔍 Route check:', { pathname, isAdmin, isPublic, Platform: Platform.OS });
      setIsAdminRoute(isAdmin);
      setIsPublicRoute(isPublic);
    }

    // Firestore 상태 로그
    console.log('🔥 Firestore status:', useFirebase ? '✅ ENABLED' : '📦 localStorage only');
  }, []);

  console.log('🎯 AppContent render:', {
    isAdminRoute,
    isPublicRoute,
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

  // 비회원도 피드를 볼 수 있도록 항상 AppNavigator 렌더링
  // 로그인이 필요한 기능은 각 화면에서 체크
  console.log('🏠 Rendering AppNavigator:', currentUser ? 'logged in' : 'guest mode');
  return <AppNavigator />;
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
