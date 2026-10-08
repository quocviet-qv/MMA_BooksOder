import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen({ navigation }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Thay link mockapi.io của bạn vào đây (dữ liệu sách)
    fetch('https://6ac736b375a4ce3fe72171dd.mockapi.io/books') 
      .then((response) => response.json())
      .then((data) => {
        // Sắp xếp theo giá giảm dần (Yêu cầu đề bài)
        const sortedData = data.sort((a, b) => b.price - a.price);
        setBooks(sortedData);
        setLoading(false);
      })
      .catch((error) => console.error(error));
  }, []);

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Chi tiết', { book: item })}>
      <Image source={{ uri: item.coverImage }} style={styles.image} />
      <Text style={styles.title}>{item.bookName}</Text>
      <Text style={styles.price}>{item.price} VNĐ</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={books}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        numColumns={2} // Hiển thị 2 cột
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#fff' },
  card: { flex: 1, margin: 5, backgroundColor: '#f9f9f9', padding: 10, borderRadius: 8, alignItems: 'center' },
  image: { width: 100, height: 150, borderRadius: 5 },
  title: { fontSize: 14, fontWeight: 'bold', marginTop: 10, textAlign: 'center' },
  price: { fontSize: 14, color: 'red', marginTop: 5 },
});