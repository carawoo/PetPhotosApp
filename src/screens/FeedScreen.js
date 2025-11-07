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
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePost } from '../contexts/PostContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import FloatingActionButton from '../components/FloatingActionButton';
import ImageSlider from '../components/ImageSlider';

const { width } = Dimensions.get('window');

export default function FeedScreen() {
  const { posts, loading, toggleLike, addComment, updateComment, deleteComment, deletePost, updatePost } = usePost();
  const { currentUser } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotification();
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [editPetInputText, setEditPetInputText] = useState('');
  const [editLocalPets, setEditLocalPets] = useState([]);
  const [editSelectedPet, setEditSelectedPet] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [menuPost, setMenuPost] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [menuComment, setMenuComment] = useState(null);
  const [showDeleteCommentConfirm, setShowDeleteCommentConfirm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState(null); // 'post' or 'comment'
  const [reportTarget, setReportTarget] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDetail, setReportDetail] = useState('');

  // selectedPost를 posts와 동기화
  React.useEffect(() => {
    if (selectedPost) {
      const updatedPost = posts.find(p => p.id === selectedPost.id);
      if (updatedPost) {
        setSelectedPost(updatedPost);
      }
    }
  }, [posts]);

  const handleLike = (postId) => {
    toggleLike(postId);
  };

  const handleComment = (post) => {
    // 비회원은 로그인 화면으로 이동
    if (!currentUser) {
      if (Platform.OS === 'web') {
        localStorage.setItem('peto_requestLogin', 'true');
        window.location.reload();
      } else {
        Alert.alert(
          '로그인 필요',
          '댓글을 작성하려면 로그인이 필요합니다.',
          [{ text: '확인', style: 'default' }]
        );
      }
      return;
    }

    setSelectedPost(post);
    setEditingComment(null);
    setCommentText('');
  };

  const handleShare = async (post) => {
    try {
      // 피드별 고유 링크 생성
      const baseUrl = Platform.OS === 'web'
        ? window.location.origin
        : 'https://peto.real-e.space';
      const shareUrl = `${baseUrl}/post/${post.id}`;
      const shareTitle = `${post.author}님의 ${post.petName || '반려동물'} 사진`;
      const shareText = post.description || '귀여운 반려동물 사진을 확인해보세요!';

      if (Platform.OS === 'web') {
        // 웹 환경: Web Share API 우선 사용 (시스템 공유 기능)
        if (navigator.share) {
          try {
            await navigator.share({
              title: shareTitle,
              text: shareText,
              url: shareUrl,
            });
            return; // 성공하면 종료
          } catch (error) {
            // 사용자가 공유를 취소한 경우 (AbortError)
            if (error.name === 'AbortError') {
              return;
            }
            console.warn('Web Share API failed, falling back to clipboard:', error);
          }
        }

        // 폴백: 클립보드 복사
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(shareUrl);
            alert('✅ 링크가 클립보드에 복사되었습니다!\n\n공유하고 싶은 곳에 붙여넣기 해주세요.');
          } else {
            // 클립보드 API 미지원 시 텍스트 선택 방식
            const textArea = document.createElement('textarea');
            textArea.value = shareUrl;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            try {
              document.execCommand('copy');
              alert('✅ 링크가 복사되었습니다!\n\n공유하고 싶은 곳에 붙여넣기 해주세요.');
            } catch (err) {
              prompt('아래 링크를 복사하세요:', shareUrl);
            }

            document.body.removeChild(textArea);
          }
        } catch (error) {
          console.error('Clipboard error:', error);
          prompt('아래 링크를 복사하세요:', shareUrl);
        }
      } else {
        // 모바일 환경: React Native Share API
        const Share = require('react-native').Share;
        await Share.share({
          title: shareTitle,
          message: `${shareText}\n\n${shareUrl}`,
        });
      }
    } catch (error) {
      console.error('Share error:', error);
      if (Platform.OS === 'web') {
        alert('공유에 실패했습니다. 다시 시도해주세요.');
      } else {
        Alert.alert('오류', '공유에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

  const handleNotifications = () => {
    setShowNotifications(true);
  };

  const handleReportPost = (post) => {
    setMenuPost(null);
    setReportType('post');
    setReportTarget(post);
    setReportReason('');
    setReportDetail('');
    setShowReportModal(true);
  };

  const handleReportComment = (comment) => {
    setMenuComment(null);
    setReportType('comment');
    setReportTarget(comment);
    setReportReason('');
    setReportDetail('');
    setShowReportModal(true);
  };

  const submitReport = async () => {
    if (!reportReason) {
      if (Platform.OS === 'web') {
        alert('신고 사유를 선택해주세요.');
      } else {
        Alert.alert('알림', '신고 사유를 선택해주세요.');
      }
      return;
    }

    try {
      // Firebase가 있으면 Firebase에 저장, 없으면 localStorage에 저장
      const reportData = {
        type: reportType,
        targetId: reportTarget.id,
        targetContent: reportType === 'post' ? reportTarget.description : reportTarget.text,
        reportedUserId: reportTarget.authorId,
        reportedUserName: reportTarget.author,
        reporterId: currentUser.id,
        reporterName: currentUser.nickname,
        reason: reportReason,
        detail: reportDetail,
        createdAt: new Date().toISOString(),
        status: 'pending',
      };

      // Firestore에 저장
      const firestoreService = require('../services/firestore.service');
      await firestoreService.createReport(reportData);

      setShowReportModal(false);
      if (Platform.OS === 'web') {
        alert('신고가 접수되었습니다. 검토 후 조치하겠습니다.');
      } else {
        Alert.alert('신고 완료', '신고가 접수되었습니다. 검토 후 조치하겠습니다.');
      }
    } catch (error) {
      console.error('Report submission error:', error);
      if (Platform.OS === 'web') {
        alert('신고 접수 중 오류가 발생했습니다.');
      } else {
        Alert.alert('오류', '신고 접수 중 오류가 발생했습니다.');
      }
    }
  };

  const handlePostMenu = (post) => {
    setMenuPost(post);
  };

  // 콤마 입력 처리 - 태그 추가 (Edit)
  const handleEditPetInputChange = (text) => {
    if (text.endsWith(',')) {
      const newPetName = text.slice(0, -1).trim();
      if (newPetName && !editLocalPets.includes(newPetName)) {
        setEditLocalPets([...editLocalPets, newPetName]);
        if (!editSelectedPet) {
          setEditSelectedPet(newPetName);
        }
      }
      setEditPetInputText('');
    } else {
      setEditPetInputText(text);
    }
  };

  // 칩 삭제 (Edit)
  const handleEditRemovePet = (petToRemove) => {
    setEditLocalPets(editLocalPets.filter(p => p !== petToRemove));
    if (editSelectedPet === petToRemove) {
      setEditSelectedPet(editLocalPets.find(p => p !== petToRemove) || '');
    }
  };

  // 칩 선택 (Edit)
  const handleEditSelectPet = (pet) => {
    setEditSelectedPet(pet);
  };

  const handleEditPost = (post) => {
    setMenuPost(null);
    setEditingPost(post);
    // 초기화: 현재 게시물의 petName을 첫 번째 칩으로 설정
    setEditLocalPets([post.petName]);
    setEditSelectedPet(post.petName);
    setEditPetInputText('');
    setEditDescription(post.description || '');
  };

  const submitPostEdit = () => {
    if (!editSelectedPet && editLocalPets.length === 0) {
      Alert.alert('알림', '반려동물 이름을 입력해주세요.');
      return;
    }

    const finalPetName = editSelectedPet || editLocalPets[0];
    if (!finalPetName) {
      Alert.alert('알림', '반려동물을 선택해주세요.');
      return;
    }

    updatePost(editingPost.id, {
      petName: finalPetName.trim(),
      description: editDescription.trim(),
    });

    setEditingPost(null);
    setEditPetInputText('');
    setEditLocalPets([]);
    setEditSelectedPet('');
    setEditDescription('');
    Alert.alert('수정 완료', '게시물이 수정되었습니다.');
  };

  const cancelPostEdit = () => {
    setEditingPost(null);
    setEditPetInputText('');
    setEditLocalPets([]);
    setEditSelectedPet('');
    setEditDescription('');
  };

  const handleDeletePost = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeletePost = () => {
    if (menuPost) {
      deletePost(menuPost.id);
      setShowDeleteConfirm(false);
      setMenuPost(null);
    }
  };

  const submitComment = () => {
    // 비회원은 로그인 필요
    if (!currentUser) {
      if (Platform.OS === 'web') {
        if (window.confirm('댓글을 작성하려면 로그인이 필요합니다.\n로그인 페이지로 이동하시겠습니까?')) {
          window.location.href = '/';
        }
      } else {
        Alert.alert(
          '로그인 필요',
          '댓글을 작성하려면 로그인이 필요합니다.',
          [
            { text: '취소', style: 'cancel' },
            { text: '로그인', onPress: () => {} }
          ]
        );
      }
      return;
    }

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
    setMenuComment(comment);
  };

  const handleEditComment = (comment) => {
    setMenuComment(null);
    setEditingComment(comment);
    setCommentText(comment.text);
  };

  const handleDeleteComment = () => {
    setShowDeleteCommentConfirm(true);
  };

  const confirmDeleteComment = () => {
    if (menuComment && selectedPost) {
      deleteComment(selectedPost.id, menuComment.id);
      setShowDeleteCommentConfirm(false);
      setMenuComment(null);
    }
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
    // 데이터 검증 - corrupted data 필터링
    if (!item || !item.id || !item.imageUrl || !item.author) {
      console.warn('Skipping invalid post:', item);
      return null;
    }

    // 좋아요 상태 체크 (비회원은 localStorage, 회원은 likedBy)
    let isLiked;
    if (!currentUser) {
      const guestLikes = JSON.parse(localStorage.getItem('peto_guestLikes') || '[]');
      isLiked = guestLikes.includes(item.id);
    } else {
      isLiked = item.likedBy?.includes(currentUser.id);
    }

    // 게시물에 저장된 authorProfileImage 사용
    const authorProfileImage = item.authorProfileImage || null;

    return (
      <View style={styles.postContainer}>
        {/* 헤더 */}
        <View style={styles.postHeader}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              {authorProfileImage ? (
                <Image
                  source={{ uri: authorProfileImage }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="paw" size={20} color="#FF3366" />
              )}
            </View>
            <View>
              <Text style={styles.authorName}>{item.author || 'Anonymous'}</Text>
              {item.petName && typeof item.petName === 'string' && item.petName.trim() && (
                <Text style={styles.petNameSmall}>{item.petName.trim()}</Text>
              )}
            </View>
          </View>
          <TouchableOpacity
            onPress={() => handlePostMenu(item)}
            style={styles.postMenuButton}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            activeOpacity={0.6}
          >
            <Ionicons name="ellipsis-horizontal" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* 이미지 슬라이더 */}
        <ImageSlider images={item.images || [item.imageUrl]} />

        {/* 액션 버튼들 */}
        <View style={styles.actionsContainer}>
          <View style={styles.leftActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleLike(item.id)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.6}
            >
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={28}
                color={isLiked ? "#FF3366" : "#333"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleComment(item)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.6}
            >
              <Ionicons name="chatbubble-outline" size={26} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleShare(item)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.6}
            >
              <Ionicons name="share-outline" size={26} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 좋아요 수 */}
        <Text style={styles.likes}>좋아요 {item.likes || 0}개</Text>

        {/* 설명 */}
        {item.description && typeof item.description === 'string' && item.description.trim() && (
          <View style={styles.captionContainer}>
            <Text style={styles.caption}>
              <Text style={styles.authorName}>{item.author || 'Anonymous'}</Text>{' '}
              {item.description.trim()}
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
        <View style={styles.headerLeft}>
          <Ionicons name="paw" size={32} color="#FF3366" />
          <Text style={styles.headerTitle}>Peto</Text>
        </View>
        <TouchableOpacity
          onPress={handleNotifications}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          activeOpacity={0.6}
          style={styles.notificationButton}
        >
          <Ionicons name="notifications-outline" size={28} color="#333" />
          {unreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
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
              onResponderTerminationRequest={() => false}
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
                          onPress={(e) => {
                            e?.stopPropagation?.();
                            handleCommentMenu(item);
                          }}
                          style={styles.commentMenuButton}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
                <View
                  style={styles.commentInputContainer}
                  onStartShouldSetResponder={() => true}
                  onResponderTerminationRequest={() => false}
                >
                  <TextInput
                    style={styles.commentInput}
                    placeholder={editingComment ? "댓글 수정..." : "댓글을 입력하세요..."}
                    value={commentText}
                    onChangeText={setCommentText}
                    multiline
                    onStartShouldSetResponder={() => true}
                  />
                  <TouchableOpacity
                    onPress={submitComment}
                    disabled={!commentText.trim()}
                  >
                    <Ionicons
                      name={editingComment ? "checkmark" : "send"}
                      size={24}
                      color={commentText.trim() ? "#FF3366" : "#ccc"}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 게시물 수정 모달 */}
      <Modal
        visible={editingPost !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={cancelPostEdit}
      >
        <View style={styles.uploadModalOverlay}>
          <TouchableOpacity
            style={styles.overlayTouchable}
            activeOpacity={1}
            onPress={cancelPostEdit}
          />
          <View
            style={styles.uploadModalContent}
            onStartShouldSetResponder={() => true}
            onResponderTerminationRequest={() => false}
          >
            <View style={styles.uploadModalHeader}>
              <Text style={styles.modalTitle}>게시물 수정</Text>
              <TouchableOpacity onPress={cancelPostEdit}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.editModalScrollView}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {editingPost && (
                <Image
                  source={{ uri: editingPost.imageUrl }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
              )}

              <View style={styles.formContainer}>
              {/* 반려동물 선택 */}
              <View style={styles.petSelectionContainer}>
                <Text style={styles.petSelectionLabel}>반려동물 *</Text>

                {/* 이름 입력란 (콤마로 태그 추가) */}
                <TextInput
                  style={styles.addPetInput}
                  placeholder="이름 입력 후 콤마(,)로 추가"
                  value={editPetInputText}
                  onChangeText={handleEditPetInputChange}
                  maxLength={20}
                />

                {/* 추가된 태그 칩 */}
                {editLocalPets.length > 0 && (
                  <View style={styles.petChipsContainer}>
                    {editLocalPets.map((pet, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.petChip,
                          editSelectedPet === pet && styles.petChipSelected
                        ]}
                        onPress={() => handleEditSelectPet(pet)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name="paw"
                          size={16}
                          color={editSelectedPet === pet ? "#FFFFFF" : "#FF3366"}
                        />
                        <Text style={[
                          styles.petChipText,
                          editSelectedPet === pet && styles.petChipTextSelected
                        ]}>
                          {pet}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleEditRemovePet(pet)}
                          style={styles.petChipRemoveButton}
                        >
                          <Ionicons
                            name="close-circle"
                            size={18}
                            color={editSelectedPet === pet ? "#FFFFFF" : "#999"}
                          />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* 등록된 반려동물 빠른 추가 */}
                {currentUser?.pets && currentUser.pets.length > 0 && (
                  <View style={styles.registeredPetsContainer}>
                    <Text style={styles.registeredPetsLabel}>등록된 반려동물</Text>
                    <View style={styles.petChipsContainer}>
                      {currentUser.pets.map((pet, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.registeredPetChip}
                          onPress={() => {
                            if (!editLocalPets.includes(pet)) {
                              setEditLocalPets([...editLocalPets, pet]);
                              setEditSelectedPet(pet);
                            }
                          }}
                          disabled={editLocalPets.includes(pet)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="add-circle-outline" size={16} color="#FF3366" />
                          <Text style={styles.registeredPetChipText}>{pet}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>

              <TextInput
                style={[styles.input, styles.descriptionInput]}
                placeholder="설명을 입력하세요..."
                value={editDescription}
                onChangeText={setEditDescription}
                multiline
                numberOfLines={4}
              />
              <TouchableOpacity style={styles.uploadButton} onPress={submitPostEdit}>
                <Text style={styles.uploadButtonText}>수정 완료</Text>
              </TouchableOpacity>
            </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 게시물 메뉴 모달 */}
      <Modal
        visible={menuPost !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuPost(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setMenuPost(null)}
          />
          <View style={styles.actionSheet}>
            {menuPost?.authorId === currentUser?.id ? (
              <>
                <TouchableOpacity
                  style={styles.actionSheetButton}
                  onPress={() => handleEditPost(menuPost)}
                >
                  <Ionicons name="create-outline" size={24} color="#333" />
                  <Text style={styles.actionSheetButtonText}>게시물 수정</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionSheetButton, styles.actionSheetButtonDanger]}
                  onPress={handleDeletePost}
                >
                  <Ionicons name="trash-outline" size={24} color="#FF3B30" />
                  <Text style={[styles.actionSheetButtonText, styles.actionSheetButtonTextDanger]}>
                    게시물 삭제
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.actionSheetButton}
                onPress={() => handleReportPost(menuPost)}
              >
                <Ionicons name="flag-outline" size={24} color="#FF9500" />
                <Text style={styles.actionSheetButtonText}>게시물 신고</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionSheetButton, styles.actionSheetButtonCancel]}
              onPress={() => setMenuPost(null)}
            >
              <Text style={styles.actionSheetButtonText}>취소</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 삭제 확인 모달 */}
      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View style={styles.confirmModalOverlay}>
          <View style={styles.confirmDialog}>
            <Text style={styles.confirmTitle}>게시물 삭제</Text>
            <Text style={styles.confirmMessage}>
              정말 이 게시물을 삭제하시겠습니까?{'\n'}삭제된 게시물은 복구할 수 없습니다.
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmButtonCancel]}
                onPress={() => setShowDeleteConfirm(false)}
              >
                <Text style={styles.confirmButtonTextCancel}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmButtonDanger]}
                onPress={confirmDeletePost}
              >
                <Text style={styles.confirmButtonTextDanger}>삭제</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 댓글 메뉴 모달 */}
      <Modal
        visible={menuComment !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuComment(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setMenuComment(null)}
          />
          <View style={styles.actionSheet}>
            {menuComment?.authorId === currentUser?.id ? (
              <>
                <TouchableOpacity
                  style={styles.actionSheetButton}
                  onPress={() => handleEditComment(menuComment)}
                >
                  <Ionicons name="create-outline" size={24} color="#333" />
                  <Text style={styles.actionSheetButtonText}>댓글 수정</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionSheetButton, styles.actionSheetButtonDanger]}
                  onPress={handleDeleteComment}
                >
                  <Ionicons name="trash-outline" size={24} color="#FF3B30" />
                  <Text style={[styles.actionSheetButtonText, styles.actionSheetButtonTextDanger]}>
                    댓글 삭제
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.actionSheetButton}
                onPress={() => {
                  setMenuComment(null);
                  Alert.alert('신고', '신고 기능은 준비 중입니다.');
                }}
              >
                <Ionicons name="flag-outline" size={24} color="#FF9500" />
                <Text style={styles.actionSheetButtonText}>댓글 신고</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionSheetButton, styles.actionSheetButtonCancel]}
              onPress={() => setMenuComment(null)}
            >
              <Text style={styles.actionSheetButtonText}>취소</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 댓글 삭제 확인 모달 */}
      <Modal
        visible={showDeleteCommentConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteCommentConfirm(false)}
      >
        <View style={styles.confirmModalOverlay}>
          <View style={styles.confirmDialog}>
            <Text style={styles.confirmTitle}>댓글 삭제</Text>
            <Text style={styles.confirmMessage}>
              정말 이 댓글을 삭제하시겠습니까?{'\n'}삭제된 댓글은 복구할 수 없습니다.
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmButtonCancel]}
                onPress={() => setShowDeleteCommentConfirm(false)}
              >
                <Text style={styles.confirmButtonTextCancel}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmButtonDanger]}
                onPress={confirmDeleteComment}
              >
                <Text style={styles.confirmButtonTextDanger}>삭제</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 알림 모달 */}
      <Modal
        visible={showNotifications}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNotifications(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.overlayBackground}
            activeOpacity={1}
            onPress={() => setShowNotifications(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>알림</Text>
              <View style={styles.notificationHeaderActions}>
                {unreadCount > 0 && (
                  <TouchableOpacity
                    onPress={markAllAsRead}
                    style={styles.markAllReadButton}
                  >
                    <Text style={styles.markAllReadText}>모두 읽음</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setShowNotifications(false)}>
                  <Ionicons name="close" size={28} color="#333" />
                </TouchableOpacity>
              </View>
            </View>

            <FlatList
              data={notifications}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.notificationItem,
                    !item.read && styles.notificationItemUnread
                  ]}
                  onPress={() => {
                    markAsRead(item.id);
                    setShowNotifications(false);

                    // 해당 게시물 찾아서 열기
                    if (item.postId) {
                      const post = posts.find(p => p.id === item.postId);
                      if (post) {
                        handleComment(post);
                      }
                    }
                  }}
                >
                  <View style={styles.notificationContent}>
                    {item.postImage && (
                      <Image
                        source={{ uri: item.postImage }}
                        style={styles.notificationImage}
                      />
                    )}
                    <View style={styles.notificationTextContainer}>
                      <Text style={styles.notificationMessage}>{item.message}</Text>
                      <Text style={styles.notificationTime}>
                        {getTimeAgo(item.createdAt)}
                      </Text>
                    </View>
                  </View>
                  {!item.read && <View style={styles.unreadDot} />}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyNotifications}>
                  <Ionicons name="notifications-outline" size={64} color="#ccc" />
                  <Text style={styles.emptyNotificationsText}>알림이 없습니다</Text>
                </View>
              }
              style={styles.notificationsList}
            />
          </View>
        </View>
      </Modal>

      {/* 신고 모달 */}
      <Modal
        visible={showReportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReportModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowReportModal(false)}
          />
          <View style={styles.reportModal}>
            <View style={styles.reportModalHeader}>
              <TouchableOpacity onPress={() => setShowReportModal(false)}>
                <Text style={styles.reportModalCancel}>취소</Text>
              </TouchableOpacity>
              <Text style={styles.reportModalTitle}>
                {reportType === 'post' ? '게시물' : '댓글'} 신고
              </Text>
              <TouchableOpacity onPress={submitReport}>
                <Text style={styles.reportModalSubmit}>제출</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.reportModalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.reportLabel}>신고 사유 *</Text>
              <View style={styles.reportReasons}>
                {[
                  { value: 'spam', label: '스팸 또는 광고' },
                  { value: 'inappropriate', label: '부적절한 콘텐츠' },
                  { value: 'harassment', label: '괴롭힘 또는 혐오 발언' },
                  { value: 'violence', label: '폭력적인 콘텐츠' },
                  { value: 'false_info', label: '허위 정보' },
                  { value: 'other', label: '기타' },
                ].map((reason) => (
                  <TouchableOpacity
                    key={reason.value}
                    style={[
                      styles.reasonOption,
                      reportReason === reason.value && styles.reasonOptionSelected,
                    ]}
                    onPress={() => setReportReason(reason.value)}
                  >
                    <Ionicons
                      name={reportReason === reason.value ? 'radio-button-on' : 'radio-button-off'}
                      size={24}
                      color={reportReason === reason.value ? '#FF3366' : '#AEAEB2'}
                    />
                    <Text
                      style={[
                        styles.reasonOptionText,
                        reportReason === reason.value && styles.reasonOptionTextSelected,
                      ]}
                    >
                      {reason.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.reportLabel}>상세 설명 (선택)</Text>
              <TextInput
                style={styles.reportDetailInput}
                placeholder="신고 사유를 자세히 설명해주세요..."
                value={reportDetail}
                onChangeText={setReportDetail}
                multiline
                numberOfLines={4}
                maxLength={500}
              />
              <Text style={styles.reportCharCount}>{reportDetail.length}/500</Text>

              <View style={styles.reportNotice}>
                <Ionicons name="information-circle-outline" size={20} color="#8E8E93" />
                <Text style={styles.reportNoticeText}>
                  신고 내용은 검토 후 적절한 조치가 취해집니다. 허위 신고는 제재 대상이 될 수 있습니다.
                </Text>
              </View>
            </ScrollView>
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
    backgroundColor: '#FAFBFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  postContainer: {
    marginBottom: 12,
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFE8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  authorName: {
    fontWeight: '700',
    fontSize: 15,
    color: '#1A1A1A',
    marginBottom: 2,
  },
  petNameSmall: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  postMenuButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
  },
  postImage: {
    width: '100%',
    height: width - 32,
    backgroundColor: '#F0F0F0',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  actionButton: {
    padding: 6,
  },
  likes: {
    fontWeight: '700',
    fontSize: 15,
    color: '#1A1A1A',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  captionContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  caption: {
    lineHeight: 20,
    fontSize: 14,
    color: '#2C2C2E',
  },
  viewComments: {
    color: '#8E8E93',
    paddingHorizontal: 20,
    paddingBottom: 10,
    fontSize: 14,
    fontWeight: '500',
  },
  timestamp: {
    color: '#C7C7CC',
    fontSize: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 120,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3A3A3C',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  commentsList: {
    maxHeight: 300,
    paddingHorizontal: 24,
  },
  commentItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentAuthor: {
    fontWeight: '700',
    fontSize: 14,
    color: '#1A1A1A',
  },
  editedLabel: {
    fontSize: 11,
    color: '#8E8E93',
    fontStyle: 'italic',
    fontWeight: '500',
  },
  commentMenuButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  commentText: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 6,
    color: '#2C2C2E',
  },
  commentTime: {
    fontSize: 12,
    color: '#C7C7CC',
    fontWeight: '500',
  },
  noComments: {
    textAlign: 'center',
    color: '#8E8E93',
    paddingVertical: 40,
    fontSize: 15,
  },
  editingIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#FFF9E6',
    borderTopWidth: 1,
    borderTopColor: '#FFE6A3',
  },
  editingText: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '600',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#F5F5F7',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    maxHeight: 100,
    fontSize: 15,
    color: '#1A1A1A',
  },
  uploadModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  uploadModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '90%',
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  uploadModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  previewImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#F5F5F7',
  },
  formContainer: {
    padding: 24,
  },
  input: {
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 16,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#FFFFFF',
  },
  descriptionInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  petSelectionContainer: {
    marginBottom: 20,
  },
  petSelectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  addPetInput: {
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  petChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  petChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F5',
    borderRadius: 20,
    paddingVertical: 8,
    paddingLeft: 12,
    paddingRight: 12,
    borderWidth: 2,
    borderColor: '#FFE8F0',
    gap: 6,
  },
  petChipSelected: {
    backgroundColor: '#FF3366',
    borderColor: '#FF3366',
  },
  petChipText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF3366',
  },
  petChipTextSelected: {
    color: '#FFFFFF',
  },
  petChipRemoveButton: {
    padding: 2,
  },
  registeredPetsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  registeredPetsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
  },
  registeredPetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 20,
    paddingVertical: 8,
    paddingLeft: 12,
    paddingRight: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 6,
  },
  registeredPetChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  noPetsText: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  editModalScrollView: {
    flex: 1,
  },
  uploadButton: {
    backgroundColor: '#FF3366',
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#FF3366',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  actionSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    paddingTop: 12,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  actionSheetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  actionSheetButtonDanger: {
    backgroundColor: '#FFFFFF',
  },
  actionSheetButtonCancel: {
    borderBottomWidth: 0,
    marginTop: 12,
    backgroundColor: '#F5F5F7',
    borderRadius: 16,
    marginHorizontal: 16,
  },
  actionSheetButtonText: {
    fontSize: 17,
    color: '#1A1A1A',
    marginLeft: 14,
    fontWeight: '600',
  },
  actionSheetButtonTextDanger: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  confirmModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
  },
  confirmDialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  confirmTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 14,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  confirmMessage: {
    fontSize: 15,
    color: '#8E8E93',
    lineHeight: 23,
    textAlign: 'center',
    marginBottom: 28,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  confirmButtonCancel: {
    backgroundColor: '#F5F5F7',
  },
  confirmButtonDanger: {
    backgroundColor: '#FF3B30',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonTextCancel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  confirmButtonTextDanger: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  notificationButton: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3366',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  notificationHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  markAllReadButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F5F5F7',
    borderRadius: 8,
  },
  markAllReadText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF3366',
  },
  notificationsList: {
    maxHeight: 500,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  notificationItemUnread: {
    backgroundColor: '#FFF5F7',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  notificationImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3366',
    marginLeft: 12,
  },
  emptyNotifications: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyNotificationsText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 16,
    fontWeight: '500',
  },
  reportModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  reportModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  reportModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  reportModalCancel: {
    fontSize: 16,
    color: '#8E8E93',
  },
  reportModalSubmit: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3366',
  },
  reportModalBody: {
    padding: 20,
  },
  reportLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  reportReasons: {
    marginBottom: 24,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    marginBottom: 8,
  },
  reasonOptionSelected: {
    backgroundColor: '#FFE8F0',
  },
  reasonOptionText: {
    fontSize: 15,
    color: '#1A1A1A',
    marginLeft: 12,
  },
  reasonOptionTextSelected: {
    fontWeight: '600',
    color: '#FF3366',
  },
  reportDetailInput: {
    fontSize: 15,
    lineHeight: 22,
    color: '#1A1A1A',
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  reportCharCount: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'right',
    marginTop: 8,
    marginBottom: 16,
  },
  reportNotice: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  reportNoticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#8E8E93',
  },
});
