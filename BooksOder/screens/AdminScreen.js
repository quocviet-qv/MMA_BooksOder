import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
// Đã xóa SafeAreaView khỏi import
import { ActivityIndicator, Alert, FlatList, Image, Text, TouchableOpacity, View } from 'react-native';

// Import style CSS của bạn
import { styles } from '../styles/AdminScreenStyles';

export default function AdminScreen({ navigation, route }) {
  const { setIsLoggedIn, setUserRole } = route.params || {};
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = 'http://192.168.101.105:3000';

  // Tự động tải lại danh sách sách mỗi khi quay lại màn hình này
  useFocusEffect(
    useCallback(() => {
      fetchBooks();
    }, [])
  );

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/books`);
      const data = await response.json();
      setBooks(data);
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Không thể tải danh sách sách.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Xác nhận", "Bạn có muốn đăng xuất khỏi quyền Admin?", [
      { text: "Hủy", style: "cancel" },
      { 
        text: "Đăng xuất", 
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove(['userToken', 'userRole']);
          setUserRole?.(null);
          setIsLoggedIn?.(false);
        }
      }
    ]);
  };

  const handleDelete = (id) => {
    Alert.alert("Cảnh báo", "Bạn có chắc chắn muốn xóa cuốn sách này?", [
      { text: "Hủy", style: "cancel" },
      { 
        text: "Xóa", 
        style: "destructive",
        onPress: async () => {
          try {
            const response = await fetch(`${API_URL}/books/${id}`, {
              method: 'DELETE',
            });
            if (response.ok) {
              Alert.alert('Thành công', 'Đã xóa sách.');
              fetchBooks(); // Tải lại danh sách sau khi xóa
            } else {
              Alert.alert('Lỗi', 'Xóa sách thất bại.');
            }
          } catch (error) {
            Alert.alert('Lỗi mạng', 'Không thể kết nối đến server.');
          }
        }
      }
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.bookItem}>
      {/* Hiển thị ảnh bìa hoặc một khối màu xám nếu mất link ảnh */}
      {item.coverImage ? (
        <Image source={{ uri: item.coverImage }} style={styles.bookImage} />
      ) : (
        <View style={[styles.bookImage, { backgroundColor: '#EAEAEA' }]} />
      )}
      
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={1}>{item.bookName}</Text>
        <Text style={styles.bookPrice}>{item.price?.toLocaleString('vi-VN')} đ</Text>
      </View>

      <View style={styles.actionButtons}>
        {/* Nút Sửa */}
        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={() => navigation.navigate('AdminForm', { book: item })}
        >
          <Ionicons name="pencil" size={20} color="#4A90E2" />
        </TouchableOpacity>
        
        {/* Nút Xóa */}
        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={() => handleDelete(item._id || item.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#E25842" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    // Đã thay thẻ SafeAreaView bằng thẻ View bình thường
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quản lý sách</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={28} color="#C5532A" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.addBtn}
        onPress={() => navigation.navigate('AdminForm')}
      >
        <Ionicons name="add-circle-outline" size={24} color="#FFF" />
        <Text style={styles.addBtnText}>Thêm sách mới</Text>
      </TouchableOpacity>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#C5532A" />
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item) => (item._id || item.id).toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}