import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import bộ style từ file riêng
import { styles } from '../styles/DetailScreenStyles';

export default function DetailScreen({ route, navigation }) {
  const { book } = route.params; // Nhận dữ liệu sách truyền sang
  const [isFav, setIsFav] = useState(false);

  // Kiểm tra trạng thái yêu thích mỗi khi mở màn hình này
  useFocusEffect(
    useCallback(() => {
      checkFavoriteStatus();
    }, [])
  );

  const checkFavoriteStatus = async () => {
    try {
      const storedFavs = await AsyncStorage.getItem('favorites');
      if (storedFavs) {
        const favList = JSON.parse(storedFavs);
        setIsFav(favList.some((item) => item.id === book.id));
      }
    } catch (error) {
      console.error(error);
    }
  };

  // 1. Hàm Thêm / Xóa Yêu thích
  const toggleFavorite = async () => {
    try {
      const storedFavs = await AsyncStorage.getItem('favorites');
      let favList = storedFavs ? JSON.parse(storedFavs) : [];

      const isExist = favList.some((item) => item.id === book.id);
      if (isExist) {
        favList = favList.filter((item) => item.id !== book.id);
        setIsFav(false);
        Alert.alert('Thông báo', 'Đã xóa khỏi danh sách yêu thích!');
      } else {
        favList.push(book);
        setIsFav(true);
        Alert.alert('Thành công', 'Đã thêm vào danh sách yêu thích!');
      }
      await AsyncStorage.setItem('favorites', JSON.stringify(favList));
    } catch (error) {
      console.error(error);
    }
  };

  // 2. Hàm Thêm vào Giỏ hàng
  const addToCart = async () => {
    try {
      const savedCart = await AsyncStorage.getItem('cart');
      let cartItems = savedCart ? JSON.parse(savedCart) : [];

      const isExist = cartItems.find((item) => item.id === book.id);
      
      if (isExist) {
        Alert.alert("Thông báo", "Cuốn sách này đã có trong giỏ hàng của bạn!");
      } else {
        cartItems.push(book);
        await AsyncStorage.setItem('cart', JSON.stringify(cartItems));
        
        Alert.alert(
          "Thành công", 
          "Đã thêm sách vào giỏ hàng!",
          [
            { text: "Tiếp tục xem", style: "cancel" },
            { 
              text: "Đến Giỏ hàng", 
              onPress: () => navigation.navigate('Main', { screen: 'Cart' }) 
            }
          ]
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        {/* Ảnh bìa sách */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: book.coverImage }} style={styles.coverImage} />
        </View>

        {/* Khung thông tin chi tiết */}
        <View style={styles.infoContainer}>
          <View style={styles.topRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{book.category || 'Sách hay'}</Text>
            </View>
            
            {/* Nút thả tim trực tiếp ở trang chi tiết */}
            <TouchableOpacity onPress={toggleFavorite} style={styles.favIconBtn}>
              <Ionicons 
                name={isFav ? "heart" : "heart-outline"} 
                size={26} 
                color={isFav ? "#E25842" : "#1A1A1A"} 
              />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.title}>{book.bookName}</Text>
          <Text style={styles.author}>Tác giả: {book.author}</Text>
          <Text style={styles.price}>{book.price.toLocaleString('vi-VN')} đ</Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Giới thiệu nội dung</Text>
          <Text style={styles.description}>
            Đây là một trong những cuốn sách đáng đọc nhất thuộc thể loại {book.category || 'này'}. 
            Tác phẩm mang đến những góc nhìn mới mẻ, sâu sắc và để lại nhiều bài học giá trị cho người đọc.
          </Text>

          {/* Đánh giá & Phản hồi */}
          <View style={styles.feedbackSection}>
            <Text style={styles.sectionTitle}>Đánh giá & Phản hồi</Text>
            <Text style={styles.feedbackText}>⭐️⭐️⭐️⭐️⭐️ (4.5/5) - Rất hay, đáng đọc!</Text>
          </View>
        </View>
      </ScrollView>

      {/* Thanh công cụ bên dưới */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.favOutlineBtn} onPress={toggleFavorite}>
          <Ionicons 
            name={isFav ? "heart" : "heart-outline"} 
            size={24} 
            color="#E25842" 
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.addToCartBtn} onPress={addToCart}>
          <Ionicons name="cart-outline" size={22} color="#FFF" style={styles.btnIcon} />
          <Text style={styles.addToCartText}>Thêm vào giỏ hàng</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}