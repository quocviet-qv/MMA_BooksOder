import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  // --- Loading & Error ---
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
  centerText: {
    marginTop: 10,
    fontSize: 15,
    color: '#64748B',
  },
  backButton: {
    marginTop: 15,
    backgroundColor: '#B91C1C',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    shadowColor: '#B91C1C',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  // --- Card dùng chung ---
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginLeft: 8,
  },
  // --- Tiến trình trạng thái (Stepper / Timeline) ---
  timelineContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    position: 'relative',
  },
  timelineStep: {
    flex: 1,
    alignItems: 'center',
    zIndex: 2,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepCircleActive: {
    backgroundColor: '#B91C1C',
  },
  stepCircleCompleted: {
    backgroundColor: '#10B981',
  },
  stepCircleCancelled: {
    backgroundColor: '#EF4444',
  },
  stepLabel: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    fontWeight: '500',
  },
  stepLabelActive: {
    color: '#B91C1C',
    fontWeight: '700',
  },
  stepLabelCompleted: {
    color: '#10B981',
    fontWeight: '700',
  },
  stepLabelCancelled: {
    color: '#EF4444',
    fontWeight: '700',
  },
  timelineLine: {
    position: 'absolute',
    top: 27,
    left: '18%',
    right: '18%',
    height: 2,
    backgroundColor: '#E2E8F0',
    zIndex: 1,
  },
  timelineLineCompleted: {
    backgroundColor: '#10B981',
  },
  timelineLineHalf: {
    width: '50%',
    backgroundColor: '#B91C1C',
  },
  statusNoticeBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusNoticeText: {
    fontSize: 13,
    color: '#64748B',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  // --- Thông tin đơn hàng ---
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  addressText: {
    fontSize: 14,
    color: '#334155',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  // --- Danh sách sản phẩm ---
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemRowLast: {
    borderBottomWidth: 0,
  },
  itemCover: {
    width: 55,
    height: 78,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  itemBookName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 20,
  },
  itemAuthor: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  itemPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  itemQuantityText: {
    fontSize: 13,
    color: '#64748B',
  },
  itemTotalPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#B91C1C',
  },
  // --- Chi tiết thanh toán ---
  paymentSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  paymentSummaryLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  paymentSummaryValue: {
    fontSize: 14,
    color: '#0F172A',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  finalTotalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  finalTotalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#B91C1C',
  },
  // --- Nút hành động ---
  cancelOrderBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 20,
    paddingVertical: 14,
    marginTop: 8,
  },
  cancelOrderBtnText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 6,
  },
});
