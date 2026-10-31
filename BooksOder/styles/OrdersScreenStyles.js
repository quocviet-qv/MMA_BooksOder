import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 36 : 16,
    paddingBottom: 16,
    backgroundColor: '#F8F9FA',
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  // --- Filter Tabs ngang ---
  filterContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    maxHeight: 48,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginHorizontal: 4,
    alignSelf: 'center',
  },
  filterTabActive: {
    backgroundColor: '#B91C1C',
    borderColor: '#B91C1C',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  // --- Loading ---
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#64748B',
  },
  // --- Empty State ---
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FED7AA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  shopBtn: {
    backgroundColor: '#B91C1C',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 20,
    shadowColor: '#B91C1C',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  shopBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  // --- Danh sách đơn hàng ---
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 25,
    paddingTop: 4,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
    marginBottom: 12,
  },
  orderCodeGroup: {
    flexDirection: 'column',
  },
  orderIdText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  orderDateText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  // --- Badge trạng thái ---
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgePending: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  badgeShipping: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  badgeCompleted: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  badgeCancelled: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusPendingText: {
    color: '#D97706',
  },
  statusShippingText: {
    color: '#2563EB',
  },
  statusCompletedText: {
    color: '#059669',
  },
  statusCancelledText: {
    color: '#DC2626',
  },
  // --- Sản phẩm trong đơn ---
  itemsList: {
    marginBottom: 12,
  },
  bookItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  bookCover: {
    width: 48,
    height: 68,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  bookInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  bookName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 18,
  },
  bookAuthor: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  bookMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  bookQuantity: {
    fontSize: 13,
    color: '#64748B',
  },
  bookPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#B91C1C',
  },
  moreItemsText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 2,
  },
  // --- Footer thẻ đơn hàng ---
  orderFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  totalValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#B91C1C',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
  },
  cancelBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EF4444',
    backgroundColor: '#FFFFFF',
  },
  cancelBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#B91C1C',
    shadowColor: '#B91C1C',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  detailBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginRight: 4,
  },
});
