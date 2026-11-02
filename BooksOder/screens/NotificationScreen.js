import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { API_URL, apiFetch as fetch } from '../src/constants/api';
import { useAuth } from '../src/context/AuthContext';
import { useLanguage } from '../src/context/LanguageContext';

export default function NotificationScreen({ navigation }) {
  const { userRole } = useAuth();
  const { language, t } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/notifications`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Không thể tải thông báo.');
      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
    } catch (error) {
      console.error('Lỗi tải thông báo:', error);
      Alert.alert(t('common.error'), error.message || t('common.networkError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useFocusEffect(useCallback(() => {
    loadNotifications();
  }, [loadNotifications]));

  const openNotification = async item => {
    if (!item.orderId) {
      Alert.alert(t('common.error'), language === 'vi' ? 'Thông báo không có mã đơn hàng.' : 'This notification has no order ID.');
      return;
    }

    try {
      if (!item.isRead) {
        const response = await fetch(`${API_URL}/notifications/${item._id}/read`, { method: 'PUT' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Không thể đánh dấu thông báo đã đọc.');
        setNotifications(current => current.map(notification =>
          notification._id === item._id ? data.notification : notification
        ));
      }
    } catch (error) {
      console.error('Lỗi đánh dấu thông báo đã đọc:', error);
      Alert.alert(t('common.error'), error.message || t('common.networkError'));
      return;
    }

    navigation.navigate(userRole === 'admin' ? 'Admin' : 'Main', userRole === 'admin'
      ? {
          screen: 'AdminOrdersTab',
          params: { screen: 'OrderDetail', params: { orderId: item.orderId } },
        }
      : {
          screen: 'Orders',
          params: { screen: 'OrderDetail', params: { orderId: item.orderId } },
        });
  };

  const renderNotification = ({ item }) => {
    const createdAt = item.createdAt
      ? new Date(item.createdAt).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')
      : '';
    return (
      <TouchableOpacity
        accessibilityRole="button"
        activeOpacity={0.75}
        onPress={() => openNotification(item)}
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          padding: 16,
          marginHorizontal: 16,
          marginTop: 10,
          borderRadius: 12,
          backgroundColor: item.isRead ? '#FFFFFF' : '#FFF7ED',
          borderWidth: 1,
          borderColor: item.isRead ? '#E5E7EB' : '#FED7AA',
        }}
      >
        <Ionicons
          name={item.isRead ? 'notifications-outline' : 'notifications'}
          size={22}
          color={item.isRead ? '#64748B' : '#B91C1C'}
          style={{ marginRight: 12, marginTop: 2 }}
        />
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#0F172A', fontSize: 15, fontWeight: item.isRead ? '600' : '800' }}>
            {item.title}
          </Text>
          <Text style={{ color: '#475569', fontSize: 14, lineHeight: 20, marginTop: 4 }}>
            {item.message}
          </Text>
          {!!createdAt && <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 8 }}>{createdAt}</Text>}
        </View>
        {!item.isRead && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#B91C1C', marginLeft: 8, marginTop: 6 }} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top', 'left', 'right']}>
      <View style={{ paddingHorizontal: 18, paddingVertical: 14, flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={language === 'vi' ? 'Quay lại' : 'Go back'}
          onPress={() => navigation.goBack()}
          style={{ marginRight: 10, padding: 4 }}
        >
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Ionicons name="notifications" size={23} color="#B91C1C" style={{ marginRight: 9 }} />
        <Text style={{ color: '#0F172A', fontSize: 21, fontWeight: '800' }}>{t('tabs.notifications')}</Text>
      </View>
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#B91C1C" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item._id}
          renderItem={renderNotification}
          contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            loadNotifications();
          }} />}
          ListEmptyComponent={
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
              <Ionicons name="notifications-off-outline" size={48} color="#94A3B8" />
              <Text style={{ color: '#64748B', marginTop: 12 }}>{t('notifications.empty')}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
