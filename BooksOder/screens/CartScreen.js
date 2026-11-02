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

import { API_URL, apiFetch as fetch } from '../src/constants/api';
import { useAuth } from '../src/context/AuthContext';
import { useCart } from '../src/context/CartContext';
import { useLanguage } from '../src/context/LanguageContext';
import { styles } from '../styles/CartScreenStyles';

export default function CartScreen({ navigation }) {
  const { userId } = useAuth();
  const { refreshCartCount } = useCart();
  const { t } = useLanguage();

  const [cartItems, setCartItems] = useState([]);
  const [recommendedBooks, setRecommendedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addingId, setAddingId] = useState(null);

  const fetchRecommendations = useCallback(async (currentCart) => {
    if (!currentCart || currentCart.length === 0) {
      setRecommendedBooks([]);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/books`);
      if (!response.ok) return;
      const allBooks = await response.json();
      if (!Array.isArray(allBooks)) return;

      const inCartIds = new Set(
        currentCart
          .map((item) => (item.bookId?._id ? item.bookId._id.toString() : item.bookId ? item.bookId.toString() : ''))
          .filter(Boolean)
      );

      const inCartCategories = new Set(
        currentCart.map((item) => item.bookId?.category).filter(Boolean)
      );
      const inCartAuthors = new Set(
        currentCart.map((item) => item.bookId?.author).filter(Boolean)
      );

      // Lọc bỏ sách đã có trong giỏ
      const candidates = allBooks.filter(
        (b) => b && b._id && !inCartIds.has(b._id.toString())
      );

      // Chấm điểm liên quan: cùng thể loại (+3), cùng tác giả (+2), rating
      const scored = candidates.map((book) => {
        let score = 0;
        if (book.category && inCartCategories.has(book.category)) score += 3;
        if (book.author && inCartAuthors.has(book.author)) score += 2;
        if (book.averageRating) score += book.averageRating * 0.5;
        return { book, score };
      });

      scored.sort((a, b) => b.score - a.score);
      const topList = scored.slice(0, 8).map((s) => s.book);
      setRecommendedBooks(topList);
    } catch (err) {
      console.error('Lỗi tải sách gợi ý:', err);
    }
  }, []);

  const fetchCart = useCallback(async () => {
    try {
      const currentId = userId || 'user123';
      const response = await fetch(`${API_URL}/cart/${currentId}`);
      if (response.ok) {
        const data = await response.json();
        const validItems = Array.isArray(data) ? data.filter((item) => item && item.bookId) : [];
        setCartItems(validItems);
        fetchRecommendations(validItems);
      }
    } catch (error) {
      console.error(error);
      Alert.alert(t('common.error'), t('common.networkError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, t, fetchRecommendations]);


  useFocusEffect(useCallback(() => { fetchCart(); }, [fetchCart]));

  const onRefresh = () => {
    setRefreshing(true);
    fetchCart();
    refreshCartCount(userId);
  };

  const handleUpdateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) return handleRemoveItem(cartItemId);
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
      } else {
        const data = await response.json();
        Alert.alert('Không thể đổi số lượng', data.message || 'Vui lòng thử lại');
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
          } catch (_error) {
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
                backgroundColor: '#F1F5F9',
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
                backgroundColor: '#F1F5F9',
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
          <Ionicons name="trash-outline" size={22} color="#B91C1C" />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.emptyContainer}>
        <ActivityIndicator size="large" color="#B91C1C" />
      </View>
    );
  }

  if (cartItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyContent}>
          <View style={styles.iconCircle}>
            <Ionicons name="bag-handle-outline" size={60} color="#B91C1C" />
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

  const handleAddRecommendedToCart = async (book) => {
    setAddingId(book._id);
    try {
      const response = await fetch(`${API_URL}/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId || 'user123', bookId: book._id, quantity: 1 }),
      });
      if (response.ok) {
        refreshCartCount(userId);
        fetchCart();
        Alert.alert(t('common.success'), `${t('cart.addSuccess')}\n"${book.bookName}"`);
      } else {
        const data = await response.json();
        Alert.alert(t('common.error'), data.message || 'Không thể thêm vào giỏ hàng');
      }
    } catch (_error) {
      Alert.alert(t('common.error'), t('common.networkError'));
    } finally {
      setAddingId(null);
    }
  };

  const renderRecommendations = () => {
    if (!recommendedBooks || recommendedBooks.length === 0) return null;

    return (
      <View style={styles.recommendSection}>
        <View style={styles.recommendHeader}>
          <View style={styles.recommendTitleRow}>
            <Ionicons name="sparkles" size={18} color="#B91C1C" />
            <Text style={styles.recommendTitle}>{t('cart.recommendedTitle')}</Text>
          </View>
          <Text style={styles.recommendSubtitle}>
            {t('cart.recommendedSubtitle')}
          </Text>
        </View>

        <View style={styles.recommendGrid}>
          {recommendedBooks.map((item) => {
            const originalPrice = Math.round((item.price || 0) * 1.15);
            const isAdding = addingId === item._id;

            return (
              <TouchableOpacity
                key={item._id}
                style={styles.gridCard}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('Chi tiết', { book: item, bookId: item._id })}
              >
                <View style={styles.gridImageWrapper}>
                  <Image
                    source={{ uri: item.coverImage || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400' }}
                    style={styles.gridCoverImage}
                  />
                  <View style={styles.gridDiscountBadge}>
                    <Text style={styles.gridDiscountText}>-15%</Text>
                  </View>
                </View>

                <View style={styles.gridBookInfo}>
                  {item.category ? (
                    <View style={styles.gridCategoryTag}>
                      <Text style={styles.gridCategoryText} numberOfLines={1}>
                        {item.category}
                      </Text>
                    </View>
                  ) : null}

                  <Text style={styles.gridBookTitle} numberOfLines={2}>
                    {item.bookName}
                  </Text>
                  <Text style={styles.gridBookAuthor} numberOfLines={1}>
                    {item.author || ''}
                  </Text>

                  <View style={styles.gridRatingRow}>
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Text style={styles.gridRatingText}>
                      {item.averageRating && item.averageRating > 0 ? item.averageRating.toFixed(1) : '5.0'}
                    </Text>
                  </View>

                  <View style={styles.gridPriceRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.gridBookPrice}>
                        {(item.price || 0).toLocaleString('vi-VN')} {t('common.currency')}
                      </Text>
                      <Text style={styles.gridOriginalPrice}>
                        {originalPrice.toLocaleString('vi-VN')} {t('common.currency')}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.gridQuickAddBtn}
                      activeOpacity={0.8}
                      disabled={isAdding}
                      onPress={() => handleAddRecommendedToCart(item)}
                    >
                      {isAdding ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Ionicons name="bag-add-outline" size={16} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.mainTitle}>{t('cart.title')}</Text>
      </View>

      <FlatList
        data={cartItems}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ListFooterComponent={renderRecommendations}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#B91C1C']}
            tintColor="#B91C1C"
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
