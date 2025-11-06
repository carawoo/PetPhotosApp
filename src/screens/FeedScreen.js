import React, { useState } from 'react';
import {
  View,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePost } from '../contexts/PostContext';
import { useAuth } from '../contexts/AuthContext';
import FloatingActionButton from '../components/FloatingActionButton';

const { width } = Dimensions.get('window');

export default function FeedScreen() {
  const { posts, loading, toggleLike, addComment, updateComment, deleteComment, deletePost } = usePost();
  const { currentUser } = useAuth();
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [editingComment, setEditingComment] = useState(null);

  const handleLike = (postId) => {
    toggleLike(postId);
  };

  const handleComment = (post) => {
    setSelectedPost(post);
    setEditingComment(null);
    setCommentText('');
  };

  const handleShare = (post) => {
    if (navigator.share) {
      navigator.share({
        title: `${post.author}님의 ${post.petName || '반려동물'} 사진`,
        text: post.description || '귀여운 반려동물 사진을 확인해보세요!',
        url: window.location.href,
      }).catch(() => {
        // 공유 취소 시 무시
      });
    } else {
      // 웹 공유 API 미지원 시 클립보드 복사
      navigator.clipboard.writeText(window.location.href);
      Alert.alert('링크 복사', '링크가 클립보드에 복사되었습니다!');
    }
  };

  const handleNotifications = () => {
    Alert.alert(
      '알림',
      '아직 새로운 알림이 없습니다.',
      [{ text: '확인' }]
    );
  };

  const handlePostMenu = (post) => {
    const isMyPost = post.authorId === currentUser?.id;
    const options = isMyPost
      ? ['삭제', '취소']
      : ['신고', '취소'];

    Alert.alert(
      '게시물 옵션',
      '',
      isMyPost
        ? [
            { text: '삭제', onPress: () => handleDeletePost(post.id), style: 'destructive' },
            { text: '취소', style: 'cancel' },
          ]
        : [
            { text: '신고', onPress: () => Alert.alert('신고', '신고 기능은 준비 중입니다.') },
            { text: '취소', style: 'cancel' },
          ]
    );
  };

  const handleDeletePost = (postId) => {
    Alert.alert(
      '게시물 삭제',
      '정말 이 게시물을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            deletePost(postId);
            Alert.alert('삭제 완료', '게시물이 삭제되었습니다.');
          },
        },
      ]
    );
  };

  const submitComment = () => {
    if (commentText.trim() && selectedPost) {
      if (editingComment) {
        // 댓글 수정
        updateComment(selectedPost.id, editingComment.id, commentText.trim());
        setEditingComment(null);
      } else {
        // 댓글 추가
        addComment(selectedPost.id, commentText.trim());
      }
      setCommentText('');
    }
  };

  const handleCommentMenu = (comment) => {
    const isMyComment = comment.authorId === currentUser?.id;

    if (!isMyComment) {
      Alert.alert('댓글 신고', '신고 기능은 준비 중입니다.');
      return;
    }

    Alert.alert(
      '댓글 옵션',
      '',
      [
        {
          text: '수정',
          onPress: () => {
            setEditingComment(comment);
            setCommentText(comment.text);
          },
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => handleDeleteComment(comment),
        },
        { text: '취소', style: 'cancel' },
      ]
    );
  };

  const handleDeleteComment = (comment) => {
    Alert.alert(
      '댓글 삭제',
      '정말 이 댓글을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            deleteComment(selectedPost.id, comment.id);
            Alert.alert('삭제 완료', '댓글이 삭제되었습니다.');
          },
        },
      ]
    );
  };

  const cancelEdit = () => {
    setEditingComment(null);
    setCommentText('');
  };

  const closeCommentModal = () => {
    setSelectedPost(null);
    setEditingComment(null);
    setCommentText('');
  };

  const renderPost = ({ item }) => {
    const isLiked = item.likedBy?.includes(currentUser?.id);

    return (
      <View style={styles.postContainer}>
        {/* 헤더 */}
        <View style={styles.postHeader}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Ionicons name="paw" size={20} color="#FF6B6B" />
            </View>
            <View>
              <Text style={styles.authorName}>{item.author || 'Anonymous'}</Text>
              {item.petName && (
                <Text style={styles.petNameSmall}>{item.petName}</Text>
              )}
            </View>
          </View>
          <TouchableOpacity
            onPress={() => handlePostMenu(item)}
            style={styles.postMenuButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
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
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleLike(item.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={28}
                color={isLiked ? "#FF6B6B" : "#333"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleComment(item)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chatbubble-outline" size={26} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleShare(item)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="share-outline" size={26} color="#333" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={() => Alert.alert('북마크', '북마크 기능은 준비 중입니다!')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="bookmark-outline" size={26} color="#333" />
          </TouchableOpacity>
        </View>

        {/* 좋아요 수 */}
        <Text style={styles.likes}>좋아요 {item.likes || 0}개</Text>

        {/* 설명 */}
        {item.description && (
          <View style={styles.captionContainer}>
            <Text style={styles.caption}>
              <Text style={styles.authorName}>{item.author || 'Anonymous'}</Text>{' '}
              {item.description}
            </Text>
          </View>
        )}

        {/* 댓글 보기 */}
        {item.comments?.length > 0 && (
          <TouchableOpacity onPress={() => handleComment(item)}>
            <Text style={styles.viewComments}>
              댓글 {item.comments.length}개 모두 보기
            </Text>
          </TouchableOpacity>
        )}

        {/* 시간 */}
        <Text style={styles.timestamp}>
          {getTimeAgo(item.createdAt)}
        </Text>
      </View>
    );
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
        <TouchableOpacity
          onPress={handleNotifications}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
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

      {/* 댓글 모달 */}
      <Modal
        visible={selectedPost !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={closeCommentModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.overlayBackground}
              activeOpacity={1}
              onPress={closeCommentModal}
            />
            <View
              style={styles.modalContent}
              onStartShouldSetResponder={() => true}
              onClick={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>댓글</Text>
                <TouchableOpacity onPress={closeCommentModal}>
                  <Ionicons name="close" size={28} color="#333" />
                </TouchableOpacity>
              </View>

              {/* 댓글 목록 */}
              <FlatList
                data={selectedPost?.comments || []}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <View style={styles.commentItem}>
                    <View style={styles.commentHeader}>
                      <View style={styles.commentLeft}>
                        <Text style={styles.commentAuthor}>{item.author}</Text>
                        {item.updatedAt && (
                          <Text style={styles.editedLabel}>(수정됨)</Text>
                        )}
                      </View>
                      {item.authorId === currentUser?.id && (
                        <TouchableOpacity
                          onPress={() => handleCommentMenu(item)}
                          style={styles.commentMenuButton}
                        >
                          <Ionicons name="ellipsis-horizontal" size={16} color="#999" />
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={styles.commentText}>{item.text}</Text>
                    <Text style={styles.commentTime}>{getTimeAgo(item.createdAt)}</Text>
                  </View>
                )}
                ListEmptyComponent={
                  <Text style={styles.noComments}>아직 댓글이 없습니다</Text>
                }
                style={styles.commentsList}
              />

              {/* 댓글 입력 */}
              <View>
                {editingComment && (
                  <View style={styles.editingIndicator}>
                    <Text style={styles.editingText}>댓글 수정 중...</Text>
                    <TouchableOpacity onPress={cancelEdit}>
                      <Ionicons name="close" size={20} color="#666" />
                    </TouchableOpacity>
                  </View>
                )}
                <View style={styles.commentInputContainer}>
                  <TextInput
                    style={styles.commentInput}
                    placeholder={editingComment ? "댓글 수정..." : "댓글을 입력하세요..."}
                    value={commentText}
                    onChangeText={setCommentText}
                    multiline
                    onClick={(e) => e.stopPropagation()}
                  />
                  <TouchableOpacity
                    onPress={submitComment}
                    disabled={!commentText.trim()}
                  >
                    <Ionicons
                      name={editingComment ? "checkmark" : "send"}
                      size={24}
                      color={commentText.trim() ? "#FF6B6B" : "#ccc"}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 플로팅 액션 버튼 */}
      <FloatingActionButton />
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
  authorName: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  petNameSmall: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  postMenuButton: {
    padding: 8,
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
  modalContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '80%',
    zIndex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  commentsList: {
    maxHeight: 300,
    paddingHorizontal: 20,
  },
  commentItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  commentAuthor: {
    fontWeight: 'bold',
  },
  editedLabel: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
  commentMenuButton: {
    padding: 4,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  commentTime: {
    fontSize: 12,
    color: '#999',
  },
  noComments: {
    textAlign: 'center',
    color: '#999',
    paddingVertical: 32,
  },
  editingIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#FFF8E1',
    borderTopWidth: 1,
    borderTopColor: '#FFE082',
  },
  editingText: {
    fontSize: 13,
    color: '#F57C00',
    fontWeight: '500',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
  },
});
