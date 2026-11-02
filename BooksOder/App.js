import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CommonActions, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, TouchableOpacity, View } from 'react-native';

import { AlertProvider } from './src/context/AlertContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { CartProvider, useCart } from './src/context/CartContext';
import { LanguageProvider, useLanguage } from './src/context/LanguageContext';

// Import các màn hình User & Admin
import AdminDashboardScreen from './screens/AdminDashboardScreen';
import AdminFormScreen from './screens/AdminFormScreen';
import AdminOrdersScreen from './screens/AdminOrdersScreen';
import AdminScreen from './screens/AdminScreen';
import CartScreen from './screens/CartScreen';
import CheckoutScreen from './screens/CheckoutScreen';
import DetailScreen from './screens/DetailScreen';
import FavoritesScreen from './screens/FavoritesScreen';
import HomeScreen from './screens/HomeScreen';
import OrderDetailScreen from './screens/OrderDetailScreen';
import OrdersScreen from './screens/OrdersScreen';
import ProfileScreen from './screens/ProfileScreen';

// Import các màn hình Xác thực
import LoginScreen from './screens/LoginScreen';
import NotificationScreen from './screens/NotificationScreen';
import RegisterScreen from './screens/RegisterScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const OrdersStack = createNativeStackNavigator();

// Quay về danh sách đơn hàng trong cùng stack.
// Nếu OrderDetail được mở trực tiếp (từ Checkout / Thông báo) thì stack chỉ có [OrderDetail],
// goBack() khi đó sẽ nhảy sang tab khác -> người dùng bị "kẹt". Vì vậy thay thế bằng màn danh sách.
const backToOrdersList = (navigation, listName) => {
  const state = navigation.getState();
  const hasListBelow = state?.routes?.length > 1 && state.routes[0]?.name === listName;
  if (hasListBelow) {
    navigation.goBack();
  } else {
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: listName }] })
    );
  }
};

// Bấm tab Đơn hàng ở bottom tab: luôn reset stack con về màn danh sách đơn hàng.
const resetOrdersStackOnTabPress = (listName) => ({ navigation, route }) => ({
  tabPress: (e) => {
    const stackState = route.state;
    const isOnList = !stackState || (stackState.index === 0 && stackState.routes[0]?.name === listName);
    if (isOnList) return;
    e.preventDefault();
    navigation.dispatch({
      ...CommonActions.reset({ index: 0, routes: [{ name: listName }] }),
      target: stackState.key,
    });
    navigation.navigate(route.name);
  },
});

const backButton = (navigation, listName) => () => (
  <TouchableOpacity
    onPress={() => backToOrdersList(navigation, listName)}
    style={{ marginRight: 15, paddingVertical: 5 }}
    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
  >
    <Ionicons name="arrow-back" size={24} color="#B91C1C" />
  </TouchableOpacity>
);

function UserOrdersStack() {
  const { t } = useLanguage();

  return (
    <OrdersStack.Navigator screenOptions={{ headerShown: false }}>
      <OrdersStack.Screen name="OrdersList" component={OrdersScreen} />
      <OrdersStack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={({ navigation }) => ({
          headerShown: true,
          title: t('headers.orderDetail'),
          headerTintColor: '#B91C1C',
          headerTitleStyle: { color: '#0F172A', fontWeight: 'bold' },
          headerStyle: { backgroundColor: '#F8F9FA' },
          headerLeft: backButton(navigation, 'OrdersList'),
        })}
      />
    </OrdersStack.Navigator>
  );
}

function AdminOrdersStack() {
  const { t } = useLanguage();

  return (
    <OrdersStack.Navigator screenOptions={{ headerShown: false }}>
      <OrdersStack.Screen name="AdminOrdersList" component={AdminOrdersScreen} />
      <OrdersStack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={({ navigation }) => ({
          headerShown: true,
          title: t('headers.orderDetail'),
          headerTintColor: '#B91C1C',
          headerTitleStyle: { color: '#0F172A', fontWeight: 'bold' },
          headerStyle: { backgroundColor: '#F8F9FA' },
          headerLeft: backButton(navigation, 'AdminOrdersList'),
        })}
      />
    </OrdersStack.Navigator>
  );
}

// 1. Cụm Tab cho User bình thường (kèm Badge giỏ hàng nhảy số realtime và Tab Hồ sơ)
function MainTabs() {
  const { cartCount } = useCart();
  const { t } = useLanguage();

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
          } else if (route.name === 'Orders') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#B91C1C',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: t('tabs.home') }} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ title: t('tabs.favorites') }} />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          title: t('tabs.cart'),
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarBadgeStyle: { backgroundColor: '#B91C1C', color: '#FFF', fontSize: 11 },
        }}
      />
      <Tab.Screen
        name="Orders"
        component={UserOrdersStack}
        options={{ title: t('tabs.orders') }}
        listeners={resetOrdersStackOnTabPress('OrdersList')}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: t('tabs.profile') }} />
    </Tab.Navigator>
  );
}

// 2. Cụm Tab cho Quản trị viên (Thống kê doanh thu, Kho sách & Quản lý đơn hàng)
function AdminTabs() {
  const { t } = useLanguage();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'AdminDashboard') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else if (route.name === 'AdminBooks') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'AdminOrdersTab') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#B91C1C',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{ title: t('tabs.adminDashboard') }}
      />
      <Tab.Screen name="AdminBooks" component={AdminScreen} options={{ title: t('tabs.adminBooks') }} />
      <Tab.Screen
        name="AdminOrdersTab"
        component={AdminOrdersStack}
        options={{ title: t('tabs.adminOrders') }}
        listeners={resetOrdersStackOnTabPress('AdminOrdersList')}
      />
    </Tab.Navigator>
  );
}

// 3. Khung điều hướng chính (Root Navigator kết nối với AuthContext)
function RootNavigator() {
  const { isLoading, isLoggedIn, userRole } = useAuth();
  const { t } = useLanguage();

  // Màn hình chờ (Loading) trong lúc kiểm tra bộ nhớ AsyncStorage
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#F8F9FA',
        }}
      >
        <ActivityIndicator size="large" color="#B91C1C" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isLoggedIn ? (
          // LUỒNG 1: Chưa đăng nhập -> Hiện Đăng nhập & Đăng ký
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : userRole === 'admin' ? (
          // LUỒNG 2: Đã đăng nhập với tài khoản Admin
          <>
            <Stack.Screen name="Admin" component={AdminTabs} />
            <Stack.Screen
              name="Notification"
              component={NotificationScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="AdminForm"
              component={AdminFormScreen}
              options={{
                headerShown: true,
                title: t('headers.bookForm'),
                headerTintColor: '#B91C1C',
                headerTitleStyle: { color: '#0F172A', fontWeight: '800' },
                headerStyle: { backgroundColor: '#F8F9FA' },
              }}
            />
          </>
        ) : (
          // LUỒNG 3: Đã đăng nhập với tài khoản User bình thường
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="Notification"
              component={NotificationScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Chi tiết"
              component={DetailScreen}
              options={{ headerShown: true, title: t('headers.bookDetail') }}
            />
            <Stack.Screen
              name="Checkout"
              component={CheckoutScreen}
              options={{ headerShown: true, title: t('headers.checkout') }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// 4. Component gốc: Bọc LanguageProvider, AuthProvider và CartProvider cho toàn bộ ứng dụng
export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <AlertProvider>
            <RootNavigator />
          </AlertProvider>
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
