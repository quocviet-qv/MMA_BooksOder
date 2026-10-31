import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { API_URL } from '../src/constants/api';
import { useAuth } from '../src/context/AuthContext';
import { styles } from '../styles/AdminOrdersScreenStyles';

const FILTER_TABS = [
  'Tất cả',
  'Chờ xác nhận',
  'Đang vận chuyển',
  'Hoàn thành',
  'Đã hủy'
];

const ALL_STATUSES = [
  'Chờ xác nhận',
  'Đang vận chuyển',
  'Hoàn thành',
  'Đã hủy'
];

export default function AdminOrdersScreen({ navigation }) {
  const { logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('Tất cả');
  const [updatingId, setUpdatingId] = useState(null);

  // Modal đổi trạng thái tùy chọn
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  const fetchOrders = async () => {
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
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleLogout = () => {
    Alert.alert('Xác nhận', 'Bạn có muốn đăng xuất khỏi quyền Admin?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => logout(),
      }
    ]);
  };

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

  // Cập nhật trạng thái đơn hàng qua API
  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert('Thành công', `Đơn hàng đã được chuyển sang trạng thái "${newStatus}".`);
        // Cập nhật trạng thái trực tiếp trong mảng local
        setOrders(prev =>
          prev.map(o => (o._id === orderId ? { ...o, status: newStatus } : o))
        );
        setModalVisible(false);
      } else {
        Alert.alert('Lỗi', data.message || 'Không thể cập nhật trạng thái đơn.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi mạng', 'Không thể kết nối đến máy chủ.');
    } finally {
      setUpdatingId(null);
    }
  };

  const openStatusModal = (order) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'Tất cả') return true;
    return normalizeStatus(order.status) === activeTab;
  });

  // Đếm số đơn chờ xác nhận để hiển thị huy hiệu
  const pendingCount = orders.filter(
    o => normalizeStatus(o.status) === 'Chờ xác nhận'
  ).length;

  const renderOrderItem = ({ item }) => {
    const statusConfig = getStatusBadgeConfig(item.status);
    const norm = normalizeStatus(item.status);
    const isPending = norm === 'Chờ xác nhận';
    const isShipping = norm === 'Đang vận chuyển';
    const isUpdating = updatingId === item._id;

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
      <View style={styles.orderCard}>
        {/* Header thẻ: Mã đơn & Trạng thái */}
        <View style={styles.cardTopRow}>
          <View>
            <Text style={styles.orderCodeText}>Đơn #{orderCode}</Text>
            {dateStr ? <Text style={styles.orderDateText}>{dateStr}</Text> : null}
          </View>
          <View style={statusConfig.badgeStyle}>
            <Text style={statusConfig.textStyle}>{statusConfig.label}</Text>
          </View>
        </View>

        {/* Khối thông tin khách hàng & Địa chỉ */}
        <View style={styles.customerBox}>
          <View style={styles.customerRow}>
            <Ionicons name="person-circle-outline" size={18} color="#C5532A" />
            <Text style={styles.customerName}>
              Khách hàng: {item.customerName || 'Khách vãng lai'}
            </Text>
          </View>
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={16} color="#666" style={{ marginTop: 2 }} />
            <Text style={styles.addressText} numberOfLines={2}>
              {item.address || 'Không có địa chỉ'}
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
                  source={{ uri: book.coverImage || 'https://via.placeholder.com/150' }}
                  style={styles.itemCover}
                />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {book.bookName || 'Sách'}
                  </Text>
                  <View style={styles.itemMeta}>
                    <Text style={styles.itemQty}>SL: ×{orderItem.quantity}</Text>
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
            <Text style={styles.totalLabel}>Tổng đơn ({validItems.length} sản phẩm):</Text>
            <Text style={styles.totalAmount}>
              {(item.totalAmount || 0).toLocaleString('vi-VN')} đ
            </Text>
          </View>

          {/* Các nút xử lý nghiệp vụ nhanh */}
          <View style={styles.actionsRow}>
            {/* Nút mở modal đổi trạng thái thủ công */}
            <TouchableOpacity
              style={styles.btnChangeStatus}
              onPress={() => openStatusModal(item)}
            >
              <Ionicons name="options-outline" size={15} color="#C5532A" />
              <Text style={styles.btnChangeStatusText}>Đổi trạng thái</Text>
            </TouchableOpacity>

            {/* Nếu Chờ xác nhận -> Nút Duyệt & Giao */}
            {isPending && (
              <>
                <TouchableOpacity
                  style={styles.btnCancel}
                  disabled={isUpdating}
                  onPress={() =>
                    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn hủy đơn hàng này?', [
                      { text: 'Quay lại', style: 'cancel' },
                      {
                        text: 'Hủy đơn',
                        style: 'destructive',
                        onPress: () => handleUpdateStatus(item._id, 'Đã hủy')
                      }
                    ])
                  }
                >
                  <Text style={styles.btnCancelText}>Hủy đơn</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btnApprove}
                  disabled={isUpdating}
                  onPress={() => handleUpdateStatus(item._id, 'Đang vận chuyển')}
                >
                  {isUpdating ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="bicycle" size={16} color="#FFF" />
                      <Text style={styles.btnApproveText}>Duyệt & Giao</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}

            {/* Nếu Đang vận chuyển -> Nút Đã giao thành công */}
            {isShipping && (
              <TouchableOpacity
                style={styles.btnComplete}
                disabled={isUpdating}
                onPress={() => handleUpdateStatus(item._id, 'Hoàn thành')}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-done" size={16} color="#FFF" />
                    <Text style={styles.btnCompleteText}>Đã giao hàng</Text>
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
    <View style={styles.container}>
      {/* Header Admin */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Quản lý đơn hàng</Text>
          <Text style={styles.headerSubtitle}>
            {pendingCount > 0
              ? `⚡ Có ${pendingCount} đơn hàng mới cần duyệt`
              : 'Tất cả đơn hàng đã được cập nhật'}
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={26} color="#C5532A" />
        </TouchableOpacity>
      </View>

      {/* Tabs lọc trạng thái */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTER_TABS.map(tab => {
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
          <Text style={styles.loadingText}>Đang tải toàn bộ đơn hàng...</Text>
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="file-tray-outline" size={44} color="#A89F91" />
          </View>
          <Text style={styles.emptyTitle}>Không có đơn hàng nào</Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === 'Tất cả'
              ? 'Hiện chưa có khách hàng nào đặt mua sách.'
              : `Không tìm thấy đơn hàng nào ở trạng thái "${activeTab}".`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={item => item._id}
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

      {/* MODAL ĐỔI TRẠNG THÁI THỦ CÔNG */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chuyển trạng thái đơn hàng</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <View>
                <Text style={{ fontSize: 13, color: '#666', marginBottom: 14 }}>
                  Đơn hàng #{selectedOrder._id.slice(-6).toUpperCase()} của{' '}
                  <Text style={{ fontWeight: 'bold', color: '#1A1A1A' }}>
                    {selectedOrder.customerName}
                  </Text>
                </Text>

                {ALL_STATUSES.map(st => {
                  const isCurrent = normalizeStatus(selectedOrder.status) === st;
                  return (
                    <TouchableOpacity
                      key={st}
                      style={[
                        styles.statusOptionItem,
                        isCurrent && styles.statusOptionActive
                      ]}
                      onPress={() => handleUpdateStatus(selectedOrder._id, st)}
                    >
                      <Text
                        style={[
                          styles.statusOptionText,
                          isCurrent && { color: '#C5532A', fontWeight: 'bold' }
                        ]}
                      >
                        {st}
                      </Text>
                      {isCurrent ? (
                        <Ionicons name="checkmark-circle" size={20} color="#C5532A" />
                      ) : (
                        <Ionicons name="chevron-forward" size={18} color="#AAA" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
