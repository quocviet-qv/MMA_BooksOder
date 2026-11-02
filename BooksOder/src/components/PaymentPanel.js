import React, { useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { API_URL, apiFetch as fetch } from '../constants/api';
import { useAuth } from '../context/AuthContext';
export const paymentLabels = { unpaid: 'Chưa thanh toán', pending: 'Chờ xác nhận chuyển khoản', paid: 'Đã thanh toán', refund_pending: 'Chờ hoàn tiền', refunded: 'Đã hoàn tiền' };
export default function PaymentPanel({ order, onUpdate, compact = false }) {
  const { userRole } = useAuth();
  const [busy, setBusy] = useState(false);
  const target = order.paymentStatus === 'refund_pending' ? 'refunded' : 'paid';
  const status = ({ 'Đã nhận hàng': 'Delivered', 'Đã giao': 'Delivered' })[order.status] || order.status;
  const isBankTransfer = order.paymentMethod === 'BANK_TRANSFER';
  const canConfirm = userRole === 'admin' && (
    target === 'refunded' ||
    (['unpaid', 'pending'].includes(order.paymentStatus) && (isBankTransfer || status === 'Delivered'))
  );
  const update = () => Alert.alert('Xác nhận thanh toán', target === 'refunded' ? 'Xác nhận cửa hàng đã hoàn tiền cho khách?' : 'Chỉ xác nhận khi cửa hàng đã nhận đủ tiền của đơn này.', [{ text: 'Quay lại', style: 'cancel' }, { text: 'Xác nhận', onPress: async () => {
    setBusy(true);
    try {
      const response = await fetch(`${API_URL}/orders/${order._id}/payment`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentStatus: target }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      Alert.alert('Thành công 🎉', target === 'refunded' ? 'Đã xác nhận hoàn tiền thành công.' : 'Đã xác nhận thanh toán thành công.');
      onUpdate?.(data.order);
    } catch (error) { Alert.alert('Không thể cập nhật', error.message); }
    finally { setBusy(false); }
  } }]);
  if (compact) {
    const isPaid = order.paymentStatus === 'paid';
    const isPendingRefund = order.paymentStatus === 'refund_pending';
    const isPendingTransfer = order.paymentStatus === 'pending';
    const badgeColor = isPaid ? '#047857' : isPendingRefund || isPendingTransfer ? '#D97706' : '#64748B';
    const badgeBg = isPaid ? '#ECFDF5' : isPendingRefund || isPendingTransfer ? '#FFFBEB' : '#F8FAFC';
    const badgeBorder = isPaid ? '#A7F3D0' : isPendingRefund || isPendingTransfer ? '#FDE68A' : '#E2E8F0';

    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 7, paddingHorizontal: 10, backgroundColor: '#F8FAFC', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', marginVertical: 6, flexWrap: 'wrap', gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ backgroundColor: '#EDE9FE', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#6D28D9' }}>
              💳 {order.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản' : 'COD'}
            </Text>
          </View>
          <View style={{ backgroundColor: badgeBg, borderColor: badgeBorder, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: badgeColor }}>
              {paymentLabels[order.paymentStatus] || 'Chưa xác nhận'}
            </Text>
          </View>
        </View>
        {canConfirm && (
          <TouchableOpacity disabled={busy} onPress={update} accessibilityRole="button" style={{ backgroundColor: '#047857', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 6, opacity: busy ? 0.5 : 1 }}>
            <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 11 }}>
              {busy ? 'Đang lưu…' : target === 'refunded' ? 'Xác nhận hoàn tiền' : 'Xác nhận đã thu tiền'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={{ padding: 14, borderRadius: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', gap: 8, marginVertical: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontWeight: '700', color: '#0F172A', fontSize: 14 }}>
          Phương thức: {order.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản' : 'Thanh toán khi nhận hàng (COD)'}
        </Text>
        <Text style={{ color: order.paymentStatus === 'paid' ? '#047857' : '#D97706', fontWeight: '700', fontSize: 12 }}>
          {paymentLabels[order.paymentStatus] || 'Chưa xác nhận'}
        </Text>
      </View>
      <Text style={{ color: '#475569', fontSize: 13 }}>Người nhận: {order.recipientName || 'Chưa cập nhật'} · {order.phone || ''}</Text>
      <Text style={{ color: '#64748B', fontSize: 12 }}>Tạm tính: {(order.subtotal ?? order.totalAmount ?? 0).toLocaleString('vi-VN')} đ · Vận chuyển: {(order.shippingFee || 0).toLocaleString('vi-VN')} đ</Text>
      {order.note ? <Text style={{ color: '#64748B', fontSize: 12 }}>Ghi chú: {order.note}</Text> : null}
      {order.paidAt ? <Text style={{ color: '#047857', fontSize: 12 }}>Đã thu: {new Date(order.paidAt).toLocaleString('vi-VN')}</Text> : null}
      {canConfirm && (
        <TouchableOpacity disabled={busy} onPress={update} accessibilityRole="button" style={{ backgroundColor: '#047857', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, alignSelf: 'flex-start', marginTop: 4, opacity: busy ? 0.5 : 1 }}>
          <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 13 }}>
            {busy ? 'Đang lưu…' : target === 'refunded' ? 'Xác nhận đã hoàn tiền' : 'Xác nhận đã thu tiền'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
