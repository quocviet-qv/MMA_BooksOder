import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native'; // Thêm import này
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles/AdminScreenStyles';

export default function AdminScreen({ route, navigation }) { // Thêm navigation vào props
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  const { setIsLoggedIn, setUserRole } = route.params || {};

  const fetchBooks = () => {
    setLoading(true);
    fetch('https://6ac736b375a4ce3fe72171dd.mockapi.io/books')
      .then(res => res.json())
      .then(data => {
        setBooks(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  // Dùng useFocusEffect thay cho useEffect để tự động gọi API lại mỗi khi mở/quay lại màn hình này
  useFocusEffect(
    useCallback(() => {
      fetchBooks();
    }, [])
  );

  const handleLogout = () => {
    Alert.alert("Xác nhận", "Bạn có chắc chắn muốn đăng xuất khỏi quyền Admin?", [
      { text: "Hủy", style: "cancel" },
      { 
        text: "Đăng xuất", 
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem('userToken');
          await AsyncStorage.removeItem('userRole');
          if(setUserRole) setUserRole(null);
          if(setIsLoggedIn) setIsLoggedIn(false);
        }
      }
    ]);
  };

  const handleDelete = (id, bookName) => {
    Alert.alert("Xóa sách", `Bạn có chắc muốn xóa cuốn "${bookName}" không?`, [
      { text: "Hủy", style: "cancel" },
      { 
        text: "Xóa", 
        style: "destructive", 
        onPress: () => {
          setLoading(true);
          fetch(`https://6ac736b375a4ce3fe72171dd.mockapi.io/books/${id}`, { method: 'DELETE' })
          .then(res => res.json())
          .then(() => {
            Alert.alert("Thành công", "Đã xóa sách khỏi hệ thống!");
            fetchBooks();
          })
          .catch(err => console.error(err));
        }
      }
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.bookItem}>
      <Image source={{ uri: item.coverImage }} style={styles.bookImage} />
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={2}>{item.bookName}</Text>
        <Text style={styles.bookPrice}>{item.price.toLocaleString('vi-VN')} đ</Text>
      </View>
      <View style={styles.actionButtons}>
        {/* NÚT SỬA ĐÃ ĐƯỢC KÍCH HOẠT */}
        <TouchableOpacity 
          style={styles.actionBtn} 
          onPress={() => navigation.navigate('AdminForm', { bookToEdit: item })}
        >
          <Ionicons name="pencil-outline" size={20} color="#4A90E2" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id, item.bookName)}>
          <Ionicons name="trash-outline" size={20} color="#E25842" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quản lý sách</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={28} color="#C5532A" />
        </TouchableOpacity>
      </View>

      {/* NÚT THÊM MỚI ĐÃ ĐƯỢC KÍCH HOẠT */}
      <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AdminForm')}>
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
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}