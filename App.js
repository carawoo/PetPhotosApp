import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { PostProvider } from './src/contexts/PostContext';

export default function App() {
  return (
    <PostProvider>
      <StatusBar style="dark" />
      <AppNavigator />
    </PostProvider>
  );
}
