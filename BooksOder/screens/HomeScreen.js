import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import bộ style từ file riêng
import { styles } from '../styles/HomeScreenStyles';

export default function HomeScreen({ navigation, route }) {
  const { setIsLoggedIn, setUserRole } = route.params || {};
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [activeSort, setActiveSort] = useState('Bán chạy');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState([]); // Mảng chứa ID các sách đã thích

  const userId = 'user123';
  const API_URL = 'http://192.168.101.105:3000';

  const handleLogout = () => {
    Alert.alert("Xác nhận", "Bạn có chắc chắn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      { 
        text: "Đăng xuất", 
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.multiRemove(['userToken', 'userRole']);
            setUserRole?.(null);
            setIsLoggedIn?.(false);
          } catch (error) {
            console.error('Không thể đăng xuất:', error);
            Alert.alert('Lỗi', 'Không thể đăng xuất. Vui lòng thử lại.');
          }
        }
      }
    ]);
  };

  // Gọi API lấy danh sách sách
  useEffect(() => {
    fetch(`${API_URL}/books`)
      .then((response) => response.json())
      .then((data) => {
        setBooks(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
      });
  }, []);

  // Tự động tải lại danh sách yêu thích từ API mỗi khi quay lại trang chủ
  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [])
  );

  const fetchFavorites = async () => {
    try {
      const response = await fetch(`${API_URL}/favorites/${userId}`);
      const data = await response.json();
      // Trích xuất ID sách để dễ dàng kiểm tra ở hàm render
      const favIds = data.map(fav => fav.bookId._id || fav.bookId);
      setFavorites(favIds);
    } catch (error) {
      console.error('Lỗi tải danh sách yêu thích:', error);
    }
  };

  // Hàm xử lý Thêm/Xóa khỏi danh sách yêu thích qua API
  const toggleFavorite = async (book) => {
    // Đảo trạng thái trên UI ngay lập tức cho mượt
    const isExist = favorites.includes(book.id);
    if (isExist) {
      setFavorites(favorites.filter(id => id !== book.id));
    } else {
      setFavorites([...favorites, book.id]);
    }

    // Gọi API lưu vào DB
    try {
      const response = await fetch(`${API_URL}/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, bookId: book.id })
      });
      
      // Nếu API lỗi, tự động fetch lại để đồng bộ với server
      if (!response.ok) {
        fetchFavorites();
      }
    } catch (error) {
      console.error(error);
      fetchFavorites();
    }
  };

  const categories = ['Tất cả', 'Tiểu thuyết', 'Kỹ năng sống', 'Khoa học'];
  const sorts = ['Bán chạy', 'Giá thấp', 'Giá cao'];

  // Lọc sách theo danh mục và từ khóa tìm kiếm
  let displayBooks = books.filter(book => {
    const matchCategory = activeCategory === 'Tất cả' || book.category === activeCategory;
    const keyword = searchQuery.toLowerCase();
    const matchSearch = book.bookName.toLowerCase().includes(keyword) || 
                        book.author.toLowerCase().includes(keyword);

    return matchCategory && matchSearch;
  });

  // Sắp xếp sách theo giá
  if (activeSort === 'Giá thấp') {
    displayBooks.sort((a, b) => a.price - b.price);
  } else if (activeSort === 'Giá cao') {
    displayBooks.sort((a, b) => b.price - a.price);
  }

  const renderBookItem = ({ item }) => {
    // Kiểm tra xem ID sách có nằm trong danh sách yêu thích từ API không
    const isFav = favorites.includes(item.id);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('Chi tiết', { book: item })}
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
          <Text style={styles.bookPrice}>{item.price.toLocaleString('vi-VN')} đ</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={displayBooks}
        keyExtractor={(item) => item.id.toString()}
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