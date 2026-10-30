import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Tự động lấy địa chỉ IP máy tính đang chạy Expo (hoặc dùng biến môi trường / IP fallback)
const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Lấy hostUri từ Expo (ví dụ: "10.87.32.64:8081") để suy ra IP của máy chạy Backend
  const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:3000`;
  }

  // Fallback cho máy ảo Android hoặc Web/iOS Simulator
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }
  return 'http://localhost:3000';
};

export const API_URL = getBaseUrl();

// Hàm lấy userId thực tế đã lưu trong AsyncStorage khi đăng nhập
export const getCurrentUserId = async () => {
  try {
    const id = await AsyncStorage.getItem('userId');
    return id || 'user123';
  } catch (error) {
    console.error('Lỗi đọc userId từ AsyncStorage:', error);
    return 'user123';
  }
};
