import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

// Import các màn hình User & Admin
import AdminFormScreen from './screens/AdminFormScreen';
import AdminScreen from './screens/AdminScreen';
import CartScreen from './screens/CartScreen';
import CheckoutScreen from './screens/CheckoutScreen';
import DetailScreen from './screens/DetailScreen';
import FavoritesScreen from './screens/FavoritesScreen';
import HomeScreen from './screens/HomeScreen';

// Import các màn hình Xác thực
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// 1. Cụm 3 Tab cho User bình thường (Người mua sách)
function MainTabs({ onLogout }) {
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
        tabBarActiveTintColor: '#E25842',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" options={{ title: 'Trang chủ' }}>
        {(props) => <HomeScreen {...props} onLogout={onLogout} />}
      </Tab.Screen>
      <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'Yêu thích' }} />
      <Tab.Screen name="Cart" component={CartScreen} options={{ title: 'Giỏ hàng' }} />
    </Tab.Navigator>
  );
}

// 2. KHUNG ĐIỀU HƯỚNG CHÍNH (GLOBAL STACK)
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
        setIsLoading(false);
      }
    };
    
    checkLoginStatus();
  }, []);

  const handleLoginSuccess = (role) => {
    setUserRole(role || 'user');
    setIsLoggedIn(true);
  };

  const handleLogoutSuccess = async () => {
    await AsyncStorage.multiRemove(['userToken', 'userRole', 'userId']);
    setUserRole(null);
    setIsLoggedIn(false);
  };

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
            <Stack.Screen name="Login">
              {(props) => (
                <LoginScreen
                  {...props}
                  onLoginSuccess={handleLoginSuccess}
                  setIsLoggedIn={setIsLoggedIn}
                  setUserRole={setUserRole}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : userRole === 'admin' ? (
          // LUỒNG 2: Đã đăng nhập với tài khoản Admin
          <>
            <Stack.Screen name="Admin">
              {(props) => (
                <AdminScreen
                  {...props}
                  onLogout={handleLogoutSuccess}
                  setIsLoggedIn={setIsLoggedIn}
                  setUserRole={setUserRole}
                />
              )}
            </Stack.Screen>
            <Stack.Screen 
              name="AdminForm" 
              component={AdminFormScreen} 
              options={{ headerShown: true, title: 'Thông tin sách' }} 
            />
          </>
        ) : (
          // LUỒNG 3: Đã đăng nhập với tài khoản User bình thường
          <>
            <Stack.Screen name="Main">
              {(props) => <MainTabs {...props} onLogout={handleLogoutSuccess} />}
            </Stack.Screen>
            <Stack.Screen name="Chi tiết" component={DetailScreen} options={{ headerShown: true }} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ headerShown: true, title: 'Thanh toán' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
