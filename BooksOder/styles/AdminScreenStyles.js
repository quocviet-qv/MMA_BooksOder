import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FAF7F2' 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 50, 
    paddingBottom: 15,
    backgroundColor: '#FFF', 
    borderBottomWidth: 1, 
    borderColor: '#EAEAEA' 
  },
  headerTitle: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#1A1A1A' 
  },
  logoutBtn: { 
    padding: 5 
  },
  addBtn: { 
    backgroundColor: '#C5532A', 
    margin: 16, 
    padding: 15, 
    borderRadius: 10, 
    alignItems: 'center', 
    flexDirection: 'row', 
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  addBtnText: { 
    color: '#FFF', 
    fontWeight: 'bold', 
    fontSize: 16, 
    marginLeft: 8 
  },
  listContainer: { 
    paddingHorizontal: 16, 
    paddingBottom: 20 
  },
  bookItem: { 
    flexDirection: 'row', 
    backgroundColor: '#FFF', 
    padding: 12, 
    borderRadius: 10, 
    marginBottom: 15, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#EAEAEA' 
  },
  bookImage: { 
    width: 60, 
    height: 90, 
    borderRadius: 5, 
    resizeMode: 'cover' 
  },
  bookInfo: { 
    flex: 1, 
    marginLeft: 15 
  },
  bookTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#1A1A1A', 
    marginBottom: 5 
  },
  bookPrice: { 
    fontSize: 14, 
    color: '#E25842', 
    fontWeight: '600' 
  },
  actionButtons: { 
    flexDirection: 'row' 
  },
  actionBtn: { 
    padding: 10, 
    marginLeft: 8, 
    backgroundColor: '#FAF7F2', 
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EAEAEA'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});