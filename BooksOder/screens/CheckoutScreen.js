import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { API_URL, apiFetch as fetch } from '../src/constants/api';
import { useAuth } from '../src/context/AuthContext';
import { useCart } from '../src/context/CartContext';
import { useLanguage } from '../src/context/LanguageContext';
import { styles } from '../styles/CheckoutScreenStyles';

const money = (n) => `${(n || 0).toLocaleString('vi-VN')} đ`;

export default function CheckoutScreen({ navigation }) {
  const { userName } = useAuth();
  const { refreshCartCount } = useCart();
  const { language, t } = useLanguage();

  const [form, setForm] = useState({
    recipientName: userName || '',
    phone: '',
    address: '',
    note: '',
  });
  const [method, setMethod] = useState('COD');
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const submitting = useRef(false);
  const [completed, setCompleted] = useState(false);
  const [checkoutKey] = useState(
    () => `checkout-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );

  // Vouchers state
  const [appliedVoucher, setAppliedVoucher] = useState('');
  const [customVoucherInput, setCustomVoucherInput] = useState('');

  const load = useCallback(
    async (voucherCode = appliedVoucher) => {
      try {
        const query = voucherCode ? `?voucherCode=${encodeURIComponent(voucherCode)}` : '';
        const response = await fetch(`${API_URL}/checkout/summary${query}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        setSummary(data);
        if (data.voucherCode) {
          setAppliedVoucher(data.voucherCode);
        } else if (voucherCode && !data.discountAmount) {
          Alert.alert(
            language === 'vi' ? 'Không đủ điều kiện' : 'Voucher Not Eligible',
            language === 'vi'
              ? 'Đơn hàng chưa đạt giá trị tối thiểu để áp dụng mã giảm giá này.'
              : 'Your order does not meet the minimum spend for this voucher.'
          );
          setAppliedVoucher('');
        }
        setError('');
      } catch (e) {
        setError(e.message || (language === 'vi' ? 'Không thể tải giỏ hàng' : 'Could not load cart'));
      }
    },
    [appliedVoucher, language]
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleApplyVoucher = (code) => {
    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode) return;
    setAppliedVoucher(cleanCode);
    load(cleanCode);
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher('');
    setCustomVoucherInput('');
    load('');
  };

  const pay = async () => {
    if (submitting.current || completed) return;
    if (
      form.recipientName.trim().length < 2 ||
      !/^(0\d{9}|\+84\d{9})$/.test(form.phone.replace(/[\s.-]/g, '')) ||
      form.address.trim().length < 10
    ) {
      setError(
        language === 'vi'
          ? 'Nhập họ tên, số điện thoại Việt Nam hợp lệ và địa chỉ chi tiết (ít nhất 10 ký tự).'
          : 'Please enter valid recipient name, phone number, and detailed address (min 10 chars).'
      );
      return;
    }

    submitting.current = true;
    setProcessing(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          paymentMethod: method,
          checkoutKey,
          voucherCode: appliedVoucher,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || (language === 'vi' ? 'Không thể đặt hàng' : 'Order failed'));

      setCompleted(true);
      await refreshCartCount();

      Alert.alert(
        language === 'vi' ? 'Đặt hàng thành công 🎉' : 'Order Placed Successfully 🎉',
        method === 'COD'
          ? language === 'vi'
            ? 'Bạn sẽ thanh toán tiền mặt khi nhận sách.'
            : 'You will pay cash upon receiving your books.'
          : language === 'vi'
          ? 'Đơn hàng đang chờ xác nhận chuyển khoản. Bản kiểm thử không thu tiền thật.'
          : 'Awaiting bank transfer confirmation. Test version does not charge real money.',
        [
          {
            text: language === 'vi' ? 'Xem đơn hàng' : 'View Order',
            onPress: () => navigation.navigate('OrderDetail', { orderId: data.order._id }),
          },
        ]
      );
    } catch (e) {
      setError(e.message || (language === 'vi' ? 'Không thể kết nối máy chủ' : 'Cannot connect to server'));
    } finally {
      setProcessing(false);
      submitting.current = false;
    }
  };

  const inputFields = [
    {
      key: 'recipientName',
      label: language === 'vi' ? 'Họ và tên' : 'Recipient Full Name',
      placeholder: language === 'vi' ? 'Nguyễn Văn An' : 'John Doe',
    },
    {
      key: 'phone',
      label: language === 'vi' ? 'Số điện thoại' : 'Phone Number',
      placeholder: '09xxxxxxxx',
    },
    {
      key: 'address',
      label: language === 'vi' ? 'Địa chỉ giao hàng' : 'Delivery Address',
      placeholder:
        language === 'vi'
          ? 'Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố'
          : 'Street address, ward, district, city',
    },
    {
      key: 'note',
      label: language === 'vi' ? 'Ghi chú (không bắt buộc)' : 'Order Note (Optional)',
      placeholder:
        language === 'vi'
          ? 'Thời gian nhận hàng, lưu ý cho nhân viên giao hàng…'
          : 'Delivery time preference, special notes for courier...',
    },
  ];

  const paymentMethods = [
    {
      id: 'COD',
      title: language === 'vi' ? 'Thanh toán khi nhận hàng (COD)' : 'Cash on Delivery (COD)',
      subtitle:
        language === 'vi'
          ? 'Thanh toán tiền mặt cho nhân viên giao hàng khi nhận sách.'
          : 'Pay with cash directly to the courier upon delivery.',
      icon: 'cash-outline',
    },
    {
      id: 'BANK_TRANSFER',
      title: language === 'vi' ? 'Chuyển khoản ngân hàng' : 'Bank Transfer',
      subtitle:
        language === 'vi'
          ? 'Bản kiểm thử: Không chuyển tiền thật. Admin xác nhận tự động.'
          : 'Test mode: No real money transferred. Admin confirms test order.',
      icon: 'card-outline',
    },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#F8F9FA' }}
      contentContainerStyle={{
        padding: 20,
        width: '100%',
        maxWidth: 900,
        alignSelf: 'center',
        paddingBottom: 60,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>
        {language === 'vi' ? 'Hoàn tất đơn hàng' : 'Complete Your Order'}
      </Text>
      <Text style={{ color: '#64748B', marginBottom: 20 }}>
        {language === 'vi'
          ? 'Giỏ hàng → Giao hàng & thanh toán → Nhận sách'
          : 'Cart → Shipping & Payment → Enjoy your books'}
      </Text>

      {error ? (
        <View
          accessibilityRole="alert"
          style={{
            backgroundColor: '#FEE2E2',
            padding: 16,
            borderRadius: 12,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: '#FCA5A5',
          }}
        >
          <Text style={{ color: '#991B1B', fontWeight: '600' }}>{error}</Text>
          <TouchableOpacity onPress={() => load()}>
            <Text style={{ color: '#B91C1C', marginTop: 8, fontWeight: '700' }}>
              {language === 'vi' ? 'Tải lại đơn hàng' : 'Reload order summary'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* 1. THÔNG TIN NHẬN SÁCH */}
      <View style={styles.card}>
        <Text style={styles.label}>
          {language === 'vi' ? '1. Thông tin người nhận' : '1. Recipient Information'}
        </Text>
        {inputFields.map(({ key, label, placeholder }) => (
          <View key={key} style={{ marginTop: 14 }}>
            <Text style={{ color: '#334155', marginBottom: 6, fontWeight: '600' }}>{label}</Text>
            <TextInput
              accessibilityLabel={label}
              style={[
                styles.input,
                { minHeight: key === 'address' || key === 'note' ? 75 : 46 },
              ]}
              placeholder={placeholder}
              placeholderTextColor="#94A3B8"
              value={form[key]}
              onChangeText={(value) => setForm((prev) => ({ ...prev, [key]: value }))}
              keyboardType={key === 'phone' ? 'phone-pad' : 'default'}
              multiline={key === 'address' || key === 'note'}
              maxLength={key === 'note' ? 1000 : key === 'address' ? 500 : 100}
            />
          </View>
        ))}
      </View>

      {/* 2. PHƯƠNG THỨC THANH TOÁN */}
      <View style={styles.card}>
        <Text style={styles.label}>
          {language === 'vi' ? '2. Phương thức thanh toán' : '2. Payment Method'}
        </Text>
        {paymentMethods.map(({ id, title, subtitle, icon }) => (
          <TouchableOpacity
            key={id}
            accessibilityRole="radio"
            accessibilityState={{ checked: method === id }}
            onPress={() => setMethod(id)}
            style={{
              flexDirection: 'row',
              padding: 16,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: method === id ? '#B91C1C' : '#E2E8F0',
              backgroundColor: method === id ? '#FFF1F2' : '#FFFFFF',
              marginTop: 10,
              gap: 12,
              alignItems: 'center',
            }}
          >
            <Ionicons name={icon} size={24} color="#B91C1C" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: '#0F172A', fontSize: 14 }}>{title}</Text>
              <Text style={{ color: '#64748B', marginTop: 4, lineHeight: 19, fontSize: 12 }}>
                {subtitle}
              </Text>
            </View>
            <Ionicons
              name={method === id ? 'radio-button-on' : 'radio-button-off'}
              size={22}
              color="#B91C1C"
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* 3. MÃ GIẢM GIÁ / VOUCHERS ƯU ĐÃI */}
      <View style={styles.voucherCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="pricetag" size={20} color="#B91C1C" />
            <Text style={styles.label}>
              {language === 'vi' ? '3. Khuyến mãi & Voucher' : '3. Vouchers & Discounts'}
            </Text>
          </View>
          {appliedVoucher ? (
            <TouchableOpacity onPress={handleRemoveVoucher}>
              <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '700' }}>
                {language === 'vi' ? 'Bỏ chọn' : 'Deselect'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Input nhập mã voucher tùy ý */}
        <View style={styles.voucherInputRow}>
          <TextInput
            style={styles.voucherInput}
            placeholder={language === 'vi' ? 'Nhập mã giảm giá...' : 'Enter voucher code...'}
            placeholderTextColor="#94A3B8"
            autoCapitalize="characters"
            value={customVoucherInput}
            onChangeText={setCustomVoucherInput}
          />
          <TouchableOpacity
            style={styles.applyVoucherBtn}
            activeOpacity={0.8}
            onPress={() => handleApplyVoucher(customVoucherInput)}
          >
            <Text style={styles.applyVoucherBtnText}>
              {language === 'vi' ? 'Áp dụng' : 'Apply'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Danh sách voucher có sẵn trong cửa hàng */}
        <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 8 }}>
          {language === 'vi' ? 'Mã ưu đãi dành cho bạn:' : 'Available vouchers for you:'}
        </Text>
        {(summary?.availableVouchers || [
          {
            code: 'GIAM10',
            name: 'Giảm 10% đơn hàng',
            description: 'Tối đa 50.000đ cho mọi đơn',
          },
          {
            code: 'FREESHIP',
            name: 'Miễn phí vận chuyển',
            description: 'Hỗ trợ 25.000đ phí giao hàng',
          },
          {
            code: 'BOOKWORM20',
            name: 'Mọt sách - Giảm 20K',
            description: 'Đơn từ 100.000đ',
          },
          {
            code: 'VIP50',
            name: 'Khách VIP - Giảm 50K',
            description: 'Đơn từ 250.000đ',
          },
        ]).map((v) => {
          const isSelected = appliedVoucher === v.code;
          return (
            <TouchableOpacity
              key={v.code}
              style={[styles.voucherItem, isSelected && styles.voucherItemActive]}
              activeOpacity={0.7}
              onPress={() => (isSelected ? handleRemoveVoucher() : handleApplyVoucher(v.code))}
            >
              <View style={styles.voucherItemLeft}>
                <View style={[styles.voucherIconWrap, isSelected && { backgroundColor: '#D1FAE5' }]}>
                  <Ionicons
                    name={isSelected ? 'checkmark-circle' : 'ticket-outline'}
                    size={20}
                    color={isSelected ? '#059669' : '#B91C1C'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.voucherCodeBadge}>
                    <Text style={styles.voucherCodeText}>{v.code}</Text>
                  </View>
                  <Text style={styles.voucherNameText}>{v.name}</Text>
                  <Text style={styles.voucherDescText}>{v.description}</Text>
                </View>
              </View>

              <View
                style={[
                  styles.selectVoucherBtn,
                  isSelected && styles.selectVoucherBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.selectVoucherBtnText,
                    isSelected && styles.selectVoucherBtnTextActive,
                  ]}
                >
                  {isSelected
                    ? language === 'vi'
                      ? 'Đã áp dụng ✓'
                      : 'Applied ✓'
                    : language === 'vi'
                    ? 'Chọn mã'
                    : 'Select'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 4. KIỂM TRA ĐƠN HÀNG */}
      <View style={styles.card}>
        <Text style={styles.label}>
          {language === 'vi' ? '4. Kiểm tra đơn hàng' : '4. Order Summary'}
        </Text>
        {!summary ? (
          <ActivityIndicator color="#B91C1C" />
        ) : (
          <>
            {summary.items.map((item) => (
              <View
                key={item._id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  marginVertical: 10,
                }}
              >
                <Image
                  source={{ uri: item.bookId.coverImage }}
                  style={{ width: 44, height: 62, borderRadius: 6 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700', color: '#0F172A', fontSize: 13 }}>
                    {item.bookId.bookName}
                  </Text>
                  <Text style={{ color: '#64748B', marginTop: 4, fontSize: 12 }}>
                    {language === 'vi' ? 'Số lượng' : 'Qty'}: {item.quantity}
                  </Text>
                </View>
                <Text style={{ fontWeight: '700', color: '#0F172A' }}>
                  {money(item.quantity * item.bookId.price)}
                </Text>
              </View>
            ))}

            {!summary.items.length && (
              <Text style={{ color: '#64748B' }}>
                {language === 'vi' ? 'Giỏ hàng đang trống.' : 'Cart is currently empty.'}
              </Text>
            )}

            <View style={[styles.totalRow, { marginTop: 16 }]}>
              <Text style={styles.totalLabel}>
                {language === 'vi' ? 'Tạm tính tiền hàng' : 'Items Subtotal'}
              </Text>
              <Text style={{ fontWeight: '600' }}>{money(summary.subtotal)}</Text>
            </View>

            <View style={[styles.totalRow, { marginVertical: 10 }]}>
              <Text style={styles.totalLabel}>
                {language === 'vi' ? 'Phí vận chuyển' : 'Shipping Fee'}
              </Text>
              <Text style={{ fontWeight: '600' }}>
                {summary.shippingFee ? money(summary.shippingFee) : (language === 'vi' ? 'Miễn phí' : 'Free')}
              </Text>
            </View>

            {/* Hiển thị dòng giảm giá Voucher nếu có */}
            {summary.discountAmount > 0 ? (
              <View style={styles.discountRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="pricetag" size={16} color="#059669" />
                  <Text style={styles.discountLabel}>
                    {language === 'vi' ? `Giảm giá Voucher (${summary.voucherCode}):` : `Voucher Discount (${summary.voucherCode}):`}
                  </Text>
                </View>
                <Text style={styles.discountPrice}>- {money(summary.discountAmount)}</Text>
              </View>
            ) : null}

            <Text style={{ fontSize: 11, color: '#64748B', marginVertical: 12 }}>
              {language === 'vi'
                ? '• Miễn phí giao hàng toàn quốc cho đơn từ 300.000 đ.'
                : '• Free nationwide shipping on orders over 300,000 VND.'}
            </Text>

            <View
              style={[
                styles.totalRow,
                { paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
              ]}
            >
              <Text style={{ fontWeight: '800', fontSize: 16, color: '#0F172A' }}>
                {language === 'vi' ? 'Tổng thanh toán' : 'Final Total'}
              </Text>
              <Text style={styles.totalPrice}>{money(summary.totalAmount)}</Text>
            </View>
          </>
        )}
      </View>

      {/* NÚT ĐẶT HÀNG */}
      <TouchableOpacity
        accessibilityRole="button"
        style={[
          styles.checkoutBtn,
          (!summary?.items.length || processing || completed) && { opacity: 0.5 },
        ]}
        onPress={pay}
        disabled={!summary?.items.length || processing || completed}
      >
        {processing ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.checkoutBtnText}>
            {completed
              ? language === 'vi'
                ? 'ĐÃ ĐẶT HÀNG THÀNH CÔNG'
                : 'ORDER COMPLETED'
              : language === 'vi'
              ? 'XÁC NHẬN ĐẶT HÀNG'
              : 'CONFIRM & PLACE ORDER'}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
