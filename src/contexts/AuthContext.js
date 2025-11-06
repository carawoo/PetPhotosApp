import React, { createContext, useState, useContext, useEffect } from 'react';

// Firebase 서비스 (optional)
let firestoreService = null;
let useFirebase = false;

try {
  const firebaseConfig = require('../config/firebase.config');
  if (firebaseConfig.db) {
    firestoreService = require('../services/firestore.service');
    useFirebase = true;
    console.log('✅ Firebase enabled for Auth');
  }
} catch (error) {
  console.log('📦 Using localStorage mode for Auth');
}

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    try {
      const autoLogin = localStorage.getItem('petPhotos_autoLogin');
      if (autoLogin === 'true') {
        const user = localStorage.getItem('petPhotos_currentUser');
        if (user) {
          setCurrentUser(JSON.parse(user));
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // 모든 사용자 목록 가져오기
  const getAllUsers = () => {
    try {
      const users = localStorage.getItem('petPhotos_users');
      return users ? JSON.parse(users) : [];
    } catch (error) {
      console.error('Failed to get users:', error);
      return [];
    }
  };

  // 사용자 목록 저장
  const saveUsers = (users) => {
    try {
      localStorage.setItem('petPhotos_users', JSON.stringify(users));
    } catch (error) {
      console.error('Failed to save users:', error);
    }
  };

  // 닉네임 중복 체크
  const isNicknameAvailable = (nickname) => {
    const users = getAllUsers();
    return !users.some(user => user.nickname.toLowerCase() === nickname.toLowerCase());
  };

  // 회원가입
  const signup = async (nickname, password, autoLogin = true) => {
    try {
      // 닉네임 중복 체크
      if (!isNicknameAvailable(nickname)) {
        return { success: false, error: '이미 사용 중인 닉네임입니다.' };
      }

      const users = getAllUsers();
      const newUser = {
        id: Date.now().toString(),
        nickname,
        password, // 실제 앱에서는 해시해야 하지만, 데모용이므로 그대로 저장
        createdAt: new Date().toISOString(),
      };

      users.push(newUser);
      saveUsers(users);

      // Firestore에도 저장 (비밀번호 포함 - 브라우저 간 로그인 지원)
      if (useFirebase && firestoreService) {
        try {
          const userDataForFirestore = {
            nickname: newUser.nickname,
            password: newUser.password, // 브라우저 간 로그인을 위해 비밀번호도 저장
            createdAt: newUser.createdAt,
          };
          await firestoreService.createUser(newUser.id, userDataForFirestore);
          console.log('✅ User synced to Firestore (with password)');
        } catch (error) {
          console.warn('⚠️ Firestore user sync failed, continuing with localStorage:', error.message);
        }
      }

      // 자동 로그인
      const userWithoutPassword = { ...newUser };
      delete userWithoutPassword.password;
      setCurrentUser(userWithoutPassword);
      localStorage.setItem('petPhotos_currentUser', JSON.stringify(userWithoutPassword));
      localStorage.setItem('petPhotos_autoLogin', autoLogin.toString());

      return { success: true };
    } catch (error) {
      console.error('Signup failed:', error);
      return { success: false, error: '회원가입에 실패했습니다.' };
    }
  };

  // 로그인
  const login = async (nickname, password, autoLogin = true) => {
    try {
      // 1. 먼저 localStorage에서 확인
      const users = getAllUsers();
      let user = users.find(
        u => u.nickname.toLowerCase() === nickname.toLowerCase() && u.password === password
      );

      // 2. localStorage에 없으면 Firestore에서 확인
      if (!user && useFirebase && firestoreService) {
        try {
          console.log('🔍 Checking Firestore for user...');
          const { collection, query, where, getDocs } = require('firebase/firestore');
          const { db } = require('../config/firebase.config');

          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('nickname', '==', nickname));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const firestoreUser = querySnapshot.docs[0];
            const firestoreUserData = firestoreUser.data();

            // Firestore에 password 필드가 있는지 확인
            if (firestoreUserData.password && firestoreUserData.password === password) {
              console.log('✅ User found in Firestore');
              user = {
                id: firestoreUser.id,
                nickname: firestoreUserData.nickname,
                password: firestoreUserData.password,
                createdAt: firestoreUserData.createdAt,
                profileImage: firestoreUserData.profileImage,
                bio: firestoreUserData.bio,
              };

              // localStorage에도 저장 (다음번 로그인 시 빠르게 하기 위해)
              users.push(user);
              saveUsers(users);
              console.log('✅ User synced to localStorage');
            } else {
              console.warn('⚠️ User found in Firestore but password missing or incorrect');
            }
          } else {
            console.log('❌ User not found in Firestore');
          }
        } catch (error) {
          console.error('Firestore login check failed:', error);
        }
      }

      if (!user) {
        return { success: false, error: '닉네임 또는 비밀번호가 올바르지 않습니다.' };
      }

      const userWithoutPassword = { ...user };
      delete userWithoutPassword.password;
      setCurrentUser(userWithoutPassword);
      localStorage.setItem('petPhotos_currentUser', JSON.stringify(userWithoutPassword));
      localStorage.setItem('petPhotos_autoLogin', autoLogin.toString());

      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: '로그인에 실패했습니다.' };
    }
  };

  // 로그아웃
  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('petPhotos_currentUser');
  };

  // 프로필 이미지 업데이트
  const updateProfileImage = async (imageUrl) => {
    try {
      if (!currentUser) return { success: false, error: '로그인이 필요합니다.' };

      const updatedUser = { ...currentUser, profileImage: imageUrl };

      // 현재 사용자 업데이트
      setCurrentUser(updatedUser);
      localStorage.setItem('petPhotos_currentUser', JSON.stringify(updatedUser));

      // 사용자 목록에서도 업데이트
      const users = getAllUsers();
      const updatedUsers = users.map(user =>
        user.id === currentUser.id
          ? { ...user, profileImage: imageUrl }
          : user
      );
      saveUsers(updatedUsers);

      // Firestore에도 업데이트
      if (useFirebase && firestoreService) {
        try {
          const userRef = firestoreService.db ? require('firebase/firestore').doc(firestoreService.db, 'users', currentUser.id) : null;
          if (userRef) {
            await require('firebase/firestore').updateDoc(userRef, { profileImage: imageUrl });
            console.log('✅ Profile image synced to Firestore');
          }
        } catch (error) {
          console.warn('⚠️ Firestore profile image sync failed:', error.message);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to update profile image:', error);
      return { success: false, error: '프로필 이미지 업데이트 실패' };
    }
  };

  // 프로필 소개글 업데이트
  const updateProfileBio = async (bio) => {
    try {
      if (!currentUser) return { success: false, error: '로그인이 필요합니다.' };

      const updatedUser = { ...currentUser, bio };

      // 현재 사용자 업데이트
      setCurrentUser(updatedUser);
      localStorage.setItem('petPhotos_currentUser', JSON.stringify(updatedUser));

      // 사용자 목록에서도 업데이트
      const users = getAllUsers();
      const updatedUsers = users.map(user =>
        user.id === currentUser.id
          ? { ...user, bio }
          : user
      );
      saveUsers(updatedUsers);

      // Firestore에도 업데이트
      if (useFirebase && firestoreService) {
        try {
          const { doc, updateDoc } = require('firebase/firestore');
          const { db } = require('../config/firebase.config');
          const userRef = doc(db, 'users', currentUser.id);
          await updateDoc(userRef, { bio });
          console.log('✅ Bio synced to Firestore');
        } catch (error) {
          console.warn('⚠️ Firestore bio sync failed:', error.message);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to update bio:', error);
      return { success: false, error: '프로필 소개글 업데이트 실패' };
    }
  };

  // 기존 localStorage 사용자를 Firestore로 마이그레이션
  const syncUsersToFirestore = async () => {
    if (!useFirebase || !firestoreService) {
      console.log('Firebase not enabled, skipping sync');
      return { success: false, error: 'Firebase not enabled' };
    }

    try {
      const users = getAllUsers();
      let synced = 0;
      let failed = 0;

      for (const user of users) {
        try {
          const userDataForFirestore = {
            nickname: user.nickname,
            createdAt: user.createdAt,
            profileImage: user.profileImage || null,
            bio: user.bio || null,
          };
          await firestoreService.createUser(user.id, userDataForFirestore);
          synced++;
          console.log(`✅ Synced user: ${user.nickname}`);
        } catch (error) {
          failed++;
          console.warn(`⚠️ Failed to sync user ${user.nickname}:`, error.message);
        }
      }

      console.log(`📊 Sync complete: ${synced} success, ${failed} failed`);
      return { success: true, synced, failed };
    } catch (error) {
      console.error('Sync users to Firestore failed:', error);
      return { success: false, error: error.message };
    }
  };

  // Firestore 연결 테스트
  const testFirestoreConnection = async () => {
    if (!useFirebase) {
      return { success: false, mode: 'localStorage', message: 'Firebase not configured' };
    }

    try {
      // 간단한 읽기 테스트
      const { collection, getDocs, limit, query } = require('firebase/firestore');
      const { db } = require('../config/firebase.config');

      const testQuery = query(collection(db, 'users'), limit(1));
      await getDocs(testQuery);

      return { success: true, mode: 'firestore', message: '✅ Firestore connected successfully' };
    } catch (error) {
      return {
        success: false,
        mode: 'localStorage',
        message: `⚠️ Firestore error: ${error.message}`,
        error: error.code
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        signup,
        login,
        logout,
        isNicknameAvailable,
        updateProfileImage,
        updateProfileBio,
        syncUsersToFirestore,
        testFirestoreConnection,
        useFirebase,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
