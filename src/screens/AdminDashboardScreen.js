import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Platform,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

export default function AdminDashboardScreen({ navigation, isWebPortal = false, adminLogout = null }) {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('reports'); // 'reports' or 'inquiries'
  const [reports, setReports] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [adminNote, setAdminNote] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Firebase 사용 시
      const firebaseConfig = require('../config/firebase.config');
      if (firebaseConfig.db) {
        const firestoreService = require('../services/firestore.service');

        if (activeTab === 'reports') {
          firestoreService.subscribeToReports((fetchedReports) => {
            setReports(fetchedReports);
            setLoading(false);
          });
        } else {
          firestoreService.subscribeToAllInquiries((fetchedInquiries) => {
            setInquiries(fetchedInquiries);
            setLoading(false);
          });
        }
      } else {
        // localStorage 사용 시
        if (activeTab === 'reports') {
          const saved = localStorage.getItem('petPhotos_reports');
          setReports(saved ? JSON.parse(saved) : []);
        } else {
          const saved = localStorage.getItem('petPhotos_inquiries');
          setInquiries(saved ? JSON.parse(saved) : []);
        }
        setLoading(false);
      }
    } catch (error) {
      console.error('Load data error:', error);
      setLoading(false);
    }
  };

  const handleReportAction = (report) => {
    setSelectedItem(report);
    setAdminNote('');
    setShowActionModal(true);
  };

  const resolveReport = async (status) => {
    try {
      const firebaseConfig = require('../config/firebase.config');
      if (firebaseConfig.db) {
        const firestoreService = require('../services/firestore.service');
        await firestoreService.updateReportStatus(selectedItem.id, status, adminNote);
      } else {
        // localStorage 사용 시
        const saved = localStorage.getItem('petPhotos_reports');
        const all = saved ? JSON.parse(saved) : [];
        const updated = all.map(r =>
          r.id === selectedItem.id
            ? { ...r, status, adminNote, resolvedAt: new Date().toISOString() }
            : r
        );
        localStorage.setItem('petPhotos_reports', JSON.stringify(updated));
        setReports(updated);
      }

      setShowActionModal(false);
      if (Platform.OS === 'web') {
        alert('처리되었습니다.');
      } else {
        Alert.alert('완료', '처리되었습니다.');
      }
    } catch (error) {
      console.error('Resolve report error:', error);
    }
  };

  const answerInquiry = async () => {
    if (!adminNote.trim()) {
      if (Platform.OS === 'web') {
        alert('답변 내용을 입력해주세요.');
      } else {
        Alert.alert('알림', '답변 내용을 입력해주세요.');
      }
      return;
    }

    try {
      const firebaseConfig = require('../config/firebase.config');
      if (firebaseConfig.db) {
        const firestoreService = require('../services/firestore.service');
        await firestoreService.answerInquiry(selectedItem.id, adminNote, currentUser.id);
      } else {
        // localStorage 사용 시
        const saved = localStorage.getItem('petPhotos_inquiries');
        const all = saved ? JSON.parse(saved) : [];
        const updated = all.map(inq =>
          inq.id === selectedItem.id
            ? { ...inq, status: 'answered', answer: adminNote, answeredAt: new Date().toISOString(), adminId: currentUser.id }
            : inq
        );
        localStorage.setItem('petPhotos_inquiries', JSON.stringify(updated));
        setInquiries(updated);
      }

      setShowActionModal(false);
      if (Platform.OS === 'web') {
        alert('답변이 등록되었습니다.');
      } else {
        Alert.alert('완료', '답변이 등록되었습니다.');
      }
    } catch (error) {
      console.error('Answer inquiry error:', error);
    }
  };

  const renderReport = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleReportAction(item)}
    >
      <View style={styles.cardHeader}>
        <View style={[
          styles.statusBadge,
          item.status === 'resolved' && styles.statusBadgeResolved,
        ]}>
          <Text style={[
            styles.statusText,
            item.status === 'resolved' && styles.statusTextResolved,
          ]}>
            {item.status === 'pending' ? '대기중' : item.status === 'reviewed' ? '검토중' : '처리완료'}
          </Text>
        </View>
        <Text style={styles.reportType}>
          {item.type === 'post' ? '게시물' : '댓글'} 신고
        </Text>
      </View>
      <Text style={styles.cardTitle}>신고 사유: {getReasonLabel(item.reason)}</Text>
      <Text style={styles.cardContent} numberOfLines={2}>
        {item.detail || item.targetContent || '상세 설명 없음'}
      </Text>
      <View style={styles.cardFooter}>
        <Text style={styles.cardDate}>신고자: {item.reporterName}</Text>
        <Text style={styles.cardDate}>피신고자: {item.reportedUserName}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderInquiry = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        setSelectedItem(item);
        setAdminNote(item.answer || '');
        setShowActionModal(true);
      }}
    >
      <View style={styles.cardHeader}>
        <View style={[
          styles.statusBadge,
          item.status === 'answered' && styles.statusBadgeResolved,
        ]}>
          <Text style={[
            styles.statusText,
            item.status === 'answered' && styles.statusTextResolved,
          ]}>
            {item.status === 'pending' ? '대기중' : '답변완료'}
          </Text>
        </View>
      </View>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardContent} numberOfLines={2}>
        {item.content}
      </Text>
      <Text style={styles.cardDate}>작성자: {item.userName}</Text>
    </TouchableOpacity>
  );

  const getReasonLabel = (reason) => {
    const labels = {
      spam: '스팸 또는 광고',
      inappropriate: '부적절한 콘텐츠',
      harassment: '괴롭힘 또는 혐오 발언',
      violence: '폭력적인 콘텐츠',
      false_info: '허위 정보',
      other: '기타',
    };
    return labels[reason] || reason;
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        {!isWebPortal ? (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color="#333" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 28 }} />
        )}
        <Text style={styles.headerTitle}>관리자 대시보드</Text>
        {isWebPortal && adminLogout ? (
          <TouchableOpacity onPress={() => {
            if (Platform.OS === 'web') {
              if (window.confirm('로그아웃하시겠습니까?')) {
                adminLogout();
              }
            } else {
              Alert.alert('로그아웃', '로그아웃하시겠습니까?', [
                { text: '취소', style: 'cancel' },
                { text: '로그아웃', onPress: () => adminLogout() },
              ]);
            }
          }}>
            <Ionicons name="log-out-outline" size={28} color="#FF3366" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 28 }} />
        )}
      </View>

      {/* 탭 */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'reports' && styles.tabActive]}
          onPress={() => setActiveTab('reports')}
        >
          <Text style={[styles.tabText, activeTab === 'reports' && styles.tabTextActive]}>
            신고 관리
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'inquiries' && styles.tabActive]}
          onPress={() => setActiveTab('inquiries')}
        >
          <Text style={[styles.tabText, activeTab === 'inquiries' && styles.tabTextActive]}>
            문의 관리
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF3366" />
        </View>
      ) : (
        <FlatList
          data={activeTab === 'reports' ? reports : inquiries}
          renderItem={activeTab === 'reports' ? renderReport : renderInquiry}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name={activeTab === 'reports' ? 'shield-checkmark-outline' : 'chatbubbles-outline'}
                size={64}
                color="#ccc"
              />
              <Text style={styles.emptyText}>
                {activeTab === 'reports' ? '신고가 없습니다' : '문의가 없습니다'}
              </Text>
            </View>
          }
        />
      )}

      {/* 처리 모달 */}
      <Modal
        visible={showActionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowActionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowActionModal(false)}
          />
          <View style={styles.actionModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {activeTab === 'reports' ? '신고 처리' : '문의 답변'}
              </Text>
              <TouchableOpacity onPress={() => setShowActionModal(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedItem && activeTab === 'reports' ? (
                <>
                  <Text style={styles.label}>신고 사유</Text>
                  <Text style={styles.value}>{getReasonLabel(selectedItem.reason)}</Text>

                  <Text style={styles.label}>상세 내용</Text>
                  <Text style={styles.value}>{selectedItem.detail || '없음'}</Text>

                  <Text style={styles.label}>신고 대상</Text>
                  <Text style={styles.value}>{selectedItem.targetContent || '없음'}</Text>

                  <Text style={styles.label}>관리자 메모</Text>
                  <TextInput
                    style={styles.noteInput}
                    placeholder="처리 내용을 입력하세요..."
                    value={adminNote}
                    onChangeText={setAdminNote}
                    multiline
                    numberOfLines={4}
                  />

                  <View style={styles.buttonGroup}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.actionButtonReviewed]}
                      onPress={() => resolveReport('reviewed')}
                    >
                      <Text style={styles.actionButtonText}>검토중으로 표시</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.actionButtonResolved]}
                      onPress={() => resolveReport('resolved')}
                    >
                      <Text style={styles.actionButtonText}>처리 완료</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : selectedItem ? (
                <>
                  <Text style={styles.label}>제목</Text>
                  <Text style={styles.value}>{selectedItem.title}</Text>

                  <Text style={styles.label}>내용</Text>
                  <Text style={styles.value}>{selectedItem.content}</Text>

                  <Text style={styles.label}>답변</Text>
                  <TextInput
                    style={styles.noteInput}
                    placeholder="답변을 입력하세요..."
                    value={adminNote}
                    onChangeText={setAdminNote}
                    multiline
                    numberOfLines={6}
                  />

                  <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonResolved]}
                    onPress={answerInquiry}
                  >
                    <Text style={styles.actionButtonText}>답변 등록</Text>
                  </TouchableOpacity>
                </>
              ) : null}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#FF3366',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8E8E93',
  },
  tabTextActive: {
    color: '#FF3366',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeResolved: {
    backgroundColor: '#D4EDDA',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#856404',
  },
  statusTextResolved: {
    color: '#155724',
  },
  reportType: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  cardContent: {
    fontSize: 14,
    lineHeight: 20,
    color: '#3A3A3C',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3A3A3C',
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  actionModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  modalBody: {
    padding: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    marginTop: 16,
  },
  value: {
    fontSize: 14,
    color: '#3A3A3C',
    lineHeight: 20,
  },
  noteInput: {
    fontSize: 15,
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonReviewed: {
    backgroundColor: '#FFC107',
  },
  actionButtonResolved: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
