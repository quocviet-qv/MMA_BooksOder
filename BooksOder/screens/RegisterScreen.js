import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { styles } from '../styles/RegisterScreenStyles';

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = 'http://192.168.101.105:3000';

  const handleRegister = async () => {
    if (!username || !password || !confirmPassword) {
      return Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ các trường!');
    }
    if (password !== confirmPassword) {
      return Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp!');
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();

      if (response.ok) {
        Alert.alert('Thành công 🎉', 'Đăng ký tài khoản thành công!', [
          { text: 'Đăng nhập ngay', onPress: () => navigation.navigate('Login') }
        ]);
      } else {
        Alert.alert('Đăng ký thất bại', data.message || 'Tài khoản đã tồn tại');
      }
    } catch (error) {
      Alert.alert('Lỗi mạng', 'Không thể kết nối đến máy chủ Backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tạo tài khoản</Text>
      <Text style={styles.subtitle}>Bắt đầu hành trình đọc sách của bạn</Text>

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
      <View style={styles.inputContainer}>
        <TextInput 
          style={styles.input} placeholder="Xác nhận mật khẩu" 
          value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry 
        />
      </View>

      <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>ĐĂNG KÝ</Text>}
      </TouchableOpacity>

      <View style={styles.linkContainer}>
        <Text style={styles.linkText}>Đã có tài khoản?</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkHighlight}>Đăng nhập ngay</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}