import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Image } from 'react-native';

import { API_URL } from '../src/constants/api';
import { styles } from '../styles/AdminFormScreenStyles'; 

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80';

export default function AdminFormScreen({ route, navigation }) {
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

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    if (!formData.bookName.trim() || !formData.author.trim() || !formData.price.trim() || !formData.category.trim()) {
      return Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ Tên sách, Tác giả, Giá tiền và Thể loại!');
    }

    const numericPrice = Number(formData.price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      return Alert.alert('Lỗi', 'Giá tiền không hợp lệ!');
    }

    setLoading(true);
    const method = isEdit ? 'PUT' : 'POST';
    const endpoint = isEdit ? `${API_URL}/books/${book._id || book.id}` : `${API_URL}/books`;

    try {
      const response = await fetch(endpoint, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookName: formData.bookName.trim(),
          author: formData.author.trim(),
          price: numericPrice,
          category: formData.category.trim(),
          coverImage: formData.coverImage.trim() || DEFAULT_COVER
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

        <Text style={styles.label}>Tác giả (*)</Text>
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
          placeholder="Tiểu thuyết, Kỹ năng sống, Khoa học..." 
        />

        <Text style={styles.label}>Link ảnh bìa (URL)</Text>
        <TextInput 
          style={styles.input} 
          value={formData.coverImage} 
          onChangeText={(text) => handleChange('coverImage', text)} 
          placeholder="https://... (để trống sẽ dùng ảnh mặc định)" 
        />

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
