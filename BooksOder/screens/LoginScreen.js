import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from '../styles/LoginScreenStyles';

export default function LoginScreen({ route, navigation }) {
  // Nhận 2 hàm cập nhật trạng thái từ App.js truyền sang
  const { setIsLoggedIn, setUserRole } = route.params;
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = 'http://192.168.101.105:3000';

  const handleLogin = async () => {
    if (!username || !password) {
      return Alert.alert('Thiếu thông tin', 'Vui lòng nhập tài khoản và mật khẩu!');
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();

      if (response.ok) {
        // Lưu Token và Role vào bộ nhớ máy để dùng cho lần mở app sau
        await AsyncStorage.setItem('userToken', data.token || 'dummy_token');
        await AsyncStorage.setItem('userRole', data.role || 'user');
        
        // Nếu BE có trả về userId thực tế, lưu lại luôn để dùng thay cho 'user123'
        if (data.userId) {
           await AsyncStorage.setItem('userId', data.userId.toString());
        }

        // Kích hoạt App.js đổi sang giao diện chính
        setUserRole(data.role || 'user');
        setIsLoggedIn(true);
      } else {
        Alert.alert('Đăng nhập thất bại', data.message || 'Sai tài khoản hoặc mật khẩu');
      }
    } catch (error) {
      Alert.alert('Lỗi mạng', 'Không thể kết nối đến máy chủ Backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chào mừng trở lại!</Text>
      <Text style={styles.subtitle}>Đăng nhập để xem giỏ hàng và kho sách của bạn</Text>

      <View style={styles.inputContainer}>
        <TextInput 
          style={styles.input} placeholder="Tên đăng nhập" 
          value={username} onChangeText={setUsername} autoCapitalize="none" 
        />
      </View>
      <View style={styles.inputContainer}>
        <TextInput 
          style={styles.input} placeholder="Mật khẩu" 
          value={password} onChangeText={setPassword} secureTextEntry 
        />
      </View>

      <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>ĐĂNG NHẬP</Text>}
      </TouchableOpacity>

      <View style={styles.linkContainer}>
        <Text style={styles.linkText}>Chưa có tài khoản?</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.linkHighlight}>Đăng ký ngay</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}