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

import { API_URL } from '../src/constants/api';
import { useAuth } from '../src/context/AuthContext';
import { styles } from '../styles/FavoritesScreenStyles';

export default function FavoritesScreen({ navigation }) {
  const { userId } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
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
      console.error(error);
      Alert.alert('Lỗi mạng', 'Không thể tải danh sách yêu thích');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchFavorites();
  };

  const handleRemoveFavorite = async (bookId) => {
    try {
      const currentId = userId || 'user123';
      const response = await fetch(`${API_URL}/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentId, bookId }),
      });

      if (response.ok) {
        setFavorites((prev) =>
          prev.filter((item) => (item.bookId._id || item.bookId) !== bookId)
        );
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể xóa khỏi danh sách yêu thích.');
    }
  };

  const renderItem = ({ item }) => {
    const book = item.bookId || {};
    return (
      <TouchableOpacity
        style={styles.bookItem}
        onPress={() => navigation.navigate('Chi tiết', { book })}
      >
        <Image
          source={{ uri: book.coverImage || 'https://via.placeholder.com/150' }}
          style={styles.bookImage}
        />
        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle} numberOfLines={1}>
            {book.bookName || 'Sách'}
          </Text>
          <Text style={styles.bookAuthor} numberOfLines={1}>
            Tác giả: {book.author || 'Đang cập nhật'}
          </Text>
          <Text style={styles.bookPrice}>
            {(book.price || 0).toLocaleString('vi-VN')} đ
          </Text>
        </View>

        <TouchableOpacity
          style={styles.heartBtn}
          onPress={() => handleRemoveFavorite(book._id || book.id)}
        >
          <Ionicons name="heart" size={24} color="#E25842" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.emptyContainer}>
        <ActivityIndicator size="large" color="#C5532A" />
      </View>
    );
  }

  if (favorites.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyContent}>
          <View style={styles.iconCircle}>
            <Ionicons name="heart-dislike-outline" size={60} color="#C5532A" />
          </View>
          <Text style={styles.emptyTitle}>Chưa có sách yêu thích!</Text>
          <Text style={styles.emptyDesc}>
            Hãy nhấn vào biểu tượng trái tim ở mỗi cuốn sách để lưu vào danh sách này nhé.
          </Text>
          <TouchableOpacity
            style={styles.exploreBtn}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.exploreBtnText}>Khám phá sách ngay</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.mainTitle}>Sách yêu thích</Text>
      </View>

      <FlatList
        data={favorites}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#C5532A']}
            tintColor="#C5532A"
          />
        }
      />
    </View>
  );
}