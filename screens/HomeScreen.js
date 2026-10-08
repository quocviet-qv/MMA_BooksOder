import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
// Đã bổ sung ActivityIndicator và TextInput ở dòng dưới đây:
import { ActivityIndicator, Dimensions, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function HomeScreen({ navigation }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [activeSort, setActiveSort] = useState('Bán chạy');
  
  // State mới lưu danh sách sách yêu thích
  const [favorites, setFavorites] = useState([]);

  // Gọi API lấy danh sách sách
  useEffect(() => {
    fetch('https://6ac736b375a4ce3fe72171dd.mockapi.io/books')
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

  // Tự động tải lại danh sách yêu thích mỗi khi quay lại màn hình này
  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  const loadFavorites = async () => {
    try {
      const savedFavs = await AsyncStorage.getItem('favorites');
      if (savedFavs) {
        setFavorites(JSON.parse(savedFavs));
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Hàm xử lý Thêm/Xóa khỏi danh sách yêu thích
  const toggleFavorite = async (book) => {
    try {
      let newFavorites = [...favorites];
      const isExist = newFavorites.find(item => item.id === book.id);
      
      if (isExist) {
        // Nếu đã có thì xóa đi
        newFavorites = newFavorites.filter(item => item.id !== book.id);
      } else {
        // Nếu chưa có thì thêm vào
        newFavorites.push(book);
      }
      
      setFavorites(newFavorites);
      await AsyncStorage.setItem('favorites', JSON.stringify(newFavorites));
    } catch (error) {
      console.error(error);
    }
  };

  const categories = ['Tất cả', 'Tiểu thuyết', 'Kỹ năng sống', 'Khoa học'];
  const sorts = ['Bán chạy', 'Giá thấp', 'Giá cao'];

  const renderBookItem = ({ item }) => {
    // Kiểm tra xem sách này đã được yêu thích chưa
    const isFav = favorites.find(b => b.id === item.id);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('DetailScreen', { book: item })}
      >
        <Image source={{ uri: item.coverImage }} style={styles.coverImage} />
        
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>-15%</Text>
        </View>

        {/* Nút Yêu thích đã được gắn sự kiện */}
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
        data={books}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={styles.greeting}>Xin chào 👋</Text>
              <Text style={styles.mainTitle}>Hôm nay bạn muốn{'\n'}đọc gì?</Text>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search-outline" size={20} color="#888" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm theo tên sách hoặc tác giả"
                placeholderTextColor="#999"
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
              <Text style={styles.bookCount}>{books.length} cuốn sách</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 16, paddingTop: 20 },
  greeting: { fontSize: 14, color: '#555', marginBottom: 4 },
  mainTitle: { fontSize: 28, fontWeight: 'bold', color: '#1A1A1A', fontFamily: 'serif' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 20, marginBottom: 16, borderRadius: 25, paddingHorizontal: 15, height: 50, borderWidth: 1, borderColor: '#EAEAEA' },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: '#000' },
  categoryList: { paddingLeft: 16, marginBottom: 15 },
  categoryBtn: { backgroundColor: '#EBE6DF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginRight: 10 },
  activeCategoryBtn: { backgroundColor: '#1C1917' },
  categoryText: { fontSize: 14, color: '#4A4A4A', fontWeight: '500' },
  activeCategoryText: { color: '#FFFFFF' },
  divider: { height: 6, backgroundColor: '#A3A3A3', marginHorizontal: 20, borderRadius: 3, marginVertical: 10 },
  sortSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 15 },
  bookCount: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A' },
  sortButtons: { flexDirection: 'row' },
  sortBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, marginLeft: 6, backgroundColor: '#EBE6DF' },
  activeSortBtn: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EBE6DF' },
  sortText: { fontSize: 12, color: '#555' },
  activeSortText: { color: '#000', fontWeight: 'bold' },
  row: { justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 16 },
  card: { width: CARD_WIDTH, backgroundColor: '#FFF', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#F0F0F0' },
  coverImage: { width: '100%', height: 220, resizeMode: 'cover' },
  discountBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: '#E25842', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  discountText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  favoriteBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: '#FFF', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  bookInfo: { padding: 10 },
  bookTitle: { fontSize: 14, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 4 },
  bookPrice: { fontSize: 14, color: '#E25842', fontWeight: '600' }
});