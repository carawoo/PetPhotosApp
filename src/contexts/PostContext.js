import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

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
  const { currentUser } = useAuth();

  // 로컬 스토리지에서 데이터 로드
  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = () => {
    try {
      const savedPosts = localStorage.getItem('petPhotos_posts');

      // 없거나 비정상적인 경우 빈 배열로 초기화
      if (!savedPosts || savedPosts === 'undefined' || savedPosts === 'null') {
        setPosts([]);
        localStorage.setItem('petPhotos_posts', '[]');
        setLoading(false);
        return;
      }

      // JSON 파싱
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

      // 배열이 아니면 초기화
      if (!Array.isArray(parsedPosts)) {
        setPosts([]);
        localStorage.setItem('petPhotos_posts', '[]');
        setLoading(false);
        return;
      }

      // 유효한 게시물만 필터링
      const validPosts = filterValidPosts(parsedPosts);

      // 변경사항이 있으면 저장
      if (validPosts.length !== parsedPosts.length) {
        console.log(`Filtered out ${parsedPosts.length - validPosts.length} invalid posts`);
        savePosts(validPosts);
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

  const savePosts = (postsToSave) => {
    try {
      const dataToSave = JSON.stringify(postsToSave);
      localStorage.setItem('petPhotos_posts', dataToSave);
    } catch (error) {
      // Check if it's a quota exceeded error
      if (
        error.name === 'QuotaExceededError' ||
        error.code === 22 ||
        error.code === 1014
      ) {
        console.error('localStorage quota exceeded');

        // Try to free up space by removing oldest posts
        if (postsToSave.length > 10) {
          // Sort by creation date and keep only the 20 most recent posts
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

        // If we still can't save, alert the user
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

  // 새 게시물 추가
  const addPost = (post) => {
    const newPost = {
      ...post,
      id: Date.now().toString(),
      author: currentUser?.nickname || 'Anonymous',
      authorId: currentUser?.id || 'anonymous',
      likes: 0,
      likedBy: [],
      comments: [],
      createdAt: new Date().toISOString(),
    };
    const updatedPosts = [newPost, ...posts];
    setPosts(updatedPosts);
    savePosts(updatedPosts);
  };

  // 유효한 게시물만 필터링
  const filterValidPosts = (postsArray) => {
    return postsArray.filter(post => {
      // 필수 필드 체크
      if (!post?.id || !post?.imageUrl || !post?.author || !post?.petName || !post?.createdAt) {
        return false;
      }
      // 이미지 URL이 base64 또는 http/https로 시작하는지 확인
      if (!post.imageUrl.startsWith('data:') && !post.imageUrl.startsWith('http://') && !post.imageUrl.startsWith('https://')) {
        console.warn('Invalid image URL format:', post.id, post.imageUrl.substring(0, 50));
        return false;
      }
      // description이 있으면 유효성 체크
      if (post.description) {
        if (typeof post.description !== 'string' || post.description.trim().length < 2) {
          return false;
        }
      }
      return true;
    });
  };

  // 업데이트 후 자동 정리
  const updateAndSave = (updatedPosts) => {
    const validPosts = filterValidPosts(updatedPosts);
    setPosts(validPosts);
    savePosts(validPosts);
  };

  // 좋아요 토글
  const toggleLike = (postId) => {
    const userId = currentUser?.id || 'anonymous';
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
    updateAndSave(updatedPosts);
  };

  // 댓글 추가
  const addComment = (postId, comment) => {
    const newComment = {
      id: Date.now().toString(),
      text: comment,
      author: currentUser?.nickname || 'Anonymous',
      authorId: currentUser?.id || 'anonymous',
      createdAt: new Date().toISOString(),
    };
    const updatedPosts = posts.map(post =>
      post.id === postId
        ? { ...post, comments: [...(post.comments || []), newComment] }
        : post
    );
    updateAndSave(updatedPosts);
  };

  // 댓글 수정
  const updateComment = (postId, commentId, newText) => {
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
    updateAndSave(updatedPosts);
  };

  // 댓글 삭제
  const deleteComment = (postId, commentId) => {
    const updatedPosts = posts.map(post =>
      post.id === postId
        ? { ...post, comments: (post.comments || []).filter(c => c.id !== commentId) }
        : post
    );
    updateAndSave(updatedPosts);
  };

  // 게시물 수정
  const updatePost = (postId, updates) => {
    const updatedPosts = posts.map(post =>
      post.id === postId
        ? { ...post, ...updates, updatedAt: new Date().toISOString() }
        : post
    );
    updateAndSave(updatedPosts);
  };

  // 게시물 삭제
  const deletePost = (postId) => {
    const updatedPosts = posts.filter(post => post.id !== postId);
    updateAndSave(updatedPosts);
  };

  return (
    <PostContext.Provider
      value={{
        posts,
        loading,
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
