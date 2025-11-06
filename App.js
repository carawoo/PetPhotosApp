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
import { getStorageKey, isDevelopment } from './src/config/environment';

// 🧪 개발 환경에서 테스트 함수 로드
if (typeof window !== 'undefined' && isDevelopment()) {
  import('./src/__tests__/post.test.js').then(module => {
    window.testLocalStoragePost = module.testLocalStoragePost;
    window.testFirestorePost = module.testFirestorePost;
    window.runAllPostTests = module.runAllPostTests;
    console.log('🧪 게시물 테스트 함수 준비 완료!');
  });
}

// 🔥 ONE-TIME CLEANUP - 개발/프로덕션 환경 분리 및 데이터 초기화
if (typeof localStorage !== 'undefined') {
  const CLEANUP_VERSION = 'v6_reset_all_data';
  const lastCleanup = localStorage.getItem('lastCleanupVersion');

  if (lastCleanup !== CLEANUP_VERSION) {
    console.log('🔥 Running data cleanup for all environments...');

    try {
      const isDev = isDevelopment();
      const envLabel = isDev ? 'DEVELOPMENT' : 'PRODUCTION';

      console.log(`📍 Environment: ${envLabel}`);
      console.log(`🗂️  Storage prefix: ${isDev ? 'petPhotos_dev_' : 'petPhotos_'}`);

      // 모든 환경에서 게시물 데이터 초기화
      console.log('🧹 Clearing posts data...');

      localStorage.removeItem(getStorageKey('posts'));
      localStorage.setItem(getStorageKey('posts'), '[]');

      console.log('✅ Posts data cleared!');

      // cleanup 버전 저장
      localStorage.setItem('lastCleanupVersion', CLEANUP_VERSION);

      console.log('✅ Data cleanup complete!');
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }
}

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

  // 공개 경로이거나 로그인 되어있으면 앱 보여주기
  if (currentUser || isPublicRoute) {
    console.log('🏠 Rendering AppNavigator:', currentUser ? 'logged in' : 'public route');
    return <AppNavigator />;
  }

  console.log('🔐 Rendering LoginScreen');
  return <LoginScreen />;
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
