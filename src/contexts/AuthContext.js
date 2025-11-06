import React, { createContext, useState, useContext, useEffect } from 'react';

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
      const user = localStorage.getItem('petPhotos_currentUser');
      if (user) {
        setCurrentUser(JSON.parse(user));
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
  const signup = (nickname, password) => {
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

      // 자동 로그인
      const userWithoutPassword = { ...newUser };
      delete userWithoutPassword.password;
      setCurrentUser(userWithoutPassword);
      localStorage.setItem('petPhotos_currentUser', JSON.stringify(userWithoutPassword));

      return { success: true };
    } catch (error) {
      console.error('Signup failed:', error);
      return { success: false, error: '회원가입에 실패했습니다.' };
    }
  };

  // 로그인
  const login = (nickname, password) => {
    try {
      const users = getAllUsers();
      const user = users.find(
        u => u.nickname.toLowerCase() === nickname.toLowerCase() && u.password === password
      );

      if (!user) {
        return { success: false, error: '닉네임 또는 비밀번호가 올바르지 않습니다.' };
      }

      const userWithoutPassword = { ...user };
      delete userWithoutPassword.password;
      setCurrentUser(userWithoutPassword);
      localStorage.setItem('petPhotos_currentUser', JSON.stringify(userWithoutPassword));

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

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        signup,
        login,
        logout,
        isNicknameAvailable,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
