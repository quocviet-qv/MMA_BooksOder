import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, Text, TouchableOpacity, View, Platform } from 'react-native'; 

import { API_URL, getCurrentUserId } from '../src/constants/api';
import { styles } from '../styles/DetailScreenStyles';

export default function DetailScreen({ route, navigation }) {
  const { book } = route.params;
  const bookId = (book.id || book._id).toString();
  const [isAdding, setIsAdding] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [loadingFav, setLoadingFav] = useState(true);
  const [userId, setUserId] = useState('user123');

  useEffect(() => {
    initData();
  }, []);

  const initData = async () => {
    const uid = await getCurrentUserId();
    setUserId(uid);
    await checkFavoriteStatus(uid);
  };

  const checkFavoriteStatus = async (uid) => {
    try {
      const response = await fetch(`${API_URL}/favorites/${uid}`);
      const favorites = await response.json();
      const isBookFavorited = (Array.isArray(favorites) ? favorites : [])
        .filter(fav => fav && fav.bookId)
        .some(fav => (fav.bookId._id || fav.bookId).toString() === bookId);
      setIsFav(isBookFavorited);
    } catch (error) {
      console.error('Lỗi tải trạng thái yêu thích:', error);
    } finally {
      setLoadingFav(false);
    }
  };

  const handleToggleFavorite = async () => {
    const nextFav = !isFav;
    setIsFav(nextFav);
    try {
      const response = await fetch(`${API_URL}/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, bookId })
      });
      if (!response.ok) {
        setIsFav(!nextFav);
      }
    } catch (error) {
      console.error(error);
      setIsFav(!nextFav);
    }
  };

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      const uid = await getCurrentUserId();
      const response = await fetch(`${API_URL}/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid, bookId, quantity: 1 })
      });

      if (response.ok) {
        Alert.alert('Thành công', 'Đã thêm sách vào giỏ hàng!', [
          { text: 'Tiếp tục mua sắm', style: 'cancel' },
          { text: 'Đến Giỏ hàng', onPress: () => navigation.navigate('Main', { screen: 'Cart' }) }
        ]);
      } else {
        Alert.alert('Lỗi', 'Không thể thêm vào giỏ hàng lúc này.');
      }
    } catch (error) {
      Alert.alert('Lỗi mạng', 'Không thể kết nối đến máy chủ Backend.');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageContainer}>
          <Image source={{ uri: book.coverImage }} style={styles.coverImage} />
        </View>
        
        <View style={styles.infoContainer}>
          <View style={styles.topRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{book.category}</Text>
            </View>
            <TouchableOpacity style={styles.favIconBtn} onPress={handleToggleFavorite} disabled={loadingFav}>
              <Ionicons name={isFav ? "heart" : "heart-outline"} size={26} color={isFav ? "#E25842" : "#999"} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.title}>{book.bookName}</Text>
          <Text style={styles.author}>Tác giả: {book.author}</Text>
          <Text style={styles.price}>{book.price?.toLocaleString('vi-VN')} đ</Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Giới thiệu nội dung</Text>
          <Text style={styles.description}>
            Đây là một trong những cuốn sách tuyệt vời nhất thuộc thể loại {book.category}. 
            Với những triết lý sâu sắc và bài học thực tế, tác phẩm của {book.author} chắc chắn sẽ mang lại cho bạn những giây phút đọc sách thú vị và bổ ích. Hãy thêm vào giỏ hàng để sở hữu ngay!
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Platform.OS === 'android' ? 45 : 25 }]}>
        <TouchableOpacity style={styles.favOutlineBtn} onPress={handleToggleFavorite} disabled={loadingFav}>
          <Ionicons name={isFav ? "heart" : "heart-outline"} size={24} color="#E25842" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.addToCartBtn} 
          onPress={handleAddToCart} 
          disabled={isAdding}
        >
          {isAdding ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="cart" size={20} color="#FFF" style={styles.btnIcon} />
              <Text style={styles.addToCartText}>Thêm vào giỏ</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
