import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

export default function InquiryScreen({ navigation }) {
  const { currentUser } = useAuth();
  const [inquiries, setInquiries] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadInquiries();
  }, []);

  const loadInquiries = async () => {
    setLoading(true);
    try {
      // Firebase 사용 시
      const firebaseConfig = require('../config/firebase.config');
      if (firebaseConfig.db) {
        const firestoreService = require('../services/firestore.service');
        firestoreService.subscribeToUserInquiries(currentUser.id, (fetchedInquiries) => {
          setInquiries(fetchedInquiries);
          setLoading(false);
        });
      } else {
        // localStorage 사용 시
        const saved = localStorage.getItem('petPhotos_inquiries');
        if (saved) {
          const all = JSON.parse(saved);
          const userInquiries = all.filter(inq => inq.userId === currentUser.id);
          setInquiries(userInquiries);
        }
        setLoading(false);
      }
    } catch (error) {
      console.error('Load inquiries error:', error);
      setLoading(false);
    }
  };

  const submitInquiry = async () => {
    if (!title.trim() || !content.trim()) {
      if (Platform.OS === 'web') {
        alert('제목과 내용을 모두 입력해주세요.');
      } else {
        Alert.alert('알림', '제목과 내용을 모두 입력해주세요.');
      }
      return;
    }

    setSubmitting(true);
    try {
      const inquiryData = {
        userId: currentUser.id,
        userName: currentUser.nickname,
        title: title.trim(),
        content: content.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      // Firebase 사용 시
      const firebaseConfig = require('../config/firebase.config');
      if (firebaseConfig.db) {
        const firestoreService = require('../services/firestore.service');
        await firestoreService.createInquiry(inquiryData);
      } else {
        // localStorage 사용 시
        const saved = localStorage.getItem('petPhotos_inquiries');
        const all = saved ? JSON.parse(saved) : [];
        all.push({ ...inquiryData, id: Date.now().toString() });
        localStorage.setItem('petPhotos_inquiries', JSON.stringify(all));
      }

      setTitle('');
      setContent('');
      setShowForm(false);
      loadInquiries();

      if (Platform.OS === 'web') {
        alert('문의가 등록되었습니다.');
      } else {
        Alert.alert('완료', '문의가 등록되었습니다.');
      }
    } catch (error) {
      console.error('Submit inquiry error:', error);
      if (Platform.OS === 'web') {
        alert('문의 등록 중 오류가 발생했습니다.');
      } else {
        Alert.alert('오류', '문의 등록 중 오류가 발생했습니다.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderInquiry = ({ item }) => (
    <View style={styles.inquiryCard}>
      <View style={styles.inquiryHeader}>
        <Text style={styles.inquiryTitle}>{item.title}</Text>
        <View style={[
          styles.statusBadge,
          item.status === 'answered' && styles.statusBadgeAnswered,
        ]}>
          <Text style={[
            styles.statusText,
            item.status === 'answered' && styles.statusTextAnswered,
          ]}>
            {item.status === 'pending' ? '대기중' : '답변완료'}
          </Text>
        </View>
      </View>
      <Text style={styles.inquiryContent}>{item.content}</Text>
      {item.answer && (
        <View style={styles.answerBox}>
          <Text style={styles.answerLabel}>답변</Text>
          <Text style={styles.answerText}>{item.answer}</Text>
        </View>
      )}
      <Text style={styles.inquiryDate}>
        {new Date(item.createdAt).toLocaleDateString('ko-KR')}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>문의하기</Text>
        <TouchableOpacity onPress={() => setShowForm(!showForm)}>
          <Ionicons
            name={showForm ? 'close' : 'add'}
            size={28}
            color="#FF3366"
          />
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={styles.formContainer}>
          <TextInput
            style={styles.titleInput}
            placeholder="제목"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
          <TextInput
            style={styles.contentInput}
            placeholder="문의 내용을 입력해주세요..."
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={6}
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={submitInquiry}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>문의 등록</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF3366" />
        </View>
      ) : (
        <FlatList
          data={inquiries}
          renderItem={renderInquiry}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>등록된 문의가 없습니다</Text>
              <Text style={styles.emptySubText}>
                궁금한 사항이 있으시면 문의해주세요
              </Text>
            </View>
          }
        />
      )}
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
  formContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  titleInput: {
    fontSize: 16,
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  contentInput: {
    fontSize: 15,
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: '#FF3366',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#AEAEB2',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 20,
  },
  inquiryCard: {
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
  inquiryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  inquiryTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
    marginRight: 12,
  },
  statusBadge: {
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeAnswered: {
    backgroundColor: '#D4EDDA',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#856404',
  },
  statusTextAnswered: {
    color: '#155724',
  },
  inquiryContent: {
    fontSize: 15,
    lineHeight: 22,
    color: '#3A3A3C',
    marginBottom: 12,
  },
  answerBox: {
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  answerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF3366',
    marginBottom: 8,
  },
  answerText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1A1A1A',
  },
  inquiryDate: {
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
  emptySubText: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
  },
});
