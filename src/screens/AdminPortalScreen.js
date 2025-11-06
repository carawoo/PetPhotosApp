import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import AdminLoginScreen from './AdminLoginScreen';
import AdminDashboardScreen from './AdminDashboardScreen';

export default function AdminPortalScreen() {
  const { adminUser, loading, adminLogin, adminLogout } = useAdminAuth();

  if (loading) {
    return <View style={styles.container} />;
  }

  if (!adminUser) {
    return <AdminLoginScreen onLogin={adminLogin} />;
  }

  return (
    <AdminDashboardScreen
      navigation={{ goBack: () => {} }}
      isWebPortal={true}
      adminLogout={adminLogout}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
});
