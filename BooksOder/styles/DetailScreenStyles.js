import { Dimensions, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  scrollView: {
    flex: 1, // Chiếm toàn bộ phần trên để đẩy thanh bottomBar xuống đáy an toàn
  },
  scrollContent: {
    paddingBottom: 20,
  },
  imageContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  coverImage: {
    width: width * 0.55,
    height: width * 0.82,
    resizeMode: 'cover',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  infoContainer: {
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 25,
    paddingBottom: 30,
    minHeight: 420,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryBadge: {
    backgroundColor: '#EBE6DF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  categoryText: {
    color: '#4A4A4A',
    fontWeight: 'bold',
    fontSize: 12,
  },
  favIconBtn: {
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    fontFamily: 'serif',
    marginBottom: 6,
  },
  author: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  price: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#E25842',
    marginBottom: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#EAEAEA',
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
  },
  feedbackSection: {
    marginTop: 25,
    padding: 15,
    backgroundColor: '#FAF7F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EBE6DF',
  },
  feedbackText: {
    fontSize: 14,
    color: '#333',
  },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EAEAEA',
    alignItems: 'center',
  },
  favOutlineBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E25842',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addToCartBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#C5532A',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnIcon: {
    marginRight: 8,
  },
  addToCartText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  }
});