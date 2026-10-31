import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8F9FA' 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 50, 
    paddingBottom: 16,
    backgroundColor: '#FFFFFF', 
    borderBottomWidth: 1, 
    borderColor: '#E2E8F0' 
  },
  headerTitle: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: '#0F172A' 
  },
  logoutBtn: { 
    padding: 6 
  },
  addBtn: { 
    backgroundColor: '#B91C1C', 
    margin: 16, 
    padding: 15, 
    borderRadius: 16, 
    alignItems: 'center', 
    flexDirection: 'row', 
    justifyContent: 'center',
    shadowColor: '#B91C1C',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3
  },
  addBtnText: { 
    color: '#FFFFFF', 
    fontWeight: '700', 
    fontSize: 16, 
    marginLeft: 8 
  },
  listContainer: { 
    paddingHorizontal: 16, 
    paddingBottom: 24 
  },
  bookItem: { 
    flexDirection: 'row', 
    backgroundColor: '#FFFFFF', 
    padding: 12, 
    borderRadius: 16, 
    marginBottom: 12, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  bookImage: { 
    width: 64, 
    height: 90, 
    borderRadius: 8, 
    resizeMode: 'cover' 
  },
  bookInfo: { 
    flex: 1, 
    marginLeft: 14 
  },
  bookTitle: { 
    fontSize: 15, 
    fontWeight: '700', 
    color: '#0F172A', 
    marginBottom: 4 
  },
  bookPrice: { 
    fontSize: 14, 
    color: '#B91C1C', 
    fontWeight: '800' 
  },
  actionButtons: { 
    flexDirection: 'row' 
  },
  actionBtn: { 
    padding: 9, 
    marginLeft: 8, 
    backgroundColor: '#F8FAFC', 
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA'
  }
});