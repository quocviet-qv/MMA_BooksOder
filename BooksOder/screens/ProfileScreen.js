import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
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

import { API_URL, getAuthHeaders } from '../src/constants/api';
import { useAuth } from '../src/context/AuthContext';
import { useCart } from '../src/context/CartContext';
import { styles } from '../styles/ProfileScreenStyles';

export default function ProfileScreen({ navigation }) {
  const { userId, userName, userRole, userToken, logout } = useAuth();
  const { cartCount } = useCart();

  const [orderCount, setOrderCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // State cho Modal Đổi mật khẩu
  const [modalVisible, setModalVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submittingPassword, setSubmittingPassword] = useState(false);

  // Tải thống kê đơn hàng của người dùng
  const loadUserStats = async () => {
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
  };

  useEffect(() => {
    loadUserStats();
  }, [userId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserStats();
    setRefreshing(false);
  };

  // Xử lý đổi mật khẩu
  const handleChangePassword = async () => {
    if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      return Alert.alert('Thông báo', 'Vui lòng điền đầy đủ các thông tin mật khẩu.');
    }

    if (newPassword.length < 6) {
      return Alert.alert('Thông báo', 'Mật khẩu mới phải có ít nhất 6 ký tự.');
    }

    if (newPassword !== confirmPassword) {
      return Alert.alert('Lỗi xác nhận', 'Mật khẩu mới và xác nhận mật khẩu không trùng khớp.');
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
        Alert.alert('Thành công', data.message || 'Đổi mật khẩu thành công!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setModalVisible(false);
      } else {
        Alert.alert('Thất bại', data.message || 'Không thể đổi mật khẩu.');
      }
    } catch (error) {
      Alert.alert('Lỗi kết nối', 'Không thể kết nối đến máy chủ.');
    } finally {
      setSubmittingPassword(false);
    }
  };

  const handleLogoutPress = () => {
    Alert.alert(
      'Xác nhận đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng xuất', style: 'destructive', onPress: () => logout() },
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
        <Text style={styles.headerTitle}>Hồ sơ cá nhân</Text>

        {/* Thẻ thông tin cá nhân */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={40} color="#C5532A" />
          </View>
          <Text style={styles.userName}>{userName || 'Khách hàng'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>
              {userRole === 'admin' ? 'Quản trị viên' : 'Khách hàng thân thiết'}
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
            <Ionicons name="receipt-outline" size={24} color="#C5532A" />
            <Text style={styles.statNumber}>{orderCount}</Text>
            <Text style={styles.statLabel}>Đơn mua</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('Cart')}
            activeOpacity={0.7}
          >
            <Ionicons name="bag-handle-outline" size={24} color="#C5532A" />
            <Text style={styles.statNumber}>{cartCount}</Text>
            <Text style={styles.statLabel}>Giỏ hàng</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('Favorites')}
            activeOpacity={0.7}
          >
            <Ionicons name="heart-outline" size={24} color="#C5532A" />
            <Text style={styles.statNumber}>Đã lưu</Text>
            <Text style={styles.statLabel}>Yêu thích</Text>
          </TouchableOpacity>
        </View>

        {/* Các tác vụ tiện ích & bảo mật */}
        <Text style={styles.sectionTitle}>Cài đặt tài khoản & Bảo mật</Text>
        <View style={styles.actionCard}>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.actionItemLeft}>
              <View style={[styles.actionIconBox, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="key-outline" size={20} color="#2563EB" />
              </View>
              <Text style={styles.actionItemText}>Đổi mật khẩu</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() =>
              Alert.alert('Chính sách bảo mật', 'Dữ liệu cá nhân và mật khẩu của bạn được mã hóa an toàn theo tiêu chuẩn bcrypt và JWT.')
            }
            activeOpacity={0.7}
          >
            <View style={styles.actionItemLeft}>
              <View style={[styles.actionIconBox, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#059669" />
              </View>
              <Text style={styles.actionItemText}>Chính sách bảo mật</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionItem, { borderBottomWidth: 0 }]}
            onPress={() =>
              Alert.alert('Hỗ trợ khách hàng', 'Mọi thắc mắc vui lòng liên hệ hotline hỗ trợ: 1900-1234 (8:00 - 21:00)')
            }
            activeOpacity={0.7}
          >
            <View style={styles.actionItemLeft}>
              <View style={[styles.actionIconBox, { backgroundColor: '#FFFBEB' }]}>
                <Ionicons name="headset-outline" size={20} color="#D97706" />
              </View>
              <Text style={styles.actionItemText}>Hỗ trợ & Trợ giúp</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Nút Đăng xuất */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogoutPress} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          <Text style={styles.logoutBtnText}>Đăng xuất</Text>
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
            <Text style={styles.modalTitle}>Đổi mật khẩu</Text>
            <Text style={styles.modalSubtitle}>
              Cập nhật mật khẩu mới để tăng cường bảo mật cho tài khoản của bạn.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mật khẩu hiện tại</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                placeholder="Nhập mật khẩu hiện tại"
                placeholderTextColor="#999"
                value={oldPassword}
                onChangeText={setOldPassword}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mật khẩu mới (tối thiểu 6 ký tự)</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                placeholder="Nhập mật khẩu mới"
                placeholderTextColor="#999"
                value={newPassword}
                onChangeText={setNewPassword}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Xác nhận mật khẩu mới</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                placeholder="Nhập lại mật khẩu mới"
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
                <Text style={styles.modalCancelText}>Hủy bỏ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleChangePassword}
                disabled={submittingPassword}
              >
                {submittingPassword ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitText}>Lưu thay đổi</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
