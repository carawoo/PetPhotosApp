import React, { createContext, useState, useContext, useEffect } from 'react';

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

  // 로컬 스토리지에서 데이터 로드
  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = () => {
    try {
      const savedPosts = localStorage.getItem('petPhotos_posts');
      if (savedPosts) {
        setPosts(JSON.parse(savedPosts));
      } else {
        // 초기 데모 데이터
        const demoPosts = [
          {
            id: '1',
            imageUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400',
            petName: '멍멍이',
            description: '오늘 산책 나왔어요! 🐕',
            likes: 42,
            likedBy: [],
            comments: [],
            createdAt: new Date().toISOString(),
          },
          {
            id: '2',
            imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400',
            petName: '냥냥이',
            description: '낮잠 자는 중 😺',
            likes: 38,
            likedBy: [],
            comments: [],
            createdAt: new Date().toISOString(),
          },
        ];
        setPosts(demoPosts);
        savePosts(demoPosts);
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
  const toggleLike = (postId, userId = 'currentUser') => {
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
      author: '나',
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
        deletePost,
      }}
    >
      {children}
    </PostContext.Provider>
  );
};
