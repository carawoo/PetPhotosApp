import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useEffect } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import LoginScreen from './src/screens/LoginScreen';
import { PostProvider } from './src/contexts/PostContext';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return currentUser ? <AppNavigator /> : <LoginScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <PostProvider>
        <StatusBar style="dark" />
        <AppContent />
      </PostProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
