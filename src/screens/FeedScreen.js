import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

const { width } = Dimensions.get('window');

export default function FeedScreen() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Firestore에서 게시물 실시간 구독
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(postsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching posts:', error);
      setLoading(false);
      // 데모용 데이터
      setPosts([
        {
          id: '1',
          imageUrl: 'https://via.placeholder.com/400',
          petName: '멍멍이',
          description: '오늘 산책 나왔어요!',
          likes: 42,
          comments: 8,
        },
      ]);
    });

    return () => unsubscribe();
  }, []);

  const renderPost = ({ item }) => (
    <View style={styles.postContainer}>
      {/* 헤더 */}
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Ionicons name="paw" size={20} color="#FF6B6B" />
          </View>
          <Text style={styles.petName}>{item.petName || '반려동물'}</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* 이미지 */}
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.postImage}
        resizeMode="cover"
      />

      {/* 액션 버튼들 */}
      <View style={styles.actionsContainer}>
        <View style={styles.leftActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="heart-outline" size={28} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={26} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-outline" size={26} color="#333" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity>
          <Ionicons name="bookmark-outline" size={26} color="#333" />
        </TouchableOpacity>
      </View>

      {/* 좋아요 수 */}
      <Text style={styles.likes}>좋아요 {item.likes || 0}개</Text>

      {/* 설명 */}
      {item.description && (
        <View style={styles.captionContainer}>
          <Text style={styles.caption}>
            <Text style={styles.petName}>{item.petName || '반려동물'}</Text>{' '}
            {item.description}
          </Text>
        </View>
      )}

      {/* 댓글 보기 */}
      {item.comments > 0 && (
        <TouchableOpacity>
          <Text style={styles.viewComments}>
            댓글 {item.comments}개 모두 보기
          </Text>
        </TouchableOpacity>
      )}

      {/* 시간 */}
      <Text style={styles.timestamp}>방금 전</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>로딩 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🐾 Pet Photos</Text>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={28} color="#333" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>아직 게시물이 없습니다</Text>
            <Text style={styles.emptySubText}>
              카메라로 반려동물 사진을 찍어보세요!
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  postContainer: {
    marginBottom: 16,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  petName: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  postImage: {
    width: width,
    height: width,
    backgroundColor: '#f0f0f0',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginRight: 16,
  },
  likes: {
    fontWeight: 'bold',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  captionContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  caption: {
    lineHeight: 18,
  },
  viewComments: {
    color: '#666',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  timestamp: {
    color: '#999',
    fontSize: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
});
