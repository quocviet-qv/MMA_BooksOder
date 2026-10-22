import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import bộ style từ thư mục styles
import { styles } from '../styles/CartScreenStyles';

export default function CartScreen({ navigation }) {
  const [cartItems, setCartItems] = useState([]);

  // Tải dữ liệu giỏ hàng mỗi khi mở màn hình này
  useFocusEffect(
    useCallback(() => {
      loadCart();
    }, [])
  );

  const loadCart = async () => {
    try {
      const savedCart = await AsyncStorage.getItem('cart');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Hàm xóa sách khỏi giỏ hàng
  const removeFromCart = async (bookId) => {
    try {
      const newCart = cartItems.filter(item => item.id !== bookId);
      setCartItems(newCart);
      await AsyncStorage.setItem('cart', JSON.stringify(newCart));
    } catch (error) {
      console.error(error);
    }
  };

  // Tính tổng tiền
  const getTotalPrice = () => {
    return cartItems.reduce((sum, item) => sum + item.price, 0);
  };

  // Hàm xử lý thanh toán
  const handleCheckout = () => {
    if (cartItems.length === 0) return;

    Alert.alert(
      "Đặt hàng thành công! 🎉",
      `Cảm ơn bạn đã đặt mua ${cartItems.length} cuốn sách với tổng tiền ${getTotalPrice().toLocaleString('vi-VN')} đ. Đơn hàng sẽ được giao đến bạn sớm nhất!`,
      [
        {
          text: "OK",
          onPress: async () => {
            try {
              // Xóa dữ liệu giỏ hàng trong bộ nhớ
              await AsyncStorage.removeItem('cart');
              setCartItems([]); // Làm trống state giao diện
            } catch (error) {
              console.error(error);
            }
          }
        }
      ]
    );
  };

  // 1. GIAO DIỆN KHI GIỎ HÀNG TRỐNG
  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <View style={styles.emptyContent}>
          <View style={styles.iconCircle}>
            <Ionicons name="cart" size={56} color="#1A1A1A" />
          </View>
          <Text style={styles.emptyTitle}>Giỏ hàng đang trống</Text>
          <Text style={styles.emptyDesc}>Hãy chọn vài cuốn sách hay để bắt đầu hành trình đọc nhé.</Text>
          
          <TouchableOpacity 
            style={styles.exploreBtn} 
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.exploreBtnText}>Khám phá sách</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 2. GIAO DIỆN KHI CÓ SẢN PHẨM TRONG GIỎ
  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <Image source={{ uri: item.coverImage }} style={styles.itemImage} />
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle} numberOfLines={2}>{item.bookName}</Text>
        <Text style={styles.itemPrice}>{item.price.toLocaleString('vi-VN')} đ</Text>
      </View>
      <TouchableOpacity 
        style={styles.removeBtn} 
        onPress={() => removeFromCart(item.id)}
      >
        <Ionicons name="trash-outline" size={24} color="#E25842" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.mainTitle}>Giỏ hàng</Text>
      </View>
      
      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderCartItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tổng cộng:</Text>
          <Text style={styles.totalValue}>{getTotalPrice().toLocaleString('vi-VN')} đ</Text>
        </View>
        <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
          <Text style={styles.checkoutBtnText}>Thanh toán</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}