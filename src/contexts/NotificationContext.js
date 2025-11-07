import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import * as firestoreService from '../services/firestore.service';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { currentUser } = useAuth();

  // 알림 로드 (Firestore 실시간 구독)
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Firestore 실시간 구독
    const unsubscribe = firestoreService.subscribeToUserNotifications(
      currentUser.id,
      (fetchedNotifications) => {
        setNotifications(fetchedNotifications);
        const unread = fetchedNotifications.filter(n => !n.read).length;
        setUnreadCount(unread);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser]);

  // 알림 추가
  const addNotification = async (notification) => {
    if (!currentUser) return;

    // targetUserId가 현재 사용자가 아니면 알림을 추가하지 않음
    if (notification.targetUserId && notification.targetUserId !== currentUser.id) {
      return;
    }

    try {
      await firestoreService.createNotification({
        ...notification,
        targetUserId: notification.targetUserId || currentUser.id,
      });
    } catch (error) {
      console.error('Failed to add notification:', error);
    }
  };

  // 알림 읽음 처리
  const markAsRead = async (notificationId) => {
    try {
      await firestoreService.markNotificationAsRead(notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // 모든 알림 읽음 처리
  const markAllAsRead = async () => {
    if (!currentUser) return;

    try {
      await firestoreService.markAllNotificationsAsRead(currentUser.id);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // 알림 삭제
  const deleteNotification = async (notificationId) => {
    try {
      await firestoreService.deleteNotification(notificationId);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  // 모든 알림 삭제
  const clearAllNotifications = async () => {
    if (!currentUser) return;

    try {
      await firestoreService.clearAllUserNotifications(currentUser.id);
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
