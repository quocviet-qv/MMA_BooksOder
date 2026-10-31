import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { API_URL } from '../src/constants/api';
import { styles } from '../styles/OrderDetailScreenStyles';

export default function OrderDetailScreen({ route, navigation }) {
  const { orderId, order: initialOrder } = route.params || {};
  const [order, setOrder] = useState(initialOrder || null);
  const [loading, setLoading] = useState(!initialOrder);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  const fetchOrderDetail = async () => {
    if (!orderId) return;
    try {
      const res = await fetch(`${API_URL}/orders/detail/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      }
    } catch (error) {
      console.error('Lỗi tải chi tiết đơn hàng:', error);
    } finally {
      setLoading(false);
    }
  };

  const normalizeStatus = (status) => {
    if (status === 'Đang xử lý' || status === 'Chờ xác nhận') return 'Chờ xác nhận';
    if (status === 'Đang giao' || status === 'Đang vận chuyển') return 'Đang vận chuyển';
    if (status === 'Đã giao' || status === 'Hoàn thành') return 'Hoàn thành';
    if (status === 'Đã hủy') return 'Đã hủy';
    return status || 'Chờ xác nhận';
  };

  const handleCancelOrder = () => {
    Alert.alert(
      'Xác nhận hủy đơn',
      'Bạn có chắc chắn muốn hủy đơn hàng này không? Thao tác này không thể hoàn tác.',
      [
        { text: 'Quay lại', style: 'cancel' },
        {
          text: 'Xác nhận hủy',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              const res = await fetch(`${API_URL}/orders/${order._id}/cancel`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
              });
              const data = await res.json();
              if (res.ok) {
                Alert.alert('Thành công', 'Đơn hàng đã được hủy thành công.');
                setOrder(data.order || { ...order, status: 'Đã hủy' });
              } else {
                Alert.alert('Không thể hủy', data.message || 'Lỗi khi hủy đơn hàng');
              }
            } catch (error) {
              console.error(error);
              Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ.');
            } finally {
              setCancelling(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#C5532A" />
        <Text style={styles.centerText}>Đang tải chi tiết đơn hàng...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={50} color="#D32F2F" />
        <Text style={styles.centerText}>Không tìm thấy thông tin đơn hàng.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentStatus = normalizeStatus(order.status);
  const isCancelled = currentStatus === 'Đã hủy';
  const isCancelable = currentStatus === 'Chờ xác nhận';

  const orderCode = order._id ? order._id.slice(-6).toUpperCase() : 'N/A';
  const dateStr = order.createdAt
    ? new Date(order.createdAt).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '';

  // Xác định bước hiện tại cho Stepper (1: Chờ xác nhận, 2: Đang vận chuyển, 3: Hoàn thành)
  const getStepIndex = () => {
    if (currentStatus === 'Chờ xác nhận') return 1;
    if (currentStatus === 'Đang vận chuyển') return 2;
    if (currentStatus === 'Hoàn thành') return 3;
    return 1;
  };

  const stepIndex = getStepIndex();
  const validItems = (order.items || []).filter(i => i && i.bookId);

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* CARD 1: TIẾN TRÌNH TRẠNG THÁI */}
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="analytics-outline" size={20} color="#C5532A" />
          <Text style={styles.cardTitle}>Trạng thái đơn hàng</Text>
        </View>

        {isCancelled ? (
          <View style={styles.statusNoticeBox}>
            <Ionicons name="close-circle" size={24} color="#D32F2F" />
            <Text style={[styles.statusNoticeText, { color: '#D32F2F', fontWeight: '600' }]}>
              Đơn hàng này đã bị hủy.
            </Text>
          </View>
        ) : (
          <View style={styles.timelineContainer}>
            {/* Đường line tiến trình */}
            <View 
              style={[
                styles.timelineLine, 
                stepIndex === 2 ? styles.timelineLineHalf : null,
                stepIndex === 3 ? styles.timelineLineCompleted : null
              ]} 
            />

            {/* Bước 1: Chờ xác nhận */}
            <View style={styles.timelineStep}>
              <View 
                style={[
                  styles.stepCircle, 
                  stepIndex >= 1 ? styles.stepCircleActive : null,
                  stepIndex > 1 ? styles.stepCircleCompleted : null
                ]}
              >
                <Ionicons 
                  name={stepIndex > 1 ? "checkmark" : "time"} 
                  size={16} 
                  color="#FFF" 
                />
              </View>
              <Text style={[styles.stepLabel, stepIndex === 1 ? styles.stepLabelActive : null]}>
                Chờ xác nhận
              </Text>
            </View>

            {/* Bước 2: Đang vận chuyển */}
            <View style={styles.timelineStep}>
              <View 
                style={[
                  styles.stepCircle, 
                  stepIndex >= 2 ? styles.stepCircleActive : null,
                  stepIndex > 2 ? styles.stepCircleCompleted : null
                ]}
              >
                <Ionicons 
                  name={stepIndex > 2 ? "checkmark" : "bicycle"} 
                  size={16} 
                  color={stepIndex >= 2 ? "#FFF" : "#888"} 
                />
              </View>
              <Text style={[styles.stepLabel, stepIndex === 2 ? styles.stepLabelActive : null]}>
                Đang giao
              </Text>
            </View>

            {/* Bước 3: Hoàn thành */}
            <View style={styles.timelineStep}>
              <View 
                style={[
                  styles.stepCircle, 
                  stepIndex === 3 ? styles.stepCircleCompleted : null
                ]}
              >
                <Ionicons 
                  name="checkmark-circle" 
                  size={16} 
                  color={stepIndex === 3 ? "#FFF" : "#888"} 
                />
              </View>
              <Text style={[styles.stepLabel, stepIndex === 3 ? styles.stepLabelCompleted : null]}>
                Hoàn thành
              </Text>
            </View>
          </View>
        )}

        {/* Thông báo chi tiết phụ theo trạng thái */}
        {!isCancelled && (
          <View style={styles.statusNoticeBox}>
            <Ionicons name="information-circle-outline" size={18} color="#C5532A" />
            <Text style={styles.statusNoticeText}>
              {currentStatus === 'Chờ xác nhận' && 'Cửa hàng đã nhận đơn và đang chuẩn bị đóng gói sách.'}
              {currentStatus === 'Đang vận chuyển' && 'Đơn hàng đang trên đường giao tới địa chỉ của bạn.'}
              {currentStatus === 'Hoàn thành' && 'Đơn hàng đã được giao thành công. Cảm ơn bạn!'}
            </Text>
          </View>
        )}
      </View>

      {/* CARD 2: ĐỊA CHỈ NHẬN HÀNG */}
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="location-outline" size={20} color="#C5532A" />
          <Text style={styles.cardTitle}>Thông tin giao hàng</Text>
        </View>

        <View style={styles.addressBox}>
          <Ionicons name="navigate-circle-outline" size={20} color="#666" style={{ marginTop: 2 }} />
          <Text style={styles.addressText}>{order.address || 'Không có địa chỉ'}</Text>
        </View>
      </View>

      {/* CARD 3: DANH SÁCH SÁCH ĐÃ ĐẶT */}
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="book-outline" size={20} color="#C5532A" />
          <Text style={styles.cardTitle}>Sách đã đặt ({validItems.length})</Text>
        </View>

        {validItems.map((item, index) => {
          const book = item.bookId || {};
          const isLast = index === validItems.length - 1;
          const subtotal = (item.price || 0) * (item.quantity || 1);

          return (
            <View 
              key={item._id || index} 
              style={[styles.itemRow, isLast && styles.itemRowLast]}
            >
              <Image 
                source={{ uri: book.coverImage || 'https://via.placeholder.com/150' }}
                style={styles.itemCover}
              />
              <View style={styles.itemDetails}>
                <Text style={styles.itemBookName} numberOfLines={2}>
                  {book.bookName || 'Sách'}
                </Text>
                <Text style={styles.itemAuthor} numberOfLines={1}>
                  Tác giả: {book.author || 'Đang cập nhật'}
                </Text>
                <View style={styles.itemPriceRow}>
                  <Text style={styles.itemQuantityText}>
                    {(item.price || 0).toLocaleString('vi-VN')} đ × {item.quantity}
                  </Text>
                  <Text style={styles.itemTotalPrice}>
                    {subtotal.toLocaleString('vi-VN')} đ
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* CARD 4: TỔNG KẾT THANH TOÁN */}
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="receipt-outline" size={20} color="#C5532A" />
          <Text style={styles.cardTitle}>Chi tiết thanh toán</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Mã đơn hàng</Text>
          <Text style={styles.infoValue}>#{orderCode}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Thời gian đặt</Text>
          <Text style={styles.infoValue}>{dateStr}</Text>
        </View>

        <View style={styles.paymentSummaryRow}>
          <Text style={styles.paymentSummaryLabel}>Tiền sách</Text>
          <Text style={styles.paymentSummaryValue}>
            {(order.totalAmount || 0).toLocaleString('vi-VN')} đ
          </Text>
        </View>

        <View style={styles.paymentSummaryRow}>
          <Text style={styles.paymentSummaryLabel}>Phí vận chuyển</Text>
          <Text style={[styles.paymentSummaryValue, { color: '#388E3C', fontWeight: 'bold' }]}>
            Miễn phí
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.paymentSummaryRow}>
          <Text style={styles.finalTotalLabel}>Tổng thanh toán</Text>
          <Text style={styles.finalTotalValue}>
            {(order.totalAmount || 0).toLocaleString('vi-VN')} đ
          </Text>
        </View>
      </View>

      {/* NÚT HỦY ĐƠN HÀNG (Nếu đơn còn ở trạng thái Chờ xác nhận) */}
      {isCancelable && (
        <TouchableOpacity 
          style={styles.cancelOrderBtn} 
          disabled={cancelling}
          onPress={handleCancelOrder}
        >
          {cancelling ? (
            <ActivityIndicator color="#D32F2F" />
          ) : (
            <>
              <Ionicons name="close-circle-outline" size={20} color="#D32F2F" />
              <Text style={styles.cancelOrderBtnText}>HỦY ĐƠN HÀNG NÀY</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}
