import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { API_URL } from '../src/constants/api';
import { useAuth } from '../src/context/AuthContext';
import { useCart } from '../src/context/CartContext';
import { useLanguage } from '../src/context/LanguageContext';
import { styles } from '../styles/FavoritesScreenStyles';

export default function FavoritesScreen({ navigation }) {
  const { userId } = useAuth();
  const { cartCount, refreshCartCount } = useCart();
  const { t, language } = useLanguage();

  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [addingCartId, setAddingCartId] = useState(null);

  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
      refreshCartCount(userId);
    }, [userId])
  );

  const fetchFavorites = async () => {
    try {
      const currentId = userId || 'user123';
      const response = await fetch(`${API_URL}/favorites/${currentId}`);
      if (response.ok) {
        const data = await response.json();
        const validFavorites = Array.isArray(data)
          ? data.filter((item) => item && item.bookId)
          : [];
        setFavorites(validFavorites);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách yêu thích:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchFavorites();
  };

  const handleRemoveFavorite = async (bookId, bookName) => {
    const currentId = userId || 'user123';
    // Cập nhật giao diện tức thì (optimistic update)
    setFavorites((prev) =>
      prev.filter((item) => (item.bookId._id || item.bookId) !== bookId)
    );

    try {
      const response = await fetch(`${API_URL}/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentId, bookId }),
      });

      if (!response.ok) {
        // Rollback nếu có lỗi mạng
        fetchFavorites();
      }
    } catch (error) {
      fetchFavorites();
      Alert.alert(
        language === 'vi' ? 'Lỗi' : 'Error',
        language === 'vi' ? 'Không thể cập nhật danh sách yêu thích.' : 'Could not update favorites.'
      );
    }
  };

  const handleQuickAddToCart = async (book) => {
    const currentId = userId || 'user123';
    const bookId = (book.id || book._id).toString();

    setAddingCartId(bookId);
    try {
      const response = await fetch(`${API_URL}/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentId, bookId, quantity: 1 }),
      });

      if (response.ok) {
        await refreshCartCount(currentId);
        Alert.alert(
          language === 'vi' ? 'Thành công 🎉' : 'Added to Cart 🎉',
          language === 'vi'
            ? `Đã thêm "${book.bookName}" vào giỏ hàng!`
            : `Added "${book.bookName}" to your cart!`,
          [
            { text: language === 'vi' ? 'Tiếp tục xem' : 'Keep shopping', style: 'cancel' },
            {
              text: language === 'vi' ? 'Đến giỏ hàng' : 'View Cart',
              onPress: () => navigation.navigate('Cart'),
            },
          ]
        );
      } else {
        Alert.alert(
          language === 'vi' ? 'Thông báo' : 'Notice',
          language === 'vi' ? 'Không thể thêm sách vào lúc này.' : 'Could not add to cart right now.'
        );
      }
    } catch (error) {
      Alert.alert(
        language === 'vi' ? 'Lỗi kết nối' : 'Connection Error',
        language === 'vi' ? 'Vui lòng kiểm tra lại mạng.' : 'Please check your connection.'
      );
    } finally {
      setAddingCartId(null);
    }
  };

  // Lọc theo từ khóa tìm kiếm
  const displayFavorites = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return favorites;
    return favorites.filter((item) => {
      const book = item.bookId || {};
      const matchName = book.bookName && book.bookName.toLowerCase().includes(query);
      const matchAuthor = book.author && book.author.toLowerCase().includes(query);
      return matchName || matchAuthor;
    });
  }, [favorites, searchQuery]);

  // Render thẻ dạng Grid 2 cột
  const renderGridItem = ({ item }) => {
    const book = item.bookId || {};
    const bookId = (book._id || book.id).toString();
    const isAdding = addingCartId === bookId;
    const originalPrice = Math.round((book.price || 0) * 1.15);

    return (
      <TouchableOpacity
        style={styles.gridCard}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('Chi tiết', { book })}
      >
        <View style={styles.gridImageWrapper}>
          <Image
            source={{
              uri: book.coverImage || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
            }}
            style={styles.gridCoverImage}
          />

          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-15%</Text>
          </View>

          <TouchableOpacity
            style={styles.gridHeartBtn}
            activeOpacity={0.7}
            onPress={() => handleRemoveFavorite(bookId, book.bookName)}
          >
            <Ionicons name="heart" size={18} color="#B91C1C" />
          </TouchableOpacity>
        </View>

        <View style={styles.gridCardBody}>
          {book.category ? (
            <View style={styles.categoryTag}>
              <Text style={styles.categoryTagText} numberOfLines={1}>
                {book.category}
              </Text>
            </View>
          ) : null}

          <Text style={styles.gridTitle} numberOfLines={2}>
            {book.bookName || (language === 'vi' ? 'Đang cập nhật' : 'Untitled')}
          </Text>

          <Text style={styles.gridAuthor} numberOfLines={1}>
            {book.author || (language === 'vi' ? 'Nhiều tác giả' : 'Various Authors')}
          </Text>

          <View style={styles.ratingRow}>
            <Ionicons name="star" size={13} color="#F59E0B" />
            <Text style={styles.ratingText}>
              {book.averageRating && book.averageRating > 0 ? book.averageRating.toFixed(1) : '5.0'}
            </Text>
            <Text style={styles.reviewCountText}>({book.totalReviews || 0})</Text>
          </View>

          <View style={styles.priceRow}>
            <View style={styles.priceWrapper}>
              <Text style={styles.gridPrice}>{(book.price || 0).toLocaleString('vi-VN')} đ</Text>
              <Text style={styles.originalPrice}>{originalPrice.toLocaleString('vi-VN')} đ</Text>
            </View>

            <TouchableOpacity
              style={styles.quickAddBtn}
              activeOpacity={0.8}
              onPress={() => handleQuickAddToCart(book)}
              disabled={isAdding}
            >
              {isAdding ? (
                <ActivityIndicator size="small" color="#B91C1C" />
              ) : (
                <Ionicons name="bag-handle-outline" size={16} color="#B91C1C" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render thẻ dạng List 1 cột nằm ngang
  const renderListItem = ({ item }) => {
    const book = item.bookId || {};
    const bookId = (book._id || book.id).toString();
    const isAdding = addingCartId === bookId;

    return (
      <TouchableOpacity
        style={styles.listCard}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('Chi tiết', { book })}
      >
        <View style={styles.listImageWrapper}>
          <Image
            source={{
              uri: book.coverImage || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
            }}
            style={styles.listImage}
          />
          <View style={styles.listDiscountBadge}>
            <Text style={styles.discountText}>-15%</Text>
          </View>
        </View>

        <View style={styles.listBody}>
          <View>
            <View style={styles.listTopRow}>
              {book.category ? (
                <View style={styles.categoryTag}>
                  <Text style={styles.categoryTagText}>{book.category}</Text>
                </View>
              ) : <View />}

              <TouchableOpacity
                style={styles.listHeartBtn}
                activeOpacity={0.7}
                onPress={() => handleRemoveFavorite(bookId, book.bookName)}
              >
                <Ionicons name="heart" size={20} color="#B91C1C" />
              </TouchableOpacity>
            </View>

            <Text style={styles.listTitle} numberOfLines={2}>
              {book.bookName}
            </Text>

            <Text style={styles.listAuthor} numberOfLines={1}>
              {book.author || (language === 'vi' ? 'Nhiều tác giả' : 'Various Authors')}
            </Text>

            <View style={styles.ratingRow}>
              <Ionicons name="star" size={13} color="#F59E0B" />
              <Text style={styles.ratingText}>
                {book.averageRating && book.averageRating > 0 ? book.averageRating.toFixed(1) : '5.0'}
              </Text>
              <Text style={styles.reviewCountText}>({book.totalReviews || 0})</Text>
            </View>
          </View>

          <View style={styles.listBottomRow}>
            <Text style={styles.listPrice}>{(book.price || 0).toLocaleString('vi-VN')} đ</Text>

            <TouchableOpacity
              style={styles.listAddBtn}
              activeOpacity={0.85}
              onPress={() => handleQuickAddToCart(book)}
              disabled={isAdding}
            >
              {isAdding ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="bag-handle-outline" size={14} color="#FFFFFF" />
                  <Text style={styles.listAddBtnText}>
                    {language === 'vi' ? 'Thêm giỏ' : 'Add to cart'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#B91C1C" />
        <Text style={styles.loadingText}>
          {language === 'vi' ? 'Đang mở danh sách yêu thích...' : 'Loading wishlist...'}
        </Text>
      </View>
    );
  }

  if (favorites.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons name="heart" size={24} color="#B91C1C" />
            <Text style={styles.mainTitle}>
              {language === 'vi' ? 'Sách yêu thích' : 'My Wishlist'}
            </Text>
          </View>
        </View>

        <View style={styles.emptyContainer}>
          <View style={styles.emptyContent}>
            <View style={styles.iconCircle}>
              <Ionicons name="heart-dislike-outline" size={54} color="#B91C1C" />
            </View>
            <Text style={styles.emptyTitle}>
              {language === 'vi' ? 'Danh sách yêu thích trống' : 'Wishlist is empty'}
            </Text>
            <Text style={styles.emptyDesc}>
              {language === 'vi'
                ? 'Bạn chưa lưu cuốn sách nào. Nhấn vào biểu tượng trái tim ở cuốn sách bạn thích để lưu lại đọc sau nhé!'
                : 'You have not saved any books yet. Tap the heart icon on any book you love to save it for later!'}
            </Text>
            <TouchableOpacity
              style={styles.exploreBtn}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.exploreBtnText}>
                {language === 'vi' ? 'Khám phá sách hay' : 'Explore books'}
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* 1. HEADER NỔI BẬT VỚI TIÊU ĐỀ & NÚT CHUYỂN CHẾ ĐỘ XEM / GIỎ HÀNG */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.titleRow}>
            <Ionicons name="heart" size={24} color="#B91C1C" />
            <Text style={styles.mainTitle}>
              {language === 'vi' ? 'Sách yêu thích' : 'My Wishlist'}
            </Text>
          </View>
          <Text style={styles.subtitle}>
            {language === 'vi'
              ? `${favorites.length} cuốn sách đã lưu`
              : `${favorites.length} saved books`}
          </Text>
        </View>

        <View style={styles.headerActions}>
          {/* Nút chuyển đổi giao diện Lưới 2 cột / Danh sách ngang */}
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.8}
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            <Ionicons
              name={viewMode === 'grid' ? 'list-outline' : 'grid-outline'}
              size={20}
              color="#0F172A"
            />
          </TouchableOpacity>

          {/* Nút giỏ hàng có badge số lượng realtime */}
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Cart')}
          >
            <Ionicons name="bag-handle-outline" size={20} color="#0F172A" />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>
                  {cartCount > 99 ? '99+' : cartCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. THANH TÌM KIẾM NHANH TRONG DANH SÁCH YÊU THÍCH */}
      {favorites.length > 2 && (
        <View style={styles.searchWrapper}>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={18} color="#94A3B8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={
                language === 'vi'
                  ? 'Tìm trong danh sách yêu thích...'
                  : 'Search in your wishlist...'
              }
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity style={styles.clearBtn} onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* 3. DANH SÁCH SÁCH YÊU THÍCH (GRID HOẶC LIST) */}
      <FlatList
        key={viewMode} // Buộc re-render an toàn khi đổi số cột numColumns
        data={displayFavorites}
        keyExtractor={(item) => (item._id || item.id || item.bookId?._id).toString()}
        renderItem={viewMode === 'grid' ? renderGridItem : renderListItem}
        numColumns={viewMode === 'grid' ? 2 : 1}
        columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
        contentContainerStyle={styles.listContent}
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
    </SafeAreaView>
  );
}