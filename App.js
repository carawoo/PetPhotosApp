import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useEffect } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import LoginScreen from './src/screens/LoginScreen';
import { PostProvider } from './src/contexts/PostContext';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

function AppContent() {
  const { currentUser, loading } = useAuth();

  // 손상된 데이터 클리어 (한 번만 실행)
  useEffect(() => {
    const cleanupVersion = '1.0.1'; // 버전 업데이트로 강제 재실행
    const lastCleanup = localStorage.getItem('lastCleanup');

    if (lastCleanup !== cleanupVersion) {
      console.log('🔧 Cleaning up corrupted localStorage data...');
      // 사용자 데이터만 유지하고 게시물 데이터 제거
      const users = localStorage.getItem('petPhotos_users');
      const currentUserData = localStorage.getItem('petPhotos_currentUser');

      localStorage.clear();

      if (users) {
        localStorage.setItem('petPhotos_users', users);
      }
      if (currentUserData) {
        localStorage.setItem('petPhotos_currentUser', currentUserData);
      }
      localStorage.setItem('lastCleanup', cleanupVersion);

      console.log('✅ Cleanup complete. Page will reload in 1 second...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }, []);

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
