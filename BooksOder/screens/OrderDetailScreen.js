import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { API_URL, apiFetch as fetch } from '../src/constants/api';
import PaymentPanel from '../src/components/PaymentPanel';
import { useAuth } from '../src/context/AuthContext';
import { useLanguage } from '../src/context/LanguageContext';
import { styles } from '../styles/OrderDetailScreenStyles';

export default function OrderDetailScreen({ route, navigation }) {
  const { orderId, order: initialOrder } = route.params || {};
  const [order, setOrder] = useState(initialOrder || null);
  const [loading, setLoading] = useState(!initialOrder);
  const [cancelling, setCancelling] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const { userRole } = useAuth();
  const { t, language } = useLanguage();

  const fetchOrderDetail = useCallback(async () => {
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
  }, [orderId]);

  useFocusEffect(
    useCallback(() => {
      fetchOrderDetail();
    }, [fetchOrderDetail])
  );

  const normalizeStatus = (status) => {
    return ({
      'Chờ xác nhận': 'Pending',
      'Đang xử lý': 'Pending',
      'Đang vận chuyển': 'Shipping',
      'Đang giao': 'Shipping',
      'Đã giao': 'Delivered',
      'Hoàn thành': 'Completed',
      'Đã hủy': 'Cancelled',
    })[status] || status || 'Pending';
  };

  const handleStatusUpdate = async (status, successMessage) => {
    setUpdatingStatus(true);
    const requestBody = { status };
    try {
      const response = await fetch(`${API_URL}/orders/${order._id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const data = await response.json();
      if (!response.ok) {
        const error = new Error(data.message || 'Không thể cập nhật trạng thái đơn hàng.');
        error.response = { status: response.status, data };
        throw error;
      }
      setOrder(data.order);
      await fetchOrderDetail();
      Alert.alert(
        language === 'vi' ? 'Thành công' : 'Success',
        successMessage || (language === 'vi' ? 'Trạng thái đơn hàng đã được cập nhật.' : 'Order status updated.')
      );
    } catch (error) {
      console.error('Lỗi cập nhật trạng thái đơn hàng:', {
        orderId: order?._id,
        currentStatus: order?.status,
        requestedStatus: status,
        role: userRole,
        response: error.response,
        error,
      });
      Alert.alert(language === 'vi' ? 'Lỗi' : 'Error', error.message || 'Không thể kết nối đến máy chủ.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const confirmDeliveryReceived = () => {
    Alert.alert(
      'Xác nhận',
      'Bạn đã chắc chắn nhận được đơn hàng chưa?',
      [
        { text: 'Chưa', style: 'cancel' },
        { text: 'Có', onPress: () => handleStatusUpdate('Delivered', 'Xác nhận thành công') },
      ]
    );
  };

  const handleCancelOrder = () => {
    Alert.alert(
      language === 'vi' ? 'Xác nhận hủy đơn' : 'Cancel Order',
      language === 'vi'
        ? 'Bạn có chắc chắn muốn hủy đơn hàng này không? Thao tác này không thể hoàn tác.'
        : 'Are you sure you want to cancel this order? This action cannot be undone.',
      [
        { text: language === 'vi' ? 'Quay lại' : 'Back', style: 'cancel' },
        {
          text: language === 'vi' ? 'Xác nhận hủy' : 'Yes, cancel',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              const res = await fetch(`${API_URL}/orders/${order._id}/cancel`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
              });
              const data = await res.json();
              if (res.ok) {
                Alert.alert(
                  language === 'vi' ? 'Thành công' : 'Success',
                  language === 'vi' ? 'Đơn hàng đã được hủy thành công.' : 'Order cancelled successfully.'
                );
                setOrder(data.order || { ...order, status: 'Đã hủy' });
              } else {
                Alert.alert(
                  language === 'vi' ? 'Không thể hủy' : 'Error',
                  data.message || (language === 'vi' ? 'Lỗi khi hủy đơn hàng' : 'Failed to cancel order')
                );
              }
            } catch (error) {
              console.error(error);
              Alert.alert(
                language === 'vi' ? 'Lỗi' : 'Error',
                language === 'vi' ? 'Không thể kết nối đến máy chủ.' : 'Cannot connect to server.'
              );
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#B91C1C" />
        <Text style={styles.centerText}>
          {language === 'vi' ? 'Đang tải chi tiết đơn hàng...' : 'Loading order details...'}
        </Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={50} color="#D32F2F" />
        <Text style={styles.centerText}>
          {language === 'vi' ? 'Không tìm thấy thông tin đơn hàng.' : 'Order not found.'}
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>
            {language === 'vi' ? 'Quay lại' : 'Back'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentStatus = normalizeStatus(order.status);
  const isCancelled = currentStatus === 'Cancelled';
  const isCancelable = currentStatus === 'Pending';

  const orderCode = order._id ? order._id.slice(-6).toUpperCase() : 'N/A';
  const dateStr = order.createdAt
    ? new Date(order.createdAt).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  // Xác định bước hiện tại cho Stepper (Pending -> Shipping -> Delivered -> Completed)
  const getStepIndex = () => {
    if (currentStatus === 'Pending') return 1;
    if (currentStatus === 'Shipping') return 2;
    if (currentStatus === 'Delivered') return 3;
    if (currentStatus === 'Completed') return 4;
    return 1;
  };

  const stepIndex = getStepIndex();
  const validItems = (order.items || []).filter((i) => i && i.bookId);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* CARD 1: TIẾN TRÌNH TRẠNG THÁI */}
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="git-network-outline" size={20} color="#B91C1C" />
          <Text style={styles.cardTitle}>
            {language === 'vi' ? 'Tiến trình đơn hàng' : 'Order Progress'}
          </Text>
        </View>

        {isCancelled ? (
          <View style={styles.cancelledBox}>
            <Ionicons name="close-circle" size={32} color="#D32F2F" />
            <Text style={styles.cancelledText}>
              {language === 'vi' ? 'Đơn hàng này đã bị hủy' : 'This order has been cancelled'}
            </Text>
          </View>
        ) : (
          <View style={styles.timelineContainer}>
            <View
              style={[
                styles.timelineLine,
                { left: '12.5%', right: '12.5%' },
              ]}
            >
              <View
                style={{
                  width: `${((stepIndex - 1) / 3) * 100}%`,
                  height: '100%',
                  backgroundColor: stepIndex === 4 ? '#10B981' : '#B91C1C',
                }}
              />
            </View>

            {[
              { status: 'Pending', label: language === 'vi' ? 'Chờ duyệt' : 'Pending', icon: 'time' },
              { status: 'Shipping', label: language === 'vi' ? 'Đang giao' : 'Shipping', icon: 'bicycle' },
              { status: 'Delivered', label: language === 'vi' ? 'Đã nhận' : 'Delivered', icon: 'cube' },
              { status: 'Completed', label: language === 'vi' ? 'Hoàn thành' : 'Completed', icon: 'checkmark-circle' },
            ].map((step, index) => {
              const stepNumber = index + 1;
              const isComplete = stepNumber < stepIndex || currentStatus === 'Completed';
              const isCurrent = stepNumber === stepIndex;
              return (
                <View key={step.status} style={styles.timelineStep}>
                  <View
                    style={[
                      styles.stepCircle,
                      isCurrent && styles.stepCircleActive,
                      isComplete && styles.stepCircleCompleted,
                    ]}
                  >
                    <Ionicons
                      name={isComplete ? 'checkmark' : step.icon}
                      size={16}
                      color={isCurrent || isComplete ? '#FFF' : '#888'}
                    />
                  </View>
                  <Text
                    style={[
                      styles.stepLabel,
                      isCurrent && (currentStatus === 'Completed' ? styles.stepLabelCompleted : styles.stepLabelActive),
                      isComplete && styles.stepLabelCompleted,
                    ]}
                  >
                    {step.label}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Thông báo chi tiết phụ theo trạng thái */}
        {!isCancelled && (
          <View style={styles.statusNoticeBox}>
            <Ionicons name="information-circle-outline" size={18} color="#B91C1C" />
            <Text style={styles.statusNoticeText}>
              {currentStatus === 'Pending' &&
                (language === 'vi'
                  ? 'Cửa hàng đã nhận đơn và đang chuẩn bị đóng gói sách.'
                  : 'Store has received your order and is packing books.')}
              {currentStatus === 'Shipping' &&
                (language === 'vi'
                  ? 'Đơn hàng đang trên đường giao tới địa chỉ của bạn.'
                  : 'Your order is currently on its way to your address.')}
              {currentStatus === 'Delivered' &&
                (language === 'vi'
                  ? 'Bạn đã xác nhận nhận sách. Đơn hàng đang chờ Admin chốt hoàn thành.'
                  : 'You confirmed receipt. The order is waiting for admin completion.')}
              {currentStatus === 'Completed' &&
                (language === 'vi'
                  ? 'Đơn hàng đã được giao thành công. Cảm ơn bạn!'
                  : 'Order delivered successfully. Thank you!')}
            </Text>
          </View>
        )}
      </View>

      <PaymentPanel order={order} onUpdate={setOrder} />

      {/* CARD 2: ĐỊA CHỈ NHẬN HÀNG */}
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="location-outline" size={20} color="#B91C1C" />
          <Text style={styles.cardTitle}>
            {language === 'vi' ? 'Thông tin giao hàng' : 'Shipping Address'}
          </Text>
        </View>

        <View style={styles.addressBox}>
          <Ionicons
            name="navigate-circle-outline"
            size={20}
            color="#666"
            style={{ marginTop: 2 }}
          />
          <Text style={styles.addressText}>
            {order.address || (language === 'vi' ? 'Không có địa chỉ' : 'No address provided')}
          </Text>
        </View>
      </View>

      {/* CARD 3: DANH SÁCH SÁCH ĐÃ ĐẶT */}
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="book-outline" size={20} color="#B91C1C" />
          <Text style={styles.cardTitle}>
            {language === 'vi'
              ? `Sách đã đặt (${validItems.length})`
              : `Ordered Items (${validItems.length})`}
          </Text>
        </View>

        {validItems.map((item, index) => {
          const book = item.bookId || {};
          const isLast = index === validItems.length - 1;
          const subtotal = (item.price || 0) * (item.quantity || 1);
          const bookId =
            typeof item.bookId === 'object'
              ? item.bookId._id || item.bookId.id
              : item.bookId;
          return (
            <TouchableOpacity
              key={item._id || index}
              style={[styles.itemRow, isLast && styles.itemRowLast]}
              activeOpacity={0.8}
              disabled={!bookId}
              onPress={() => navigation.navigate('Chi tiết', { bookId: String(bookId) })}
            >
              <Image
                source={{ uri: book.coverImage || 'https://via.placeholder.com/150' }}
                style={styles.itemCover}
              />
              <View style={styles.itemDetails}>
                <Text style={styles.itemBookName} numberOfLines={2}>
                  {book.bookName || (language === 'vi' ? 'Sách' : 'Book')}
                </Text>
                <Text style={styles.itemAuthor} numberOfLines={1}>
                  {language === 'vi' ? 'Tác giả:' : 'Author:'} {book.author || (language === 'vi' ? 'Đang cập nhật' : 'Unknown')}
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
            </TouchableOpacity>
          );
        })}
      </View>

      {/* CARD 4: TỔNG KẾT THANH TOÁN */}
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="receipt-outline" size={20} color="#B91C1C" />
          <Text style={styles.cardTitle}>
            {language === 'vi' ? 'Chi tiết thanh toán' : 'Payment Summary'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            {language === 'vi' ? 'Mã đơn hàng' : 'Order ID'}
          </Text>
          <Text style={styles.infoValue}>#{orderCode}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            {language === 'vi' ? 'Thời gian đặt' : 'Order Date'}
          </Text>
          <Text style={styles.infoValue}>{dateStr}</Text>
        </View>

        <View style={styles.paymentSummaryRow}>
          <Text style={styles.paymentSummaryLabel}>
            {language === 'vi' ? 'Tiền sách' : 'Books Subtotal'}
          </Text>
          <Text style={styles.paymentSummaryValue}>
            {(order.subtotal || order.totalAmount || 0).toLocaleString('vi-VN')} đ
          </Text>
        </View>

        <View style={styles.paymentSummaryRow}>
          <Text style={styles.paymentSummaryLabel}>
            {language === 'vi' ? 'Phí vận chuyển' : 'Shipping Fee'}
          </Text>
          <Text style={[styles.paymentSummaryValue, { color: '#388E3C', fontWeight: 'bold' }]}>
            {order.shippingFee ? `${order.shippingFee.toLocaleString('vi-VN')} đ` : (language === 'vi' ? 'Miễn phí' : 'Free')}
          </Text>
        </View>

        {order.discountAmount > 0 ? (
          <View style={styles.paymentSummaryRow}>
            <Text style={[styles.paymentSummaryLabel, { color: '#059669', fontWeight: '700' }]}>
              {language === 'vi'
                ? `Giảm giá Voucher (${order.voucherCode}):`
                : `Voucher Discount (${order.voucherCode}):`}
            </Text>
            <Text style={[styles.paymentSummaryValue, { color: '#059669', fontWeight: '800' }]}>
              - {order.discountAmount.toLocaleString('vi-VN')} đ
            </Text>
          </View>
        ) : null}

        <View style={styles.divider} />

        <View style={styles.paymentSummaryRow}>
          <Text style={styles.finalTotalLabel}>
            {language === 'vi' ? 'Tổng thanh toán' : 'Final Amount'}
          </Text>
          <Text style={styles.finalTotalValue}>
            {(order.totalAmount || 0).toLocaleString('vi-VN')} đ
          </Text>
        </View>
      </View>

      {userRole === 'admin' && currentStatus === 'Pending' && (
        <TouchableOpacity
          style={styles.statusActionBtn}
          disabled={updatingStatus}
          onPress={() => handleStatusUpdate('Shipping')}
        >
          {updatingStatus ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="bicycle" size={20} color="#FFFFFF" />
              <Text style={styles.statusActionBtnText}>Duyệt & Giao hàng</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {userRole === 'admin' && currentStatus === 'Shipping' && (
        <View style={styles.statusWaitingBox}>
          <Ionicons name="time-outline" size={20} color="#2563EB" />
          <Text style={styles.statusWaitingText}>Đang giao - Chờ khách hàng xác nhận nhận hàng</Text>
        </View>
      )}

      {userRole !== 'admin' && currentStatus === 'Shipping' && (
        <>
          <View style={styles.statusWaitingBox}>
            <Ionicons name="bicycle-outline" size={20} color="#2563EB" />
            <Text style={styles.statusWaitingText}>Đơn hàng đang được giao đến bạn</Text>
          </View>
          <TouchableOpacity
            style={styles.statusActionBtn}
            disabled={updatingStatus}
            onPress={confirmDeliveryReceived}
          >
            {updatingStatus ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                <Text style={styles.statusActionBtnText}>Xác nhận đã nhận được hàng</Text>
              </>
            )}
          </TouchableOpacity>
        </>
      )}

      {userRole === 'admin' && currentStatus === 'Delivered' && (
        <TouchableOpacity
          style={styles.statusActionBtn}
          disabled={updatingStatus}
          onPress={() => handleStatusUpdate('Completed')}
        >
          {updatingStatus ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-done" size={20} color="#FFFFFF" />
              <Text style={styles.statusActionBtnText}>Xác nhận Hoàn thành</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* NÚT HỦY ĐƠN HÀNG (Nếu đơn còn ở trạng thái Chờ xác nhận) */}
      {isCancelable && userRole !== 'admin' && (
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
              <Text style={styles.cancelOrderBtnText}>
                {language === 'vi' ? 'HỦY ĐƠN HÀNG NÀY' : 'CANCEL THIS ORDER'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}
