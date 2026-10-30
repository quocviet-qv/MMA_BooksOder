import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Image } from 'react-native';

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
    coverImage: book?.coverImage || ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  // Chọn ảnh từ thư viện thiết bị và chuyển thành Base64
  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      return Alert.alert('Cần cấp quyền', 'Vui lòng cấp quyền truy cập thư viện ảnh để chọn ảnh bìa sách.');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [2, 3],
      quality: 0.6, // Nén nhẹ để tối ưu dung lượng khi lưu vào MongoDB
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      if (asset.base64) {
        const mimeType = asset.mimeType || 'image/jpeg';
        const base64Uri = `data:${mimeType};base64,${asset.base64}`;
        handleChange('coverImage', base64Uri);
      } else if (asset.uri) {
        handleChange('coverImage', asset.uri);
      }
    }
  };

  // Chụp ảnh trực tiếp từ Camera (trên điện thoại)
  const handleTakePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      return Alert.alert('Cần cấp quyền', 'Vui lòng cấp quyền máy ảnh để chụp ảnh bìa sách.');
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [2, 3],
      quality: 0.6,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      if (asset.base64) {
        const mimeType = asset.mimeType || 'image/jpeg';
        const base64Uri = `data:${mimeType};base64,${asset.base64}`;
        handleChange('coverImage', base64Uri);
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.bookName.trim() || !formData.author.trim() || !formData.price.trim() || !formData.category.trim()) {
      return Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ Tên sách, Tác giả, Giá tiền và Thể loại!');
    }

    if (!formData.coverImage) {
      return Alert.alert('Thiếu ảnh bìa', 'Vui lòng chọn hình ảnh bìa sách từ máy!');
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
          coverImage: formData.coverImage
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

        <Text style={styles.label}>Hình ảnh bìa sách (*)</Text>
        <View style={styles.imagePickerRow}>
          <TouchableOpacity style={styles.imagePickerBtn} onPress={handlePickImage}>
            <Ionicons name="images-outline" size={20} color="#C5532A" />
            <Text style={styles.imagePickerBtnText}>Chọn ảnh từ máy</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.imagePickerBtn} onPress={handleTakePhoto}>
            <Ionicons name="camera-outline" size={20} color="#C5532A" />
            <Text style={styles.imagePickerBtnText}>Chụp ảnh</Text>
          </TouchableOpacity>
        </View>

        {formData.coverImage ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: formData.coverImage }} style={styles.imagePreview} />
            <TouchableOpacity
              style={styles.removeImageBtn}
              onPress={() => handleChange('coverImage', '')}
            >
              <Ionicons name="close-circle-outline" size={16} color="#E25842" />
              <Text style={styles.removeImageText}>Xóa ảnh đã chọn</Text>
            </TouchableOpacity>
          </View>
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
