import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 15,
    paddingBottom: 15,
    backgroundColor: '#FAF7F2',
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  subtitle: {
    fontSize: 14,
    color: '#777',
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
    backgroundColor: '#EBE4DA',
    marginHorizontal: 4,
    alignSelf: 'center',
  },
  filterTabActive: {
    backgroundColor: '#C5532A',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
  },
  filterTabTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  // --- Loading ---
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#777',
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
    backgroundColor: '#EBE4DA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  emptyDesc: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20,
  },
  shopBtn: {
    backgroundColor: '#C5532A',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  shopBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  // --- Danh sách đơn hàng ---
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 25,
    paddingTop: 4,
  },
  orderCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ECE6DD',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0ECE4',
    paddingBottom: 10,
    marginBottom: 12,
  },
  orderCodeGroup: {
    flexDirection: 'column',
  },
  orderIdText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  orderDateText: {
    fontSize: 12,
    color: '#888',
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
    backgroundColor: '#FFF8E1',
    borderColor: '#FFE082',
  },
  badgeShipping: {
    backgroundColor: '#E3F2FD',
    borderColor: '#90CAF9',
  },
  badgeCompleted: {
    backgroundColor: '#E8F5E9',
    borderColor: '#A5D6A7',
  },
  badgeCancelled: {
    backgroundColor: '#FFEBEE',
    borderColor: '#FFCDD2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusPendingText: {
    color: '#F57C00',
  },
  statusShippingText: {
    color: '#1976D2',
  },
  statusCompletedText: {
    color: '#388E3C',
  },
  statusCancelledText: {
    color: '#D32F2F',
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
    borderRadius: 6,
    backgroundColor: '#EBE4DA',
  },
  bookInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  bookName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
    lineHeight: 18,
  },
  bookAuthor: {
    fontSize: 12,
    color: '#777',
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
    color: '#555',
  },
  bookPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E25842',
  },
  moreItemsText: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 2,
  },
  // --- Footer thẻ đơn hàng ---
  orderFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F0ECE4',
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
    color: '#666',
  },
  totalValue: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#E25842',
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
    borderColor: '#D32F2F',
    backgroundColor: '#FFF',
  },
  cancelBtnText: {
    color: '#D32F2F',
    fontSize: 13,
    fontWeight: '600',
  },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#C5532A',
  },
  detailBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
    marginRight: 4,
  },
});
