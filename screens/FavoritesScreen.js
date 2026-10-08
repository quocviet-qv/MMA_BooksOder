import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Alert, Button, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState([]);

  // Lấy dữ liệu mỗi khi mở màn hình này
  useFocusEffect(
    useCallback(() => {
      const fetchFavorites = async () => {
        const storedFavs = await AsyncStorage.getItem('favorites');
        if (storedFavs) setFavorites(JSON.parse(storedFavs));
      };
      fetchFavorites();
    }, [])
  );

  // Xóa 1 cuốn sách
  const removeFavorite = async (id) => {
    const newList = favorites.filter((item) => item.id !== id);
    setFavorites(newList);
    await AsyncStorage.setItem('favorites', JSON.stringify(newList));
  };

  // Xóa tất cả
  const clearAllFavorites = async () => {
    Alert.alert('Xác nhận', 'Bạn có chắc muốn xóa tất cả sách yêu thích?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', onPress: async () => {
          await AsyncStorage.removeItem('favorites');
          setFavorites([]);
        } 
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {favorites.length > 0 && (
        <Button title="Xóa tất cả" onPress={clearAllFavorites} color="red" />
      )}
      
      {favorites.length === 0 ? (
        <Text style={styles.emptyText}>Chưa có sách nào trong danh sách yêu thích.</Text>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <View>
                <Text style={styles.title}>{item.bookName}</Text>
                <Text style={styles.price}>{item.price} VNĐ</Text>
              </View>
              <TouchableOpacity onPress={() => removeFavorite(item.id)} style={styles.deleteBtn}>
                <Text style={styles.deleteText}>Xóa</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#fff' },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16 },
  item: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: '#f9f9f9', marginBottom: 10, borderRadius: 8 },
  title: { fontSize: 16, fontWeight: 'bold' },
  price: { color: 'red' },
  deleteBtn: { backgroundColor: '#ffcccc', padding: 10, borderRadius: 5, justifyContent: 'center' },
  deleteText: { color: 'red', fontWeight: 'bold' }
});