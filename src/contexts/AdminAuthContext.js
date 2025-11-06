import React, { createContext, useState, useContext, useEffect } from 'react';

const AdminAuthContext = createContext();

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = () => {
    try {
      const savedAdmin = localStorage.getItem('petPhotos_adminUser');
      if (savedAdmin) {
        setAdminUser(JSON.parse(savedAdmin));
      }
    } catch (error) {
      console.error('Admin auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const adminLogin = (admin) => {
    setAdminUser(admin);
    localStorage.setItem('petPhotos_adminUser', JSON.stringify(admin));
  };

  const adminLogout = () => {
    setAdminUser(null);
    localStorage.removeItem('petPhotos_adminUser');
  };

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        loading,
        adminLogin,
        adminLogout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};
