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
import { useLanguage } from '../src/context/LanguageContext';
import { styles } from '../styles/OrderDetailScreenStyles';

export default function OrderDetailScreen({ route, navigation }) {
  const { orderId, order: initialOrder } = route.params || {};
  const [order, setOrder] = useState(initialOrder || null);
  const [loading, setLoading] = useState(!initialOrder);
  const [cancelling, setCancelling] = useState(false);
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
    if (status === 'Đang xử lý' || status === 'Chờ xác nhận') return 'Chờ xác nhận';
    if (status === 'Đang giao' || status === 'Đang vận chuyển') return 'Đang vận chuyển';
    if (status === 'Đã giao' || status === 'Hoàn thành') return 'Hoàn thành';
    if (status === 'Đã hủy') return 'Đã hủy';
    return status || 'Chờ xác nhận';
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
  const isCancelled = currentStatus === 'Đã hủy';
  const isCancelable = currentStatus === 'Chờ xác nhận';

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

  // Xác định bước hiện tại cho Stepper (1: Chờ xác nhận, 2: Đang vận chuyển, 3: Hoàn thành)
  const getStepIndex = () => {
    if (currentStatus === 'Chờ xác nhận') return 1;
    if (currentStatus === 'Đang vận chuyển') return 2;
    if (currentStatus === 'Hoàn thành') return 3;
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
            {/* Đường line tiến trình */}
            <View
              style={[
                styles.timelineLine,
                stepIndex === 2 ? styles.timelineLineHalf : null,
                stepIndex === 3 ? styles.timelineLineCompleted : null,
              ]}
            />

            {/* Bước 1: Chờ xác nhận */}
            <View style={styles.timelineStep}>
              <View
                style={[
                  styles.stepCircle,
                  stepIndex >= 1 ? styles.stepCircleActive : null,
                  stepIndex > 1 ? styles.stepCircleCompleted : null,
                ]}
              >
                <Ionicons
                  name={stepIndex > 1 ? 'checkmark' : 'time'}
                  size={16}
                  color="#FFF"
                />
              </View>
              <Text style={[styles.stepLabel, stepIndex === 1 ? styles.stepLabelActive : null]}>
                {language === 'vi' ? 'Chờ xác nhận' : 'Pending'}
              </Text>
            </View>

            {/* Bước 2: Đang vận chuyển */}
            <View style={styles.timelineStep}>
              <View
                style={[
                  styles.stepCircle,
                  stepIndex >= 2 ? styles.stepCircleActive : null,
                  stepIndex > 2 ? styles.stepCircleCompleted : null,
                ]}
              >
                <Ionicons
                  name={stepIndex > 2 ? 'checkmark' : 'bicycle'}
                  size={16}
                  color={stepIndex >= 2 ? '#FFF' : '#888'}
                />
              </View>
              <Text style={[styles.stepLabel, stepIndex === 2 ? styles.stepLabelActive : null]}>
                {language === 'vi' ? 'Đang giao' : 'Shipping'}
              </Text>
            </View>

            {/* Bước 3: Hoàn thành */}
            <View style={styles.timelineStep}>
              <View
                style={[
                  styles.stepCircle,
                  stepIndex === 3 ? styles.stepCircleCompleted : null,
                ]}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={stepIndex === 3 ? '#FFF' : '#888'}
                />
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  stepIndex === 3 ? styles.stepLabelCompleted : null,
                ]}
              >
                {language === 'vi' ? 'Hoàn thành' : 'Completed'}
              </Text>
            </View>
          </View>
        )}

        {/* Thông báo chi tiết phụ theo trạng thái */}
        {!isCancelled && (
          <View style={styles.statusNoticeBox}>
            <Ionicons name="information-circle-outline" size={18} color="#B91C1C" />
            <Text style={styles.statusNoticeText}>
              {currentStatus === 'Chờ xác nhận' &&
                (language === 'vi'
                  ? 'Cửa hàng đã nhận đơn và đang chuẩn bị đóng gói sách.'
                  : 'Store has received your order and is packing books.')}
              {currentStatus === 'Đang vận chuyển' &&
                (language === 'vi'
                  ? 'Đơn hàng đang trên đường giao tới địa chỉ của bạn.'
                  : 'Your order is currently on its way to your address.')}
              {currentStatus === 'Hoàn thành' &&
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
