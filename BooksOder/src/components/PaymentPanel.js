import React, { useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { API_URL, apiFetch as fetch } from '../constants/api';
import { useAuth } from '../context/AuthContext';
export const paymentLabels = { unpaid: 'Chưa thanh toán', pending: 'Chờ xác nhận chuyển khoản', paid: 'Đã thanh toán', refund_pending: 'Chờ hoàn tiền', refunded: 'Đã hoàn tiền' };
export default function PaymentPanel({ order, onUpdate, compact = false }) {
  const { userRole } = useAuth();
  const [busy, setBusy] = useState(false);
  const target = order.paymentStatus === 'refund_pending' ? 'refunded' : 'paid';
  const canConfirm = userRole === 'admin' && (target === 'refunded' || ['unpaid', 'pending'].includes(order.paymentStatus) && order.status !== 'Đã hủy');
  const update = () => Alert.alert('Xác nhận thanh toán', target === 'refunded' ? 'Xác nhận cửa hàng đã hoàn tiền cho khách?' : 'Chỉ xác nhận khi cửa hàng đã nhận đủ tiền của đơn này.', [{ text: 'Quay lại', style: 'cancel' }, { text: 'Xác nhận', onPress: async () => {
    setBusy(true);
    try {
      const response = await fetch(`${API_URL}/orders/${order._id}/payment`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentStatus: target }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      onUpdate?.(data.order);
    } catch (error) { Alert.alert('Không thể cập nhật', error.message); }
    finally { setBusy(false); }
  } }]);
  return <View style={{ padding: 16, borderRadius: 12, backgroundColor: '#F8FAFC', gap: 9, marginVertical: 12 }}>
    <Text style={{ fontWeight: '700', color: '#0F172A' }}>Thanh toán · {order.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản' : 'COD'}</Text>
    <Text style={{ color: order.paymentStatus === 'paid' ? '#047857' : '#9A3412' }}>{paymentLabels[order.paymentStatus] || 'Chưa xác nhận'}</Text>
    {!compact && <><Text>Người nhận: {order.recipientName || 'Chưa cập nhật'} · {order.phone || ''}</Text><Text>Tạm tính: {(order.subtotal ?? order.totalAmount ?? 0).toLocaleString('vi-VN')} đ · Vận chuyển: {(order.shippingFee || 0).toLocaleString('vi-VN')} đ</Text>{order.note ? <Text>Ghi chú: {order.note}</Text> : null}{order.paidAt ? <Text>Đã thu: {new Date(order.paidAt).toLocaleString('vi-VN')}</Text> : null}</>}
    {canConfirm && <TouchableOpacity disabled={busy} onPress={update} accessibilityRole="button" style={{ backgroundColor: '#047857', padding: 12, borderRadius: 8, alignSelf: 'flex-start', opacity: busy ? 0.5 : 1 }}><Text style={{ color: '#FFF', fontWeight: '700' }}>{busy ? 'Đang lưu…' : target === 'refunded' ? 'Xác nhận đã hoàn tiền' : 'Xác nhận đã thu tiền'}</Text></TouchableOpacity>}
  </View>;
}
