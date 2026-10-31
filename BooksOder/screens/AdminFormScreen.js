import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { API_URL } from '../src/constants/api';
import { styles } from '../styles/AdminFormScreenStyles';

export default function AdminFormScreen({ route, navigation }) {
  const book = route.params?.book;
  const isEdit = !!book;

  const [formData, setFormData] = useState({
    bookName: book?.bookName || '',
    author: book?.author || '',
    price: book?.price ? book.price.toString() : '',
    category: book?.category || '',
    coverImage: book?.coverImage || '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    if (!formData.bookName.trim() || !formData.price || !formData.category.trim()) {
      return Alert.alert('Lỗi', 'Vui lòng nhập đủ Tên sách, Giá và Thể loại!');
    }

    setLoading(true);
    const method = isEdit ? 'PUT' : 'POST';
    const endpoint = isEdit ? `${API_URL}/books/${book._id || book.id}` : `${API_URL}/books`;

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Thành công', isEdit ? 'Đã cập nhật sách!' : 'Đã thêm sách mới!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Thất bại', data.message || 'Có lỗi xảy ra.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi mạng', 'Không thể kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{isEdit ? 'Chỉnh sửa thông tin sách' : 'Thêm sách vào kho'}</Text>

      <Text style={styles.label}>Tên sách *</Text>
      <TextInput
        style={styles.input}
        placeholder="Nhập tên sách"
        value={formData.bookName}
        onChangeText={(text) => handleChange('bookName', text)}
      />

      <Text style={styles.label}>Tác giả</Text>
      <TextInput
        style={styles.input}
        placeholder="Nhập tên tác giả"
        value={formData.author}
        onChangeText={(text) => handleChange('author', text)}
      />

      <Text style={styles.label}>Giá bán (VNĐ) *</Text>
      <TextInput
        style={styles.input}
        placeholder="Ví dụ: 99000"
        keyboardType="numeric"
        value={formData.price}
        onChangeText={(text) => handleChange('price', text)}
      />

      <Text style={styles.label}>Thể loại *</Text>
      <TextInput
        style={styles.input}
        placeholder="Tiểu thuyết, Kinh tế, Công nghệ..."
        value={formData.category}
        onChangeText={(text) => handleChange('category', text)}
      />

      <Text style={styles.label}>Link ảnh bìa sách (URL)</Text>
      <TextInput
        style={styles.input}
        placeholder="https://example.com/anh-bia.jpg"
        value={formData.coverImage}
        onChangeText={(text) => handleChange('coverImage', text)}
      />

      <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.btnText}>{isEdit ? 'LƯU THAY ĐỔI' : 'THÊM SÁCH'}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}