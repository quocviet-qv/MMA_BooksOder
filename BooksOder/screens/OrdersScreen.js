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

import { API_URL } from '../src/constants/api';
import { useAuth } from '../src/context/AuthContext';
import { styles } from '../styles/OrdersScreenStyles';

const FILTER_TABS = [
  'Tất cả',
  'Chờ xác nhận',
  'Đang vận chuyển',
  'Hoàn thành',
  'Đã hủy'
];

export default function OrdersScreen({ navigation }) {
  const { userId } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('Tất cả');
  const [cancellingId, setCancellingId] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [userId])
  );

  const loadOrders = async () => {
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
      Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ để tải đơn hàng.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

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
          label: 'Chờ xác nhận'
        };
      case 'Đang vận chuyển':
        return {
          badgeStyle: [styles.statusBadge, styles.badgeShipping],
          textStyle: [styles.statusText, styles.statusShippingText],
          label: 'Đang vận chuyển'
        };
      case 'Hoàn thành':
        return {
          badgeStyle: [styles.statusBadge, styles.badgeCompleted],
          textStyle: [styles.statusText, styles.statusCompletedText],
          label: 'Hoàn thành'
        };
      case 'Đã hủy':
        return {
          badgeStyle: [styles.statusBadge, styles.badgeCancelled],
          textStyle: [styles.statusText, styles.statusCancelledText],
          label: 'Đã hủy'
        };
      default:
        return {
          badgeStyle: [styles.statusBadge, styles.badgePending],
          textStyle: [styles.statusText, styles.statusPendingText],
          label: status
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
    if (activeTab === 'Tất cả') return true;
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
            <Text style={styles.totalLabel}>Tổng thanh toán:</Text>
            <Text style={styles.totalValue}>
              {(item.totalAmount || 0).toLocaleString('vi-VN')} đ
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
                  <Text style={styles.cancelBtnText}>Hủy đơn</Text>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.detailBtn}
              onPress={() => navigation.navigate('OrderDetail', { orderId: item._id, order: item })}
            >
              <Text style={styles.detailBtnText}>Chi tiết</Text>
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
        <Text style={styles.mainTitle}>Đơn hàng của tôi</Text>
        <Text style={styles.subtitle}>Theo dõi và quản lý lịch sử mua hàng</Text>
      </View>

      {/* Tabs lọc trạng thái */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {FILTER_TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.filterTab, isActive && styles.filterTabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Nội dung danh sách đơn hàng */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#C5532A" />
          <Text style={styles.loadingText}>Đang tải lịch sử đơn hàng...</Text>
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="receipt-outline" size={54} color="#A89F91" />
          </View>
          <Text style={styles.emptyTitle}>Chưa có đơn hàng nào</Text>
          <Text style={styles.emptyDesc}>
            {activeTab === 'Tất cả'
              ? 'Bạn chưa đặt mua cuốn sách nào. Hãy khám phá và mua sắm ngay hôm nay!'
              : `Không tìm thấy đơn hàng nào thuộc trạng thái "${activeTab}".`}
          </Text>
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.shopBtnText}>Khám phá sách ngay</Text>
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
              colors={['#C5532A']}
              tintColor="#C5532A"
            />
          }
        />
      )}
    </View>
  );
}
