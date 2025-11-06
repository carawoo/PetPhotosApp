import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';

// ====== 게시물 관련 ======

/**
 * 모든 게시물 가져오기 (실시간 리스너)
 */
export const subscribeToPosts = (callback, limitCount = 50) => {
  const q = query(
    collection(db, 'posts'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    }));
    callback(posts);
  }, (error) => {
    console.error('Posts subscription error:', error);
    callback([]);
  });
};

/**
 * 게시물 추가
 */
export const createPost = async (postData) => {
  try {
    const docRef = await addDoc(collection(db, 'posts'), {
      ...postData,
      likes: 0,
      likedBy: [],
      comments: [],
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Create post error:', error);
    throw error;
  }
};

/**
 * 게시물 수정
 */
export const updatePost = async (postId, updates) => {
  try {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Update post error:', error);
    throw error;
  }
};

/**
 * 게시물 삭제
 */
export const deletePost = async (postId) => {
  try {
    await deleteDoc(doc(db, 'posts', postId));
  } catch (error) {
    console.error('Delete post error:', error);
    throw error;
  }
};

/**
 * 좋아요 토글
 */
export const toggleLike = async (postId, userId, isLiked) => {
  try {
    const postRef = doc(db, 'posts', postId);

    if (isLiked) {
      // 좋아요 취소
      await updateDoc(postRef, {
        likes: increment(-1),
        likedBy: arrayRemove(userId),
      });
    } else {
      // 좋아요
      await updateDoc(postRef, {
        likes: increment(1),
        likedBy: arrayUnion(userId),
      });
    }
  } catch (error) {
    console.error('Toggle like error:', error);
    throw error;
  }
};

/**
 * 댓글 추가
 */
export const addComment = async (postId, comment) => {
  try {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      comments: arrayUnion({
        ...comment,
        createdAt: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error('Add comment error:', error);
    throw error;
  }
};

/**
 * 댓글 수정
 */
export const updateComment = async (postId, commentId, newText) => {
  try {
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);

    if (postSnap.exists()) {
      const post = postSnap.data();
      const updatedComments = post.comments.map(comment =>
        comment.id === commentId
          ? { ...comment, text: newText, updatedAt: new Date().toISOString() }
          : comment
      );

      await updateDoc(postRef, { comments: updatedComments });
    }
  } catch (error) {
    console.error('Update comment error:', error);
    throw error;
  }
};

/**
 * 댓글 삭제
 */
export const deleteComment = async (postId, commentId) => {
  try {
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);

    if (postSnap.exists()) {
      const post = postSnap.data();
      const updatedComments = post.comments.filter(c => c.id !== commentId);
      await updateDoc(postRef, { comments: updatedComments });
    }
  } catch (error) {
    console.error('Delete comment error:', error);
    throw error;
  }
};

// ====== 사용자 관련 ======

/**
 * 사용자 생성
 */
export const createUser = async (userId, userData) => {
  try {
    await setDoc(doc(db, 'users', userId), {
      ...userData,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Create user error:', error);
    throw error;
  }
};

/**
 * 사용자 정보 가져오기
 */
export const getUser = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : null;
  } catch (error) {
    console.error('Get user error:', error);
    throw error;
  }
};
