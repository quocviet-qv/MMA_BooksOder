import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from '../styles/LoginScreenStyles';
import { API_URL } from '../src/constants/api';

export default function LoginScreen({ route, navigation, setIsLoggedIn: propSetIsLoggedIn, setUserRole: propSetUserRole, onLoginSuccess }) {
  const setIsLoggedIn = propSetIsLoggedIn || route?.params?.setIsLoggedIn;
  const setUserRole = propSetUserRole || route?.params?.setUserRole;
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      return Alert.alert('Thiếu thông tin', 'Vui lòng nhập tài khoản và mật khẩu!');
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });
      
      const data = await response.json();

      if (response.ok) {
        await AsyncStorage.setItem('userToken', data.token || 'dummy_token');
        await AsyncStorage.setItem('userRole', data.role || 'user');
        
        if (data.userId) {
          await AsyncStorage.setItem('userId', data.userId.toString());
        }

        if (onLoginSuccess) {
          onLoginSuccess(data.role || 'user');
        } else {
          setUserRole?.(data.role || 'user');
          setIsLoggedIn?.(true);
        }
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
