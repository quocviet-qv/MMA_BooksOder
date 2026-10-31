import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_URL } from '../constants/api';
const AuthContext = createContext();
const keys = ['userToken', 'userRole', 'userId', 'userName'];
export function AuthProvider({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState(null);
  useEffect(() => {
    let active = true;
    Promise.all([AsyncStorage.getItem('userToken'), AsyncStorage.getItem('userId')])
      .then(async ([token, userId]) => {
        if (!token || !userId) return null;
        const response = await fetch(`${API_URL}/profile/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) { await AsyncStorage.multiRemove(keys); return null; }
        const profile = await response.json();
        return { token, userId: profile._id, role: profile.role, username: profile.username };
      })
      .then(stored => { if (active) setSession(stored); })
      .catch(error => console.error('Không thể khôi phục phiên đăng nhập:', error.message))
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);
  const login = async ({ token, role, userId, username }) => {
    if (!token || !userId || !['user', 'admin'].includes(role)) throw new Error('Thông tin đăng nhập không hợp lệ');
    await AsyncStorage.multiSet([['userToken', token], ['userRole', role], ['userId', String(userId)], ['userName', username]]);
    setSession({ token, role, userId: String(userId), username });
  };
  const logout = async () => { await AsyncStorage.multiRemove(keys); setSession(null); };
  return <AuthContext.Provider value={{ isLoading, isLoggedIn: !!session, userRole: session?.role, userId: session?.userId, userName: session?.username, userToken: session?.token, login, logout }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
