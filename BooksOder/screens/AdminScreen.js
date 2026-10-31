import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { API_URL, apiFetch as fetch } from '../src/constants/api';
import { useAuth } from '../src/context/AuthContext';
import { styles } from '../styles/AdminScreenStyles';

export default function AdminScreen({ navigation }) {
  const { logout } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');


  const fetchBooks = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/books`);
      if (response.ok) {
        const data = await response.json();
        setBooks(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi mạng', 'Không thể kết nối đến máy chủ Backend.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);


  useFocusEffect(useCallback(() => { fetchBooks(); }, [fetchBooks]));

  const onRefresh = () => {
    setRefreshing(true);
    fetchBooks();
  };

  const handleLogout = () => {
    Alert.alert('Xác nhận', 'Bạn có muốn đăng xuất khỏi quyền Quản trị viên?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  const handleDelete = (id, bookName) => {
    Alert.alert(
      'Cảnh báo xóa sách',
      `Bạn có chắc chắn muốn xóa cuốn sách "${bookName || 'này'}" khỏi hệ thống?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa vĩnh viễn',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/books/${id}`, {
                method: 'DELETE',
              });
              if (response.ok) {
                Alert.alert('Thành công', 'Đã xóa sách khỏi kho.');
                setBooks((prev) => prev.filter((b) => (b._id || b.id) !== id));
              } else {
                Alert.alert('Thất bại', 'Không thể xóa cuốn sách này.');
              }
            } catch (_error) {
              Alert.alert('Lỗi kết nối', 'Không thể kết nối đến máy chủ.');
            }
          },
        },
      ]
    );
  };

  const filteredBooks = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return books;
    return books.filter((b) => {
      const matchName = b.bookName && b.bookName.toLowerCase().includes(query);
      const matchAuthor = b.author && b.author.toLowerCase().includes(query);
      const matchCategory = b.category && b.category.toLowerCase().includes(query);
      return matchName || matchAuthor || matchCategory;
    });
  }, [books, searchQuery]);

  const renderItem = ({ item }) => {
    const bookId = item._id || item.id;
    const stockCount = item.stock !== undefined ? Number(item.stock) : 50;

    let stockStyle = styles.stockIn;
    let stockTextStyle = styles.stockTextIn;
    let stockLabel = `Còn ${stockCount} cuốn`;

    if (stockCount === 0) {
      stockStyle = styles.stockOut;
      stockTextStyle = styles.stockTextOut;
      stockLabel = 'Hết hàng';
    } else if (stockCount <= 5) {
      stockStyle = styles.stockLow;
      stockTextStyle = styles.stockTextLow;
      stockLabel = `Sắp hết (${stockCount})`;
    }

    return (
      <View style={styles.bookItem}>
        <View style={styles.cardMainRow}>
          {item.coverImage ? (
            <Image source={{ uri: item.coverImage }} style={styles.bookImage} />
          ) : (
            <View style={[styles.bookImage, styles.bookImagePlaceholder]}>
              <Ionicons name="book-outline" size={28} color="#94A3B8" />
            </View>
          )}

          <View style={styles.bookInfo}>
            <View style={styles.tagRow}>
              {item.category ? (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{item.category}</Text>
                </View>
              ) : null}

              <View style={[styles.stockBadge, stockStyle]}>
                <Text style={[styles.stockText, stockTextStyle]}>{stockLabel}</Text>
              </View>
            </View>

            <Text style={styles.bookTitle} numberOfLines={2}>
              {item.bookName}
            </Text>

            <Text style={styles.bookAuthor} numberOfLines={1}>
              {item.author || 'Chưa có tác giả'}
            </Text>

            <Text style={styles.bookPrice}>
              {(item.price || 0).toLocaleString('vi-VN')} đ
            </Text>
          </View>
        </View>

        {/* THAO TÁC SỬA (PUT) & XÓA (DELETE) */}
        <View style={styles.cardFooterRow}>
          {/* Nút Sửa PUT */}
          <TouchableOpacity
            style={styles.editBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('AdminForm', { book: item })}
          >
            <Ionicons name="create-outline" size={16} color="#0F172A" />
            <Text style={styles.editBtnText}>Sửa (PUT)</Text>
          </TouchableOpacity>

          {/* Nút Xóa DELETE */}
          <TouchableOpacity
            style={styles.deleteBtn}
            activeOpacity={0.8}
            onPress={() => handleDelete(bookId, item.bookName)}
          >
            <Ionicons name="trash-outline" size={16} color="#B91C1C" />
            <Text style={styles.deleteBtnText}>Xóa</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* 1. HEADER QUẢN TRỊ VIÊN */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.titleRow}>
            <Ionicons name="shield-checkmark" size={24} color="#B91C1C" />
            <Text style={styles.headerTitle}>Kho sách (Admin)</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            {books.length} đầu sách đang lưu trong hệ thống
          </Text>
        </View>

        <TouchableOpacity
          style={styles.logoutBtn}
          activeOpacity={0.8}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={22} color="#B91C1C" />
        </TouchableOpacity>
      </View>

      {/* 2. NÚT THÊM SÁCH MỚI (POST) */}
      <View style={styles.topActionsWrapper}>
        <TouchableOpacity
          style={styles.addBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('AdminForm')}
        >
          <Ionicons name="add-circle" size={22} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Thêm sách mới vào kho (POST)</Text>
        </TouchableOpacity>
      </View>

      {/* 3. THANH TÌM KIẾM NHANH TRONG KHO */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo tên sách, tác giả hoặc thể loại..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity style={styles.clearBtn} onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 4. DANH SÁCH SÁCH TRONG KHO */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#B91C1C" />
          <Text style={styles.loadingText}>Đang tải danh sách kho sách...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredBooks}
          keyExtractor={(item) => (item._id || item.id).toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#B91C1C']}
              tintColor="#B91C1C"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="cube-outline" size={38} color="#B91C1C" />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'Không tìm thấy sách phù hợp' : 'Kho sách chưa có sản phẩm'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? 'Hãy thử kiểm tra lại từ khóa tìm kiếm của bạn.'
                  : 'Nhấn vào nút "Thêm sách mới vào kho (POST)" phía trên để xuất bản cuốn sách đầu tiên!'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}