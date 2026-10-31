import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { API_URL } from '../src/constants/api';
import { useAuth } from '../src/context/AuthContext';
import { useCart } from '../src/context/CartContext';
import { useLanguage } from '../src/context/LanguageContext';
import { styles } from '../styles/CartScreenStyles';

export default function CartScreen({ navigation }) {
  const { userId } = useAuth();
  const { refreshCartCount } = useCart();
  const { t } = useLanguage();

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchCart();
    }, [userId])
  );

  const fetchCart = async () => {
    try {
      const currentId = userId || 'user123';
      const response = await fetch(`${API_URL}/cart/${currentId}`);
      if (response.ok) {
        const data = await response.json();
        const validItems = Array.isArray(data) ? data.filter((item) => item && item.bookId) : [];
        setCartItems(validItems);
      }
    } catch (error) {
      console.error(error);
      Alert.alert(t('common.error'), t('common.networkError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCart();
    refreshCartCount(userId);
  };

  const handleUpdateQuantity = async (cartItemId, newQuantity) => {
    try {
      const response = await fetch(`${API_URL}/cart/${cartItemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      if (response.ok) {
        if (newQuantity <= 0) {
          setCartItems((prev) => prev.filter((item) => item._id !== cartItemId));
        } else {
          setCartItems((prev) =>
            prev.map((item) =>
              item._id === cartItemId ? { ...item, quantity: newQuantity } : item
            )
          );
        }
        refreshCartCount(userId);
      }
    } catch (error) {
      console.error('Lỗi cập nhật số lượng:', error);
    }
  };

  const handleRemoveItem = async (cartItemId) => {
    Alert.alert('Xác nhận', 'Bạn có muốn bỏ sản phẩm này khỏi giỏ hàng?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await fetch(`${API_URL}/cart/${cartItemId}`, {
              method: 'DELETE',
            });
            if (response.ok) {
              setCartItems((prev) => prev.filter((item) => item._id !== cartItemId));
              refreshCartCount(userId);
            }
          } catch (error) {
            Alert.alert('Lỗi', 'Không thể xóa sản phẩm khỏi giỏ hàng.');
          }
        },
      },
    ]);
  };

  // Tính tổng tiền giỏ hàng
  const totalAmount = cartItems.reduce((sum, item) => {
    const price = item.bookId?.price || 0;
    return sum + price * (item.quantity || 1);
  }, 0);

  const renderItem = ({ item }) => {
    const book = item.bookId || {};
    return (
      <View style={styles.cartItem}>
        <Image
          source={{ uri: book.coverImage || 'https://via.placeholder.com/150' }}
          style={styles.itemImage}
        />
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle} numberOfLines={1}>
            {book.bookName || 'Sách'}
          </Text>
          <Text style={styles.itemPrice}>
            {((book.price || 0) * (item.quantity || 1)).toLocaleString('vi-VN')} đ
          </Text>

          {/* Bộ tăng giảm số lượng */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <TouchableOpacity
              onPress={() => handleUpdateQuantity(item._id, item.quantity - 1)}
              style={{
                width: 28,
                height: 28,
                backgroundColor: '#EBE4DA',
                borderRadius: 14,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333' }}>-</Text>
            </TouchableOpacity>

            <Text style={{ marginHorizontal: 12, fontSize: 14, fontWeight: 'bold' }}>
              {item.quantity}
            </Text>

            <TouchableOpacity
              onPress={() => handleUpdateQuantity(item._id, item.quantity + 1)}
              style={{
                width: 28,
                height: 28,
                backgroundColor: '#EBE4DA',
                borderRadius: 14,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333' }}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemoveItem(item._id)}>
          <Ionicons name="trash-outline" size={22} color="#E25842" />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.emptyContainer}>
        <ActivityIndicator size="large" color="#C5532A" />
      </View>
    );
  }

  if (cartItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyContent}>
          <View style={styles.iconCircle}>
            <Ionicons name="bag-handle-outline" size={60} color="#C5532A" />
          </View>
          <Text style={styles.emptyTitle}>{t('cart.emptyTitle')}</Text>
          <Text style={styles.emptyDesc}>
            {t('cart.emptySubtitle')}
          </Text>
          <TouchableOpacity
            style={styles.exploreBtn}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.exploreBtnText}>{t('cart.exploreBtn')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.mainTitle}>{t('cart.title')}</Text>
      </View>

      <FlatList
        data={cartItems}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#C5532A']}
            tintColor="#C5532A"
          />
        }
      />

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{t('cart.totalPrice')}</Text>
          <Text style={styles.totalValue}>{totalAmount.toLocaleString('vi-VN')} {t('common.currency')}</Text>
        </View>

        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() => navigation.navigate('Checkout', { totalAmount })}
        >
          <Text style={styles.checkoutBtnText}>{t('cart.checkoutBtn')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}