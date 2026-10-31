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
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { API_URL } from '../src/constants/api';
import { useAuth } from '../src/context/AuthContext';
import { useCart } from '../src/context/CartContext';
import { useLanguage } from '../src/context/LanguageContext';
import { styles } from '../styles/HomeScreenStyles';

export default function HomeScreen({ navigation }) {
  const { userId, logout } = useAuth();
  const { refreshCartCount } = useCart();
  const { t, language, toggleLanguage } = useLanguage();

  const categories = [
    t('home.allCategory'),
    'Tiểu thuyết',
    'Kinh tế',
    'Kỹ năng sống',
    'Công nghệ',
    'Văn học',
  ];

  const sorts = [
    { id: 'bestseller', label: language === 'vi' ? 'Bán chạy' : 'Best Seller' },
    { id: 'newest', label: t('home.sortNewest') },
    { id: 'priceAsc', label: t('home.sortPriceAsc') },
    { id: 'priceDesc', label: t('home.sortPriceDesc') },
  ];

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [activeSort, setActiveSort] = useState('bestseller');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState([]);

  const handleLogout = () => {
    Alert.alert(t('common.confirm'), t('common.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.logout'),
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  useFocusEffect(
    useCallback(() => {
      loadHomeData();
      refreshCartCount(userId);
    }, [userId])
  );

  const loadHomeData = async () => {
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
  };

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

  // Lọc và sắp xếp sách hiển thị
  let displayBooks = books.filter((book) => {
    const isAll = activeCategory === categories[0] || activeCategory === 'Tất cả' || activeCategory === 'All';
    const matchCategory = isAll || book.category === activeCategory;
    const query = searchQuery.toLowerCase().trim();
    const matchSearch =
      (book.bookName && book.bookName.toLowerCase().includes(query)) ||
      (book.author && book.author.toLowerCase().includes(query));
    return matchCategory && matchSearch;
  });

  if (activeSort === 'priceAsc') {
    displayBooks.sort((a, b) => a.price - b.price);
  } else if (activeSort === 'priceDesc') {
    displayBooks.sort((a, b) => b.price - a.price);
  } else if (activeSort === 'newest') {
    displayBooks.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  const renderBookItem = ({ item }) => {
    const itemId = (item.id || item._id).toString();
    const isFav = favorites.includes(itemId);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('Chi tiết', { book: item })}
      >
        <Image source={{ uri: item.coverImage }} style={styles.coverImage} />

        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>-15%</Text>
        </View>

        <TouchableOpacity style={styles.favoriteBtn} onPress={() => toggleFavorite(item)}>
          <Ionicons
            name={isFav ? 'heart' : 'heart-outline'}
            size={18}
            color={isFav ? '#E25842' : '#000'}
          />
        </TouchableOpacity>

        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle} numberOfLines={1}>
            {item.bookName}
          </Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={13} color="#FFB800" />
            <Text style={styles.ratingText}>
              {item.averageRating && item.averageRating > 0 ? item.averageRating.toFixed(1) : '5.0'}
            </Text>
            <Text style={styles.reviewCountText}>({item.totalReviews || 0})</Text>
          </View>
          <Text style={styles.bookPrice}>{(item.price || 0).toLocaleString('vi-VN')} đ</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#C5532A" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={displayBooks}
        keyExtractor={(item) => (item.id || item._id).toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#C5532A']}
            tintColor="#C5532A"
          />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <View>
                <Text style={styles.greeting}>{t('home.greeting')}</Text>
                <Text style={styles.mainTitle}>{t('home.headerTitle')}</Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity
                  style={[styles.logoutBtn, { marginRight: 8, paddingHorizontal: 10 }]}
                  onPress={toggleLanguage}
                >
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#C5532A' }}>
                    {language === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                  <Ionicons name="log-out-outline" size={24} color="#C5532A" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search-outline" size={20} color="#888" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder={t('home.searchPlaceholder')}
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={categories}
              keyExtractor={(item) => item}
              style={styles.categoryList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.categoryBtn,
                    activeCategory === item && styles.activeCategoryBtn,
                  ]}
                  onPress={() => setActiveCategory(item)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      activeCategory === item && styles.activeCategoryText,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />

            <View style={styles.divider} />

            <View style={styles.sortSection}>
              <Text style={styles.bookCount}>
                {displayBooks.length} {t('home.booksCount')}
              </Text>
              <View style={styles.sortButtons}>
                {sorts.map((sort) => (
                  <TouchableOpacity
                    key={sort.id}
                    style={[styles.sortBtn, activeSort === sort.id && styles.activeSortBtn]}
                    onPress={() => setActiveSort(sort.id)}
                  >
                    <Text
                      style={[
                        styles.sortText,
                        activeSort === sort.id && styles.activeSortText,
                      ]}
                    >
                      {sort.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        }
        renderItem={renderBookItem}
      />
    </SafeAreaView>
  );
}