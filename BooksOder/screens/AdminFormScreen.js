import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
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

import { API_URL, getAuthHeaders, apiFetch as fetch } from '../src/constants/api';
import { useLanguage } from '../src/context/LanguageContext';
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
  const { t, language } = useLanguage();
  const book = route.params?.book;
  const isEdit = !!book;
  const isEn = language === 'en';

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

  // Chọn ảnh từ thư viện thiết bị và chuyển sang Base64
  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        return Alert.alert(
          'Quyền truy cập bị từ chối',
          'Vui lòng cấp quyền truy cập thư viện ảnh để chọn ảnh bìa sách.'
        );
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64) {
          const mime = asset.mimeType || 'image/jpeg';
          handleChange('coverImage', `data:${mime};base64,${asset.base64}`);
        } else if (asset.uri) {
          handleChange('coverImage', asset.uri);
        }
      }
    } catch (err) {
      console.error('Lỗi chọn ảnh:', err);
      Alert.alert('Lỗi', 'Không thể mở thư viện ảnh: ' + err.message);
    }
  };

  // Chụp ảnh trực tiếp từ máy ảnh và chuyển sang Base64
  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        return Alert.alert(
          'Quyền truy cập bị từ chối',
          'Vui lòng cấp quyền truy cập máy ảnh để chụp ảnh bìa sách.'
        );
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64) {
          const mime = asset.mimeType || 'image/jpeg';
          handleChange('coverImage', `data:${mime};base64,${asset.base64}`);
        } else if (asset.uri) {
          handleChange('coverImage', asset.uri);
        }
      }
    } catch (err) {
      console.error('Lỗi chụp ảnh:', err);
      Alert.alert('Lỗi', 'Không thể mở máy ảnh: ' + err.message);
    }
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
    if (!formData.coverImage.trim()) {
      return Alert.alert('Thiếu ảnh bìa', 'Vui lòng chọn hoặc chụp ảnh bìa cho cuốn sách!');
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
                {isEdit ? (isEn ? 'UPDATE' : 'CẬP NHẬT') : (isEn ? 'CREATE NEW' : 'TẠO MỚI')}
              </Text>
            </View>
            <Text style={styles.heroTitle}>
              {isEdit ? (isEn ? 'Edit Book Details' : 'Chỉnh sửa thông tin sách') : (isEn ? 'Add Book to Store' : 'Thêm sách vào kho')}
            </Text>
            <Text style={[styles.heroSubtitle, isEdit && styles.heroSubtitleEdit]}>
              {isEdit
                ? `${isEn ? 'Book ID' : 'Mã sách'}: #${(book._id || book.id || '').toString().slice(-6).toUpperCase()}`
                : (isEn ? 'Fill details below to publish book to store' : 'Điền thông tin chi tiết để xuất bản sách lên cửa hàng')}
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
                  {isEn ? 'Book cover preview' : 'Xem trước ảnh bìa sách'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 3. SECTION 1: THÔNG TIN CƠ BẢN */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="book-outline" size={20} color="#B91C1C" />
            <Text style={styles.sectionTitle}>{isEn ? 'Basic Information' : 'Thông tin cơ bản'}</Text>
          </View>

          {/* Tên sách */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {isEn ? 'Book Title' : 'Tên cuốn sách'} <Text style={styles.requiredStar}>*</Text>
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
                placeholder={isEn ? 'Enter full book title...' : 'Nhập tên sách đầy đủ...'}
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
            <Text style={styles.label}>{isEn ? 'Author / Translator' : 'Tác giả / Dịch giả'}</Text>
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
                placeholder={isEn ? 'e.g. Dale Carnegie, J.K. Rowling...' : 'Ví dụ: Dale Carnegie, Nguyễn Nhật Ánh...'}
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
              {isEn ? 'Book Category' : 'Thể loại sách'} <Text style={styles.requiredStar}>*</Text>
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
                placeholder={isEn ? 'Enter or select category below...' : 'Nhập hoặc chọn thể loại bên dưới...'}
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
            <Text style={styles.sectionTitle}>{isEn ? 'Price & Inventory' : 'Giá bán & Số lượng'}</Text>
          </View>

          <View style={styles.rowGroup}>
            {/* Giá bán */}
            <View style={[styles.inputGroup, styles.halfInput]}>
              <Text style={styles.label}>
                {isEn ? 'Price (VND)' : 'Giá bán (VNĐ)'} <Text style={styles.requiredStar}>*</Text>
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
                  placeholder={isEn ? 'e.g. 125000' : 'Ví dụ: 125000'}
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
                {isEn ? 'Stock Quantity' : 'Số lượng tồn kho'} <Text style={styles.requiredStar}>*</Text>
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
                  placeholder={isEn ? 'e.g. 50' : 'Ví dụ: 50'}
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
            <Ionicons name="image-outline" size={20} color="#B91C1C" />
            <Text style={styles.sectionTitle}>{isEn ? 'Cover Image (Base64) & Summary' : 'Ảnh bìa sách (Base64) & Giới thiệu'}</Text>
          </View>

          {/* Chọn ảnh từ thiết bị / Camera */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {isEn ? 'Book Cover' : 'Ảnh bìa sách'} <Text style={styles.requiredStar}>*</Text>
            </Text>

            {/* Trạng thái ảnh hiện tại */}
            {formData.coverImage ? (
              <View style={styles.base64StatusBadge}>
                <View style={styles.base64StatusLeft}>
                  <Ionicons name="checkmark-circle" size={18} color="#059669" />
                  <Text style={styles.base64StatusText}>
                    {formData.coverImage.startsWith('data:image/')
                      ? `${isEn ? 'Base64 Loaded' : 'Đã nạp ảnh Base64'} (~${Math.round(formData.coverImage.length * 0.75 / 1024)} KB)`
                      : (isEn ? 'Using image link' : 'Đang dùng liên kết ảnh')}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.clearImageBtn}
                  onPress={() => handleChange('coverImage', '')}
                >
                  <Text style={styles.clearImageBtnText}>{isEn ? 'Remove' : 'Xóa ảnh'}</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Các nút tải ảnh: Thư viện & Camera */}
            <View style={styles.imageActionsRow}>
              <TouchableOpacity
                style={styles.pickImageBtn}
                activeOpacity={0.7}
                onPress={handlePickImage}
              >
                <Ionicons name="images-outline" size={20} color="#1D4ED8" />
                <Text style={styles.pickImageBtnText}>{isEn ? 'Pick from Gallery' : 'Chọn ảnh từ máy'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cameraBtn}
                activeOpacity={0.7}
                onPress={handleTakePhoto}
              >
                <Ionicons name="camera-outline" size={18} color="#334155" />
                <Text style={styles.cameraBtnText}>{isEn ? 'Take Photo' : 'Chụp ảnh'}</Text>
              </TouchableOpacity>
            </View>

            {/* Hoặc dán chuỗi Base64 thủ công */}
            <Text style={[styles.label, { fontSize: 12, color: '#64748B', marginTop: 4 }]}>
              {isEn ? 'Or enter Base64 string / URL:' : 'Hoặc nhập / dán chuỗi Base64:'}
            </Text>
            <View
              style={[
                styles.inputWrapper,
                activeInput === 'coverImage' && styles.inputWrapperFocus,
              ]}
            >
              <Ionicons
                name="code-slash-outline"
                size={18}
                color={activeInput === 'coverImage' ? '#B91C1C' : '#94A3B8'}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder={isEn ? 'data:image/jpeg;base64,... or image URL' : 'data:image/jpeg;base64,... hoặc URL ảnh'}
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
            <Text style={styles.label}>{isEn ? 'Synopsis & Description' : 'Tóm tắt & Giới thiệu nội dung'}</Text>
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
                placeholder={isEn ? 'Enter book description, chapters or key highlights...' : 'Nhập tóm tắt cuốn sách, các chương hoặc thông điệp chính gửi tới người đọc...'}
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
                  {isEdit
                    ? (isEn ? 'SAVE CHANGES' : 'LƯU THAY ĐỔI')
                    : (isEn ? 'PUBLISH BOOK' : 'XUẤT BẢN SÁCH')}
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
            <Text style={styles.cancelBtnText}>{isEn ? 'Back to List' : 'Quay lại danh sách'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}