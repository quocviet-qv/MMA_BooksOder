import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';

// Import bộ style từ file riêng
import { styles } from '../styles/CheckoutScreenStyles';

export default function CheckoutScreen({ route, navigation }) {
  // Nhận tổng tiền từ màn hình Giỏ hàng truyền sang
  const { totalAmount } = route.params; 
  const [address, setAddress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const userId = 'user123';
  const API_URL = 'http://192.168.101.105:3000';

  const handlePayment = async () => {
    if (!address.trim()) {
      return Alert.alert('Thiếu thông tin', 'Vui lòng nhập địa chỉ giao hàng!');
    }

    setIsProcessing(true);
    try {
      const response = await fetch(`${API_URL}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, address })
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Thành công 🎉', 'Đơn hàng của bạn đã được đặt thành công!', [
          { text: 'Về trang chủ', onPress: () => navigation.navigate('Main', { screen: 'Home' }) }
        ]);
      } else {
        Alert.alert('Lỗi thanh toán', data.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi mạng', 'Không thể kết nối đến máy chủ Backend.');
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
          placeholder="📍 Nhập địa chỉ "
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

      <TouchableOpacity style={styles.checkoutBtn} onPress={handlePayment} disabled={isProcessing}>
        {isProcessing ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.checkoutBtnText}>XÁC NHẬN ĐẶT HÀNG</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}