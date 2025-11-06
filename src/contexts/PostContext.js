import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { compressImage, formatBase64Size } from '../utils/imageCompression';

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

  // 데이터 로드
  useEffect(() => {
    if (useFirebase) {
      // Firebase 실시간 리스너
      const unsubscribe = firestoreService.subscribeToPosts((fetchedPosts) => {
        setPosts(fetchedPosts);
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      // localStorage에서 로드
      loadPostsFromLocalStorage();
    }
  }, [useFirebase]);

  // ====== localStorage 함수들 ======

  const loadPostsFromLocalStorage = () => {
    try {
      const savedPosts = localStorage.getItem('petPhotos_posts');

      if (!savedPosts || savedPosts === 'undefined' || savedPosts === 'null') {
        setPosts([]);
        localStorage.setItem('petPhotos_posts', '[]');
        setLoading(false);
        return;
      }

      let parsedPosts;
      try {
        parsedPosts = JSON.parse(savedPosts);
      } catch (parseError) {
        console.error('Invalid JSON, resetting posts');
        setPosts([]);
        localStorage.setItem('petPhotos_posts', '[]');
        setLoading(false);
        return;
      }

      if (!Array.isArray(parsedPosts)) {
        setPosts([]);
        localStorage.setItem('petPhotos_posts', '[]');
        setLoading(false);
        return;
      }

      const validPosts = filterValidPosts(parsedPosts);

      if (validPosts.length !== parsedPosts.length) {
        console.log(`Filtered out ${parsedPosts.length - validPosts.length} invalid posts`);
        savePostsToLocalStorage(validPosts);
      }

      setPosts(validPosts);
    } catch (error) {
      console.error('Load posts error:', error);
      setPosts([]);
      localStorage.setItem('petPhotos_posts', '[]');
    } finally {
      setLoading(false);
    }
  };

  const savePostsToLocalStorage = (postsToSave) => {
    try {
      const dataToSave = JSON.stringify(postsToSave);
      localStorage.setItem('petPhotos_posts', dataToSave);
    } catch (error) {
      if (
        error.name === 'QuotaExceededError' ||
        error.code === 22 ||
        error.code === 1014
      ) {
        console.error('localStorage quota exceeded');

        if (postsToSave.length > 10) {
          const recentPosts = [...postsToSave]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 20);

          try {
            localStorage.setItem('petPhotos_posts', JSON.stringify(recentPosts));
            setPosts(recentPosts);

            if (typeof window !== 'undefined' && window.alert) {
              window.alert(
                '저장 공간이 부족하여 오래된 게시물이 자동으로 삭제되었습니다.\n' +
                `최근 ${recentPosts.length}개의 게시물만 유지됩니다.`
              );
            }
            return;
          } catch (retryError) {
            console.error('Failed to save even after cleanup:', retryError);
          }
        }

        if (typeof window !== 'undefined' && window.alert) {
          window.alert(
            '저장 공간이 부족합니다.\n' +
            '브라우저 설정에서 사이트 데이터를 삭제하거나,\n' +
            '일부 게시물을 삭제해주세요.'
          );
        }
      } else {
        console.error('Failed to save posts:', error);
        if (typeof window !== 'undefined' && window.alert) {
          window.alert('게시물 저장 중 오류가 발생했습니다.');
        }
      }
    }
  };

  const filterValidPosts = (postsArray) => {
    return postsArray.filter(post => {
      if (!post?.id || !post?.imageUrl || !post?.author || !post?.petName || !post?.createdAt) {
        return false;
      }
      if (!post.imageUrl.startsWith('data:') && !post.imageUrl.startsWith('http://') && !post.imageUrl.startsWith('https://')) {
        console.warn('Invalid image URL format:', post.id, post.imageUrl.substring(0, 50));
        return false;
      }
      if (post.description) {
        if (typeof post.description !== 'string' || post.description.trim().length < 2) {
          return false;
        }
      }
      return true;
    });
  };

  const updateAndSaveToLocalStorage = (updatedPosts) => {
    const validPosts = filterValidPosts(updatedPosts);
    setPosts(validPosts);
    savePostsToLocalStorage(validPosts);
  };

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
      };

      if (useFirebase) {
        // Firebase에 저장
        setUploadProgress(95);
        await firestoreService.createPost(newPostData);
        setUploadProgress(100);
        console.log('✅ Post saved to Firestore');
      } else {
        // localStorage에 저장
        const newPost = {
          ...newPostData,
          id: Date.now().toString(),
          likes: 0,
          likedBy: [],
          comments: [],
          createdAt: new Date().toISOString(),
        };
        const updatedPosts = [newPost, ...posts];
        updateAndSaveToLocalStorage(updatedPosts);
        setUploadProgress(100);
      }
    } catch (error) {
      console.error('Add post error:', error);
      throw error;
    } finally {
      setTimeout(() => setUploadProgress(0), 500);
    }
  };

  // ====== 게시물 수정 ======

  const updatePost = async (postId, updates) => {
    try {
      if (useFirebase) {
        await firestoreService.updatePost(postId, updates);
      } else {
        const updatedPosts = posts.map(post =>
          post.id === postId
            ? { ...post, ...updates, updatedAt: new Date().toISOString() }
            : post
        );
        updateAndSaveToLocalStorage(updatedPosts);
      }
    } catch (error) {
      console.error('Update post error:', error);
      throw error;
    }
  };

  // ====== 게시물 삭제 ======

  const deletePost = async (postId) => {
    try {
      if (useFirebase) {
        await firestoreService.deletePost(postId);
      } else {
        const updatedPosts = posts.filter(post => post.id !== postId);
        updateAndSaveToLocalStorage(updatedPosts);
      }
    } catch (error) {
      console.error('Delete post error:', error);
      throw error;
    }
  };

  // ====== 좋아요 토글 ======

  const toggleLike = async (postId) => {
    try {
      const userId = currentUser?.id || 'anonymous';

      if (useFirebase) {
        const post = posts.find(p => p.id === postId);
        const isLiked = post?.likedBy?.includes(userId);
        await firestoreService.toggleLike(postId, userId, isLiked);
      } else {
        const updatedPosts = posts.map(post => {
          if (post.id === postId) {
            const isLiked = post.likedBy?.includes(userId);
            return {
              ...post,
              likes: isLiked ? (post.likes || 1) - 1 : (post.likes || 0) + 1,
              likedBy: isLiked
                ? (post.likedBy || []).filter(id => id !== userId)
                : [...(post.likedBy || []), userId],
            };
          }
          return post;
        });
        updateAndSaveToLocalStorage(updatedPosts);
      }
    } catch (error) {
      console.error('Toggle like error:', error);
      throw error;
    }
  };

  // ====== 댓글 추가 ======

  const addComment = async (postId, comment) => {
    try {
      const newComment = {
        id: Date.now().toString(),
        text: comment,
        author: currentUser?.nickname || 'Anonymous',
        authorId: currentUser?.id || 'anonymous',
        createdAt: new Date().toISOString(),
      };

      if (useFirebase) {
        await firestoreService.addComment(postId, newComment);
      } else {
        const updatedPosts = posts.map(post =>
          post.id === postId
            ? { ...post, comments: [...(post.comments || []), newComment] }
            : post
        );
        updateAndSaveToLocalStorage(updatedPosts);
      }
    } catch (error) {
      console.error('Add comment error:', error);
      throw error;
    }
  };

  // ====== 댓글 수정 ======

  const updateComment = async (postId, commentId, newText) => {
    try {
      if (useFirebase) {
        await firestoreService.updateComment(postId, commentId, newText);
      } else {
        const updatedPosts = posts.map(post =>
          post.id === postId
            ? {
                ...post,
                comments: (post.comments || []).map(comment =>
                  comment.id === commentId
                    ? { ...comment, text: newText, updatedAt: new Date().toISOString() }
                    : comment
                ),
              }
            : post
        );
        updateAndSaveToLocalStorage(updatedPosts);
      }
    } catch (error) {
      console.error('Update comment error:', error);
      throw error;
    }
  };

  // ====== 댓글 삭제 ======

  const deleteComment = async (postId, commentId) => {
    try {
      if (useFirebase) {
        await firestoreService.deleteComment(postId, commentId);
      } else {
        const updatedPosts = posts.map(post =>
          post.id === postId
            ? { ...post, comments: (post.comments || []).filter(c => c.id !== commentId) }
            : post
        );
        updateAndSaveToLocalStorage(updatedPosts);
      }
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
