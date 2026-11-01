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

import { API_URL, apiFetch as fetch } from '../src/constants/api';
import { useLanguage } from '../src/context/LanguageContext';
import { styles } from '../styles/RegisterScreenStyles';

export default function RegisterScreen({ navigation }) {
  const { t, language, toggleLanguage } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username.trim() || !password.trim() || !confirmPassword.trim()) {
      return Alert.alert(t('common.warning'), t('auth.missingInfo'));
    }
    if (password !== confirmPassword) {
      return Alert.alert(t('common.error'), t('auth.passwordMismatch'));
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(t('common.success'), t('auth.registerSuccess'), [
          { text: t('auth.loginNow'), onPress: () => navigation.navigate('Login') },
        ]);
      } else {
        Alert.alert(t('common.error'), data.message || 'Tài khoản đã tồn tại');
      }
    } catch (error) {
      console.error('Lỗi đăng ký:', error);
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
        <Ionicons name="globe-outline" size={16} color="#B91C1C" />
        <Text style={styles.langText}>
          {language === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.title}>{t('auth.registerTitle')}</Text>
      <Text style={styles.subtitle}>{t('auth.registerSubtitle')}</Text>

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
        <View style={styles.passwordInputContainer}>
          <TextInput
            style={[styles.input, { paddingRight: 52 }]}
            placeholder={t('auth.passwordPlaceholder')}
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            style={styles.passwordToggle}
            onPress={() => setShowPassword(visible => !visible)}
            accessibilityRole="button"
            accessibilityLabel={t(showPassword ? 'auth.hidePassword' : 'auth.showPassword')}
            hitSlop={8}
          >
            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={22} color="gray" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.inputContainer}>
        <View style={styles.passwordInputContainer}>
          <TextInput
            style={[styles.input, { paddingRight: 52 }]}
            placeholder={t('auth.confirmPasswordPlaceholder')}
            placeholderTextColor="#999"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
          />
          <TouchableOpacity
            style={styles.passwordToggle}
            onPress={() => setShowConfirmPassword(visible => !visible)}
            accessibilityRole="button"
            accessibilityLabel={t(showConfirmPassword ? 'auth.hidePassword' : 'auth.showPassword')}
            hitSlop={8}
          >
            <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={22} color="gray" />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.btnText}>{t('auth.registerBtn')}</Text>
        )}
      </TouchableOpacity>

      <View style={styles.linkContainer}>
        <Text style={styles.linkText}>{t('auth.haveAccount')}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkHighlight}>{t('auth.loginNow')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}