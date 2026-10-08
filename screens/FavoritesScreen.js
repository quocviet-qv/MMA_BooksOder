import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function FavoritesScreen({ navigation }) {
  const [favorites, setFavorites] = useState([]);

  // Lấy dữ liệu mỗi khi người dùng bấm sang tab này
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

  // Hàm gỡ bỏ sách khỏi yêu thích
  const removeFavorite = async (bookId) => {
    try {
      const newFavorites = favorites.filter(item => item.id !== bookId);
      setFavorites(newFavorites);
      await AsyncStorage.setItem('favorites', JSON.stringify(newFavorites));
    } catch (error) {
      console.error(error);
    }
  };

  // 1. GIAO DIỆN KHI CHƯA CÓ SÁCH NÀO (Giống hình bạn gửi)
  if (favorites.length === 0) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <View style={styles.emptyContent}>
          <View style={styles.iconCircle}>
            {/* Dùng icon chồng sách tượng trưng */}
            <Ionicons name="library" size={56} color="#4A4A4A" />
          </View>
          <Text style={styles.emptyTitle}>Bạn chưa lưu cuốn sách nào</Text>
          <Text style={styles.emptyDesc}>Bấm vào biểu tượng trái tim để lưu những cuốn sách bạn thích.</Text>
          
          <TouchableOpacity 
            style={styles.exploreBtn} 
            // Lưu ý: Đổi tên 'Home' thành tên đúng của màn hình Home trong file App.js của bạn nếu bị lỗi chuyển trang
            onPress={() => navigation.navigate('Home')} 
          >
            <Text style={styles.exploreBtnText}>Khám phá sách</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 2. GIAO DIỆN KHI ĐÃ CÓ SÁCH
  const renderBookItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('DetailScreen', { book: item })}
    >
      <Image source={{ uri: item.coverImage }} style={styles.coverImage} />
      
      <View style={styles.discountBadge}>
        <Text style={styles.discountText}>-15%</Text>
      </View>

      <TouchableOpacity style={styles.favoriteBtn} onPress={() => removeFavorite(item.id)}>
        <Ionicons name="heart" size={18} color="#E25842" />
      </TouchableOpacity>

      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={1}>{item.bookName}</Text>
        <Text style={styles.bookPrice}>{item.price.toLocaleString('vi-VN')} đ</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.mainTitle}>Sách yêu thích</Text>
      </View>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        renderItem={renderBookItem}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 20,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    fontFamily: 'serif',
  },
  // Style cho màn hình rỗng
  emptyContainer: {
    flex: 1,
    backgroundColor: '#FAF7F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContent: {
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: -50,
  },
  iconCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#EBE4DA', // Màu nền tròn nhạt
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3E2723', // Màu nâu tối
    fontFamily: 'serif',
    marginBottom: 12,
  },
  emptyDesc: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 35,
    lineHeight: 22,
  },
  exploreBtn: {
    backgroundColor: '#C5532A', // Màu cam đất giống thiết kế
    paddingVertical: 14,
    paddingHorizontal: 35,
    borderRadius: 25,
  },
  exploreBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Style cho thẻ sách
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  coverImage: {
    width: '100%',
    height: 220,
    resizeMode: 'cover',
  },
  discountBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#E25842',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  favoriteBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFF',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bookInfo: {
    padding: 10,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  bookPrice: {
    fontSize: 14,
    color: '#E25842',
    fontWeight: '600',
  },
});