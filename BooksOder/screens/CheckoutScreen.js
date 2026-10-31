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
import { useCart } from '../src/context/CartContext';
import { useLanguage } from '../src/context/LanguageContext';
import { styles } from '../styles/CheckoutScreenStyles';

export default function CheckoutScreen({ route, navigation }) {
  const { totalAmount = 0 } = route.params || {};
  const { userId } = useAuth();
  const { refreshCartCount } = useCart();
  const { t } = useLanguage();
  const [address, setAddress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    if (!address.trim()) {
      return Alert.alert(
        t('common.warning') || 'Thiếu thông tin',
        'Vui lòng nhập địa chỉ giao hàng!'
      );
    }

    setIsProcessing(true);
    try {
      const currentId = userId || 'user123';
      const response = await fetch(`${API_URL}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentId, address: address.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        refreshCartCount(currentId);
        Alert.alert('Thành công 🎉', 'Đơn hàng của bạn đã được đặt thành công!', [
          {
            text: 'Xem đơn hàng',
            onPress: () => navigation.navigate('Main', { screen: 'Orders' }),
          },
          {
            text: 'Về trang chủ',
            onPress: () => navigation.navigate('Main', { screen: 'Home' }),
          },
        ]);
      } else {
        Alert.alert(t('common.error') || 'Lỗi thanh toán', data.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error(error);
      Alert.alert(t('common.error') || 'Lỗi mạng', t('common.networkError') || 'Không thể kết nối đến máy chủ Backend.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Thông tin giao hàng</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Địa chỉ nhận hàng:</Text>
        <TextInput
          style={styles.input}
          placeholder="📍 Nhập địa chỉ nhận sách chi tiết..."
          placeholderTextColor="#94A3B8"
          value={address}
          onChangeText={setAddress}
          multiline
        />
      </View>

      <View style={styles.card}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tổng thanh toán:</Text>
          <Text style={styles.totalPrice}>{totalAmount.toLocaleString('vi-VN')} đ</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.checkoutBtn}
        onPress={handlePayment}
        disabled={isProcessing}
        activeOpacity={0.8}
      >
        {isProcessing ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.checkoutBtnText}>XÁC NHẬN ĐẶT HÀNG</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}