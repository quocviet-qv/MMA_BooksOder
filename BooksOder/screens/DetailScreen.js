import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
// Đã gỡ SafeAreaView, chỉ dùng View và Platform
import { ActivityIndicator, Alert, Image, ScrollView, Text, TouchableOpacity, View, Platform } from 'react-native'; 

import { styles } from '../styles/DetailScreenStyles';

export default function DetailScreen({ route, navigation }) {
  const { book } = route.params;
  const [isAdding, setIsAdding] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [loadingFav, setLoadingFav] = useState(true);

  const userId = 'user123';
  const API_URL = 'http://192.168.101.105:3000';

  useEffect(() => {
    checkFavoriteStatus();
  }, []);

  const checkFavoriteStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/favorites/${userId}`);
      const favorites = await response.json();
      const isBookFavorited = favorites.some(fav => fav.bookId._id === book.id || fav.bookId === book.id);
      setIsFav(isBookFavorited);
    } catch (error) {
      console.error('Lỗi tải trạng thái yêu thích:', error);
    } finally {
      setLoadingFav(false);
    }
  };

  const handleToggleFavorite = async () => {
    setIsFav(!isFav); 
    try {
      const response = await fetch(`${API_URL}/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, bookId: book.id })
      });
      if (!response.ok) {
        setIsFav(!isFav); 
      }
    } catch (error) {
      console.error(error);
      setIsFav(!isFav); 
    }
  };

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      const response = await fetch(`${API_URL}/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId, bookId: book.id, quantity: 1 })
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
    // Dùng View bình thường thay vì SafeAreaView
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

      {/* Đẩy padding đáy lên 45px nếu là Android để né thanh điều hướng hệ thống */}
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