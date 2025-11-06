import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const imageSize = width / 3 - 1;

// 데모 사용자 데이터
const USER_DATA = {
  username: '반려동물 사랑',
  bio: '우리 집 귀여운 멍멍이와 냥냥이를 소개합니다 🐶🐱',
  profileImage: 'https://via.placeholder.com/150',
  postsCount: 24,
  followers: 1234,
  following: 567,
  posts: Array(12).fill(null).map((_, i) => ({
    id: String(i),
    imageUrl: 'https://via.placeholder.com/400',
  })),
};

export default function ProfileScreen() {
  const renderPost = (post) => (
    <TouchableOpacity key={post.id} style={styles.postItem}>
      <Image source={{ uri: post.imageUrl }} style={styles.postImage} />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.username}>{USER_DATA.username}</Text>
        <TouchableOpacity>
          <Ionicons name="menu-outline" size={28} color="#333" />
        </TouchableOpacity>
      </View>

      {/* 프로필 정보 */}
      <View style={styles.profileSection}>
        {/* 프로필 이미지 */}
        <View style={styles.profileImageContainer}>
          <Image
            source={{ uri: USER_DATA.profileImage }}
            style={styles.profileImage}
          />
          <TouchableOpacity style={styles.editButton}>
            <Ionicons name="camera" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* 통계 */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{USER_DATA.postsCount}</Text>
            <Text style={styles.statLabel}>게시물</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{USER_DATA.followers}</Text>
            <Text style={styles.statLabel}>팔로워</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{USER_DATA.following}</Text>
            <Text style={styles.statLabel}>팔로잉</Text>
          </View>
        </View>
      </View>

      {/* 소개 */}
      <View style={styles.bioSection}>
        <Text style={styles.bioText}>{USER_DATA.bio}</Text>
      </View>

      {/* 프로필 편집 버튼 */}
      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.editProfileButton}>
          <Text style={styles.editProfileButtonText}>프로필 편집</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareProfileButton}>
          <Ionicons name="share-outline" size={20} color="#333" />
        </TouchableOpacity>
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
        {USER_DATA.posts.map(post => renderPost(post))}
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
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
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
});
