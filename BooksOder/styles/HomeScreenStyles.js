import { Dimensions, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    paddingHorizontal: 16, 
    paddingTop: 20 
  },
  logoutBtn: { 
    padding: 8, 
    backgroundColor: '#FFF', 
    borderRadius: 20, 
    elevation: 2, 
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 4 
  },
  greeting: { fontSize: 14, color: '#555', marginBottom: 4 },
  mainTitle: { fontSize: 28, fontWeight: 'bold', color: '#1A1A1A', fontFamily: 'serif' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 20, marginBottom: 16, borderRadius: 25, paddingHorizontal: 15, height: 50, borderWidth: 1, borderColor: '#EAEAEA' },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: '#000' },
  categoryList: { paddingLeft: 16, marginBottom: 15 },
  categoryBtn: { backgroundColor: '#EBE6DF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginRight: 10 },
  activeCategoryBtn: { backgroundColor: '#1C1917' },
  categoryText: { fontSize: 14, color: '#4A4A4A', fontWeight: '500' },
  activeCategoryText: { color: '#FFFFFF' },
  divider: { height: 6, backgroundColor: '#A3A3A3', marginHorizontal: 20, borderRadius: 3, marginVertical: 10 },
  sortSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 15 },
  bookCount: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A' },
  sortButtons: { flexDirection: 'row' },
  sortBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, marginLeft: 6, backgroundColor: '#EBE6DF' },
  activeSortBtn: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EBE6DF' },
  sortText: { fontSize: 12, color: '#555' },
  activeSortText: { color: '#000', fontWeight: 'bold' },
  row: { justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 16 },
  card: { width: CARD_WIDTH, backgroundColor: '#FFF', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#F0F0F0' },
  coverImage: { width: '100%', height: 220, resizeMode: 'cover' },
  discountBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: '#E25842', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  discountText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  favoriteBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: '#FFF', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  bookInfo: { padding: 10 },
  bookTitle: { fontSize: 14, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 4 },
  bookPrice: { fontSize: 14, color: '#E25842', fontWeight: '600' }
});