import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userToken, setUserToken] = useState(null);

  // Kiểm tra phiên đăng nhập đã lưu trong AsyncStorage khi mở ứng dụng
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [token, role, uid] = await Promise.all([
        AsyncStorage.getItem('userToken'),
        AsyncStorage.getItem('userRole'),
        AsyncStorage.getItem('userId'),
      ]);

      if (token) {
        setUserToken(token);
        setUserRole(role || 'user');
        setUserId(uid || 'user123');
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error('Lỗi khi tải thông tin đăng nhập đã lưu:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async ({ token, role, userId: newUserId }) => {
    try {
      const safeRole = role || 'user';
      const safeId = newUserId ? newUserId.toString() : 'user123';
      const safeToken = token || 'dummy_token';

      await AsyncStorage.multiSet([
        ['userToken', safeToken],
        ['userRole', safeRole],
        ['userId', safeId],
      ]);

      setUserToken(safeToken);
      setUserRole(safeRole);
      setUserId(safeId);
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Lỗi lưu đăng nhập:', error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(['userToken', 'userRole', 'userId']);
      setUserToken(null);
      setUserRole(null);
      setUserId(null);
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Lỗi đăng xuất:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        isLoggedIn,
        userRole,
        userId,
        userToken,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được sử dụng bên trong AuthProvider');
  }
  return context;
}
