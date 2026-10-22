import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 20,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    fontFamily: 'serif',
  },
  // --- Style cho màn hình rỗng (Empty State) ---
  emptyContainer: {
    flex: 1,
    backgroundColor: '#FAF7F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: -50,
  },
  iconCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#EBE4DA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A',
    fontFamily: 'serif',
    marginBottom: 12,
  },
  emptyDesc: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 35,
    lineHeight: 22,
  },
  exploreBtn: {
    backgroundColor: '#C5532A',
    paddingVertical: 14,
    paddingHorizontal: 35,
    borderRadius: 25,
  },
  exploreBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // --- Style cho danh sách có sản phẩm ---
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  itemImage: {
    width: 70,
    height: 100,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  itemPrice: {
    fontSize: 16,
    color: '#E25842',
    fontWeight: '600',
  },
  removeBtn: {
    padding: 10,
  },
  footer: {
    backgroundColor: '#FFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#EAEAEA',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  totalLabel: {
    fontSize: 16,
    color: '#555',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E25842',
  },
  checkoutBtn: {
    backgroundColor: '#C5532A',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  checkoutBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  }
});