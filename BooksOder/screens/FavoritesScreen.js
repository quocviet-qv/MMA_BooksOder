import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { styles } from '../styles/FavoritesScreenStyles';

export default function FavoritesScreen({ navigation }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const userId = 'user123';
  const API_URL = 'http://192.168.101.105:3000';

  // Tự động fetch lại dữ liệu mỗi khi người dùng bấm vào Tab Yêu thích
  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [])
  );

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/favorites/${userId}`);
      const data = await response.json();
      setFavorites(data);
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi mạng', 'Không thể tải danh sách yêu thích');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (bookId) => {
    try {
      const response = await fetch(`${API_URL}/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, bookId })
      });

      if (response.ok) {
        // Cập nhật lại danh sách trên màn hình ngay lập tức để tạo cảm giác mượt mà
        setFavorites(prevFavs => prevFavs.filter(fav => fav.bookId._id !== bookId));
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể xóa khỏi danh sách yêu thích');
    }
  };

  const renderItem = ({ item }) => {
    const book = item.bookId;
    if (!book) return null;

    return (
      <TouchableOpacity 
        style={styles.card}
        // Chuyển sang màn hình Chi tiết và ghép lại id để đồng bộ với định dạng cũ
        onPress={() => navigation.navigate('Chi tiết', { book: { ...book, id: book._id } })}
      >
        <Image source={{ uri: book.coverImage }} style={styles.coverImage} />
        
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>-15%</Text>
        </View>

        <TouchableOpacity style={styles.favoriteBtn} onPress={() => handleRemoveFavorite(book._id)}>
          <Ionicons name="heart" size={18} color="#E25842" />
        </TouchableOpacity>

        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle} numberOfLines={1}>{book.bookName}</Text>
          <Text style={styles.bookPrice}>{book.price?.toLocaleString('vi-VN')} đ</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#C5532A" style={{ flex: 1, justifyContent: 'center' }} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.mainTitle}>Sách yêu thích</Text>
      </View>

      {favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyContent}>
            <View style={styles.iconCircle}>
              <Ionicons name="heart-outline" size={60} color="#C5532A" />
            </View>
            <Text style={styles.emptyTitle}>Chưa có mục yêu thích</Text>
            <Text style={styles.emptyDesc}>Bạn chưa lưu cuốn sách nào. Hãy khám phá và thêm các cuốn sách bạn thích nhé!</Text>
            <TouchableOpacity 
              style={styles.exploreBtn}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.exploreBtnText}>Khám phá ngay</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          numColumns={2} // Hiển thị 2 cột
          columnWrapperStyle={styles.row} // Căn đều 2 cột theo CSS
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}