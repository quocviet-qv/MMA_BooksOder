import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState(null);
  const [userToken, setUserToken] = useState(null);

  // Kiểm tra phiên đăng nhập đã lưu trong AsyncStorage khi mở ứng dụng
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [token, role, uid, uname] = await Promise.all([
        AsyncStorage.getItem('userToken'),
        AsyncStorage.getItem('userRole'),
        AsyncStorage.getItem('userId'),
        AsyncStorage.getItem('userName'),
      ]);

      if (token) {
        setUserToken(token);
        setUserRole(role || 'user');
        setUserId(uid || 'user123');
        setUserName(uname || 'Người dùng');
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error('Lỗi khi tải thông tin đăng nhập đã lưu:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async ({ token, role, userId: newUserId, username: newUserName }) => {
    try {
      const safeRole = role || 'user';
      const safeId = newUserId ? newUserId.toString() : 'user123';
      const safeToken = token || 'dummy_token';
      const safeName = newUserName || 'Người dùng';

      await AsyncStorage.multiSet([
        ['userToken', safeToken],
        ['userRole', safeRole],
        ['userId', safeId],
        ['userName', safeName],
      ]);

      setUserToken(safeToken);
      setUserRole(safeRole);
      setUserId(safeId);
      setUserName(safeName);
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Lỗi lưu đăng nhập:', error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(['userToken', 'userRole', 'userId', 'userName']);
      setUserToken(null);
      setUserRole(null);
      setUserId(null);
      setUserName(null);
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
        userName,
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
