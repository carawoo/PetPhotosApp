import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
  Platform,
  ActivityIndicator,
  Share,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { usePost } from '../contexts/PostContext';
import { compressImage } from '../utils/imageCompression';
import SettingsScreen from './SettingsScreen';
import AdminDashboardScreen from './AdminDashboardScreen';

const { width } = Dimensions.get('window');
const imageSize = width / 3 - 1;

export default function ProfileScreen() {
  const { currentUser, logout, updateProfileImage, updateProfileBio } = useAuth();
  const { posts, toggleLike, addComment, deleteComment } = usePost();
  const [uploading, setUploading] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [editingBio, setEditingBio] = useState(false);
  const [bioText, setBioText] = useState('');
  const [showSettingsScreen, setShowSettingsScreen] = useState(false);
  const [showAdminScreen, setShowAdminScreen] = useState(false);

  // 현재 사용자의 게시물만 필터링
  const userPosts = posts.filter(post => post.authorId === currentUser?.id);

  // selectedPost를 posts와 동기화
  React.useEffect(() => {
    if (selectedPost) {
      const updatedPost = posts.find(p => p.id === selectedPost.id);
      if (updatedPost) {
        setSelectedPost(updatedPost);
      }
    }
  }, [posts]);

  const handleProfileImagePress = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setUploading(true);
        let imageUrl = result.assets[0].uri;

        // Blob URL을 Base64로 변환 (웹용)
        if (imageUrl.startsWith('blob:')) {
          try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            imageUrl = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          } catch (error) {
            console.error('Blob conversion failed:', error);
          }
        }

        // 이미지 압축
        if (imageUrl.startsWith('data:image')) {
          try {
            imageUrl = await compressImage(imageUrl, 400, 400, 0.8);
          } catch (error) {
            console.warn('Compression failed, using original:', error);
          }
        }

        // 프로필 이미지 업데이트
        const updateResult = updateProfileImage(imageUrl);
        if (updateResult.success) {
          if (Platform.OS === 'web') {
            alert('프로필 이미지가 변경되었습니다!');
          } else {
            Alert.alert('성공', '프로필 이미지가 변경되었습니다!');
          }
        }
        setUploading(false);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      setUploading(false);
      if (Platform.OS === 'web') {
        alert('이미지 선택에 실패했습니다.');
      } else {
        Alert.alert('오류', '이미지 선택에 실패했습니다.');
      }
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('정말 로그아웃하시겠습니까?')) {
        logout();
      }
    } else {
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
    }
  };

  const handleShareProfile = async () => {
    console.log('🔗 Share button clicked');
    try {
      const shareContent = {
        title: `${currentUser?.nickname}의 반려동물 사진첩`,
        message: `${currentUser?.nickname}님의 반려동물 사진첩을 확인해보세요!\n게시물 ${userPosts.length}개 | 좋아요 ${userPosts.reduce((sum, post) => sum + post.likes, 0)}개\n\nPeto 앱에서 확인하기: peto://profile/${currentUser?.id}`,
      };

      console.log('📝 Share content:', shareContent.message);

      if (Platform.OS === 'web') {
        console.log('🌐 Web platform detected');

        // 웹에서는 클립보드에 복사
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            console.log('📋 Using Clipboard API');
            await navigator.clipboard.writeText(shareContent.message);
            console.log('✅ Clipboard copy successful');
            alert('프로필 링크가 클립보드에 복사되었습니다!');
          } else {
            throw new Error('Clipboard API not available');
          }
        } catch (clipboardError) {
          console.warn('⚠️ Clipboard API failed, using fallback:', clipboardError);

          // 폴백: 수동 복사
          const textArea = document.createElement('textarea');
          textArea.value = shareContent.message;
          textArea.style.position = 'fixed';
          textArea.style.top = '0';
          textArea.style.left = '0';
          textArea.style.opacity = '0';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();

          try {
            const successful = document.execCommand('copy');
            console.log('📋 execCommand copy:', successful ? 'successful' : 'failed');
            if (successful) {
              alert('프로필 링크가 클립보드에 복사되었습니다!');
            } else {
              throw new Error('execCommand failed');
            }
          } catch (execError) {
            console.error('❌ execCommand error:', execError);
            // 최후의 수단: 프롬프트로 보여주기
            prompt('다음 링크를 복사하세요:', shareContent.message);
          } finally {
            document.body.removeChild(textArea);
          }
        }
      } else {
        console.log('📱 Mobile platform detected');
        // 모바일에서는 Share API 사용
        await Share.share({
          title: shareContent.title,
          message: shareContent.message,
        });
        console.log('✅ Share successful');
      }
    } catch (error) {
      console.error('❌ Share error:', error);
      if (Platform.OS === 'web') {
        alert(`공유에 실패했습니다: ${error.message}`);
      } else {
        Alert.alert('오류', '공유에 실패했습니다.');
      }
    }
  };

  const handlePostClick = (post) => {
    setSelectedPost(post);
    setCommentText('');
  };

  const handleLike = (postId) => {
    toggleLike(postId);
  };

  const handleSubmitComment = () => {
    if (!commentText.trim() || !selectedPost) return;

    addComment(selectedPost.id, commentText.trim());
    setCommentText('');
  };

  const handleBioEdit = () => {
    setBioText(currentUser?.bio || '');
    setEditingBio(true);
  };

  const handleBioSave = () => {
    const result = updateProfileBio(bioText);
    if (result.success) {
      if (Platform.OS === 'web') {
        alert('프로필 소개글이 업데이트되었습니다!');
      } else {
        Alert.alert('성공', '프로필 소개글이 업데이트되었습니다!');
      }
      setEditingBio(false);
    } else {
      if (Platform.OS === 'web') {
        alert(result.error || '업데이트에 실패했습니다.');
      } else {
        Alert.alert('오류', result.error || '업데이트에 실패했습니다.');
      }
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const posted = new Date(timestamp);
    const diffMs = now - posted;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}시간 전`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}일 전`;
  };

  const renderPost = (post) => (
    <TouchableOpacity
      key={post.id}
      style={styles.postItem}
      onPress={() => handlePostClick(post)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: post.imageUrl }} style={styles.postImage} />
      <View style={styles.postOverlay}>
        <View style={styles.postStats}>
          <Ionicons name="heart" size={18} color="#fff" />
          <Text style={styles.postStatText}>{post.likes || 0}</Text>
          {post.comments?.length > 0 && (
            <>
              <Ionicons name="chatbubble" size={16} color="#fff" style={{ marginLeft: 12 }} />
              <Text style={styles.postStatText}>{post.comments.length}</Text>
            </>
          )}
        </View>
      </View>
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
        <TouchableOpacity
          style={styles.profileImageContainer}
          onPress={handleProfileImagePress}
          disabled={uploading}
          activeOpacity={0.7}
        >
          <View style={styles.profileImage}>
            {uploading ? (
              <ActivityIndicator size="large" color="#FF3366" />
            ) : currentUser?.profileImage ? (
              <Image
                source={{ uri: currentUser.profileImage }}
                style={styles.profileImagePhoto}
              />
            ) : (
              <Ionicons name="paw" size={44} color="#FF3366" />
            )}
          </View>
          <View style={styles.editImageBadge}>
            <Ionicons name="camera" size={16} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

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
        <View style={styles.bioContainer}>
          <Text style={styles.bioText}>
            {currentUser?.bio || `반려동물 사진을 공유하는 ${currentUser?.nickname} 입니다 🐾`}
          </Text>
          <TouchableOpacity onPress={handleBioEdit} style={styles.editBioButton}>
            <Ionicons name="create-outline" size={18} color="#8E8E93" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 프로필 공유 버튼 */}
      <View style={styles.shareSection}>
        <TouchableOpacity style={styles.shareButton} onPress={handleShareProfile}>
          <Ionicons name="share-social-outline" size={20} color="#FF3366" />
          <Text style={styles.shareButtonText}>프로필 공유하기</Text>
        </TouchableOpacity>
      </View>

      {/* 추가 메뉴 */}
      <View style={styles.menuSection}>
        <TouchableOpacity style={styles.menuItem} onPress={() => setShowSettingsScreen(true)}>
          <Ionicons name="settings-outline" size={22} color="#333" />
          <Text style={styles.menuItemText}>설정</Text>
          <Ionicons name="chevron-forward" size={20} color="#AEAEB2" />
        </TouchableOpacity>
        {/* 관리자 메뉴 - 특정 사용자만 보이도록 (예: admin 권한) */}
        {currentUser?.nickname === '_carawoo' && (
          <TouchableOpacity style={styles.menuItem} onPress={() => setShowAdminScreen(true)}>
            <Ionicons name="shield-checkmark-outline" size={22} color="#FF3366" />
            <Text style={[styles.menuItemText, styles.adminMenuText]}>관리자 대시보드</Text>
            <Ionicons name="chevron-forward" size={20} color="#AEAEB2" />
          </TouchableOpacity>
        )}
      </View>

      {/* 탭 */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity style={[styles.tab, styles.activeTab]}>
          <Ionicons name="grid-outline" size={24} color="#FF3366" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Ionicons name="play-outline" size={24} color="#999" />
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

      {/* 게시물 상세 모달 */}
      <Modal
        visible={selectedPost !== null}
        animationType="slide"
        onRequestClose={() => setSelectedPost(null)}
      >
        <View style={styles.modalContainer}>
          {/* 모달 헤더 */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedPost(null)}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>게시물</Text>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {selectedPost && (
              <View style={styles.postDetailContainer}>
                {/* 작성자 정보 */}
                <View style={styles.postDetailHeader}>
                  <View style={styles.userInfo}>
                    <View style={styles.avatar}>
                      {currentUser?.profileImage ? (
                        <Image
                          source={{ uri: currentUser.profileImage }}
                          style={styles.avatarImage}
                        />
                      ) : (
                        <Ionicons name="paw" size={20} color="#FF3366" />
                      )}
                    </View>
                    <View>
                      <Text style={styles.authorName}>{selectedPost.author}</Text>
                      {selectedPost.petName && (
                        <Text style={styles.petNameSmall}>{selectedPost.petName}</Text>
                      )}
                    </View>
                  </View>
                </View>

                {/* 이미지 */}
                <Image
                  source={{ uri: selectedPost.imageUrl }}
                  style={styles.postDetailImage}
                  resizeMode="cover"
                />

                {/* 액션 버튼들 */}
                <View style={styles.actionsContainer}>
                  <View style={styles.leftActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleLike(selectedPost.id)}
                    >
                      <Ionicons
                        name={selectedPost.likedBy?.includes(currentUser?.id) ? "heart" : "heart-outline"}
                        size={28}
                        color={selectedPost.likedBy?.includes(currentUser?.id) ? "#FF3366" : "#333"}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                      <Ionicons name="chatbubble-outline" size={26} color="#333" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 좋아요 수 */}
                <Text style={styles.likes}>좋아요 {selectedPost.likes || 0}개</Text>

                {/* 설명 */}
                {selectedPost.description && (
                  <View style={styles.captionContainer}>
                    <Text style={styles.caption}>
                      <Text style={styles.authorName}>{selectedPost.author}</Text>{' '}
                      {selectedPost.description}
                    </Text>
                  </View>
                )}

                {/* 시간 */}
                <Text style={styles.timestamp}>
                  {getTimeAgo(selectedPost.createdAt)}
                </Text>

                {/* 댓글 목록 */}
                <View style={styles.commentsSection}>
                  <Text style={styles.commentsSectionTitle}>댓글</Text>
                  {selectedPost.comments && selectedPost.comments.length > 0 ? (
                    selectedPost.comments.map((comment) => (
                      <View key={comment.id} style={styles.commentItem}>
                        <View style={styles.commentAvatar}>
                          <Ionicons name="person-circle" size={32} color="#AEAEB2" />
                        </View>
                        <View style={styles.commentContent}>
                          <Text style={styles.commentAuthor}>{comment.author}</Text>
                          <Text style={styles.commentText}>{comment.text}</Text>
                          <Text style={styles.commentTime}>{getTimeAgo(comment.createdAt)}</Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noComments}>첫 댓글을 남겨보세요!</Text>
                  )}
                </View>
              </View>
            )}
          </ScrollView>

          {/* 댓글 입력 */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.commentInputContainer}
          >
            <TextInput
              style={styles.commentInput}
              placeholder="댓글을 입력하세요..."
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <TouchableOpacity
              style={[styles.submitCommentButton, !commentText.trim() && styles.submitCommentButtonDisabled]}
              onPress={handleSubmitComment}
              disabled={!commentText.trim()}
            >
              <Ionicons name="send" size={24} color={commentText.trim() ? "#FF3366" : "#AEAEB2"} />
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* 소개글 편집 모달 */}
      <Modal
        visible={editingBio}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditingBio(false)}
      >
        <View style={styles.bioModalOverlay}>
          <TouchableOpacity
            style={styles.bioModalBackdrop}
            activeOpacity={1}
            onPress={() => setEditingBio(false)}
          />
          <View style={styles.bioModalContent}>
            <View style={styles.bioModalHeader}>
              <TouchableOpacity onPress={() => setEditingBio(false)}>
                <Text style={styles.bioModalCancel}>취소</Text>
              </TouchableOpacity>
              <Text style={styles.bioModalTitle}>소개 편집</Text>
              <TouchableOpacity onPress={handleBioSave}>
                <Text style={styles.bioModalSave}>완료</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.bioModalBody}>
              <TextInput
                style={styles.bioModalInput}
                placeholder="자신에 대해 소개해주세요..."
                value={bioText}
                onChangeText={setBioText}
                multiline
                numberOfLines={4}
                maxLength={150}
                autoFocus
              />
              <Text style={styles.bioCharCount}>{bioText.length}/150</Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* 설정 화면 Modal */}
      <Modal
        visible={showSettingsScreen}
        animationType="slide"
        onRequestClose={() => setShowSettingsScreen(false)}
      >
        <SettingsScreen navigation={{ goBack: () => setShowSettingsScreen(false) }} />
      </Modal>

      {/* 관리자 대시보드 Modal */}
      <Modal
        visible={showAdminScreen}
        animationType="slide"
        onRequestClose={() => setShowAdminScreen(false)}
      >
        <AdminDashboardScreen navigation={{ goBack: () => setShowAdminScreen(false) }} />
      </Modal>
    </ScrollView>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  username: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    marginTop: 1,
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 36,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FF3366',
    backgroundColor: '#FFE8F0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF3366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
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
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 6,
    fontWeight: '600',
  },
  bioSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
  },
  bioContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bioText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: '#2C2C2E',
  },
  editBioButton: {
    padding: 4,
  },
  shareSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F7',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FFE0E7',
    gap: 8,
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF3366',
    letterSpacing: -0.3,
  },
  actionsSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 10,
  },
  editProfileButton: {
    flex: 1,
    backgroundColor: '#F5F5F7',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  editProfileButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  shareProfileButton: {
    backgroundColor: '#F5F5F7',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    marginTop: 12,
    backgroundColor: '#FFFFFF',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#FF3366',
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 1,
  },
  postItem: {
    width: imageSize,
    height: imageSize,
    margin: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  postOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 8,
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postStatText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  modalContent: {
    flex: 1,
  },
  postDetailContainer: {
    backgroundColor: '#FFFFFF',
  },
  postDetailHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFE8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  postDetailImage: {
    width: width,
    height: width,
    backgroundColor: '#E5E5EA',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  leftActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    padding: 4,
  },
  likes: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  captionContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  caption: {
    fontSize: 15,
    lineHeight: 20,
    color: '#1A1A1A',
  },
  petNameSmall: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 12,
    color: '#8E8E93',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  commentsSection: {
    backgroundColor: '#FAFBFC',
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginTop: 8,
  },
  commentsSectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentAvatar: {
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 20,
    marginBottom: 4,
  },
  commentTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  noComments: {
    fontSize: 14,
    color: '#AEAEB2',
    textAlign: 'center',
    paddingVertical: 20,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    gap: 12,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#F5F5F7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  submitCommentButton: {
    padding: 8,
  },
  submitCommentButtonDisabled: {
    opacity: 0.5,
  },
  emptyContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingBottom: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3A3A3C',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubText: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  editImageBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF3366',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#FF3366',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  profileImagePhoto: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  bioModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bioModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bioModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  bioModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  bioModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  bioModalCancel: {
    fontSize: 16,
    color: '#8E8E93',
  },
  bioModalSave: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3366',
  },
  bioModalBody: {
    padding: 20,
  },
  bioModalInput: {
    fontSize: 15,
    lineHeight: 22,
    color: '#1A1A1A',
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    padding: 16,
  },
  bioCharCount: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'right',
    marginTop: 8,
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  menuItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  adminMenuText: {
    color: '#FF3366',
    fontWeight: '600',
  },
});
