import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import InquiryScreen from './InquiryScreen';

export default function SettingsScreen({ navigation }) {
  const { currentUser, logout } = useAuth();
  const [showInquiryScreen, setShowInquiryScreen] = useState(false);
  const [showReportHistory, setShowReportHistory] = useState(false);

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('로그아웃 하시겠습니까?')) {
        logout();
        navigation.goBack();
      }
    } else {
      Alert.alert(
        '로그아웃',
        '로그아웃 하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '로그아웃',
            onPress: () => {
              logout();
              navigation.goBack();
            },
          },
        ]
      );
    }
  };

  const handleDeleteAccount = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('정말로 회원탈퇴 하시겠습니까?\n모든 데이터가 삭제됩니다.')) {
        // 사용자 데이터 삭제 로직
        try {
          const users = JSON.parse(localStorage.getItem('petPhotos_users') || '[]');
          const updatedUsers = users.filter(u => u.id !== currentUser.id);
          localStorage.setItem('petPhotos_users', JSON.stringify(updatedUsers));
          localStorage.removeItem('petPhotos_currentUser');
          localStorage.removeItem('petPhotos_autoLogin');
          localStorage.removeItem(`notifications_${currentUser.id}`);

          alert('회원탈퇴가 완료되었습니다.');
          logout();
          navigation.goBack();
        } catch (error) {
          alert('회원탈퇴 중 오류가 발생했습니다.');
        }
      }
    } else {
      Alert.alert(
        '회원탈퇴',
        '정말로 회원탈퇴 하시겠습니까?\n모든 데이터가 삭제됩니다.',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '탈퇴',
            style: 'destructive',
            onPress: () => {
              try {
                const users = JSON.parse(localStorage.getItem('petPhotos_users') || '[]');
                const updatedUsers = users.filter(u => u.id !== currentUser.id);
                localStorage.setItem('petPhotos_users', JSON.stringify(updatedUsers));
                localStorage.removeItem('petPhotos_currentUser');
                localStorage.removeItem('petPhotos_autoLogin');
                localStorage.removeItem(`notifications_${currentUser.id}`);

                Alert.alert('알림', '회원탈퇴가 완료되었습니다.');
                logout();
                navigation.goBack();
              } catch (error) {
                Alert.alert('오류', '회원탈퇴 중 오류가 발생했습니다.');
              }
            },
          },
        ]
      );
    }
  };

  const getReportHistory = () => {
    try {
      const allReports = [];

      // localStorage에서 신고 내역 가져오기
      const savedReports = localStorage.getItem('petPhotos_reports');
      if (savedReports) {
        const reports = JSON.parse(savedReports);
        const userReports = reports.filter(r => r.reporterId === currentUser?.id);
        allReports.push(...userReports);
      }

      return allReports;
    } catch (error) {
      console.error('Failed to load report history:', error);
      return [];
    }
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>설정</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* 계정 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>계정</Text>
          <View style={styles.infoCard}>
            <Ionicons name="person-circle-outline" size={24} color="#FF3366" />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>닉네임</Text>
              <Text style={styles.infoValue}>{currentUser?.nickname}</Text>
            </View>
          </View>
        </View>

        {/* 지원 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>지원</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setShowInquiryScreen(true)}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="chatbubble-ellipses-outline" size={22} color="#333" />
              <Text style={styles.menuText}>문의하기</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#AEAEB2" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setShowReportHistory(true)}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="flag-outline" size={22} color="#333" />
              <Text style={styles.menuText}>신고 내역</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#AEAEB2" />
          </TouchableOpacity>
        </View>

        {/* 계정 관리 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>계정 관리</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleLogout}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="log-out-outline" size={22} color="#FF9500" />
              <Text style={[styles.menuText, styles.logoutText]}>로그아웃</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#AEAEB2" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleDeleteAccount}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="trash-outline" size={22} color="#FF3B30" />
              <Text style={[styles.menuText, styles.deleteText]}>회원탈퇴</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#AEAEB2" />
          </TouchableOpacity>
        </View>

        {/* 앱 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>앱 정보</Text>
          <View style={styles.infoCard}>
            <Text style={styles.versionText}>버전 1.0.0</Text>
          </View>
        </View>
      </ScrollView>

      {/* 문의하기 모달 */}
      <Modal
        visible={showInquiryScreen}
        animationType="slide"
      >
        <InquiryScreen navigation={{ goBack: () => setShowInquiryScreen(false) }} />
      </Modal>

      {/* 신고 내역 모달 */}
      <Modal
        visible={showReportHistory}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>신고 내역</Text>
              <TouchableOpacity onPress={() => setShowReportHistory(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.reportList}>
              {getReportHistory().length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="flag-outline" size={48} color="#AEAEB2" />
                  <Text style={styles.emptyText}>신고 내역이 없습니다</Text>
                </View>
              ) : (
                getReportHistory().map((report) => (
                  <View key={report.id} style={styles.reportItem}>
                    <View style={styles.reportHeader}>
                      <Text style={styles.reportType}>
                        {report.type === 'post' ? '게시물 신고' : '댓글 신고'}
                      </Text>
                      <Text style={styles.reportDate}>
                        {new Date(report.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={styles.reportReason}>{report.reason}</Text>
                    {report.detail && (
                      <Text style={styles.reportDetail}>{report.detail}</Text>
                    )}
                    <View style={styles.reportStatus}>
                      <Text style={[
                        styles.statusBadge,
                        report.status === 'pending' && styles.statusPending,
                        report.status === 'reviewed' && styles.statusReviewed,
                        report.status === 'resolved' && styles.statusResolved,
                      ]}>
                        {report.status === 'pending' && '검토 중'}
                        {report.status === 'reviewed' && '검토 완료'}
                        {report.status === 'resolved' && '처리 완료'}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  versionText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  menuItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  logoutText: {
    color: '#FF9500',
  },
  deleteText: {
    color: '#FF3B30',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  reportList: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  reportItem: {
    backgroundColor: '#FAFBFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  reportDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  reportReason: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  reportDetail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  reportStatus: {
    marginTop: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
  },
  statusPending: {
    backgroundColor: '#FFF3CD',
    color: '#856404',
  },
  statusReviewed: {
    backgroundColor: '#D1ECF1',
    color: '#0C5460',
  },
  statusResolved: {
    backgroundColor: '#D4EDDA',
    color: '#155724',
  },
});
