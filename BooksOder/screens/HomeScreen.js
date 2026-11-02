import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { API_URL, apiFetch as fetch } from '../src/constants/api';
import { useAuth } from '../src/context/AuthContext';
import { useCart } from '../src/context/CartContext';
import { useLanguage } from '../src/context/LanguageContext';
import { styles } from '../styles/HomeScreenStyles';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { userId } = useAuth();
  const { cartCount, refreshCartCount } = useCart();
  const { t, language } = useLanguage();

  const categories = useMemo(
    () => [
      { id: 'all', name: language === 'vi' ? 'Tất cả danh mục' : 'All Categories', icon: 'grid-outline', vnName: 'Tất cả' },
      { id: 'novel', name: language === 'vi' ? 'Tiểu thuyết' : 'Novel', icon: 'book-outline', vnName: 'Tiểu thuyết' },
      { id: 'economy', name: language === 'vi' ? 'Kinh tế' : 'Economy', icon: 'trending-up-outline', vnName: 'Kinh tế' },
      { id: 'skills', name: language === 'vi' ? 'Kỹ năng sống' : 'Life Skills', icon: 'bulb-outline', vnName: 'Kỹ năng sống' },
      { id: 'tech', name: language === 'vi' ? 'Công nghệ' : 'Technology', icon: 'hardware-chip-outline', vnName: 'Công nghệ' },
      { id: 'literature', name: language === 'vi' ? 'Văn học' : 'Literature', icon: 'pencil-outline', vnName: 'Văn học' },
    ],
    [language]
  );

  const sorts = useMemo(
    () => [
      { id: 'bestseller', label: language === 'vi' ? 'Bán chạy nhất' : 'Best Sellers', icon: 'flame-outline' },
      { id: 'newest', label: language === 'vi' ? 'Mới nhất xuất bản' : 'Newest Releases', icon: 'sparkles-outline' },
      { id: 'priceAsc', label: language === 'vi' ? 'Giá: Thấp đến Cao' : 'Price: Low to High', icon: 'trending-up-outline' },
      { id: 'priceDesc', label: language === 'vi' ? 'Giá: Cao đến Thấp' : 'Price: High to Low', icon: 'trending-down-outline' },
    ],
    [language]
  );

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSort, setActiveSort] = useState('bestseller');
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [addingCartId, setAddingCartId] = useState(null);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const bannerScrollRef = useRef(null);

  // Lấy ra sách bán chạy nhất để hiển thị nổi bật trên banner slide
  const topBook = useMemo(() => {
    if (!books || books.length === 0) return null;
    return [...books].sort((a, b) => (b.averageRating || 5) - (a.averageRating || 5))[0];
  }, [books]);

  // Tự động lướt banner nhẹ nhàng mỗi 4.5 giây
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBannerIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % 3;
        bannerScrollRef.current?.scrollTo({ x: nextIndex * width, animated: true });
        return nextIndex;
      });
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  const onBannerScroll = (event) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    if (slideIndex >= 0 && slideIndex < 3 && slideIndex !== activeBannerIndex) {
      setActiveBannerIndex(slideIndex);
    }
  };

  const loadHomeData = useCallback(async () => {
    try {
      const currentId = userId || 'user123';
      const [booksRes, favRes] = await Promise.all([
        fetch(`${API_URL}/books`),
        fetch(`${API_URL}/favorites/${currentId}`),
      ]);

      if (booksRes.ok) {
        const booksData = await booksRes.json();
        setBooks(Array.isArray(booksData) ? booksData : []);
      }

      if (favRes.ok) {
        const favData = await favRes.json();
        const favIds = (Array.isArray(favData) ? favData : [])
          .filter((fav) => fav && fav.bookId)
          .map((fav) => (fav.bookId._id || fav.bookId).toString());
        setFavorites(favIds);
      }
    } catch (error) {
      console.error('Lỗi tải dữ liệu trang chủ:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);


  useFocusEffect(useCallback(() => { loadHomeData(); refreshCartCount(userId); }, [loadHomeData, refreshCartCount, userId]));

  const onRefresh = () => {
    setRefreshing(true);
    loadHomeData();
  };

  const toggleFavorite = async (book) => {
    const bookId = (book.id || book._id).toString();
    const isExist = favorites.includes(bookId);

    if (isExist) {
      setFavorites(favorites.filter((id) => id !== bookId));
    } else {
      setFavorites([...favorites, bookId]);
    }

    try {
      const currentId = userId || 'user123';
      await fetch(`${API_URL}/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentId, bookId }),
      });
    } catch (error) {
      console.error('Lỗi khi thả tim:', error);
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
              onPress: () => navigation.navigate('Main', { screen: 'Cart' }),
            },
          ]
        );
      } else {
        Alert.alert(
          language === 'vi' ? 'Thông báo' : 'Notice',
          language === 'vi' ? 'Không thể thêm sách vào lúc này.' : 'Could not add to cart right now.'
        );
      }
    } catch (_error) {
      Alert.alert(
        language === 'vi' ? 'Lỗi kết nối' : 'Connection Error',
        language === 'vi' ? 'Vui lòng kiểm tra lại mạng.' : 'Please check your connection.'
      );
    } finally {
      setAddingCartId(null);
    }
  };

  // Lọc và sắp xếp sách hiển thị
  const selectedCategoryObj = categories.find((c) => c.id === activeCategory) || categories[0];
  const selectedSortObj = sorts.find((s) => s.id === activeSort) || sorts[0];

  let displayBooks = books.filter((book) => {
    const isAll = activeCategory === 'all';
    const matchCategory =
      isAll ||
      book.category === selectedCategoryObj.vnName ||
      book.category === selectedCategoryObj.name;
    const query = searchQuery.toLowerCase().trim();
    const matchSearch =
      !query ||
      (book.bookName && book.bookName.toLowerCase().includes(query)) ||
      (book.author && book.author.toLowerCase().includes(query));
    return matchCategory && matchSearch;
  });

  if (activeSort === 'priceAsc') {
    displayBooks.sort((a, b) => (a.price || 0) - (b.price || 0));
  } else if (activeSort === 'priceDesc') {
    displayBooks.sort((a, b) => (b.price || 0) - (a.price || 0));
  } else if (activeSort === 'newest') {
    displayBooks.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  } else if (activeSort === 'bestseller') {
    displayBooks.sort((a, b) => (b.averageRating || 5) - (a.averageRating || 5));
  }

  const renderBookItem = ({ item }) => {
    const itemId = (item.id || item._id).toString();
    const isFav = favorites.includes(itemId);
    const originalPrice = Math.round((item.price || 0) * 1.15);
    const isAdding = addingCartId === itemId;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('Chi tiết', { book: item })}
      >
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: item.coverImage || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400' }}
            style={styles.coverImage}
          />

          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-15%</Text>
          </View>

          <TouchableOpacity
            style={styles.favoriteBtn}
            activeOpacity={0.7}
            onPress={() => toggleFavorite(item)}
          >
            <Ionicons
              name={isFav ? 'heart' : 'heart-outline'}
              size={18}
              color={isFav ? '#EF4444' : '#64748B'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.bookInfo}>
          {item.category ? (
            <View style={styles.categoryTag}>
              <Text style={styles.categoryTagText} numberOfLines={1}>
                {item.category}
              </Text>
            </View>
          ) : null}

          <Text style={styles.bookTitle} numberOfLines={2}>
            {item.bookName}
          </Text>

          <Text style={styles.bookAuthor} numberOfLines={1}>
            {item.author || (language === 'vi' ? 'Nhiều tác giả' : 'Various Authors')}
          </Text>

          <View style={styles.ratingRow}>
            <Ionicons name="star" size={13} color="#F59E0B" />
            <Text style={styles.ratingText}>
              {item.averageRating && item.averageRating > 0 ? item.averageRating.toFixed(1) : '5.0'}
            </Text>
            <Text style={styles.reviewCountText}>({item.totalReviews || 0})</Text>
          </View>

          <View style={styles.priceRow}>
            <View style={styles.priceWrapper}>
              <Text style={styles.bookPrice}>{(item.price || 0).toLocaleString('vi-VN')} đ</Text>
              <Text style={styles.originalPrice}>{originalPrice.toLocaleString('vi-VN')} đ</Text>
            </View>

            <TouchableOpacity
              style={styles.quickAddBtn}
              activeOpacity={0.8}
              disabled={isAdding}
              onPress={() => handleQuickAddToCart(item)}
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
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#B91C1C" />
        <Text style={styles.loadingText}>
          {language === 'vi' ? 'Đang chuẩn bị kho sách...' : 'Loading books...'}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* 1. THANH TÌM KIẾM THU GỌN KÈM ICON THÔNG BÁO & GIỎ HÀNG (CỐ ĐỊNH TRÊN CÙNG KHI CUỘN) */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={20}
            color="#B91C1C"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={
              language === 'vi'
                ? 'Tìm tên sách, tác giả...'
                : 'Search books, author...'
            }
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => setSearchQuery('')}
            >
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Nút thông báo */}
        <TouchableOpacity
          style={styles.topActionBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Notification')}
        >
          <Ionicons name="notifications-outline" size={22} color="#0F172A" />
          <View style={styles.notificationDot} />
        </TouchableOpacity>

        {/* Nút giỏ hàng */}
        <TouchableOpacity
          style={styles.topActionBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Cart')}
        >
          <Ionicons name="bag-handle-outline" size={22} color="#0F172A" />
          {cartCount > 0 && (
            <View style={styles.actionBadge}>
              <Text style={styles.actionBadgeText}>
                {cartCount > 99 ? '99+' : cartCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={displayBooks}
        keyExtractor={(item) => (item.id || item._id).toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#B91C1C']}
            tintColor="#B91C1C"
          />
        }
        ListHeaderComponent={
          <View>
            {/* 1. DANH MỤC SÁCH DẠNG CHIP NGANG (ĐƯA LÊN TRÊN BANNER) */}
            <View style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <Text style={styles.sectionTitle}>
                  {language === 'vi' ? 'Danh mục sách' : 'Categories'}
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryList}
              >
                {categories.map((cat) => {
                  const isActive = activeCategory === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryBtn,
                        isActive && styles.activeCategoryBtn,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => setActiveCategory(cat.id)}
                    >
                      <Ionicons
                        name={cat.icon}
                        size={16}
                        color={isActive ? '#FFFFFF' : '#64748B'}
                        style={styles.categoryIcon}
                      />
                      <Text
                        style={[
                          styles.categoryText,
                          isActive && styles.activeCategoryText,
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* 2. HERO PROMO BANNER CAROUSEL (VUỐT QUA LẠI) */}
            <View style={styles.carouselWrapper}>
              <ScrollView
                ref={bannerScrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={onBannerScroll}
              >
                {/* SLIDE 1: ƯU ĐÃI THÁNG NÀY */}
                <View style={styles.slideWrapper}>
                  <View style={styles.bannerContainer}>
                    <View style={styles.bannerLeft}>
                      <View style={styles.bannerBadge}>
                        <Text style={styles.bannerBadgeText}>
                          {language === 'vi' ? '⚡ ƯU ĐÃI THÁNG' : '⚡ SPECIAL OFFER'}
                        </Text>
                      </View>
                      <Text style={styles.bannerTitle}>
                        {language === 'vi'
                          ? 'Giảm 15% tất cả\nsách mới xuất bản'
                          : '15% Off all\nnew releases'}
                      </Text>
                      <Text style={styles.bannerSubtitle}>
                        {language === 'vi'
                          ? 'Đọc nhiều hơn, biết nhiều hơn'
                          : 'Read more, learn more'}
                      </Text>
                      <TouchableOpacity
                        style={styles.bannerActionBtn}
                        activeOpacity={0.85}
                        onPress={() => setActiveSort('newest')}
                      >
                        <Text style={styles.bannerActionText}>
                          {language === 'vi' ? 'Khám phá ngay' : 'Explore now'}
                        </Text>
                        <Ionicons name="arrow-forward" size={14} color="#B91C1C" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.bannerRight}>
                      <Ionicons name="book" size={44} color="#FFFFFF" />
                    </View>
                  </View>
                </View>

                {/* SLIDE 2: SÁCH BÁN CHẠY NHẤT (BESTSELLER SPOTLIGHT) */}
                <View style={styles.slideWrapper}>
                  <View style={[styles.bannerContainer, styles.bannerBestseller]}>
                    <View style={styles.bannerLeft}>
                      <View style={[styles.bannerBadge, { backgroundColor: '#F59E0B' }]}>
                        <Text style={[styles.bannerBadgeText, { color: '#0F172A' }]}>
                          {language === 'vi' ? '👑 TOP 1 BÁN CHẠY' : '👑 BEST SELLER'}
                        </Text>
                      </View>
                      <Text style={styles.bannerTitle} numberOfLines={2}>
                        {topBook ? topBook.bookName : (language === 'vi' ? 'Đắc Nhân Tâm' : 'How to Win Friends')}
                      </Text>
                      <Text style={[styles.bannerSubtitle, styles.bannerSubtitleLight]} numberOfLines={1}>
                        {topBook?.author || (language === 'vi' ? 'Sách được yêu thích nhất' : 'Most loved book')} • 5.0★
                      </Text>
                      <TouchableOpacity
                        style={styles.bannerActionBtn}
                        activeOpacity={0.85}
                        onPress={() => {
                          if (topBook) {
                            navigation.navigate('Chi tiết', { book: topBook });
                          } else {
                            setActiveSort('bestseller');
                          }
                        }}
                      >
                        <Text style={[styles.bannerActionText, { color: '#0F172A' }]}>
                          {language === 'vi' ? 'Xem chi tiết' : 'View details'}
                        </Text>
                        <Ionicons name="arrow-forward" size={14} color="#0F172A" />
                      </TouchableOpacity>
                    </View>

                    {topBook?.coverImage ? (
                      <Image
                        source={{ uri: topBook.coverImage }}
                        style={styles.bannerThumbImage}
                      />
                    ) : (
                      <View style={[styles.bannerRight, { backgroundColor: 'rgba(245, 158, 11, 0.25)' }]}>
                        <Ionicons name="trophy" size={42} color="#F59E0B" />
                      </View>
                    )}
                  </View>
                </View>

                {/* SLIDE 3: FREESHIP & QUÀ TẶNG */}
                <View style={styles.slideWrapper}>
                  <View style={[styles.bannerContainer, styles.bannerFreeship]}>
                    <View style={styles.bannerLeft}>
                      <View style={[styles.bannerBadge, { backgroundColor: 'rgba(255, 255, 255, 0.25)' }]}>
                        <Text style={styles.bannerBadgeText}>
                          {language === 'vi' ? '🚚 FREESHIP 0Đ' : '🚚 FREE SHIPPING'}
                        </Text>
                      </View>
                      <Text style={styles.bannerTitle}>
                        {language === 'vi'
                          ? 'Miễn phí vận chuyển\nđơn từ 200.000đ'
                          : 'Free shipping on\norders over 200k'}
                      </Text>
                      <Text style={[styles.bannerSubtitle, styles.bannerSubtitleLight]}>
                        {language === 'vi'
                          ? 'Tặng kèm Bookmark cao cấp'
                          : 'Exclusive premium bookmark'}
                      </Text>
                      <TouchableOpacity
                        style={styles.bannerActionBtn}
                        activeOpacity={0.85}
                        onPress={() => {
                          setActiveCategory('all');
                          setSearchQuery('');
                        }}
                      >
                        <Text style={[styles.bannerActionText, { color: '#0F766E' }]}>
                          {language === 'vi' ? 'Mua sắm ngay' : 'Shop now'}
                        </Text>
                        <Ionicons name="arrow-forward" size={14} color="#0F766E" />
                      </TouchableOpacity>
                    </View>

                    <View style={[styles.bannerRight, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                      <Ionicons name="gift" size={44} color="#FFFFFF" />
                    </View>
                  </View>
                </View>
              </ScrollView>

              {/* CHẤM CHUYỂN SLIDE (DOTS PAGINATION) */}
              <View style={styles.dotsContainer}>
                {[0, 1, 2].map((idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => {
                      bannerScrollRef.current?.scrollTo({ x: idx * width, animated: true });
                      setActiveBannerIndex(idx);
                    }}
                  >
                    <View
                      style={[
                        styles.dot,
                        activeBannerIndex === idx && styles.activeDot,
                      ]}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 3. GỢI Ý CHO BẠN (DROPDOWN SẮP XẾP / GỢI Ý ĐẶT DƯỚI BANNER) */}
            <View style={styles.dropdownSection}>
              <View style={styles.sortTopRow}>
                <View style={styles.sortHeaderLeft}>
                  <Text style={styles.sectionTitle} numberOfLines={1}>
                    {language === 'vi' ? 'Gợi ý cho bạn' : 'Recommended for You'}
                  </Text>
                  <Text style={styles.sortSubtitleText}>
                    {displayBooks.length} {language === 'vi' ? 'đầu sách' : 'books'}
                  </Text>
                </View>

                {/* Dropdown Gợi ý cho bạn dạng Pill Button */}
                <TouchableOpacity
                  style={[
                    styles.sortPillBtn,
                    activeSort !== 'bestseller' && styles.sortPillBtnActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setSortModalVisible(true)}
                >
                  <Ionicons
                    name={selectedSortObj.icon}
                    size={15}
                    color={activeSort !== 'bestseller' ? '#B91C1C' : '#475569'}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.sortPillText,
                      activeSort !== 'bestseller' && { color: '#B91C1C' },
                    ]}
                    numberOfLines={1}
                  >
                    {selectedSortObj.label}
                  </Text>
                  <Ionicons name="chevron-down" size={14} color="#64748B" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="search-outline" size={36} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>
              {language === 'vi'
                ? 'Không tìm thấy sách nào'
                : 'No books found'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {language === 'vi'
                ? 'Thử tìm với từ khóa khác hoặc chuyển sang danh mục khác nhé!'
                : 'Try searching with another keyword or change category.'}
            </Text>
            <TouchableOpacity
              style={styles.resetBtn}
              activeOpacity={0.8}
              onPress={() => {
                setSearchQuery('');
                setActiveCategory('all');
              }}
            >
              <Text style={styles.resetBtnText}>
                {language === 'vi' ? 'Xem tất cả sách' : 'View all books'}
              </Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={renderBookItem}
      />

      {/* MODAL GỢI Ý & SẮP XẾP SÁCH */}
      <Modal
        visible={sortModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSortModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSortModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
            <View style={styles.modalDragHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {language === 'vi' ? 'Gợi ý & Sắp xếp sách' : 'Sorting & Recommendations'}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setSortModalVisible(false)}
              >
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {sorts.map((sort) => {
                const isActive = activeSort === sort.id;
                return (
                  <TouchableOpacity
                    key={sort.id}
                    style={[
                      styles.modalOptionItem,
                      isActive && styles.modalOptionItemActive,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      setActiveSort(sort.id);
                      setSortModalVisible(false);
                    }}
                  >
                    <View style={styles.modalOptionLeft}>
                      <Ionicons
                        name={sort.icon}
                        size={20}
                        color={isActive ? '#B91C1C' : '#64748B'}
                      />
                      <Text
                        style={[
                          styles.modalOptionText,
                          isActive && styles.modalOptionTextActive,
                        ]}
                      >
                        {sort.label}
                      </Text>
                    </View>
                    {isActive && (
                      <Ionicons name="checkmark-circle" size={20} color="#B91C1C" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}