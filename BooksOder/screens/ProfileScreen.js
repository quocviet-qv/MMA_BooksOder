import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { API_URL, getAuthHeaders, apiFetch as fetch } from '../src/constants/api';
import { useAuth } from '../src/context/AuthContext';
import { useCart } from '../src/context/CartContext';
import { useLanguage } from '../src/context/LanguageContext';
import { styles } from '../styles/ProfileScreenStyles';

export default function ProfileScreen({ navigation }) {
  const { userId, userName, userRole, logout } = useAuth();
  const { cartCount } = useCart();
  const { t, language, toggleLanguage } = useLanguage();

  const [orderCount, setOrderCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // State cho Modal Đổi mật khẩu
  const [modalVisible, setModalVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submittingPassword, setSubmittingPassword] = useState(false);

  // Tải thống kê đơn hàng của người dùng
  const loadUserStats = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_URL}/orders/user/${userId}`);
      if (res.ok) {
        const orders = await res.json();
        setOrderCount(Array.isArray(orders) ? orders.length : 0);
      }
    } catch (error) {
      console.log('Không thể tải thống kê đơn hàng:', error.message);
    }
  }, [userId]);


  useFocusEffect(useCallback(() => { loadUserStats(); }, [loadUserStats]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserStats();
    setRefreshing(false);
  };

  // Xử lý đổi mật khẩu
  const handleChangePassword = async () => {
    if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      return Alert.alert(t('common.warning'), t('auth.missingInfo'));
    }

    if (newPassword.length < 6) {
      return Alert.alert(t('common.warning'), t('profile.newPassLabel'));
    }

    if (newPassword !== confirmPassword) {
      return Alert.alert(t('common.error'), t('auth.passwordMismatch'));
    }

    setSubmittingPassword(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/change-password`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId,
          oldPassword: oldPassword.trim(),
          newPassword: newPassword.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert(t('common.success'), data.message || t('common.success'));
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setModalVisible(false);
      } else {
        Alert.alert(t('common.error'), data.message || t('common.error'));
      }
    } catch (_error) {
      Alert.alert(t('common.error'), t('common.networkError'));
    } finally {
      setSubmittingPassword(false);
    }
  };

  const handleLogoutPress = () => {
    Alert.alert(
      t('common.logout'),
      t('common.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.logout'), style: 'destructive', onPress: () => logout() },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.headerTitle}>{t('profile.title')}</Text>

        {/* Thẻ thông tin cá nhân */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={40} color="#B91C1C" />
          </View>
          <Text style={styles.userName}>{userName || 'User'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>
              {userRole === 'admin' ? t('profile.adminRole') : t('profile.vipCustomer')}
            </Text>
          </View>
          <Text style={styles.userIdText}>ID: {userId}</Text>
        </View>

        {/* Thống kê nhanh */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('Orders')}
            activeOpacity={0.7}
          >
            <Ionicons name="receipt-outline" size={24} color="#B91C1C" />
            <Text style={styles.statNumber}>{orderCount}</Text>
            <Text style={styles.statLabel}>{t('profile.ordersCount')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('Cart')}
            activeOpacity={0.7}
          >
            <Ionicons name="bag-handle-outline" size={24} color="#B91C1C" />
            <Text style={styles.statNumber}>{cartCount}</Text>
            <Text style={styles.statLabel}>{t('profile.cartCount')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('Favorites')}
            activeOpacity={0.7}
          >
            <Ionicons name="heart-outline" size={24} color="#B91C1C" />
            <Text style={styles.statNumber}>-</Text>
            <Text style={styles.statLabel}>{t('profile.savedCount')}</Text>
          </TouchableOpacity>
        </View>

        {/* Các tác vụ tiện ích & bảo mật */}
        <Text style={styles.sectionTitle}>{t('profile.settingsSection')}</Text>
        <View style={styles.actionCard}>
          {/* Chuyển đổi ngôn ngữ Tiếng Việt / Tiếng Anh */}
          <TouchableOpacity
            style={styles.actionItem}
            onPress={toggleLanguage}
            activeOpacity={0.7}
          >
            <View style={styles.actionItemLeft}>
              <View style={[styles.actionIconBox, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="language-outline" size={20} color="#D97706" />
              </View>
              <Text style={styles.actionItemText}>{t('profile.switchLanguage')}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#B91C1C', marginRight: 6 }}>
                {language === 'vi' ? '🇻🇳 Tiếng Việt' : '🇬🇧 English'}
              </Text>
              <Ionicons name="swap-horizontal" size={16} color="#9CA3AF" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.actionItemLeft}>
              <View style={[styles.actionIconBox, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="key-outline" size={20} color="#2563EB" />
              </View>
              <Text style={styles.actionItemText}>{t('profile.changePassword')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() =>
              Alert.alert(t('profile.privacyPolicy'), t('profile.privacyDesc'))
            }
            activeOpacity={0.7}
          >
            <View style={styles.actionItemLeft}>
              <View style={[styles.actionIconBox, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#059669" />
              </View>
              <Text style={styles.actionItemText}>{t('profile.privacyPolicy')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionItem, { borderBottomWidth: 0 }]}
            onPress={() =>
              Alert.alert(t('profile.support'), t('profile.supportDesc'))
            }
            activeOpacity={0.7}
          >
            <View style={styles.actionItemLeft}>
              <View style={[styles.actionIconBox, { backgroundColor: '#FFFBEB' }]}>
                <Ionicons name="headset-outline" size={20} color="#D97706" />
              </View>
              <Text style={styles.actionItemText}>{t('profile.support')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Nút Đăng xuất */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogoutPress} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          <Text style={styles.logoutBtnText}>{t('profile.logoutBtn')}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal Đổi mật khẩu */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('profile.modalChangePassTitle')}</Text>
            <Text style={styles.modalSubtitle}>
              {t('profile.modalChangePassSubtitle')}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('profile.oldPassLabel')}</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                placeholder={t('profile.oldPassPlaceholder')}
                placeholderTextColor="#999"
                value={oldPassword}
                onChangeText={setOldPassword}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('profile.newPassLabel')}</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                placeholder={t('profile.newPassPlaceholder')}
                placeholderTextColor="#999"
                value={newPassword}
                onChangeText={setNewPassword}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('profile.confirmNewPassLabel')}</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                placeholder={t('profile.confirmNewPassPlaceholder')}
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setModalVisible(false)}
                disabled={submittingPassword}
              >
                <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleChangePassword}
                disabled={submittingPassword}
              >
                {submittingPassword ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitText}>{t('common.save')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
