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
 * 모든 게시물 삭제 (관리자용)
 */
export const deleteAllPosts = async () => {
  try {
    const q = query(collection(db, 'posts'));
    const snapshot = await getDocs(q);

    let deleted = 0;
    const deletePromises = snapshot.docs.map(async (docSnapshot) => {
      await deleteDoc(docSnapshot.ref);
      deleted++;
    });

    await Promise.all(deletePromises);
    console.log(`✅ Deleted ${deleted} posts from Firestore`);
    return { success: true, deleted };
  } catch (error) {
    console.error('Delete all posts error:', error);
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

/**
 * 모든 사용자 가져오기 (관리자용)
 */
export const subscribeToAllUsers = (callback, limitCount = 100) => {
  const q = query(
    collection(db, 'users'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  return onSnapshot(q, (snapshot) => {
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    }));
    callback(users);
  }, (error) => {
    console.error('Users subscription error:', error);
    callback([]);
  });
};

/**
 * 사용자 정보 업데이트
 */
export const updateUser = async (userId, updates) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Update user error:', error);
    throw error;
  }
};

// ====== 신고 관련 ======

/**
 * 신고 추가
 */
export const createReport = async (reportData) => {
  try {
    const docRef = await addDoc(collection(db, 'reports'), {
      ...reportData,
      status: 'pending', // pending, reviewed, resolved
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Create report error:', error);
    throw error;
  }
};

/**
 * 모든 신고 가져오기 (관리자용)
 */
export const subscribeToReports = (callback, limitCount = 100) => {
  const q = query(
    collection(db, 'reports'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  return onSnapshot(q, (snapshot) => {
    const reports = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    }));
    callback(reports);
  }, (error) => {
    console.error('Reports subscription error:', error);
    callback([]);
  });
};

/**
 * 신고 상태 업데이트
 */
export const updateReportStatus = async (reportId, status, adminNote) => {
  try {
    const reportRef = doc(db, 'reports', reportId);
    await updateDoc(reportRef, {
      status,
      adminNote: adminNote || '',
      resolvedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Update report status error:', error);
    throw error;
  }
};

/**
 * 신고 삭제
 */
export const deleteReport = async (reportId) => {
  try {
    await deleteDoc(doc(db, 'reports', reportId));
  } catch (error) {
    console.error('Delete report error:', error);
    throw error;
  }
};

// ====== 문의 관련 ======

/**
 * 문의 추가
 */
export const createInquiry = async (inquiryData) => {
  try {
    const docRef = await addDoc(collection(db, 'inquiries'), {
      ...inquiryData,
      status: 'pending', // pending, answered
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Create inquiry error:', error);
    throw error;
  }
};

/**
 * 사용자의 문의 목록 가져오기
 */
export const subscribeToUserInquiries = (userId, callback) => {
  const q = query(
    collection(db, 'inquiries'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const inquiries = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      }))
      .filter(inquiry => inquiry.userId === userId);
    callback(inquiries);
  }, (error) => {
    console.error('User inquiries subscription error:', error);
    callback([]);
  });
};

/**
 * 모든 문의 가져오기 (관리자용)
 */
export const subscribeToAllInquiries = (callback, limitCount = 100) => {
  const q = query(
    collection(db, 'inquiries'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  return onSnapshot(q, (snapshot) => {
    const inquiries = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    }));
    callback(inquiries);
  }, (error) => {
    console.error('All inquiries subscription error:', error);
    callback([]);
  });
};

/**
 * 문의에 답변 추가
 */
export const answerInquiry = async (inquiryId, answer, adminId) => {
  try {
    const inquiryRef = doc(db, 'inquiries', inquiryId);
    await updateDoc(inquiryRef, {
      status: 'answered',
      answer,
      adminId,
      answeredAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Answer inquiry error:', error);
    throw error;
  }
};

/**
 * 문의 삭제
 */
export const deleteInquiry = async (inquiryId) => {
  try {
    await deleteDoc(doc(db, 'inquiries', inquiryId));
  } catch (error) {
    console.error('Delete inquiry error:', error);
    throw error;
  }
};

// ====== 사용자 제재 관련 ======

/**
 * 사용자 제재
 */
export const banUser = async (userId, reason, duration) => {
  try {
    const userRef = doc(db, 'users', userId);
    const banUntil = duration === 'permanent'
      ? null
      : new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString();

    await updateDoc(userRef, {
      isBanned: true,
      banReason: reason,
      banUntil: banUntil,
      bannedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Ban user error:', error);
    throw error;
  }
};

/**
 * 사용자 제재 해제
 */
export const unbanUser = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isBanned: false,
      banReason: null,
      banUntil: null,
      unbannedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Unban user error:', error);
    throw error;
  }
};

// ====== 알림 관련 ======

/**
 * 사용자 알림 구독 (실시간)
 */
export const subscribeToUserNotifications = (userId, callback) => {
  const q = query(
    collection(db, 'notifications'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      }))
      .filter(notification => notification.targetUserId === userId);
    callback(notifications);
  }, (error) => {
    console.error('Notifications subscription error:', error);
    callback([]);
  });
};

/**
 * 알림 추가
 */
export const createNotification = async (notificationData) => {
  try {
    const docRef = await addDoc(collection(db, 'notifications'), {
      ...notificationData,
      read: false,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
};

/**
 * 알림 읽음 처리
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      read: true,
      readAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    throw error;
  }
};

/**
 * 모든 알림 읽음 처리
 */
export const markAllNotificationsAsRead = async (userId) => {
  try {
    const q = query(collection(db, 'notifications'));
    const snapshot = await getDocs(q);

    const updatePromises = snapshot.docs
      .filter(doc => doc.data().targetUserId === userId && !doc.data().read)
      .map(doc => updateDoc(doc.ref, {
        read: true,
        readAt: serverTimestamp(),
      }));

    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    throw error;
  }
};

/**
 * 알림 삭제
 */
export const deleteNotification = async (notificationId) => {
  try {
    await deleteDoc(doc(db, 'notifications', notificationId));
  } catch (error) {
    console.error('Delete notification error:', error);
    throw error;
  }
};

/**
 * 사용자의 모든 알림 삭제
 */
export const clearAllUserNotifications = async (userId) => {
  try {
    const q = query(collection(db, 'notifications'));
    const snapshot = await getDocs(q);

    const deletePromises = snapshot.docs
      .filter(doc => doc.data().targetUserId === userId)
      .map(doc => deleteDoc(doc.ref));

    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Clear all notifications error:', error);
    throw error;
  }
};
