import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { cancellationReasonCodes } from '../constants/cancellation';
import { useLanguage } from '../context/LanguageContext';
export default function CancellationNotice({ order }) {
  const { t, language } = useLanguage();
  if (order.status !== 'Đã hủy') return null;
  const reason = cancellationReasonCodes.includes(order.cancellationReasonCode)
    ? t(`cancellation.${order.cancellationReasonCode}`)
    : order.cancellationReason;
  const timestamp = order.cancelledAt ? new Date(order.cancelledAt) : null;
  return <View style={s.box}>
    <Text style={s.title}>{t(order.cancelledBy === 'customer' ? 'cancellation.customerCancelled' : order.cancelledBy === 'admin' ? 'cancellation.adminCancelled' : 'cancellation.cancelled')}</Text>
    {reason ? <Text style={s.text}>{t('cancellation.reasonLabel')}: {reason}</Text> : !order.cancelledBy && <Text style={s.text}>{t('cancellation.noReason')}</Text>}
    {!!order.cancellationDetails && <Text style={s.text}>{order.cancellationDetails}</Text>}
    {timestamp && !Number.isNaN(timestamp.getTime()) && <Text style={s.date}>{t('cancellation.cancelledAt')}: {timestamp.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}</Text>}
    {order.paymentStatus === 'refund_pending' && <Text style={s.text}>{t('cancellation.refundPending')}</Text>}
  </View>;
}
const s = StyleSheet.create({ box: { borderRadius: 12, padding: 16, marginVertical: 12, gap: 8, backgroundColor: '#FFF1F2', borderWidth: 1, borderColor: '#FECDD3' }, title: { color: '#991B1B', fontWeight: '700', fontSize: 15 }, text: { color: '#7F1D1D', lineHeight: 22 }, date: { color: '#64748B', fontSize: 12 } });
