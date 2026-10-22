import React, { useState } from 'react';
// Đã dùng View bình thường thay vì SafeAreaView
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Image } from 'react-native';

// Import bộ style của bạn
import { styles } from '../styles/AdminFormScreenStyles'; 

export default function AdminFormScreen({ route, navigation }) {
  // Lấy dữ liệu sách từ route (nếu là chế độ Sửa)
  const book = route.params?.book;
  const isEdit = !!book;

  const [formData, setFormData] = useState({
    bookName: book?.bookName || '',
    author: book?.author || '',
    price: book?.price ? book.price.toString() : '',
    category: book?.category || '',
    coverImage: book?.coverImage || ''
  });
  const [loading, setLoading] = useState(false);

  const API_URL = 'http://192.168.101.105:3000';

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    if (!formData.bookName || !formData.price || !formData.category) {
      return Alert.alert('Lỗi', 'Vui lòng nhập đủ Tên sách, Giá và Thể loại!');
    }

    setLoading(true);
    const method = isEdit ? 'PUT' : 'POST';
    const endpoint = isEdit ? `${API_URL}/books/${book._id || book.id}` : `${API_URL}/books`;

    try {
      const response = await fetch(endpoint, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price)
        })
      });

      if (response.ok) {
        Alert.alert('Thành công', isEdit ? 'Cập nhật sách thành công!' : 'Đã thêm sách mới!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Lỗi', 'Thao tác thất bại.');
      }
    } catch (error) {
      Alert.alert('Lỗi mạng', 'Không thể kết nối với server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <Text style={styles.label}>Tên sách (*)</Text>
        <TextInput 
          style={styles.input} 
          value={formData.bookName} 
          onChangeText={(text) => handleChange('bookName', text)} 
          placeholder="Nhập tên sách..." 
        />

        <Text style={styles.label}>Tác giả</Text>
        <TextInput 
          style={styles.input} 
          value={formData.author} 
          onChangeText={(text) => handleChange('author', text)} 
          placeholder="Nhập tên tác giả..." 
        />

        <Text style={styles.label}>Giá tiền (*)</Text>
        <TextInput 
          style={styles.input} 
          value={formData.price} 
          onChangeText={(text) => handleChange('price', text)} 
          placeholder="Ví dụ: 150000" 
          keyboardType="numeric" 
        />

        <Text style={styles.label}>Thể loại (*)</Text>
        <TextInput 
          style={styles.input} 
          value={formData.category} 
          onChangeText={(text) => handleChange('category', text)} 
          placeholder="Tiểu thuyết, Khoa học..." 
        />

        <Text style={styles.label}>Link ảnh bìa (URL)</Text>
        <TextInput 
          style={styles.input} 
          value={formData.coverImage} 
          onChangeText={(text) => handleChange('coverImage', text)} 
          placeholder="https://..." 
        />

        {/* Khung hiển thị trước ảnh bìa theo class imagePreview của bạn */}
        {formData.coverImage ? (
          <Image source={{ uri: formData.coverImage }} style={styles.imagePreview} />
        ) : null}

        <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.saveBtnText}>{isEdit ? 'CẬP NHẬT' : 'THÊM MỚI'}</Text>
          )}
        </TouchableOpacity>
        
      </ScrollView>
    </View>
  );
}