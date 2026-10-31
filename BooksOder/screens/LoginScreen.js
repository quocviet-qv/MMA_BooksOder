import { Ionicons } from '@expo/vector-icons';
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
import { useLanguage } from '../src/context/LanguageContext';
import { styles } from '../styles/LoginScreenStyles';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      return Alert.alert(t('common.warning'), t('auth.missingInfo'));
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
        Alert.alert(t('common.error'), data.message || t('auth.missingInfo'));
      }
    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      Alert.alert(t('common.error'), t('common.networkError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Nút chuyển đổi ngôn ngữ góc trên phải */}
      <TouchableOpacity
        style={styles.langSwitcher}
        onPress={toggleLanguage}
        activeOpacity={0.7}
      >
        <Ionicons name="globe-outline" size={16} color="#C5532A" />
        <Text style={styles.langText}>
          {language === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.title}>{t('auth.loginTitle')}</Text>
      <Text style={styles.subtitle}>{t('auth.loginSubtitle')}</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={t('auth.usernamePlaceholder')}
          placeholderTextColor="#999"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
      </View>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={t('auth.passwordPlaceholder')}
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.btnText}>{t('auth.loginBtn')}</Text>
        )}
      </TouchableOpacity>

      <View style={styles.linkContainer}>
        <Text style={styles.linkText}>{t('auth.noAccount')}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.linkHighlight}>{t('auth.registerNow')}</Text>
        </TouchableOpacity>
      </View>

      {/* Phím chọn tài khoản test nhanh */}
      <View style={styles.quickTestContainer}>
        <Text style={styles.quickTestTitle}>{t('auth.quickTestTitle')}</Text>
        <View style={styles.quickTestRow}>
          <TouchableOpacity
            style={[styles.quickTestBtn, { borderColor: '#C5532A', backgroundColor: '#FBECE7' }]}
            onPress={() => {
              setUsername('admin');
              setPassword('admin123');
            }}
          >
            <Text style={[styles.quickTestText, { color: '#C5532A' }]}>{t('auth.quickAdmin')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickTestBtn, { borderColor: '#2563EB', backgroundColor: '#EFF6FF' }]}
            onPress={() => {
              setUsername('user1');
              setPassword('user123');
            }}
          >
            <Text style={[styles.quickTestText, { color: '#2563EB' }]}>{t('auth.quickUser1')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickTestBtn, { borderColor: '#059669', backgroundColor: '#ECFDF5' }]}
            onPress={() => {
              setUsername('user2');
              setPassword('user123');
            }}
          >
            <Text style={[styles.quickTestText, { color: '#059669' }]}>{t('auth.quickUser2')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}