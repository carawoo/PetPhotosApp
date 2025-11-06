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
      if (savedPosts) {
        const parsedPosts = JSON.parse(savedPosts);
        // blob URL을 가진 게시물 필터링 (페이지 새로고침 후에는 작동하지 않음)
        const validPosts = parsedPosts.filter(post => {
          if (post.imageUrl && post.imageUrl.startsWith('blob:')) {
            console.warn('Removing post with invalid blob URL:', post.id);
            return false;
          }
          return true;
        });

        // 필터링된 게시물이 원본과 다르면 저장
        if (validPosts.length !== parsedPosts.length) {
          savePosts(validPosts);
        }

        setPosts(validPosts);
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePosts = (postsToSave) => {
    try {
      localStorage.setItem('petPhotos_posts', JSON.stringify(postsToSave));
    } catch (error) {
      console.error('Failed to save posts:', error);
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

  // 좋아요 토글
  const toggleLike = (postId) => {
    const userId = currentUser?.id || 'anonymous';
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        const isLiked = post.likedBy.includes(userId);
        return {
          ...post,
          likes: isLiked ? post.likes - 1 : post.likes + 1,
          likedBy: isLiked
            ? post.likedBy.filter(id => id !== userId)
            : [...post.likedBy, userId],
        };
      }
      return post;
    });
    setPosts(updatedPosts);
    savePosts(updatedPosts);
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
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [...(post.comments || []), newComment],
        };
      }
      return post;
    });
    setPosts(updatedPosts);
    savePosts(updatedPosts);
  };

  // 댓글 수정
  const updateComment = (postId, commentId, newText) => {
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: post.comments.map(comment =>
            comment.id === commentId
              ? { ...comment, text: newText, updatedAt: new Date().toISOString() }
              : comment
          ),
        };
      }
      return post;
    });
    setPosts(updatedPosts);
    savePosts(updatedPosts);
  };

  // 댓글 삭제
  const deleteComment = (postId, commentId) => {
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: post.comments.filter(comment => comment.id !== commentId),
        };
      }
      return post;
    });
    setPosts(updatedPosts);
    savePosts(updatedPosts);
  };

  // 게시물 삭제
  const deletePost = (postId) => {
    const updatedPosts = posts.filter(post => post.id !== postId);
    setPosts(updatedPosts);
    savePosts(updatedPosts);
  };

  return (
    <PostContext.Provider
      value={{
        posts,
        loading,
        addPost,
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
