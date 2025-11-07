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
  const [showLoginScreen, setShowLoginScreen] = useState(false);

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

      // 로그인 요청 플래그 체크
      const requestLogin = localStorage.getItem('peto_requestLogin');
      if (requestLogin === 'true' && !currentUser) {
        setShowLoginScreen(true);
        localStorage.removeItem('peto_requestLogin');
      }
    }

    // Firestore 상태 로그
    console.log('🔥 Firestore status:', useFirebase ? '✅ ENABLED' : '📦 localStorage only');
  }, [currentUser]);

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

  // 로그인 화면 표시 (로그인 요청이 있고 비회원인 경우)
  if (showLoginScreen && !currentUser) {
    console.log('🔐 Rendering LoginScreen (requested)');
    return <LoginScreen onLoginSuccess={() => setShowLoginScreen(false)} />;
  }

  // 비회원도 피드를 볼 수 있도록 항상 AppNavigator 렌더링
  // 로그인이 필요한 기능은 각 화면에서 체크
  console.log('🏠 Rendering AppNavigator:', currentUser ? 'logged in' : 'guest mode');
  return <AppNavigator />;
}

export default function App() {
  useEffect(() => {
    // PWA에서 뒤로 스와이프 제스처 비활성화 (웹만)
    if (Platform.OS === 'web') {
      // body와 html에 overscroll-behavior 적용
      const style = document.createElement('style');
      style.innerHTML = `
        html, body {
          overscroll-behavior: none;
          overscroll-behavior-x: none;
          -webkit-overflow-scrolling: touch;
        }

        /* iOS Safari에서 pull-to-refresh 비활성화 */
        body {
          position: fixed;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        #root {
          width: 100%;
          height: 100%;
          overflow: auto;
          overscroll-behavior: none;
        }
      `;
      document.head.appendChild(style);

      // 터치 이벤트로 뒤로가기 제스처 방지
      let touchStartX = 0;
      let touchStartY = 0;

      const handleTouchStart = (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      };

      const handleTouchMove = (e) => {
        const touchEndX = e.touches[0].clientX;
        const touchEndY = e.touches[0].clientY;
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;

        // 좌우 스와이프가 상하 스와이프보다 크고, 화면 가장자리에서 시작된 경우
        if (Math.abs(diffX) > Math.abs(diffY) && (touchStartX < 50 || touchStartX > window.innerWidth - 50)) {
          e.preventDefault();
        }
      };

      document.addEventListener('touchstart', handleTouchStart, { passive: false });
      document.addEventListener('touchmove', handleTouchMove, { passive: false });

      return () => {
        document.head.removeChild(style);
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchmove', handleTouchMove);
      };
    }
  }, []);

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
