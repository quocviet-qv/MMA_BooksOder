import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
const routes = { Login: '/login', Register: '/register', Home: '/home', Favorites: '/favorites', Cart: '/cart', Orders: '/orders', Profile: '/profile', 'Chi tiết': '/detail', Checkout: '/checkout', OrderDetail: '/order-detail', AdminDashboard: '/admin-dashboard', AdminBooks: '/admin-books', AdminOrdersTab: '/admin-orders', AdminForm: '/admin-form' };
export default function ScreenBridge({ screen: Screen, requiresBook = false }) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useLocalSearchParams();
  const params = {};
  for (const [key, value] of Object.entries(search)) {
    try { params[key] = JSON.parse(value); } catch { params[key] = value; }
  }
  const navigate = (name, values = {}) => {
    const screen = values.screen || name;
    const path = routes[screen] || (name === 'Admin' ? '/admin-dashboard' : '/home');
    const encoded = Object.fromEntries(Object.entries(values).filter(([key, value]) => key !== 'screen' && value !== undefined).map(([key, value]) => [key, typeof value === 'object' ? JSON.stringify(value) : String(value)]));
    router.push({ pathname: path, params: encoded });
  };
  if (requiresBook && (!params.book || typeof params.book !== 'object' || !(params.book._id || params.book.id))) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 }}><Text>Vui lòng chọn một cuốn sách trong cửa hàng.</Text><TouchableOpacity onPress={() => router.replace('/home')}><Text style={{ color: '#B91C1C' }}>Về kho sách</Text></TouchableOpacity></View>;
  }
  const content = <Screen route={{ params }} navigation={{ navigate, goBack: () => router.canGoBack() ? router.back() : router.replace('/'), setOptions: () => {} }} />;
  if (Platform.OS !== 'web' || pathname === '/home') return content;
  return <View style={{ flex: 1, backgroundColor: '#F8F9FA', alignItems: 'center' }}><View style={{ flex: 1, width: '100%', maxWidth: pathname === '/login' || pathname === '/register' ? 480 : 1100 }}>{content}</View></View>;
}
