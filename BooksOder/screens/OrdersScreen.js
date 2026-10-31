import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { API_URL, apiFetch as fetch } from '../src/constants/api';
import { useAuth } from '../src/context/AuthContext';
import { useLanguage } from '../src/context/LanguageContext';
import { styles } from '../styles/OrdersScreenStyles';

export default function OrdersScreen({ navigation }) {
  const { userId } = useAuth();
  const { t } = useLanguage();

  const filterTabs = [
    { id: 'all', label: t('home.allCategory') },
    { id: 'Chờ xác nhận', label: t('orders.statusPending') },
    { id: 'Đang vận chuyển', label: t('orders.statusShipping') },
    { id: 'Hoàn thành', label: t('orders.statusCompleted') },
    { id: 'Đã hủy', label: t('orders.statusCancelled') },
  ];

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [cancellingId, setCancellingId] = useState(null);


  const loadOrders = useCallback(async () => {
    try {
      const uid = userId || 'user123';
      const response = await fetch(`${API_URL}/orders/${uid}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(Array.isArray(data) ? data : []);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Lỗi tải danh sách đơn hàng:', error);
      Alert.alert(t('common.error'), t('common.networkError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, t]);


  useFocusEffect(useCallback(() => { loadOrders(); }, [loadOrders]));

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  // Chuẩn hóa trạng thái đơn hàng để lọc và hiển thị màu
  const normalizeStatus = (status) => {
    if (status === 'Đang xử lý' || status === 'Chờ xác nhận') return 'Chờ xác nhận';
    if (status === 'Đang giao' || status === 'Đang vận chuyển') return 'Đang vận chuyển';
    if (status === 'Đã giao' || status === 'Hoàn thành') return 'Hoàn thành';
    if (status === 'Đã hủy') return 'Đã hủy';
    return status || 'Chờ xác nhận';
  };

  const getStatusBadgeConfig = (status) => {
    const norm = normalizeStatus(status);
    switch (norm) {
      case 'Chờ xác nhận':
        return {
          badgeStyle: [styles.statusBadge, styles.badgePending],
          textStyle: [styles.statusText, styles.statusPendingText],
          label: t('orders.statusPending'),
        };
      case 'Đang vận chuyển':
        return {
          badgeStyle: [styles.statusBadge, styles.badgeShipping],
          textStyle: [styles.statusText, styles.statusShippingText],
          label: t('orders.statusShipping'),
        };
      case 'Hoàn thành':
        return {
          badgeStyle: [styles.statusBadge, styles.badgeCompleted],
          textStyle: [styles.statusText, styles.statusCompletedText],
          label: t('orders.statusCompleted'),
        };
      case 'Đã hủy':
        return {
          badgeStyle: [styles.statusBadge, styles.badgeCancelled],
          textStyle: [styles.statusText, styles.statusCancelledText],
          label: t('orders.statusCancelled'),
        };
      default:
        return {
          badgeStyle: [styles.statusBadge, styles.badgePending],
          textStyle: [styles.statusText, styles.statusPendingText],
          label: status,
        };
    }
  };

  // Xử lý Hủy đơn hàng
  const handleCancelOrder = (order) => {
    Alert.alert(
      'Hủy đơn hàng',
      'Bạn có chắc chắn muốn hủy đơn hàng này không?',
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy đơn',
          style: 'destructive',
          onPress: async () => {
            setCancellingId(order._id);
            try {
              const res = await fetch(`${API_URL}/orders/${order._id}/cancel`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
              });
              const data = await res.json();
              if (res.ok) {
                Alert.alert('Thành công', 'Đơn hàng của bạn đã được hủy.');
                loadOrders();
              } else {
                Alert.alert('Không thể hủy', data.message || 'Lỗi khi hủy đơn hàng');
              }
            } catch (error) {
              console.error(error);
              Alert.alert('Lỗi mạng', 'Không thể gửi yêu cầu hủy đơn lúc này.');
            } finally {
              setCancellingId(null);
            }
          }
        }
      ]
    );
  };

  // Lọc đơn hàng theo Tab được chọn
  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true;
    return normalizeStatus(order.status) === activeTab;
  });

  const renderOrderItem = ({ item }) => {
    const statusConfig = getStatusBadgeConfig(item.status);
    const isCancelable = normalizeStatus(item.status) === 'Chờ xác nhận';
    const dateStr = item.createdAt 
      ? new Date(item.createdAt).toLocaleString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : '';
    const orderCode = item._id ? item._id.slice(-6).toUpperCase() : 'N/A';
    const validItems = (item.items || []).filter(i => i && i.bookId);

    return (
      <TouchableOpacity 
        style={styles.orderCard}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('OrderDetail', { orderId: item._id, order: item })}
      >
        {/* Header thẻ: Mã đơn & Trạng thái */}
        <View style={styles.orderHeader}>
          <View style={styles.orderCodeGroup}>
            <Text style={styles.orderIdText}>Đơn hàng #{orderCode}</Text>
            {dateStr ? <Text style={styles.orderDateText}>{dateStr}</Text> : null}
          </View>
          <View style={statusConfig.badgeStyle}>
            <Text style={statusConfig.textStyle}>{statusConfig.label}</Text>
          </View>
        </View>

        {/* Danh sách sách tóm tắt (tối đa 2 sản phẩm hiển thị trên card) */}
        <View style={styles.itemsList}>
          {validItems.slice(0, 2).map((orderItem, idx) => {
            const book = orderItem.bookId || {};
            return (
              <View key={orderItem._id || idx} style={styles.bookItemRow}>
                <Image
                  source={{ uri: book.coverImage || 'https://via.placeholder.com/150' }}
                  style={styles.bookCover}
                />
                <View style={styles.bookInfo}>
                  <Text style={styles.bookName} numberOfLines={1}>
                    {book.bookName || 'Tên sách không xác định'}
                  </Text>
                  <Text style={styles.bookAuthor} numberOfLines={1}>
                    Tác giả: {book.author || 'Đang cập nhật'}
                  </Text>
                  <View style={styles.bookMetaRow}>
                    <Text style={styles.bookQuantity}>Số lượng: x{orderItem.quantity}</Text>
                    <Text style={styles.bookPrice}>
                      {(orderItem.price || 0).toLocaleString('vi-VN')} đ
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
          {validItems.length > 2 && (
            <Text style={styles.moreItemsText}>
              + thêm {validItems.length - 2} sản phẩm khác...
            </Text>
          )}
        </View>

        {/* Footer: Tổng tiền & Các nút hành động */}
        <View style={styles.orderFooter}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t('orders.total')}</Text>
            <Text style={styles.totalValue}>
              {(item.totalAmount || 0).toLocaleString('vi-VN')} {t('common.currency')}
            </Text>
          </View>

          <View style={styles.actionRow}>
            {isCancelable && (
              <TouchableOpacity
                style={styles.cancelBtn}
                disabled={cancellingId === item._id}
                onPress={() => handleCancelOrder(item)}
              >
                {cancellingId === item._id ? (
                  <ActivityIndicator size="small" color="#D32F2F" />
                ) : (
                  <Text style={styles.cancelBtnText}>{t('orders.cancelOrder')}</Text>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.detailBtn}
              onPress={() => navigation.navigate('OrderDetail', { orderId: item._id, order: item })}
            >
              <Text style={styles.detailBtnText}>{t('orders.viewDetail')}</Text>
              <Ionicons name="chevron-forward" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header màn hình */}
      <View style={styles.header}>
        <Text style={styles.mainTitle}>{t('orders.title')}</Text>
      </View>

      {/* Tabs lọc trạng thái */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {filterTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.filterTab, isActive && styles.filterTabActive]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Nội dung danh sách đơn hàng */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#B91C1C" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="receipt-outline" size={54} color="#B91C1C" />
          </View>
          <Text style={styles.emptyTitle}>{t('orders.empty')}</Text>
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.shopBtnText}>{t('cart.exploreBtn')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item._id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#B91C1C']}
              tintColor="#B91C1C"
            />
          }
        />
      )}
    </View>
  );
}
