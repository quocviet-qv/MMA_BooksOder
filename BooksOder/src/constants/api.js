import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Tự động phát hiện IP của máy tính đang chạy Expo để kết nối Backend
const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Lấy hostUri từ Expo Go / Dev Client (ví dụ: "192.168.1.10:8081" -> lấy "192.168.1.10")
  const debuggerHost =
    Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost;

  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:3000`;
  }

  // Fallback khi chạy trên máy ảo Android
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }

  // Fallback cho iOS Simulator hoặc Web
  return 'http://localhost:3000';
};

export const API_URL = getBaseUrl();

// Lấy UserId thực tế đã lưu khi đăng nhập
export const getCurrentUserId = async () => {
  try {
    const id = await AsyncStorage.getItem('userId');
    return id || 'user123';
  } catch (error) {
    console.error('Lỗi đọc userId từ AsyncStorage:', error);
    return 'user123';
  }
};

// Lấy Token xác thực để đính kèm vào Headers
export const getAuthHeaders = async () => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  } catch (error) {
    return { 'Content-Type': 'application/json' };
  }
};
