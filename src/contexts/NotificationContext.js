import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

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

  // 알림 로드
  useEffect(() => {
    if (currentUser) {
      loadNotifications();

      // localStorage 변경 감지 (다른 탭이나 다른 사용자의 동작으로 알림 추가됨)
      const handleStorageChange = (e) => {
        if (e.key === `notifications_${currentUser.id}`) {
          loadNotifications();
        }
      };

      window.addEventListener('storage', handleStorageChange);

      // 주기적으로 알림 체크 (같은 탭에서의 변경사항 감지)
      const interval = setInterval(() => {
        loadNotifications();
      }, 3000); // 3초마다 체크

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        clearInterval(interval);
      };
    }
  }, [currentUser]);

  const loadNotifications = () => {
    try {
      const saved = localStorage.getItem(`notifications_${currentUser?.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setNotifications(parsed);
        const unread = parsed.filter(n => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const saveNotifications = (notifs) => {
    try {
      localStorage.setItem(`notifications_${currentUser?.id}`, JSON.stringify(notifs));
      const unread = notifs.filter(n => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Failed to save notifications:', error);
    }
  };

  // 알림 추가
  const addNotification = (notification) => {
    if (!currentUser) return;

    // targetUserId가 현재 사용자가 아니면 알림을 추가하지 않음
    // (다른 사용자의 알림이므로 현재 사용자에게 보여지면 안됨)
    if (notification.targetUserId && notification.targetUserId !== currentUser.id) {
      return;
    }

    const newNotification = {
      id: Date.now().toString(),
      ...notification,
      read: false,
      createdAt: new Date().toISOString(),
    };

    const updated = [newNotification, ...notifications];
    setNotifications(updated);
    saveNotifications(updated);
  };

  // 알림 읽음 처리
  const markAsRead = (notificationId) => {
    const updated = notifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    setNotifications(updated);
    saveNotifications(updated);
  };

  // 모든 알림 읽음 처리
  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    saveNotifications(updated);
  };

  // 알림 삭제
  const deleteNotification = (notificationId) => {
    const updated = notifications.filter(n => n.id !== notificationId);
    setNotifications(updated);
    saveNotifications(updated);
  };

  // 모든 알림 삭제
  const clearAllNotifications = () => {
    setNotifications([]);
    saveNotifications([]);
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
