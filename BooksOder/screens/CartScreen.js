import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { API_URL, getCurrentUserId } from '../src/constants/api';
import { styles } from '../styles/CartScreenStyles';

export default function CartScreen({ navigation }) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchCart();
    }, [])
  );

  const fetchCart = async () => {
    setLoading(true);
    try {
      const uid = await getCurrentUserId();
      const response = await fetch(`${API_URL}/cart/${uid}`);
      const data = await response.json();
      const validCart = (Array.isArray(data) ? data : []).filter(item => item && item.bookId);
      setCartItems(validCart);
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi mạng', 'Không thể tải giỏ hàng từ Backend');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(cartItemId);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/cart/${cartItemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQuantity })
      });
      if (response.ok) {
        setCartItems(prev =>
          prev.map(item => (item._id === cartItemId ? { ...item, quantity: newQuantity } : item))
        );
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật số lượng.');
    }
  };

  const handleRemoveItem = (cartItemId) => {
    Alert.alert('Xóa sản phẩm', 'Bạn muốn xóa cuốn sách này khỏi giỏ hàng?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await fetch(`${API_URL}/cart/${cartItemId}`, {
              method: 'DELETE'
            });
            if (response.ok) {
              setCartItems(prev => prev.filter(item => item._id !== cartItemId));
            }
          } catch (error) {
            Alert.alert('Lỗi', 'Không thể xóa sản phẩm.');
          }
        }
      }
    ]);
  };

  const totalAmount = cartItems.reduce((sum, item) => {
    return sum + ((item.bookId?.price || 0) * (item.quantity || 1));
  }, 0);

  const handleGoToCheckout = () => {
    if (cartItems.length === 0) {
      return Alert.alert('Thông báo', 'Giỏ hàng của bạn đang trống!');
    }
    navigation.navigate('Checkout', { totalAmount });
  };

  const renderItem = ({ item }) => (
    <View style={styles.cartItem}>
      <Image source={{ uri: item.bookId?.coverImage }} style={styles.itemImage} />
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle} numberOfLines={2}>{item.bookId?.bookName}</Text>
        <Text style={styles.itemPrice}>{item.bookId?.price?.toLocaleString('vi-VN')} đ</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
          <TouchableOpacity
            onPress={() => handleUpdateQuantity(item._id, item.quantity - 1)}
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: '#EBE4DA',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <Ionicons name="remove" size={16} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={{ marginHorizontal: 12, fontSize: 15, fontWeight: '600', color: '#1A1A1A' }}>
            {item.quantity}
          </Text>
          <TouchableOpacity
            onPress={() => handleUpdateQuantity(item._id, item.quantity + 1)}
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: '#EBE4DA',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <Ionicons name="add" size={16} color="#1A1A1A" />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemoveItem(item._id)}>
        <Ionicons name="trash-outline" size={22} color="#E25842" />
      </TouchableOpacity>
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
