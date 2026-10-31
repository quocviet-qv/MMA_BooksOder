import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { API_URL } from '../src/constants/api';
import { useAuth } from '../src/context/AuthContext';
import { styles } from '../styles/LoginScreenStyles';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      return Alert.alert('Thiếu thông tin', 'Vui lòng nhập tài khoản và mật khẩu!');
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        // Cập nhật AuthContext (tự động đổi giao diện theo Role)
        await login({
          token: data.token || 'dummy_token',
          role: data.role || 'user',
          userId: data.userId || 'user123',
          username: data.username || username.trim(),
        });
      } else {
        Alert.alert('Đăng nhập thất bại', data.message || 'Sai tài khoản hoặc mật khẩu');
      }
    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
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
          style={styles.input}
          placeholder="Tên đăng nhập"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
      </View>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Mật khẩu"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.btnText}>ĐĂNG NHẬP</Text>
        )}
      </TouchableOpacity>

      <View style={styles.linkContainer}>
        <Text style={styles.linkText}>Chưa có tài khoản?</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.linkHighlight}>Đăng ký ngay</Text>
        </TouchableOpacity>
      </View>

      {/* Phím chọn tài khoản test nhanh */}
      <View style={styles.quickTestContainer}>
        <Text style={styles.quickTestTitle}>⚡ Chọn tài khoản test nhanh:</Text>
        <View style={styles.quickTestRow}>
          <TouchableOpacity
            style={[styles.quickTestBtn, { borderColor: '#C5532A', backgroundColor: '#FBECE7' }]}
            onPress={() => {
              setUsername('admin');
              setPassword('admin123');
            }}
          >
            <Text style={[styles.quickTestText, { color: '#C5532A' }]}>👑 Admin</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickTestBtn, { borderColor: '#2563EB', backgroundColor: '#EFF6FF' }]}
            onPress={() => {
              setUsername('user1');
              setPassword('user123');
            }}
          >
            <Text style={[styles.quickTestText, { color: '#2563EB' }]}>🛒 User 1</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickTestBtn, { borderColor: '#059669', backgroundColor: '#ECFDF5' }]}
            onPress={() => {
              setUsername('user2');
              setPassword('user123');
            }}
          >
            <Text style={[styles.quickTestText, { color: '#059669' }]}>👤 User 2</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}