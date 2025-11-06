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

  const checkAuth = async () => {
    try {
      const autoLogin = localStorage.getItem('petPhotos_autoLogin');
      const userId = localStorage.getItem('petPhotos_userId');

      if (autoLogin === 'true' && userId && useFirebase && firestoreService) {
        // Firestore에서 사용자 정보 가져오기
        try {
          const { doc, getDoc } = require('firebase/firestore');
          const { db } = require('../config/firebase.config');

          const userRef = doc(db, 'users', userId);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const userData = userSnap.data();
            const user = {
              id: userSnap.id,
              nickname: userData.nickname,
              createdAt: userData.createdAt,
              profileImage: userData.profileImage,
              bio: userData.bio,
            };
            setCurrentUser(user);
            console.log('✅ Auto-login from Firestore');
          } else {
            // 사용자가 삭제됨
            localStorage.removeItem('petPhotos_autoLogin');
            localStorage.removeItem('petPhotos_userId');
          }
        } catch (error) {
          console.error('Firestore auto-login failed:', error);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // 닉네임 중복 체크 (Firestore 기반)
  const isNicknameAvailable = async (nickname) => {
    if (!useFirebase || !firestoreService) {
      console.error('❌ Firestore is required for nickname check');
      return false;
    }

    try {
      const { collection, query, where, getDocs } = require('firebase/firestore');
      const { db } = require('../config/firebase.config');

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('nickname', '==', nickname));
      const querySnapshot = await getDocs(q);

      return querySnapshot.empty; // 빈 결과면 사용 가능
    } catch (error) {
      console.error('Nickname availability check failed:', error);
      return false;
    }
  };

  // 회원가입 (Firestore 전용)
  const signup = async (nickname, password, autoLogin = true) => {
    if (!useFirebase || !firestoreService) {
      return { success: false, error: 'Firestore가 필요합니다.' };
    }

    try {
      // 닉네임 중복 체크
      const available = await isNicknameAvailable(nickname);
      if (!available) {
        return { success: false, error: '이미 사용 중인 닉네임입니다.' };
      }

      const userId = Date.now().toString();
      const newUser = {
        nickname,
        password, // 실제 앱에서는 해시해야 하지만, 데모용이므로 그대로 저장
        createdAt: new Date().toISOString(),
      };

      // Firestore에 저장
      await firestoreService.createUser(userId, newUser);
      console.log('✅ User created in Firestore:', userId);

      // 현재 사용자 설정
      const userWithoutPassword = {
        id: userId,
        nickname: newUser.nickname,
        createdAt: newUser.createdAt,
      };
      setCurrentUser(userWithoutPassword);

      // 자동 로그인 설정 (localStorage는 설정만 저장)
      localStorage.setItem('petPhotos_autoLogin', autoLogin.toString());
      localStorage.setItem('petPhotos_userId', userId);

      return { success: true };
    } catch (error) {
      console.error('Signup failed:', error);
      return { success: false, error: '회원가입에 실패했습니다.' };
    }
  };

  // 로그인 (Firestore 전용)
  const login = async (nickname, password, autoLogin = true) => {
    if (!useFirebase || !firestoreService) {
      return { success: false, error: 'Firestore가 필요합니다.' };
    }

    try {
      console.log('🔍 Checking Firestore for user...');
      const { collection, query, where, getDocs } = require('firebase/firestore');
      const { db } = require('../config/firebase.config');

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('nickname', '==', nickname));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return { success: false, error: '닉네임 또는 비밀번호가 올바르지 않습니다.' };
      }

      const firestoreUser = querySnapshot.docs[0];
      const firestoreUserData = firestoreUser.data();

      // 비밀번호 확인
      if (!firestoreUserData.password || firestoreUserData.password !== password) {
        return { success: false, error: '닉네임 또는 비밀번호가 올바르지 않습니다.' };
      }

      console.log('✅ User found in Firestore');

      // 현재 사용자 설정
      const user = {
        id: firestoreUser.id,
        nickname: firestoreUserData.nickname,
        createdAt: firestoreUserData.createdAt,
        profileImage: firestoreUserData.profileImage,
        bio: firestoreUserData.bio,
      };

      setCurrentUser(user);

      // 자동 로그인 설정 (localStorage는 설정만 저장)
      localStorage.setItem('petPhotos_autoLogin', autoLogin.toString());
      localStorage.setItem('petPhotos_userId', firestoreUser.id);

      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: '로그인에 실패했습니다.' };
    }
  };

  // 로그아웃
  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('petPhotos_autoLogin');
    localStorage.removeItem('petPhotos_userId');
  };

  // 프로필 이미지 업데이트 (Firestore 전용)
  const updateProfileImage = async (imageUrl) => {
    if (!currentUser) return { success: false, error: '로그인이 필요합니다.' };
    if (!useFirebase || !firestoreService) {
      return { success: false, error: 'Firestore가 필요합니다.' };
    }

    try {
      const { doc, updateDoc } = require('firebase/firestore');
      const { db } = require('../config/firebase.config');

      const userRef = doc(db, 'users', currentUser.id);
      await updateDoc(userRef, { profileImage: imageUrl });
      console.log('✅ Profile image updated in Firestore');

      // 현재 사용자 상태 업데이트
      setCurrentUser({ ...currentUser, profileImage: imageUrl });

      return { success: true };
    } catch (error) {
      console.error('Failed to update profile image:', error);
      return { success: false, error: '프로필 이미지 업데이트 실패' };
    }
  };

  // 프로필 소개글 업데이트 (Firestore 전용)
  const updateProfileBio = async (bio) => {
    if (!currentUser) return { success: false, error: '로그인이 필요합니다.' };
    if (!useFirebase || !firestoreService) {
      return { success: false, error: 'Firestore가 필요합니다.' };
    }

    try {
      const { doc, updateDoc } = require('firebase/firestore');
      const { db } = require('../config/firebase.config');

      const userRef = doc(db, 'users', currentUser.id);
      await updateDoc(userRef, { bio });
      console.log('✅ Bio updated in Firestore');

      // 현재 사용자 상태 업데이트
      setCurrentUser({ ...currentUser, bio });

      return { success: true };
    } catch (error) {
      console.error('Failed to update bio:', error);
      return { success: false, error: '프로필 소개글 업데이트 실패' };
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
        useFirebase,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
