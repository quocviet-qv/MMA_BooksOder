import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

// Import các màn hình User
import AdminFormScreen from './screens/AdminFormScreen';
import AdminScreen from './screens/AdminScreen';
import CartScreen from './screens/CartScreen';
import DetailScreen from './screens/DetailScreen';
import FavoritesScreen from './screens/FavoritesScreen';
import HomeScreen from './screens/HomeScreen';

// Import các màn hình Xác thực
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// 1. Cụm 3 Tab cho User bình thường (Người mua sách)
function MainTabs({ route }) {
  const { setIsLoggedIn, setUserRole } = route.params || {};
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Favorites') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'Cart') {
            iconName = focused ? 'bag-handle' : 'bag-handle-outline';
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#E25842', // Màu cam đỏ
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} initialParams={{ setIsLoggedIn, setUserRole }} options={{ title: 'Trang chủ' }} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'Yêu thích' }} />
      <Tab.Screen name="Cart" component={CartScreen} options={{ title: 'Giỏ hàng' }} />
    </Tab.Navigator>
  );
}

// 2. Giao diện tạm thời cho Admin


// 3. KHUNG ĐIỀU HƯỚNG CHÍNH (GLOBAL STACK)
export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null); // 'admin' hoặc 'user'

  // Kiểm tra trạng thái đăng nhập khi mở app
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const role = await AsyncStorage.getItem('userRole');
        
        if (token) {
          setIsLoggedIn(true);
          setUserRole(role);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false); // Dừng màn hình chờ
      }
    };
    
    checkLoginStatus();
  }, []);

  // Màn hình chờ (Loading) trong lúc kiểm tra bộ nhớ
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#C5532A" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isLoggedIn ? (
          // LUỒNG 1: Chưa đăng nhập -> Hiện Đăng nhập & Đăng ký
          <>
            <Stack.Screen 
              name="Login" 
              component={LoginScreen} 
              // Truyền hàm xuống LoginScreen để cập nhật trạng thái sau khi đăng nhập thành công
              initialParams={{ setIsLoggedIn, setUserRole }} 
            />
            <Stack.Screen 
              name="Register" 
              component={RegisterScreen} 
            />
          </>
       ) : userRole === 'admin' ? (
          // LUỒNG 2: Đã đăng nhập với tài khoản Admin
          <>
            <Stack.Screen 
              name="Admin" 
              component={AdminScreen} 
              initialParams={{ setIsLoggedIn, setUserRole }} 
            />
            <Stack.Screen 
              name="AdminForm" 
              component={AdminFormScreen} 
              options={{ headerShown: true, title: 'Thông tin sách' }} 
            />
          </>
        ) : (
          // LUỒNG 3: Đã đăng nhập với tài khoản User bình thường
          <>
            <Stack.Screen name="Main" component={MainTabs} initialParams={{ setIsLoggedIn, setUserRole }} />
            <Stack.Screen name="Chi tiết" component={DetailScreen} options={{ headerShown: true }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}