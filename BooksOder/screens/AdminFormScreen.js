import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, Text, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../styles/AdminFormScreenStyles';

export default function AdminFormScreen({ route, navigation }) {
  // Lấy dữ liệu sách nếu đang ở chế độ "Sửa"
  const { bookToEdit } = route.params || {};
  const isEditMode = !!bookToEdit;

  const [bookName, setBookName] = useState('');
  const [author, setAuthor] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [loading, setLoading] = useState(false);

  // Nếu là sửa, điền sẵn thông tin cũ vào ô nhập
  useEffect(() => {
    if (isEditMode) {
      setBookName(bookToEdit.bookName);
      setAuthor(bookToEdit.author);
      setPrice(bookToEdit.price.toString());
      setCategory(bookToEdit.category);
      setCoverImage(bookToEdit.coverImage);
    }
  }, [bookToEdit]);

  const handleSave = () => {
    // Validate cơ bản
    if (!bookName || !author || !price || !coverImage) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ các thông tin bắt buộc!');
      return;
    }

    setLoading(true);

    const bookData = {
      bookName,
      author,
      price: Number(price), // Ép kiểu giá tiền về số
      category: category || 'Khác',
      coverImage
    };

    const url = isEditMode 
      ? `https://6ac736b375a4ce3fe72171dd.mockapi.io/books/${bookToEdit.id}`
      : 'https://6ac736b375a4ce3fe72171dd.mockapi.io/books';
    
    const method = isEditMode ? 'PUT' : 'POST';

    fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookData)
    })
    .then(res => res.json())
    .then(() => {
      setLoading(false);
      Alert.alert('Thành công', isEditMode ? 'Đã cập nhật sách!' : 'Đã thêm sách mới!', [
        { text: 'OK', onPress: () => navigation.goBack() } // Quay lại màn hình Admin
      ]);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
      Alert.alert('Lỗi', 'Có lỗi xảy ra, vui lòng thử lại!');
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.label}>Tên sách (*)</Text>
        <TextInput style={styles.input} value={bookName} onChangeText={setBookName} placeholder="Nhập tên sách..." />

        <Text style={styles.label}>Tác giả (*)</Text>
        <TextInput style={styles.input} value={author} onChangeText={setAuthor} placeholder="Nhập tên tác giả..." />

        <Text style={styles.label}>Thể loại</Text>
        <TextInput style={styles.input} value={category} onChangeText={setCategory} placeholder="Ví dụ: Kỹ năng sống, Tiểu thuyết..." />

        <Text style={styles.label}>Giá tiền (VNĐ) (*)</Text>
        <TextInput style={styles.input} value={price} onChangeText={setPrice} placeholder="Nhập giá tiền..." keyboardType="numeric" />

        <Text style={styles.label}>Link ảnh bìa (URL) (*)</Text>
        <TextInput style={styles.input} value={coverImage} onChangeText={setCoverImage} placeholder="Dán link ảnh bìa vào đây..." />
        
        {/* Hiển thị ảnh xem trước nếu có link */}
        {coverImage ? <Image source={{ uri: coverImage }} style={styles.imagePreview} /> : null}

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.saveBtnText}>{isEditMode ? 'Lưu thay đổi' : 'Thêm sách'}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}