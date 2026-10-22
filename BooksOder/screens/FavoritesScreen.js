import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import style riêng từ thư mục styles
import { styles } from '../styles/FavoritesScreenStyles';

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
      } else {
        setFavorites([]);
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

  // 1. GIAO DIỆN KHI CHƯA CÓ SÁCH NÀO
  if (favorites.length === 0) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <View style={styles.emptyContent}>
          <View style={styles.iconCircle}>
            <Ionicons name="library" size={56} color="#4A4A4A" />
          </View>
          <Text style={styles.emptyTitle}>Bạn chưa lưu cuốn sách nào</Text>
          <Text style={styles.emptyDesc}>Bấm vào biểu tượng trái tim để lưu những cuốn sách bạn thích.</Text>
          
          <TouchableOpacity 
            style={styles.exploreBtn} 
            onPress={() => navigation.navigate('Home')} 
          >
            <Text style={styles.exploreBtnText}>Khám phá sách</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 2. GIAO DIỆN KHI ĐÃ CÓ SÁCH (Đã sửa route 'DetailScreen' thành 'Chi tiết' cho đồng bộ App.js)
  const renderBookItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('Chi tiết', { book: item })}
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