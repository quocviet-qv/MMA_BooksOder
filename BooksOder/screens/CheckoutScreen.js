import React, { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_URL, apiFetch as fetch } from '../src/constants/api';
import { useAuth } from '../src/context/AuthContext';
import { useCart } from '../src/context/CartContext';
import { styles } from '../styles/CheckoutScreenStyles';
const money = n => `${(n || 0).toLocaleString('vi-VN')} đ`;
export default function CheckoutScreen({ navigation }) {
  const { userName } = useAuth();
  const { refreshCartCount } = useCart();
  const [form, setForm] = useState({ recipientName: userName || '', phone: '', address: '', note: '' });
  const [method, setMethod] = useState('COD');
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const submitting = useRef(false);
  const [completed, setCompleted] = useState(false);
  const [checkoutKey] = useState(() => `checkout-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const load = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/checkout/summary`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setSummary(data);
      setError('');
    } catch (e) { setError(e.message || 'Không thể tải giỏ hàng'); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const pay = async () => {
    if (submitting.current || completed) return;
    if (form.recipientName.trim().length < 2 || !/^(0\d{9}|\+84\d{9})$/.test(form.phone.replace(/[\s.-]/g, '')) || form.address.trim().length < 10) {
      setError('Nhập họ tên, số điện thoại Việt Nam hợp lệ và địa chỉ chi tiết (ít nhất 10 ký tự).'); return;
    }
    submitting.current = true;
    setProcessing(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/checkout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, paymentMethod: method, checkoutKey }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Không thể đặt hàng');
      setCompleted(true);
      await refreshCartCount();
      Alert.alert('Đặt hàng thành công', method === 'COD' ? 'Bạn sẽ thanh toán khi nhận sách.' : 'Đơn hàng đang chờ xác nhận chuyển khoản. Bản kiểm thử không thu tiền thật.', [{ text: 'Xem đơn hàng', onPress: () => navigation.navigate('OrderDetail', { orderId: data.order._id }) }]);
    } catch (e) { setError(e.message || 'Không thể kết nối máy chủ'); }
    finally { setProcessing(false); submitting.current = false; }
  };
  return <ScrollView style={{ flex: 1, backgroundColor: '#F8F9FA' }} contentContainerStyle={{ padding: 20, width: '100%', maxWidth: 900, alignSelf: 'center', paddingBottom: 50 }} keyboardShouldPersistTaps="handled">
    <Text style={styles.title}>Hoàn tất đơn hàng</Text>
    <Text style={{ color: '#64748B', marginBottom: 20 }}>Giỏ hàng → Giao hàng & thanh toán → Nhận sách</Text>
    {error ? <View accessibilityRole="alert" style={{ backgroundColor: '#FEE2E2', padding: 16, borderRadius: 12, marginBottom: 16 }}><Text style={{ color: '#991B1B' }}>{error}</Text><TouchableOpacity onPress={load}><Text style={{ color: '#991B1B', marginTop: 8 }}>Tải lại giỏ hàng</Text></TouchableOpacity></View> : null}
    <View style={styles.card}><Text style={styles.label}>1. Thông tin nhận sách</Text>
      {[['recipientName', 'Họ và tên', 'Nguyễn Văn An'], ['phone', 'Số điện thoại', '09xxxxxxxx'], ['address', 'Địa chỉ giao hàng', 'Số nhà, đường, phường/xã, tỉnh/thành phố'], ['note', 'Ghi chú (không bắt buộc)', 'Thời gian nhận hàng, lưu ý cho cửa hàng…']].map(([key, label, placeholder]) => <View key={key} style={{ marginTop: 14 }}><Text style={{ color: '#334155', marginBottom: 7 }}>{label}</Text><TextInput accessibilityLabel={label} style={[styles.input, { minHeight: key === 'address' || key === 'note' ? 75 : 46 }]} placeholder={placeholder} placeholderTextColor="#94A3B8" value={form[key]} onChangeText={value => setForm(prev => ({ ...prev, [key]: value }))} keyboardType={key === 'phone' ? 'phone-pad' : 'default'} multiline={key === 'address' || key === 'note'} maxLength={key === 'note' ? 1000 : key === 'address' ? 500 : 100} /></View>)}
    </View>
    <View style={styles.card}><Text style={styles.label}>2. Phương thức thanh toán</Text>
      {[['COD', 'Thanh toán khi nhận hàng', 'Thanh toán cho đơn vị vận chuyển khi nhận sách.', 'cash-outline'], ['BANK_TRANSFER', 'Chuyển khoản ngân hàng', 'Bản kiểm thử: không chuyển tiền thật. Admin xác nhận khoản thu thủ công.', 'card-outline']].map(([id, title, subtitle, icon]) => <TouchableOpacity key={id} accessibilityRole="radio" accessibilityState={{ checked: method === id }} onPress={() => setMethod(id)} style={{ flexDirection: 'row', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: method === id ? '#B91C1C' : '#E2E8F0', backgroundColor: method === id ? '#FFF1F2' : '#FFF', marginTop: 10, gap: 12 }}><Ionicons name={icon} size={24} color="#B91C1C" /><View style={{ flex: 1 }}><Text style={{ fontWeight: '700', color: '#0F172A' }}>{title}</Text><Text style={{ color: '#64748B', marginTop: 5, lineHeight: 21 }}>{subtitle}</Text></View><Ionicons name={method === id ? 'radio-button-on' : 'radio-button-off'} size={22} color="#B91C1C" /></TouchableOpacity>)}
    </View>
    <View style={styles.card}><Text style={styles.label}>3. Kiểm tra đơn hàng</Text>
      {!summary ? <ActivityIndicator color="#B91C1C" /> : <>
        {summary.items.map(item => <View key={item._id} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginVertical: 10 }}><Image source={{ uri: item.bookId.coverImage }} style={{ width: 42, height: 60, borderRadius: 4 }} /><View style={{ flex: 1 }}><Text style={{ fontWeight: '600' }}>{item.bookId.bookName}</Text><Text style={{ color: '#64748B', marginTop: 5 }}>SL: {item.quantity}</Text></View><Text>{money(item.quantity * item.bookId.price)}</Text></View>)}
        {!summary.items.length && <Text>Giỏ hàng đang trống.</Text>}
        <View style={[styles.totalRow, { marginTop: 16 }]}><Text style={styles.totalLabel}>Tạm tính</Text><Text>{money(summary.subtotal)}</Text></View>
        <View style={[styles.totalRow, { marginVertical: 14 }]}><Text style={styles.totalLabel}>Phí vận chuyển</Text><Text>{summary.shippingFee ? money(summary.shippingFee) : 'Miễn phí'}</Text></View>
        <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 18 }}>Miễn phí giao hàng cho đơn từ 300.000 đ. Đơn còn lại: 25.000 đ.</Text>
        <View style={styles.totalRow}><Text style={{ fontWeight: '700' }}>Tổng thanh toán</Text><Text style={styles.totalPrice}>{money(summary.totalAmount)}</Text></View>
      </>}
    </View>
    <TouchableOpacity accessibilityRole="button" style={[styles.checkoutBtn, (!summary?.items.length || processing || completed) && { opacity: 0.5 }]} onPress={pay} disabled={!summary?.items.length || processing || completed}>{processing ? <ActivityIndicator color="#FFF" /> : <Text style={styles.checkoutBtnText}>{completed ? 'ĐÃ ĐẶT HÀNG' : 'XÁC NHẬN ĐẶT HÀNG'}</Text>}</TouchableOpacity>
  </ScrollView>;
}
