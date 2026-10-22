import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2', padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 20, fontFamily: 'serif' },
  card: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, marginBottom: 15, elevation: 2 },
  label: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  input: { backgroundColor: '#F5F5F5', padding: 12, borderRadius: 8, fontSize: 15, minHeight: 80, textAlignVertical: 'top' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 16, color: '#666' },
  totalPrice: { fontSize: 20, fontWeight: 'bold', color: '#E25842' },
  checkoutBtn: { backgroundColor: '#C5532A', padding: 15, borderRadius: 25, alignItems: 'center', marginTop: 10 },
  checkoutBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});