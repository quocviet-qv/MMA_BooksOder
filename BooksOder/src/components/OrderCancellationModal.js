import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL, apiFetch } from '../constants/api';
import { cancellationReasonCodes } from '../constants/cancellation';
import { useLanguage } from '../context/LanguageContext';

// A dedicated full-screen page that works with both navigation entry points.
export default function OrderCancellationModal({ order, onClose, onCancelled }) {
  const { t, language } = useLanguage();
  const [reasonCode, setReasonCode] = useState('');
  const [reasonDetail, setReasonDetail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cancelledOrder, setCancelledOrder] = useState(null);
  const inFlight = useRef(false);
  const requiredDetails = reasonCode === 'other';
  const close = () => { if (!inFlight.current) onClose(); };
  const submit = async () => {
    if (inFlight.current || cancelledOrder) return;
    if (!reasonCode) { setError(t('cancellation.required')); return; }
    if (requiredDetails && reasonDetail.trim().length < 5) { setError(t('cancellation.invalidDetails')); return; }
    inFlight.current = true;
    setSubmitting(true);
    setError('');
    try {
      const response = await apiFetch(`${API_URL}/orders/${order._id}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reasonCode, reasonDetail: reasonDetail.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || t('cancellation.failed'));
      setCancelledOrder(data.order);
      onCancelled(data.order);
    } catch (failure) {
      setError(failure instanceof TypeError ? t('cancellation.networkError') : failure.message || t('cancellation.failed'));
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };
  return <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={close}>
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={s.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.header}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={t('cancellation.close')} disabled={submitting} onPress={close} style={s.back}>
            <Ionicons name="arrow-back" size={23} color="#0F172A" />
          </TouchableOpacity>
          <Text accessibilityRole="header" style={s.headerTitle}>{t('cancellation.title')}</Text>
        </View>
        {cancelledOrder ? <ScrollView contentContainerStyle={s.content}>
          <View accessibilityRole="alert" style={s.success}>
            <Ionicons name="checkmark-circle" size={66} color="#059669" />
            <Text style={s.title}>{t('cancellation.successTitle')}</Text>
            <Text style={s.subtitle}>{t('cancellation.successMessage')}</Text>
            <Text style={s.orderCode}>#{order._id.slice(-6).toUpperCase()}</Text>
            <Text style={s.savedReason}>{t(`cancellation.${cancelledOrder.cancellationReasonCode}`)}</Text>
            {!!cancelledOrder.cancellationDetails && <Text style={s.subtitle}>{cancelledOrder.cancellationDetails}</Text>}
            {cancelledOrder.paymentStatus === 'refund_pending' && <Text style={s.refund}>{t('cancellation.refundPending')}</Text>}
          </View>
          <TouchableOpacity accessibilityRole="button" style={s.primary} onPress={close}><Text style={s.primaryText}>{t('cancellation.done')}</Text></TouchableOpacity>
        </ScrollView> : <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
          <View style={s.orderSummary}>
            <Ionicons name="receipt-outline" size={25} color="#B91C1C" />
            <View style={{ flex: 1 }}><Text style={s.orderCode}>{t('cancellation.orderLabel')} #{order._id.slice(-6).toUpperCase()}</Text><Text style={s.subtitle}>{(order.totalAmount || 0).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')} đ</Text></View>
          </View>
          <Text style={s.title}>{t('cancellation.chooseReason')}</Text>
          <Text style={s.subtitle}>{t('cancellation.subtitle')}</Text>
          <View accessibilityRole="radiogroup" accessibilityLabel={t('cancellation.chooseReason')} style={s.reasons}>
            {cancellationReasonCodes.map(code => <TouchableOpacity key={code} accessibilityRole="radio" accessibilityState={{ checked: reasonCode === code, disabled: submitting }} disabled={submitting} onPress={() => { setReasonCode(code); setError(''); }} style={[s.reason, reasonCode === code && s.selected]}>
              <Ionicons name={reasonCode === code ? 'radio-button-on' : 'radio-button-off'} size={23} color={reasonCode === code ? '#B91C1C' : '#94A3B8'} />
              <Text style={s.reasonText}>{t(`cancellation.${code}`)}</Text>
            </TouchableOpacity>)}
          </View>
          <Text style={s.label}>{t(requiredDetails ? 'cancellation.detailsLabel' : 'cancellation.optionalDetails')}{requiredDetails ? ' *' : ''}</Text>
          <TextInput accessibilityLabel={t(requiredDetails ? 'cancellation.detailsLabel' : 'cancellation.optionalDetails')} editable={!submitting} value={reasonDetail} onChangeText={value => { setReasonDetail(value); setError(''); }} placeholder={t('cancellation.placeholder')} placeholderTextColor="#94A3B8" multiline maxLength={500} textAlignVertical="top" style={s.input} />
          <Text style={s.counter}>{reasonDetail.length}/500</Text>
          {!!error && <View accessibilityRole="alert" style={s.error}><Text style={s.errorText}>{error}</Text></View>}
          <View style={s.warning}><Ionicons name="information-circle-outline" size={22} color="#B45309" /><View style={{ flex: 1 }}><Text style={s.warningText}>{t('cancellation.warning')}</Text>{order.paymentStatus === 'paid' && <Text style={[s.warningText, { marginTop: 8 }]}>{t('cancellation.refundWarning')}</Text>}</View></View>
          <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: submitting }} disabled={submitting} onPress={submit} style={[s.primary, submitting && { opacity: 0.6 }]}>{submitting ? <View style={s.busy}><ActivityIndicator color="#FFF" /><Text style={s.primaryText}>{t('cancellation.submitting')}</Text></View> : <Text style={s.primaryText}>{t('cancellation.confirm')}</Text>}</TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" disabled={submitting} onPress={close} style={s.secondary}><Text style={s.secondaryText}>{t('cancellation.keepOrder')}</Text></TouchableOpacity>
        </ScrollView>}
      </KeyboardAvoidingView>
    </SafeAreaView>
  </Modal>;
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F9FA' }, page: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  back: { padding: 7 }, headerTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', flex: 1 },
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', padding: 20, paddingBottom: 40 },
  orderSummary: { flexDirection: 'row', gap: 14, alignItems: 'center', padding: 16, backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 24 },
  orderCode: { color: '#0F172A', fontWeight: '700', fontSize: 15 },
  title: { color: '#0F172A', fontSize: 22, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: '#64748B', fontSize: 14, lineHeight: 22, marginTop: 4 },
  reasons: { marginTop: 22, marginBottom: 20, gap: 10 },
  reason: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFF', borderRadius: 12 },
  selected: { backgroundColor: '#FFF1F2', borderColor: '#B91C1C' },
  reasonText: { flex: 1, color: '#334155', lineHeight: 22, fontSize: 14 },
  label: { color: '#334155', fontWeight: '600', marginBottom: 10 },
  input: { minHeight: 110, borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#FFF', borderRadius: 12, padding: 14, color: '#0F172A', fontSize: 14, lineHeight: 22 },
  counter: { textAlign: 'right', color: '#64748B', fontSize: 12, marginTop: 6 },
  warning: { flexDirection: 'row', gap: 10, padding: 14, backgroundColor: '#FFFBEB', borderRadius: 12, marginVertical: 18 }, warningText: { color: '#92400E', lineHeight: 21, fontSize: 13 },
  primary: { padding: 16, backgroundColor: '#B91C1C', borderRadius: 12, alignItems: 'center' }, primaryText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  secondary: { padding: 16, alignItems: 'center', marginTop: 8 }, secondaryText: { color: '#475569', fontWeight: '600' },
  error: { backgroundColor: '#FEE2E2', borderRadius: 10, padding: 14, marginTop: 12 }, errorText: { color: '#991B1B', lineHeight: 22 },
  busy: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  success: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1FAE5', borderRadius: 18, padding: 26, alignItems: 'center', gap: 14, marginVertical: 24 },
  savedReason: { color: '#334155', lineHeight: 22, fontWeight: '600' }, refund: { color: '#92400E', backgroundColor: '#FFFBEB', padding: 14, borderRadius: 8, lineHeight: 22 },
});
