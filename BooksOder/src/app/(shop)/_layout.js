import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../context/CartContext';
export default function ShopTabs() {
  const { cartCount } = useCart();
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#B91C1C', tabBarStyle: { height: 68, paddingBottom: 8, paddingTop: 8 } }}>
    {[['home', 'Trang chủ', 'home-outline'], ['favorites', 'Yêu thích', 'heart-outline'], ['cart', 'Giỏ hàng', 'bag-handle-outline'], ['orders', 'Đơn hàng', 'receipt-outline'], ['profile', 'Tài khoản', 'person-outline']].map(([name, title, icon]) => <Tabs.Screen key={name} name={name} options={{ title, tabBarBadge: name === 'cart' && cartCount > 0 ? cartCount : undefined, tabBarIcon: ({ color, size }) => <Ionicons name={icon} size={size} color={color} /> }} />)}
  </Tabs>;
}
