import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Button, Image, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function DetailScreen({ route }) {
  const { book } = route.params; // Nhận dữ liệu sách từ Trang chủ truyền sang

  // Hàm thêm vào danh sách yêu thích
  const addToFavorites = async () => {
    try {
      // 1. Lấy danh sách cũ
      const storedFavs = await AsyncStorage.getItem('favorites');
      let favList = storedFavs ? JSON.parse(storedFavs) : [];

      // 2. Kiểm tra xem sách đã có chưa
      const isExist = favList.find((item) => item.id === book.id);
      if (isExist) {
        Alert.alert('Thông báo', 'Cuốn sách này đã có trong danh sách yêu thích!');
        return;
      }

      // 3. Thêm mới và lưu lại
      favList.push(book);
      await AsyncStorage.setItem('favorites', JSON.stringify(favList));
      Alert.alert('Thành công', 'Đã thêm vào danh sách yêu thích!');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: book.coverImage }} style={styles.image} />
      <Text style={styles.title}>{book.bookName}</Text>
      <Text style={styles.author}>Tác giả: {book.author}</Text>
      <Text style={styles.price}>Giá: {book.price} VNĐ</Text>
      
      {/* Nút thả tim / Thêm vào Yêu thích */}
      <View style={styles.buttonContainer}>
        <Button title="❤️ Thêm vào Yêu thích" onPress={addToFavorites} color="#ff5c5c" />
      </View>

      <View style={styles.feedbackSection}>
        <Text style={styles.sectionTitle}>Đánh giá & Phản hồi</Text>
        <Text>⭐️⭐️⭐️⭐️⭐️ (4.5) - Rất hay, đáng đọc!</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  image: { width: 150, height: 220, alignSelf: 'center', borderRadius: 8 },
  title: { fontSize: 22, fontWeight: 'bold', marginTop: 20, textAlign: 'center' },
  author: { fontSize: 16, color: 'gray', textAlign: 'center', marginTop: 5 },
  price: { fontSize: 18, color: 'red', textAlign: 'center', marginTop: 10, fontWeight: 'bold' },
  buttonContainer: { marginTop: 20 },
  feedbackSection: { marginTop: 30, padding: 15, backgroundColor: '#f0f0f0', borderRadius: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 }
});