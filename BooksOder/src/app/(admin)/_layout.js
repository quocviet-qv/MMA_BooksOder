import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
export default function AdminTabs() {
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#B91C1C', tabBarStyle: { height: 68, paddingBottom: 8, paddingTop: 8 } }}>
    {[['admin-dashboard', 'Tổng quan', 'bar-chart-outline'], ['admin-books', 'Kho sách', 'book-outline'], ['admin-orders', 'Đơn & thanh toán', 'receipt-outline']].map(([name, title, icon]) => <Tabs.Screen key={name} name={name} options={{ title, tabBarIcon: ({ color, size }) => <Ionicons name={icon} size={size} color={color} /> }} />)}
  </Tabs>;
}
