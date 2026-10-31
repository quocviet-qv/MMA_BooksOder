import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
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
    backgroundColor: '#FAF7F2',
  },
  centerText: {
    marginTop: 10,
    fontSize: 15,
    color: '#666',
  },
  backButton: {
    marginTop: 15,
    backgroundColor: '#C5532A',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  // --- Card dùng chung ---
  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ECE6DD',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
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
    backgroundColor: '#EBE4DA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepCircleActive: {
    backgroundColor: '#C5532A',
  },
  stepCircleCompleted: {
    backgroundColor: '#388E3C',
  },
  stepCircleCancelled: {
    backgroundColor: '#D32F2F',
  },
  stepLabel: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
    fontWeight: '500',
  },
  stepLabelActive: {
    color: '#C5532A',
    fontWeight: 'bold',
  },
  stepLabelCompleted: {
    color: '#388E3C',
    fontWeight: 'bold',
  },
  stepLabelCancelled: {
    color: '#D32F2F',
    fontWeight: 'bold',
  },
  timelineLine: {
    position: 'absolute',
    top: 27,
    left: '18%',
    right: '18%',
    height: 2,
    backgroundColor: '#E0D8CE',
    zIndex: 1,
  },
  timelineLineCompleted: {
    backgroundColor: '#388E3C',
  },
  timelineLineHalf: {
    width: '50%',
    backgroundColor: '#C5532A',
  },
  statusNoticeBox: {
    backgroundColor: '#F9F5F0',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusNoticeText: {
    fontSize: 13,
    color: '#666',
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
    color: '#777',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FBF9F6',
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
  },
  addressText: {
    fontSize: 14,
    color: '#333',
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
    borderBottomColor: '#F5F1EB',
  },
  itemRowLast: {
    borderBottomWidth: 0,
  },
  itemCover: {
    width: 55,
    height: 78,
    borderRadius: 6,
    backgroundColor: '#EBE4DA',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  itemBookName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    lineHeight: 20,
  },
  itemAuthor: {
    fontSize: 12,
    color: '#888',
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
    color: '#666',
  },
  itemTotalPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E25842',
  },
  // --- Chi tiết thanh toán ---
  paymentSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  paymentSummaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  paymentSummaryValue: {
    fontSize: 14,
    color: '#222',
  },
  divider: {
    height: 1,
    backgroundColor: '#ECE6DD',
    marginVertical: 8,
  },
  finalTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  finalTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E25842',
  },
  // --- Nút hành động ---
  cancelOrderBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D32F2F',
    borderRadius: 25,
    paddingVertical: 14,
    marginTop: 8,
  },
  cancelOrderBtnText: {
    color: '#D32F2F',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 6,
  },
});
