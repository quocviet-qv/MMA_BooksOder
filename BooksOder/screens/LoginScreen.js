import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import bộ style từ thư mục styles
import { styles } from '../styles/LoginScreenStyles';

export default function LoginScreen({ navigation, route }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Hàm mồi để trigger việc thay đổi state isLoggedIn ở App.js
  const { setIsLoggedIn, setUserRole } = route.params;

  const handleLogin = async () => {
    // 1. Hardcode tài khoản Admin
    if (username === 'admin' && password === 'admin123') {
      await AsyncStorage.setItem('userToken', 'admin_token');
      await AsyncStorage.setItem('userRole', 'admin');
      setUserRole('admin');
      setIsLoggedIn(true);
      return;
    }

    // 2. Tài khoản User bình thường
    if (username === 'user' && password === '123456') {
      await AsyncStorage.setItem('userToken', 'user_token');
      await AsyncStorage.setItem('userRole', 'user');
      setUserRole('user');
      setIsLoggedIn(true);
      return;
    }

    Alert.alert("Lỗi", "Sai tên đăng nhập hoặc mật khẩu!");
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Đăng Nhập</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Tên đăng nhập (Thử: admin hoặc user)"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Mật khẩu (Thử: admin123 hoặc 123456)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
        <Text style={styles.loginText}>Đăng nhập</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => Alert.alert("Thông báo", "Chuyển sang trang Đăng ký")}>
        <Text style={styles.registerLink}>Chưa có tài khoản? Đăng ký ngay</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}