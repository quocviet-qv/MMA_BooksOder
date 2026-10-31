import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { API_URL, getAuthHeaders } from '../src/constants/api';
import { styles } from '../styles/AdminFormScreenStyles';

const COMMON_CATEGORIES = [
  'Tiểu thuyết',
  'Kinh tế',
  'Kỹ năng sống',
  'Công nghệ',
  'Văn học',
  'Tâm lý học',
];

export default function AdminFormScreen({ route, navigation }) {
  const book = route.params?.book;
  const isEdit = !!book;

  const [formData, setFormData] = useState({
    bookName: book?.bookName || '',
    author: book?.author || '',
    price: book?.price !== undefined ? book.price.toString() : '',
    category: book?.category || '',
    coverImage: book?.coverImage || '',
    description: book?.description || '',
    stock: book?.stock !== undefined ? book.stock.toString() : '50',
  });

  const [loading, setLoading] = useState(false);
  const [activeInput, setActiveInput] = useState(null);

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectCategory = (cat) => {
    handleChange('category', cat);
  };

  const handleSubmit = async () => {
    if (!formData.bookName.trim()) {
      return Alert.alert('Thiếu thông tin', 'Vui lòng nhập Tên sách!');
    }
    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      return Alert.alert('Giá không hợp lệ', 'Vui lòng nhập Giá bán là số dương lớn hơn 0!');
    }
    if (!formData.category.trim()) {
      return Alert.alert('Thiếu thông tin', 'Vui lòng chọn hoặc nhập Thể loại sách!');
    }

    setLoading(true);
    const method = isEdit ? 'PUT' : 'POST';
    const endpoint = isEdit ? `${API_URL}/books/${book._id || book.id}` : `${API_URL}/books`;

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(endpoint, {
        method,
        headers,
        body: JSON.stringify({
          ...formData,
          bookName: formData.bookName.trim(),
          author: formData.author.trim(),
          category: formData.category.trim(),
          coverImage: formData.coverImage.trim(),
          description: formData.description.trim(),
          price: Number(formData.price),
          stock: Number(formData.stock) || 0,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Thành công 🎉',
          isEdit ? 'Đã cập nhật thông tin sách thành công!' : 'Đã thêm sách mới vào kho thành công!',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Thất bại', data.message || 'Không thể lưu thông tin sách.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi kết nối', 'Không thể kết nối đến máy chủ Backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. HERO BANNER CARD (PHÂN BIỆT RÕ THÊM POST / SỬA PUT) */}
        <View style={[styles.heroCard, isEdit && styles.heroCardEdit]}>
          <View style={styles.heroLeft}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>
                {isEdit ? '⚡ CẬP NHẬT (PUT)' : '✨ TẠO MỚI (POST)'}
              </Text>
            </View>
            <Text style={styles.heroTitle}>
              {isEdit ? 'Chỉnh sửa thông tin sách' : 'Thêm sách vào kho'}
            </Text>
            <Text style={[styles.heroSubtitle, isEdit && styles.heroSubtitleEdit]}>
              {isEdit
                ? `Mã sách: #${(book._id || book.id || '').toString().slice(-6).toUpperCase()}`
                : 'Điền thông tin chi tiết để xuất bản sách lên cửa hàng'}
            </Text>
          </View>

          <View style={styles.heroIconCircle}>
            <Ionicons
              name={isEdit ? 'create-outline' : 'add-circle-outline'}
              size={32}
              color="#FFFFFF"
            />
          </View>
        </View>

        {/* 2. LIVE COVER IMAGE PREVIEW (XEM TRƯỚC ẢNH BÌA) */}
        <View style={styles.previewContainer}>
          <View style={styles.previewFrame}>
            {formData.coverImage ? (
              <Image
                source={{ uri: formData.coverImage }}
                style={styles.previewImage}
              />
            ) : (
              <View style={styles.previewPlaceholder}>
                <Ionicons name="image-outline" size={40} color="#94A3B8" />
                <Text style={styles.previewPlaceholderText}>
                  Xem trước ảnh bìa sách
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 3. SECTION 1: THÔNG TIN CƠ BẢN */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="book-outline" size={20} color="#B91C1C" />
            <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
          </View>

          {/* Tên sách */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Tên cuốn sách <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View
              style={[
                styles.inputWrapper,
                activeInput === 'bookName' && styles.inputWrapperFocus,
              ]}
            >
              <Ionicons
                name="bookmark-outline"
                size={18}
                color={activeInput === 'bookName' ? '#B91C1C' : '#94A3B8'}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Nhập tên sách đầy đủ..."
                placeholderTextColor="#94A3B8"
                value={formData.bookName}
                onChangeText={(text) => handleChange('bookName', text)}
                onFocus={() => setActiveInput('bookName')}
                onBlur={() => setActiveInput(null)}
              />
            </View>
          </View>

          {/* Tác giả */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tác giả / Dịch giả</Text>
            <View
              style={[
                styles.inputWrapper,
                activeInput === 'author' && styles.inputWrapperFocus,
              ]}
            >
              <Ionicons
                name="person-outline"
                size={18}
                color={activeInput === 'author' ? '#B91C1C' : '#94A3B8'}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: Dale Carnegie, Nguyễn Nhật Ánh..."
                placeholderTextColor="#94A3B8"
                value={formData.author}
                onChangeText={(text) => handleChange('author', text)}
                onFocus={() => setActiveInput('author')}
                onBlur={() => setActiveInput(null)}
              />
            </View>
          </View>

          {/* Thể loại */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Thể loại sách <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View
              style={[
                styles.inputWrapper,
                activeInput === 'category' && styles.inputWrapperFocus,
              ]}
            >
              <Ionicons
                name="pricetag-outline"
                size={18}
                color={activeInput === 'category' ? '#B91C1C' : '#94A3B8'}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Nhập hoặc chọn thể loại bên dưới..."
                placeholderTextColor="#94A3B8"
                value={formData.category}
                onChangeText={(text) => handleChange('category', text)}
                onFocus={() => setActiveInput('category')}
                onBlur={() => setActiveInput(null)}
              />
            </View>

            {/* Quick Category Chips */}
            <View style={styles.chipsContainer}>
              {COMMON_CATEGORIES.map((cat) => {
                const isSelected = formData.category.trim() === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    activeOpacity={0.7}
                    onPress={() => handleSelectCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && styles.chipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* 4. SECTION 2: GIÁ BÁN & KHO HÀNG */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cash-outline" size={20} color="#B91C1C" />
            <Text style={styles.sectionTitle}>Giá bán & Số lượng</Text>
          </View>

          <View style={styles.rowGroup}>
            {/* Giá bán */}
            <View style={[styles.inputGroup, styles.halfInput]}>
              <Text style={styles.label}>
                Giá bán (VNĐ) <Text style={styles.requiredStar}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  activeInput === 'price' && styles.inputWrapperFocus,
                ]}
              >
                <Ionicons
                  name="pricetags-outline"
                  size={18}
                  color={activeInput === 'price' ? '#B91C1C' : '#94A3B8'}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Ví dụ: 125000"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={formData.price}
                  onChangeText={(text) => handleChange('price', text)}
                  onFocus={() => setActiveInput('price')}
                  onBlur={() => setActiveInput(null)}
                />
              </View>
            </View>

            {/* Tồn kho */}
            <View style={[styles.inputGroup, styles.halfInput]}>
              <Text style={styles.label}>
                Số lượng tồn kho <Text style={styles.requiredStar}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  activeInput === 'stock' && styles.inputWrapperFocus,
                ]}
              >
                <Ionicons
                  name="cube-outline"
                  size={18}
                  color={activeInput === 'stock' ? '#B91C1C' : '#94A3B8'}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Ví dụ: 50"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={formData.stock}
                  onChangeText={(text) => handleChange('stock', text)}
                  onFocus={() => setActiveInput('stock')}
                  onBlur={() => setActiveInput(null)}
                />
              </View>
            </View>
          </View>
        </View>

        {/* 5. SECTION 3: HÌNH ẢNH & MÔ TẢ NỘI DUNG */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={20} color="#B91C1C" />
            <Text style={styles.sectionTitle}>Hình ảnh & Nội dung giới thiệu</Text>
          </View>

          {/* Link ảnh bìa */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Link ảnh bìa sách (URL trực tiếp)</Text>
            <View
              style={[
                styles.inputWrapper,
                activeInput === 'coverImage' && styles.inputWrapperFocus,
              ]}
            >
              <Ionicons
                name="link-outline"
                size={18}
                color={activeInput === 'coverImage' ? '#B91C1C' : '#94A3B8'}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="https://images.unsplash.com/..."
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                value={formData.coverImage}
                onChangeText={(text) => handleChange('coverImage', text)}
                onFocus={() => setActiveInput('coverImage')}
                onBlur={() => setActiveInput(null)}
              />
              {formData.coverImage.length > 0 && (
                <TouchableOpacity onPress={() => handleChange('coverImage', '')}>
                  <Ionicons name="close-circle" size={18} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Mô tả sách */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tóm tắt & Giới thiệu nội dung</Text>
            <View
              style={[
                styles.inputWrapper,
                { alignItems: 'flex-start', paddingVertical: 4 },
                activeInput === 'description' && styles.inputWrapperFocus,
              ]}
            >
              <Ionicons
                name="text-outline"
                size={18}
                color={activeInput === 'description' ? '#B91C1C' : '#94A3B8'}
                style={[styles.inputIcon, { marginTop: 10 }]}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Nhập tóm tắt cuốn sách, các chương hoặc thông điệp chính gửi tới người đọc..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={4}
                value={formData.description}
                onChangeText={(text) => handleChange('description', text)}
                onFocus={() => setActiveInput('description')}
                onBlur={() => setActiveInput(null)}
              />
            </View>
          </View>
        </View>

        {/* 6. THAO TÁC HÀNH ĐỘNG (ACTION BUTTONS) */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.submitBtn}
            activeOpacity={0.85}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons
                  name={isEdit ? 'checkmark-circle' : 'cloud-upload'}
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.submitBtnText}>
                  {isEdit ? 'LƯU THAY ĐỔI (PUT)' : 'XUẤT BẢN SÁCH (POST)'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            activeOpacity={0.8}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.cancelBtnText}>Quay lại danh sách</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}