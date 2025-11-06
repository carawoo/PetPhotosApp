import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { usePost } from '../contexts/PostContext';

const { width } = Dimensions.get('window');
const imageSize = width / 3 - 1;

export default function ProfileScreen() {
  const { currentUser, logout } = useAuth();
  const { posts } = usePost();

  // 현재 사용자의 게시물만 필터링
  const userPosts = posts.filter(post => post.authorId === currentUser?.id);

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          onPress: () => logout(),
          style: 'destructive',
        },
      ]
    );
  };

  const renderPost = (post) => (
    <TouchableOpacity key={post.id} style={styles.postItem}>
      <Image source={{ uri: post.imageUrl }} style={styles.postImage} />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.username}>{currentUser?.nickname || 'Anonymous'}</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={28} color="#333" />
        </TouchableOpacity>
      </View>

      {/* 프로필 정보 */}
      <View style={styles.profileSection}>
        {/* 프로필 이미지 */}
        <View style={styles.profileImageContainer}>
          <View style={styles.profileImage}>
            <Ionicons name="paw" size={40} color="#FF6B6B" />
          </View>
        </View>

        {/* 통계 */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userPosts.length}</Text>
            <Text style={styles.statLabel}>게시물</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {userPosts.reduce((sum, post) => sum + post.likes, 0)}
            </Text>
            <Text style={styles.statLabel}>좋아요</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {userPosts.reduce((sum, post) => sum + (post.comments?.length || 0), 0)}
            </Text>
            <Text style={styles.statLabel}>댓글</Text>
          </View>
        </View>
      </View>

      {/* 소개 */}
      <View style={styles.bioSection}>
        <Text style={styles.bioText}>
          반려동물 사진을 공유하는 {currentUser?.nickname} 입니다 🐾
        </Text>
        <Text style={styles.joinDate}>
          가입일: {new Date(currentUser?.createdAt).toLocaleDateString('ko-KR')}
        </Text>
      </View>

      {/* 탭 */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity style={[styles.tab, styles.activeTab]}>
          <Ionicons name="grid-outline" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Ionicons name="play-outline" size={24} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Ionicons name="bookmark-outline" size={24} color="#999" />
        </TouchableOpacity>
      </View>

      {/* 게시물 그리드 */}
      <View style={styles.postsGrid}>
        {userPosts.length > 0 ? (
          userPosts.map(post => renderPost(post))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>아직 게시물이 없습니다</Text>
            <Text style={styles.emptySubText}>
              카메라로 반려동물 사진을 찍어보세요!
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  username: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 32,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: '#FF6B6B',
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  bioSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  joinDate: {
    fontSize: 12,
    color: '#999',
  },
  actionsSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
  },
  editProfileButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  editProfileButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  shareProfileButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginTop: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#333',
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  postItem: {
    width: imageSize,
    height: imageSize,
    margin: 0.5,
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  emptyContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
