import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { compressImage, formatBase64Size, getBase64Size } from '../utils/imageCompression';

// NotificationContext는 동적으로 import
let useNotificationHook = null;
try {
  const NotificationModule = require('./NotificationContext');
  useNotificationHook = NotificationModule.useNotification;
} catch (error) {
  // NotificationContext가 없으면 무시
}

// Firebase 서비스 (optional)
let firestoreService = null;
let storageService = null;

try {
  const firebaseConfig = require('../config/firebase.config');
  if (firebaseConfig.db) {
    firestoreService = require('../services/firestore.service');
    // Storage는 Blaze 플랜이 필요하므로 비활성화
    // storageService = require('../services/storage.service');
    console.log('✅ Firebase enabled (Firestore only, images stored as Base64)');
  }
} catch (error) {
  console.log('📦 Using localStorage mode (Firebase not configured)');
}

const PostContext = createContext();

export const usePost = () => {
  const context = useContext(PostContext);
  if (!context) {
    throw new Error('usePost must be used within PostProvider');
  }
  return context;
};

export const PostProvider = ({ children }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { currentUser } = useAuth();
  const useFirebase = firestoreService !== null;

  // 알림 기능 (선택적)
  let addNotification = null;
  if (useNotificationHook) {
    try {
      const notificationContext = useNotificationHook();
      addNotification = notificationContext.addNotification;
    } catch (error) {
      // 알림 기능 사용 불가
    }
  }

  // 데이터 로드 (Firestore 전용)
  useEffect(() => {
    if (!useFirebase) {
      console.error('❌ Firestore is required');
      setLoading(false);
      return;
    }

    // Firebase 실시간 리스너
    const unsubscribe = firestoreService.subscribeToPosts((fetchedPosts) => {
      setPosts(fetchedPosts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [useFirebase]);

  // ====== 게시물 추가 ======

  const addPost = async (post) => {
    try {
      // images 배열 또는 단일 imageUrl 지원 (하위 호환성)
      const images = post.images || (post.imageUrl ? [post.imageUrl] : []);

      if (images.length === 0) {
        throw new Error('이미지가 필요합니다');
      }

      // 여러 이미지 압축
      const compressedImages = [];
      setUploadProgress(10);

      for (let i = 0; i < images.length; i++) {
        let imageUrl = images[i];

        // 이미지 압축 (Base64인 경우)
        if (imageUrl.startsWith('data:image')) {
          console.log(`📦 Original image ${i + 1} size:`, formatBase64Size(imageUrl));

          try {
            // 최대 1200px, 품질 0.85로 압축 (Firestore 1MB 제한 고려)
            imageUrl = await compressImage(imageUrl, 1200, 1200, 0.85);
            const compressedSize = formatBase64Size(imageUrl);
            console.log(`✅ Compressed image ${i + 1} size:`, compressedSize);

            // 압축 후에도 너무 크면 경고
            const sizeInKB = getBase64Size(imageUrl) / 1024;
            if (sizeInKB > 800) {
              console.warn(`⚠️ Compressed image ${i + 1} is still large:`, Math.round(sizeInKB), 'KB');
            }
          } catch (compressionError) {
            console.warn(`⚠️ Image ${i + 1} compression failed:`, compressionError.message);
          }
        }

        compressedImages.push(imageUrl);
        setUploadProgress(10 + ((i + 1) / images.length) * 20);
      }

      // Firebase Storage 시도 (실패하면 Base64 사용)
      if (useFirebase && storageService) {
        try {
          setUploadProgress(40);
          imageUrl = await storageService.uploadImage(
            imageUrl,
            'posts',
            (progress) => setUploadProgress(40 + (progress * 0.5))
          );
          setUploadProgress(90);
          console.log('✅ Image uploaded to Storage');
        } catch (storageError) {
          console.warn('⚠️ Storage upload failed, using Base64 fallback:', storageError.message);
          // Storage 실패 시 압축된 Base64 사용
        }
      }

      const newPostData = {
        images: compressedImages, // 여러 이미지 지원
        imageUrl: compressedImages[0], // 하위 호환성을 위해 첫 번째 이미지
        petName: post.petName,
        description: post.description || '',
        author: currentUser?.nickname || 'Anonymous',
        authorId: currentUser?.id || 'anonymous',
        authorProfileImage: currentUser?.profileImage || null,
      };

      if (!useFirebase) {
        throw new Error('Firestore가 필요합니다');
      }

      // Firebase에 저장
      setUploadProgress(95);
      console.log('📝 Attempting to save post to Firestore...');
      console.log('📦 Post data size (approx):', Math.round(JSON.stringify(newPostData).length / 1024), 'KB');

      await firestoreService.createPost(newPostData);
      setUploadProgress(100);
      console.log('✅ Post saved to Firestore successfully!');
    } catch (error) {
      console.error('❌ Add post error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      throw error;
    } finally {
      setTimeout(() => setUploadProgress(0), 500);
    }
  };

  // ====== 게시물 수정 ======

  const updatePost = async (postId, updates) => {
    if (!useFirebase) {
      throw new Error('Firestore가 필요합니다');
    }

    try {
      await firestoreService.updatePost(postId, updates);
    } catch (error) {
      console.error('Update post error:', error);
      throw error;
    }
  };

  // ====== 게시물 삭제 ======

  const deletePost = async (postId) => {
    if (!useFirebase) {
      throw new Error('Firestore가 필요합니다');
    }

    try {
      await firestoreService.deletePost(postId);
    } catch (error) {
      console.error('Delete post error:', error);
      throw error;
    }
  };

  // 다른 사용자에게 알림 보내기 (Firestore 저장)
  const sendNotificationToUser = async (targetUserId, notification) => {
    try {
      await firestoreService.createNotification({
        ...notification,
        targetUserId,
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  };

  // ====== 좋아요 토글 ======

  const toggleLike = async (postId) => {
    try {
      // 비회원용 디바이스 ID (localStorage 기반)
      let deviceId = localStorage.getItem('peto_deviceId');
      if (!deviceId) {
        deviceId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('peto_deviceId', deviceId);
      }

      const userId = currentUser?.id || deviceId;
      const post = posts.find(p => p.id === postId);

      // 비회원은 localStorage에서 좋아요 상태 확인
      let isLiked;
      if (!currentUser) {
        const guestLikes = JSON.parse(localStorage.getItem('peto_guestLikes') || '[]');
        isLiked = guestLikes.includes(postId);
      } else {
        isLiked = post?.likedBy?.includes(userId);
      }

      // 좋아요 추가 시 게시물 작성자에게 알림 (본인 게시물 제외, 비회원 제외)
      if (!isLiked && post && post.authorId !== userId && currentUser) {
        sendNotificationToUser(post.authorId, {
          type: 'like',
          postId: postId,
          postImage: post.imageUrl,
          fromUser: currentUser.nickname,
          fromUserId: userId,
          message: `${currentUser.nickname}님이 회원님의 게시물을 좋아합니다`,
          targetUserId: post.authorId,
        });
      }

      if (!useFirebase) {
        throw new Error('Firestore가 필요합니다');
      }

      // 비회원인 경우 localStorage에 저장
      if (!currentUser) {
        const guestLikes = JSON.parse(localStorage.getItem('peto_guestLikes') || '[]');
        if (isLiked) {
          // 좋아요 취소
          const updatedLikes = guestLikes.filter(id => id !== postId);
          localStorage.setItem('peto_guestLikes', JSON.stringify(updatedLikes));
        } else {
          // 좋아요 추가
          guestLikes.push(postId);
          localStorage.setItem('peto_guestLikes', JSON.stringify(guestLikes));
        }
      }

      await firestoreService.toggleLike(postId, userId, isLiked);
    } catch (error) {
      console.error('Toggle like error:', error);
      throw error;
    }
  };

  // ====== 댓글 추가 ======

  const addComment = async (postId, comment) => {
    try {
      const userId = currentUser?.id || 'anonymous';
      const post = posts.find(p => p.id === postId);

      const newComment = {
        id: Date.now().toString(),
        text: comment,
        author: currentUser?.nickname || 'Anonymous',
        authorId: userId,
        createdAt: new Date().toISOString(),
      };

      // 댓글 추가 시 게시물 작성자에게 알림 (본인 게시물 제외)
      if (post && post.authorId !== userId) {
        sendNotificationToUser(post.authorId, {
          type: 'comment',
          postId: postId,
          postImage: post.imageUrl,
          fromUser: currentUser?.nickname || 'Someone',
          fromUserId: userId,
          message: `${currentUser?.nickname || 'Someone'}님이 댓글을 남겼습니다: "${comment.length > 30 ? comment.substring(0, 30) + '...' : comment}"`,
          targetUserId: post.authorId,
        });
      }

      if (!useFirebase) {
        throw new Error('Firestore가 필요합니다');
      }

      await firestoreService.addComment(postId, newComment);
    } catch (error) {
      console.error('Add comment error:', error);
      throw error;
    }
  };

  // ====== 댓글 수정 ======

  const updateComment = async (postId, commentId, newText) => {
    if (!useFirebase) {
      throw new Error('Firestore가 필요합니다');
    }

    try {
      await firestoreService.updateComment(postId, commentId, newText);
    } catch (error) {
      console.error('Update comment error:', error);
      throw error;
    }
  };

  // ====== 댓글 삭제 ======

  const deleteComment = async (postId, commentId) => {
    if (!useFirebase) {
      throw new Error('Firestore가 필요합니다');
    }

    try {
      await firestoreService.deleteComment(postId, commentId);
    } catch (error) {
      console.error('Delete comment error:', error);
      throw error;
    }
  };

  return (
    <PostContext.Provider
      value={{
        posts,
        loading,
        uploadProgress,
        useFirebase,
        addPost,
        updatePost,
        toggleLike,
        addComment,
        updateComment,
        deleteComment,
        deletePost,
      }}
    >
      {children}
    </PostContext.Provider>
  );
};
