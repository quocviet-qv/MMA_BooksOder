import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// Import bộ style từ file riêng
import { styles } from '../styles/CartScreenStyles';

export default function CartScreen({ navigation }) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const userId = 'user123'; 
  const API_URL = 'http://192.168.101.105:3000'; 

  useFocusEffect(
    useCallback(() => {
      fetchCart();
    }, [])
  );

  const fetchCart = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/cart/${userId}`);
      const data = await response.json();
      setCartItems(data);
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi mạng', 'Không thể tải giỏ hàng từ Backend');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = cartItems.reduce((sum, item) => {
    return sum + (item.bookId?.price * item.quantity);
  }, 0);

  const handleGoToCheckout = () => {
    if (cartItems.length === 0) {
      return Alert.alert('Thông báo', 'Giỏ hàng của bạn đang trống!');
    }
    // Chuyển sang màn hình Checkout và truyền tổng tiền sang đó
    navigation.navigate('Checkout', { totalAmount });
  };

  const renderItem = ({ item }) => (
    <View style={styles.cartItem}>
      <Image source={{ uri: item.bookId?.coverImage }} style={styles.itemImage} />
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle} numberOfLines={2}>{item.bookId?.bookName}</Text>
        <Text style={styles.itemPrice}>{item.bookId?.price?.toLocaleString('vi-VN')} đ</Text>
        <Text style={{ color: '#666', marginTop: 5 }}>Số lượng: {item.quantity}</Text>
      </View>
    </View>
  );

  if (loading) {
    return <ActivityIndicator size="large" color="#C5532A" style={{ flex: 1, justifyContent: 'center' }} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.mainTitle}>Giỏ hàng của bạn</Text>
      </View>
      
      {cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyContent}>
            <View style={styles.iconCircle}>
              <Ionicons name="cart-outline" size={60} color="#C5532A" />
            </View>
            <Text style={styles.emptyTitle}>Giỏ hàng trống</Text>
            <Text style={styles.emptyDesc}>Bạn chưa có cuốn sách nào trong giỏ hàng. Hãy khám phá thêm nhé!</Text>
            <TouchableOpacity 
              style={styles.exploreBtn}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.exploreBtnText}>Khám phá ngay</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            keyExtractor={item => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
          
          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tổng thanh toán:</Text>
              <Text style={styles.totalValue}>{totalAmount.toLocaleString('vi-VN')} đ</Text>
            </View>
            
            <TouchableOpacity style={styles.checkoutBtn} onPress={handleGoToCheckout}>
              <Text style={styles.checkoutBtnText}>MUA HÀNG</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}