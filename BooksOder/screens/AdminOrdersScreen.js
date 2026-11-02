import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { API_URL, apiFetch as fetch } from '../src/constants/api';
import PaymentPanel from '../src/components/PaymentPanel';
import { useAuth } from '../src/context/AuthContext';
import { styles } from '../styles/AdminOrdersScreenStyles';

const FILTER_TABS = [
  'Tất cả',
  'Chờ xác nhận',
  'Đang vận chuyển',
  'Đã nhận hàng',
  'Hoàn thành',
  'Đã hủy',
];

export default function AdminOrdersScreen({ navigation }) {
  const { logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/orders`);
      if (response.ok) {
        const data = await response.json();
        setOrders(Array.isArray(data) ? data : []);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Lỗi tải danh sách đơn hàng cho Admin:', error);
      Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchWalletBalance = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/orders/dashboard/stats`);
      if (!response.ok) throw new Error('Không thể tải số dư ví Admin');
      const data = await response.json();
      setWalletBalance(data.walletBalance || 0);
    } catch (error) {
      console.error('Lỗi tải số dư ví Admin:', error);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    fetchOrders();
    fetchWalletBalance();
  }, [fetchOrders, fetchWalletBalance]));

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
    fetchWalletBalance();
  };

  const handleLogout = () => {
    Alert.alert('Xác nhận', 'Bạn có muốn đăng xuất khỏi quyền Quản trị viên?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

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
          iconName: 'time-outline',
          iconColor: '#D97706',
          label: 'Chờ xác nhận',
        };
      case 'Đang vận chuyển':
        return {
          badgeStyle: [styles.statusBadge, styles.badgeShipping],
          textStyle: [styles.statusText, styles.statusShippingText],
          iconName: 'bicycle-outline',
          iconColor: '#2563EB',
          label: 'Đang vận chuyển',
        };
      case 'Đã nhận hàng':
        return {
          badgeStyle: [styles.statusBadge, styles.badgeShipping],
          textStyle: [styles.statusText, styles.statusShippingText],
          iconName: 'cube-outline',
          iconColor: '#2563EB',
          label: 'Đã nhận hàng',
        };
      case 'Hoàn thành':
        return {
          badgeStyle: [styles.statusBadge, styles.badgeCompleted],
          textStyle: [styles.statusText, styles.statusCompletedText],
          iconName: 'checkmark-circle-outline',
          iconColor: '#059669',
          label: 'Hoàn thành',
        };
      case 'Đã hủy':
        return {
          badgeStyle: [styles.statusBadge, styles.badgeCancelled],
          textStyle: [styles.statusText, styles.statusCancelledText],
          iconName: 'close-circle-outline',
          iconColor: '#DC2626',
          label: 'Đã hủy',
        };
      default:
        return {
          badgeStyle: [styles.statusBadge, styles.badgePending],
          textStyle: [styles.statusText, styles.statusPendingText],
          iconName: 'help-circle-outline',
          iconColor: '#D97706',
          label: status,
        };
    }
  };

  // Cập nhật trạng thái đơn hàng qua API
  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    const requestBody = { status: newStatus };
    const currentOrder = orders.find((order) => order._id === orderId);
    const isCancel = newStatus === 'Đã hủy';
    try {
      const response = await fetch(`${API_URL}/orders/${orderId}/${isCancel ? 'cancel' : 'status'}`, {
        method: 'PUT',
        ...(isCancel ? {} : {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        }),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert('Thành công 🎉', `Đơn hàng đã được chuyển sang trạng thái "${newStatus}".`);
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, ...data.order } : o))
        );
        await Promise.all([fetchOrders(), fetchWalletBalance()]);
      } else {
        console.error('API từ chối cập nhật trạng thái đơn hàng:', {
          orderId,
          currentStatus: currentOrder?.status,
          requestedStatus: newStatus,
          httpStatus: response.status,
          response: data,
          payload: isCancel ? null : requestBody,
        });
        Alert.alert('Thất bại', data.message || `HTTP ${response.status}: Không thể cập nhật trạng thái đơn.`);
      }
    } catch (error) {
      console.error('Lỗi request cập nhật trạng thái đơn hàng:', {
        orderId,
        currentStatus: currentOrder?.status,
        requestedStatus: newStatus,
        payload: isCancel ? null : requestBody,
        error,
      });
      Alert.alert('Lỗi kết nối', 'Không thể kết nối đến máy chủ.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Thống kê nhanh số lượng theo từng trạng thái
  const stats = useMemo(() => {
    let pending = 0;
    let shipping = 0;
    let delivered = 0;
    let completed = 0;
    let cancelled = 0;

    for (const o of orders) {
      const norm = normalizeStatus(o.status);
      if (norm === 'Chờ xác nhận') pending++;
      else if (norm === 'Đang vận chuyển') shipping++;
      else if (norm === 'Đã nhận hàng') delivered++;
      else if (norm === 'Hoàn thành') completed++;
      else if (norm === 'Đã hủy') cancelled++;
    }

    return { pending, shipping, delivered, completed, cancelled };
  }, [orders]);

  // Lọc theo Tab và Search
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const norm = normalizeStatus(order.status);
      const matchTab = activeTab === 'Tất cả' || norm === activeTab;
      if (!matchTab) return false;

      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;

      const orderCode = (order._id || '').toLowerCase();
      const customer = (order.customerName || '').toLowerCase();
      const address = (order.address || '').toLowerCase();

      return (
        orderCode.includes(query) ||
        customer.includes(query) ||
        address.includes(query)
      );
    });
  }, [orders, activeTab, searchQuery]);

  const renderOrderItem = ({ item }) => {
    const statusConfig = getStatusBadgeConfig(item.status);
    const norm = normalizeStatus(item.status);
    const isPending = norm === 'Chờ xác nhận';
    const isShipping = norm === 'Đang vận chuyển';
    const isDelivered = norm === 'Đã nhận hàng';
    const isUpdating = updatingId === item._id;

    const dateStr = item.createdAt
      ? new Date(item.createdAt).toLocaleString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '';
    const orderCode = item._id ? item._id.slice(-6).toUpperCase() : 'N/A';
    const validItems = (item.items || []).filter((i) => i && i.bookId);

    return (
      <View style={styles.orderCard}>
        <PaymentPanel order={item} onUpdate={updated => setOrders(previous => previous.map(o => o._id === updated._id ? { ...o, ...updated } : o))} />
        <TouchableOpacity onPress={() => navigation.navigate('OrderDetail', { orderId: item._id })}><Text style={{ color: '#B91C1C', fontWeight: '700', marginBottom: 12 }}>Xem chi tiết đơn hàng →</Text></TouchableOpacity>
        {/* Header thẻ: Mã đơn & Trạng thái */}
        <View style={styles.cardTopRow}>
          <View>
            <Text style={styles.orderCodeText}>Đơn #{orderCode}</Text>
            {dateStr ? <Text style={styles.orderDateText}>{dateStr}</Text> : null}
          </View>
          <View style={statusConfig.badgeStyle}>
            <Ionicons name={statusConfig.iconName} size={14} color={statusConfig.iconColor} />
            <Text style={statusConfig.textStyle}>{statusConfig.label}</Text>
          </View>
        </View>

        {/* Khối thông tin khách hàng & Địa chỉ */}
        <View style={styles.customerBox}>
          <View style={styles.customerRow}>
            <Ionicons name="person-circle" size={18} color="#B91C1C" />
            <Text style={styles.customerName}>
              {item.customerName || 'Khách vãng lai'}
            </Text>
          </View>
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={15} color="#64748B" style={{ marginTop: 2 }} />
            <Text style={styles.addressText} numberOfLines={2}>
              {item.address || 'Không có địa chỉ giao hàng'}
            </Text>
          </View>
        </View>

        {/* Danh sách sách trong đơn */}
        <View style={styles.itemsSection}>
          {validItems.map((orderItem, idx) => {
            const book = orderItem.bookId || {};
            return (
              <View key={orderItem._id || idx} style={styles.itemRow}>
                <Image
                  source={{
                    uri: book.coverImage || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200',
                  }}
                  style={styles.itemCover}
                />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {book.bookName || 'Sách'}
                  </Text>
                  <View style={styles.itemMeta}>
                    <Text style={styles.itemQty}>SL: ×{orderItem.quantity || 1}</Text>
                    <Text style={styles.itemPrice}>
                      {((orderItem.price || 0) * (orderItem.quantity || 1)).toLocaleString('vi-VN')} đ
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Footer: Tổng tiền & Các nút hành động duyệt */}
        <View style={styles.cardFooter}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              Tổng thanh toán ({validItems.length} đầu sách):
            </Text>
            <Text style={styles.totalAmount}>
              {(item.totalAmount || 0).toLocaleString('vi-VN')} đ
            </Text>
          </View>

          {/* Các nút xử lý nghiệp vụ nhanh */}
          <View style={styles.actionsRow}>
            {/* Nếu Chờ xác nhận -> Nút Hủy đơn & Nút Duyệt & Giao */}
            {isPending && (
              <>
                <TouchableOpacity
                  style={styles.btnCancel}
                  activeOpacity={0.8}
                  disabled={isUpdating}
                  onPress={() =>
                    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn hủy đơn hàng này?', [
                      { text: 'Quay lại', style: 'cancel' },
                      {
                        text: 'Hủy đơn',
                        style: 'destructive',
                        onPress: () => handleUpdateStatus(item._id, 'Đã hủy'),
                      },
                    ])
                  }
                >
                  <Text style={styles.btnCancelText}>Hủy đơn</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btnApprove}
                  activeOpacity={0.85}
                  disabled={isUpdating}
                  onPress={() => handleUpdateStatus(item._id, 'Shipping')}
                >
                  {isUpdating ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="bicycle" size={15} color="#FFFFFF" />
                      <Text style={styles.btnApproveText}>Duyệt & Giao hàng</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}

            {/* Chờ khách xác nhận khi đơn đang giao */}
            {isShipping && (
              <Text style={{ color: '#2563EB', fontSize: 13, fontWeight: '700', flex: 1 }}>
                Đang giao - Chờ khách hàng xác nhận nhận hàng
              </Text>
            )}

            {isDelivered && (
              <TouchableOpacity
                style={styles.btnComplete}
                activeOpacity={0.85}
                disabled={isUpdating}
                onPress={() => handleUpdateStatus(item._id, 'Completed')}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-done" size={16} color="#FFFFFF" />
                    <Text style={styles.btnCompleteText}>Xác nhận Hoàn thành</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* 1. HEADER ADMIN */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.titleRow}>
            <Ionicons name="receipt" size={24} color="#B91C1C" />
            <Text style={styles.headerTitle}>Quản lý đơn hàng</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            {orders.length} đơn hàng trong hệ thống
          </Text>
        </View>

        <TouchableOpacity
          style={styles.logoutBtn}
          activeOpacity={0.8}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={22} color="#B91C1C" />
        </TouchableOpacity>
      </View>

      {/* 2. CHIP THỐNG KÊ NHANH (KPI ROW) */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsScroll}
        >
          <TouchableOpacity
            style={[styles.statChip, activeTab === 'Chờ xác nhận' && styles.statChipActive]}
            activeOpacity={0.7}
            onPress={() => setActiveTab('Chờ xác nhận')}
          >
            <View style={[styles.statDot, { backgroundColor: '#D97706' }]} />
            <Text style={styles.statText}>Chờ duyệt:</Text>
            <Text style={[styles.statCount, { color: '#D97706' }]}>{stats.pending}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statChip, activeTab === 'Đang vận chuyển' && styles.statChipActive]}
            activeOpacity={0.7}
            onPress={() => setActiveTab('Đang vận chuyển')}
          >
            <View style={[styles.statDot, { backgroundColor: '#2563EB' }]} />
            <Text style={styles.statText}>Đang giao:</Text>
            <Text style={[styles.statCount, { color: '#2563EB' }]}>{stats.shipping}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statChip, activeTab === 'Đã nhận hàng' && styles.statChipActive]}
            activeOpacity={0.7}
            onPress={() => setActiveTab('Đã nhận hàng')}
          >
            <View style={[styles.statDot, { backgroundColor: '#0EA5E9' }]} />
            <Text style={styles.statText}>Đã nhận:</Text>
            <Text style={[styles.statCount, { color: '#0EA5E9' }]}>{stats.delivered}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statChip, activeTab === 'Hoàn thành' && styles.statChipActive]}
            activeOpacity={0.7}
            onPress={() => setActiveTab('Hoàn thành')}
          >
            <View style={[styles.statDot, { backgroundColor: '#059669' }]} />
            <Text style={styles.statText}>Hoàn thành:</Text>
            <Text style={[styles.statCount, { color: '#059669' }]}>{stats.completed}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statChip, activeTab === 'Đã hủy' && styles.statChipActive]}
            activeOpacity={0.7}
            onPress={() => setActiveTab('Đã hủy')}
          >
            <View style={[styles.statDot, { backgroundColor: '#DC2626' }]} />
            <Text style={styles.statText}>Đã hủy:</Text>
            <Text style={[styles.statCount, { color: '#DC2626' }]}>{stats.cancelled}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* 3. THANH TÌM KIẾM ĐƠN HÀNG */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo mã đơn #ID, tên khách hàng, địa chỉ..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity style={styles.clearBtn} onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 4. TABS LỌC TRẠNG THÁI */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTER_TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.filterTab, isActive && styles.filterTabActive]}
                activeOpacity={0.8}
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

      {/* 5. DANH SÁCH ĐƠN HÀNG */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#B91C1C" />
          <Text style={styles.loadingText}>Đang tải danh sách đơn hàng...</Text>
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="file-tray-outline" size={38} color="#B91C1C" />
          </View>
          <Text style={styles.emptyTitle}>Không có đơn hàng nào</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? 'Không tìm thấy đơn hàng nào khớp với từ khóa tìm kiếm.'
              : activeTab === 'Tất cả'
              ? 'Hiện chưa có khách hàng nào đặt mua sách.'
              : `Không có đơn hàng nào đang ở trạng thái "${activeTab}".`}
          </Text>
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

    </SafeAreaView>
  );
}
