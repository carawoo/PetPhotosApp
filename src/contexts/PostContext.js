import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { compressImage, formatBase64Size } from '../utils/imageCompression';

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
      let imageUrl = post.imageUrl;

      // 이미지 압축 (Base64인 경우)
      if (imageUrl.startsWith('data:image')) {
        console.log('📦 Original image size:', formatBase64Size(imageUrl));
        setUploadProgress(10);

        try {
          imageUrl = await compressImage(imageUrl);
          console.log('✅ Compressed image size:', formatBase64Size(imageUrl));
          setUploadProgress(30);
        } catch (compressionError) {
          console.warn('⚠️ Image compression failed, using original:', compressionError.message);
          // 압축 실패 시 원본 사용 (에러는 발생시키지 않음)
        }
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
        imageUrl,
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
      await firestoreService.createPost(newPostData);
      setUploadProgress(100);
      console.log('✅ Post saved to Firestore');
    } catch (error) {
      console.error('Add post error:', error);
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
      const userId = currentUser?.id || 'anonymous';
      const post = posts.find(p => p.id === postId);
      const isLiked = post?.likedBy?.includes(userId);

      // 좋아요 추가 시 게시물 작성자에게 알림 (본인 게시물 제외)
      if (!isLiked && post && post.authorId !== userId) {
        sendNotificationToUser(post.authorId, {
          type: 'like',
          postId: postId,
          postImage: post.imageUrl,
          fromUser: currentUser?.nickname || 'Someone',
          fromUserId: userId,
          message: `${currentUser?.nickname || 'Someone'}님이 회원님의 게시물을 좋아합니다`,
          targetUserId: post.authorId,
        });
      }

      if (!useFirebase) {
        throw new Error('Firestore가 필요합니다');
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
