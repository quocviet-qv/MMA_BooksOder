import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2', justifyContent: 'center', padding: 25 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 10, textAlign: 'center', fontFamily: 'serif' },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 40 },
  inputContainer: { marginBottom: 20 },
  input: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#EAEAEA', fontSize: 16 },
  btn: { backgroundColor: '#C5532A', padding: 16, borderRadius: 25, alignItems: 'center', marginTop: 10, shadowColor: '#C5532A', shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  linkContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 25 },
  linkText: { color: '#666', fontSize: 15 },
  linkHighlight: { color: '#C5532A', fontSize: 15, fontWeight: 'bold', marginLeft: 5 }
});