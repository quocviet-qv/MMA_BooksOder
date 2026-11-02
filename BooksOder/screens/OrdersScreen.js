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
  const { t, language } = useLanguage();

  const filterTabs = [
    { id: 'all', label: t('home.allCategory') },
    { id: 'Chờ xác nhận', label: t('orders.statusPending') },
    { id: 'Đang vận chuyển', label: t('orders.statusShipping') },
    { id: 'Đã nhận hàng', label: language === 'vi' ? 'Đã nhận hàng' : 'Delivered' },
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
    return ({
      Pending: 'Chờ xác nhận',
      'Đang xử lý': 'Chờ xác nhận',
      'Chờ xác nhận': 'Chờ xác nhận',
      Shipping: 'Đang vận chuyển',
      'Đang giao': 'Đang vận chuyển',
      'Đang vận chuyển': 'Đang vận chuyển',
      Delivered: 'Đã nhận hàng',
      'Đã giao': 'Đã nhận hàng',
      Completed: 'Hoàn thành',
      'Hoàn thành': 'Hoàn thành',
      Cancelled: 'Đã hủy',
      'Đã hủy': 'Đã hủy',
    })[status] || status || 'Chờ xác nhận';
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
      case 'Đã nhận hàng':
        return {
          badgeStyle: [styles.statusBadge, styles.badgeShipping],
          textStyle: [styles.statusText, styles.statusShippingText],
          label: language === 'vi' ? 'Đã nhận hàng' : 'Delivered',
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
      t('orders.cancelOrder'),
      t('orders.cancelConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
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
                Alert.alert(t('common.success'), language === 'vi' ? 'Đơn hàng của bạn đã được hủy.' : 'Your order has been cancelled.');
                loadOrders();
              } else {
                Alert.alert(t('common.error'), data.message || (language === 'vi' ? 'Lỗi khi hủy đơn hàng' : 'Failed to cancel order'));
              }
            } catch (error) {
              console.error(error);
              Alert.alert(t('common.error'), t('common.networkError'));
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
            <Text style={styles.orderIdText}>
              {language === 'vi' ? `Đơn hàng #${orderCode}` : `Order #${orderCode}`}
            </Text>
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
                    {book.bookName || (language === 'vi' ? 'Tên sách không xác định' : 'Unknown Book')}
                  </Text>
                  <Text style={styles.bookAuthor} numberOfLines={1}>
                    {language === 'vi' ? 'Tác giả:' : 'Author:'} {book.author || (language === 'vi' ? 'Đang cập nhật' : 'Unknown')}
                  </Text>
                  <View style={styles.bookMetaRow}>
                    <Text style={styles.bookQuantity}>
                      {language === 'vi' ? 'Số lượng:' : 'Qty:'} x{orderItem.quantity}
                    </Text>
                    <Text style={styles.bookPrice}>
                      {(orderItem.price || 0).toLocaleString('vi-VN')} {t('common.currency')}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
          {validItems.length > 2 && (
            <Text style={styles.moreItemsText}>
              {language === 'vi'
                ? `+ thêm ${validItems.length - 2} sản phẩm khác...`
                : `+ ${validItems.length - 2} more items...`}
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
