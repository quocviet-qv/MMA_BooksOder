import React from 'react';
import { Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { LanguageProvider } from '../context/LanguageContext';
import { AlertProvider } from '../context/AlertContext';
function Routes() {
  const { isLoading, isLoggedIn, userRole } = useAuth();
  if (isLoading) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color="#B91C1C" /></View>;
  return <Stack screenOptions={{ headerShown: false }}>
    <Stack.Screen name="index" />
    <Stack.Protected guard={!isLoggedIn}><Stack.Screen name="login" /><Stack.Screen name="register" /></Stack.Protected>
    <Stack.Protected guard={isLoggedIn && userRole === 'user'}><Stack.Screen name="(shop)" /><Stack.Screen name="detail" options={{ headerShown: true, title: 'Chi tiết sách' }} /><Stack.Screen name="checkout" options={{ headerShown: true, title: 'Thanh toán' }} /></Stack.Protected>
    <Stack.Protected guard={isLoggedIn && userRole === 'admin'}><Stack.Screen name="(admin)" /><Stack.Screen name="admin-form" options={{ headerShown: true, title: 'Thông tin sách' }} /></Stack.Protected>
    <Stack.Protected guard={isLoggedIn}><Stack.Screen name="order-detail" options={{ headerShown: true, title: 'Chi tiết đơn hàng' }} /></Stack.Protected>
  </Stack>;
}
export default function Layout() {
  return <LanguageProvider><AuthProvider><CartProvider><AlertProvider><Routes /></AlertProvider></CartProvider></AuthProvider></LanguageProvider>;
}
