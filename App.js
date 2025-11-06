import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useEffect } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import LoginScreen from './src/screens/LoginScreen';
import { PostProvider } from './src/contexts/PostContext';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

// 🔥 FORCE CLEANUP - 즉시 실행 (모듈 로드 시점)
if (typeof localStorage !== 'undefined') {
  const cleanupVersion = '1.0.2'; // 강제 재실행
  const lastCleanup = localStorage.getItem('lastCleanup');

  if (lastCleanup !== cleanupVersion) {
    console.log('🔥 FORCE CLEANUP: Removing corrupted localStorage data...');
    const users = localStorage.getItem('petPhotos_users');
    const currentUser = localStorage.getItem('petPhotos_currentUser');

    localStorage.clear();

    if (users) localStorage.setItem('petPhotos_users', users);
    if (currentUser) localStorage.setItem('petPhotos_currentUser', currentUser);
    localStorage.setItem('lastCleanup', cleanupVersion);

    console.log('✅ Cleanup complete!');
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
