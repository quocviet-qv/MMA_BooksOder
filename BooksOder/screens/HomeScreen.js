import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { API_URL, getCurrentUserId } from '../src/constants/api';
import { styles } from '../styles/HomeScreenStyles';

export default function HomeScreen({ navigation, route, onLogout }) {
  const { setIsLoggedIn, setUserRole } = route?.params || {};
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [activeSort, setActiveSort] = useState('Bán chạy');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [userId, setUserId] = useState('user123');

  const handleLogout = () => {
    Alert.alert("Xác nhận", "Bạn có chắc chắn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      { 
        text: "Đăng xuất", 
        style: "destructive",
        onPress: async () => {
          try {
            if (onLogout) {
              await onLogout();
            } else {
              await AsyncStorage.multiRemove(['userToken', 'userRole', 'userId']);
              setUserRole?.(null);
              setIsLoggedIn?.(false);
            }
          } catch (error) {
            console.error('Không thể đăng xuất:', error);
            Alert.alert('Lỗi', 'Không thể đăng xuất. Vui lòng thử lại.');
          }
        }
      }
    ]);
  };

  // Tự động tải lại sách và danh sách yêu thích mỗi khi vào Trang chủ
  useFocusEffect(
    useCallback(() => {
      loadHomeData();
    }, [])
  );

  const loadHomeData = async () => {
    const currentId = await getCurrentUserId();
    setUserId(currentId);

    try {
      const [booksRes, favRes] = await Promise.all([
        fetch(`${API_URL}/books`),
        fetch(`${API_URL}/favorites/${currentId}`)
      ]);

      if (booksRes.ok) {
        const booksData = await booksRes.json();
        setBooks(Array.isArray(booksData) ? booksData : []);
      }

      if (favRes.ok) {
        const favData = await favRes.json();
        const favIds = (Array.isArray(favData) ? favData : [])
          .filter(fav => fav && fav.bookId)
          .map(fav => (fav.bookId._id || fav.bookId).toString());
        setFavorites(favIds);
      }
    } catch (error) {
      console.error('Lỗi tải dữ liệu trang chủ:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async (uid = userId) => {
    try {
      const response = await fetch(`${API_URL}/favorites/${uid}`);
      const data = await response.json();
      const favIds = (Array.isArray(data) ? data : [])
        .filter(fav => fav && fav.bookId)
        .map(fav => (fav.bookId._id || fav.bookId).toString());
      setFavorites(favIds);
    } catch (error) {
      console.error('Lỗi tải danh sách yêu thích:', error);
    }
  };

  // Hàm xử lý Thêm/Xóa khỏi danh sách yêu thích qua API
  const toggleFavorite = async (book) => {
    const bookId = (book.id || book._id).toString();
    const isExist = favorites.includes(bookId);
    if (isExist) {
      setFavorites(favorites.filter(id => id !== bookId));
    } else {
      setFavorites([...favorites, bookId]);
    }

    try {
      const response = await fetch(`${API_URL}/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, bookId })
      });
      
      if (!response.ok) {
        fetchFavorites(userId);
      }
    } catch (error) {
      console.error(error);
      fetchFavorites(userId);
    }
  };

  const categories = ['Tất cả', 'Tiểu thuyết', 'Kỹ năng sống', 'Khoa học'];
  const sorts = ['Bán chạy', 'Giá thấp', 'Giá cao'];

  // Lọc sách theo danh mục và từ khóa tìm kiếm (bảo vệ null/undefined)
  let displayBooks = books.filter(book => {
    const matchCategory = activeCategory === 'Tất cả' || book.category === activeCategory;
    const keyword = searchQuery.toLowerCase();
    const bookName = (book.bookName || '').toLowerCase();
    const author = (book.author || '').toLowerCase();
    const matchSearch = bookName.includes(keyword) || author.includes(keyword);

    return matchCategory && matchSearch;
  });

  // Sắp xếp sách theo giá
  if (activeSort === 'Giá thấp') {
    displayBooks.sort((a, b) => (a.price || 0) - (b.price || 0));
  } else if (activeSort === 'Giá cao') {
    displayBooks.sort((a, b) => (b.price || 0) - (a.price || 0));
  }

  const renderBookItem = ({ item }) => {
    const itemId = (item.id || item._id).toString();
    const isFav = favorites.includes(itemId);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('Chi tiết', { book: { ...item, id: itemId } })}
      >
        <Image source={{ uri: item.coverImage }} style={styles.coverImage} />
        
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>-15%</Text>
        </View>

        <TouchableOpacity 
          style={styles.favoriteBtn} 
          onPress={() => toggleFavorite(item)}
        >
          <Ionicons 
            name={isFav ? "heart" : "heart-outline"} 
            size={18} 
            color={isFav ? "#E25842" : "#000"} 
          />
        </TouchableOpacity>

        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle} numberOfLines={1}>{item.bookName}</Text>
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
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <View>
                <Text style={styles.greeting}>Xin chào 👋</Text>
                <Text style={styles.mainTitle}>Hôm nay bạn muốn{'\n'}đọc gì?</Text>
              </View>
              
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={26} color="#C5532A" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search-outline" size={20} color="#888" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm theo tên sách hoặc tác giả"
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={(text) => setSearchQuery(text)}
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
                  style={[styles.categoryBtn, activeCategory === item && styles.activeCategoryBtn]}
                  onPress={() => setActiveCategory(item)}
                >
                  <Text style={[styles.categoryText, activeCategory === item && styles.activeCategoryText]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />

            <View style={styles.divider} />

            <View style={styles.sortSection}>
              <Text style={styles.bookCount}>{displayBooks.length} cuốn sách</Text>
              <View style={styles.sortButtons}>
                {sorts.map((sort) => (
                  <TouchableOpacity
                    key={sort}
                    style={[styles.sortBtn, activeSort === sort && styles.activeSortBtn]}
                    onPress={() => setActiveSort(sort)}
                  >
                    <Text style={[styles.sortText, activeSort === sort && styles.activeSortText]}>{sort}</Text>
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
