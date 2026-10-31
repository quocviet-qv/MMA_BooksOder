import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { API_URL, getCurrentUserId } from '../src/constants/api';
import { styles } from '../styles/DetailScreenStyles';

const STAR_MOODS = {
  1: 'Rất tệ 😡',
  2: 'Tệ 🙁',
  3: 'Bình thường 😐',
  4: 'Hài lòng 🙂',
  5: 'Tuyệt vời / Rất hài lòng 🌟'
};

export default function DetailScreen({ route, navigation }) {
  const { book } = route.params;
  const bookId = (book.id || book._id).toString();

  const [isAdding, setIsAdding] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [loadingFav, setLoadingFav] = useState(true);
  const [userId, setUserId] = useState('user123');

  // Trạng thái cho Hệ thống Đánh giá & Bình luận
  const [reviews, setReviews] = useState([]);
  const [totalReviews, setTotalReviews] = useState(book.totalReviews || 0);
  const [averageRating, setAverageRating] = useState(book.averageRating || 0);
  const [ratingCounts, setRatingCounts] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [loadingReviews, setLoadingReviews] = useState(true);

  // Trạng thái cho Modal gửi đánh giá
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRating, setSelectedRating] = useState(5);
  const [commentText, setCommentText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    initScreenData();
  }, [bookId]);

  const initScreenData = async () => {
    const uid = await getCurrentUserId();
    setUserId(uid);
    checkFavoriteStatus(uid);
    fetchReviews();
  };

  const checkFavoriteStatus = async (uid) => {
    try {
      const response = await fetch(`${API_URL}/favorites/${uid}`);
      if (response.ok) {
        const favorites = await response.json();
        const isBookFavorited = (Array.isArray(favorites) ? favorites : [])
          .filter(fav => fav && fav.bookId)
          .some(fav => (fav.bookId._id || fav.bookId).toString() === bookId);
        setIsFav(isBookFavorited);
      }
    } catch (error) {
      console.error('Lỗi tải trạng thái yêu thích:', error);
    } finally {
      setLoadingFav(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API_URL}/reviews/${bookId}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(Array.isArray(data.reviews) ? data.reviews : []);
        setTotalReviews(data.totalReviews || 0);
        setAverageRating(data.averageRating || 0);
        if (data.ratingCounts) {
          setRatingCounts(data.ratingCounts);
        }
      }
    } catch (error) {
      console.error('Lỗi tải đánh giá:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleToggleFavorite = async () => {
    const nextFav = !isFav;
    setIsFav(nextFav);
    try {
      const response = await fetch(`${API_URL}/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, bookId })
      });
      if (!response.ok) {
        setIsFav(!nextFav);
      }
    } catch (error) {
      console.error(error);
      setIsFav(!nextFav);
    }
  };

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      const response = await fetch(`${API_URL}/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, bookId, quantity: 1 })
      });

      if (response.ok) {
        Alert.alert('Thành công', 'Đã thêm sách vào giỏ hàng!', [
          { text: 'Tiếp tục mua sắm', style: 'cancel' },
          { text: 'Đến Giỏ hàng', onPress: () => navigation.navigate('Main', { screen: 'Cart' }) }
        ]);
      } else {
        Alert.alert('Lỗi', 'Không thể thêm vào giỏ hàng lúc này.');
      }
    } catch (error) {
      Alert.alert('Lỗi mạng', 'Không thể kết nối đến máy chủ Backend.');
    } finally {
      setIsAdding(false);
    }
  };

  // Xử lý gửi đánh giá mới
  const handleSubmitReview = async () => {
    if (!commentText.trim()) {
      return Alert.alert('Thiếu nhận xét', 'Vui lòng viết đôi lời nhận xét về cuốn sách này.');
    }

    setSubmittingReview(true);
    try {
      const response = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId,
          userId,
          rating: selectedRating,
          comment: commentText.trim()
        })
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert('Cảm ơn bạn! 🎉', 'Đánh giá của bạn đã được đăng thành công.');
        setModalVisible(false);
        setCommentText('');
        setSelectedRating(5);

        // Cập nhật lại danh sách đánh giá tại chỗ
        if (data.review) {
          setReviews(prev => [data.review, ...prev]);
        }
        if (data.averageRating !== undefined) {
          setAverageRating(data.averageRating);
        }
        if (data.totalReviews !== undefined) {
          setTotalReviews(data.totalReviews);
        }
        fetchReviews(); // Đồng bộ lại phân bố sao
      } else {
        Alert.alert('Lỗi', data.message || 'Không thể gửi đánh giá.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi mạng', 'Không thể kết nối máy chủ để gửi đánh giá.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Hàm vẽ 5 ngôi sao theo điểm số
  const renderStars = (score, size = 16) => {
    const stars = [];
    const rounded = Math.round(score);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rounded ? 'star' : 'star-outline'}
          size={size}
          color="#FFB800"
          style={{ marginRight: 2 }}
        />
      );
    }
    return stars;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Ảnh bìa sách */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: book.coverImage }} style={styles.coverImage} />
        </View>

        {/* Nội dung thông tin sách */}
        <View style={styles.infoContainer}>
          {/* Hàng thể loại & Yêu thích */}
          <View style={styles.topRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{book.category}</Text>
            </View>
            <TouchableOpacity style={styles.favIconBtn} onPress={handleToggleFavorite} disabled={loadingFav}>
              <Ionicons name={isFav ? "heart" : "heart-outline"} size={26} color={isFav ? "#E25842" : "#999"} />
            </TouchableOpacity>
          </View>

          {/* Tiêu đề & Tác giả */}
          <Text style={styles.title}>{book.bookName}</Text>
          <Text style={styles.author}>Tác giả: {book.author}</Text>

          {/* Dòng đánh giá tóm tắt trên đầu */}
          <View style={styles.ratingSummaryRow}>
            <View style={styles.ratingStarsGroup}>
              {renderStars(averageRating > 0 ? averageRating : 5, 17)}
            </View>
            <Text style={styles.ratingScoreBadge}>
              {averageRating > 0 ? averageRating.toFixed(1) : '5.0'}
            </Text>
            <Text style={styles.ratingCountText}>
              ({totalReviews} đánh giá)
            </Text>
          </View>

          {/* Giá sách */}
          <Text style={styles.price}>{book.price?.toLocaleString('vi-VN')} đ</Text>

          <View style={styles.divider} />

          {/* Giới thiệu nội dung */}
          <Text style={styles.sectionTitle}>Giới thiệu nội dung</Text>
          <Text style={styles.description}>
            Đây là một trong những cuốn sách tuyệt vời nhất thuộc thể loại {book.category}.
            Với những triết lý sâu sắc và bài học thực tế, tác phẩm của {book.author} chắc chắn sẽ mang lại cho bạn những giây phút đọc sách thú vị và bổ ích. Hãy thêm vào giỏ hàng để sở hữu ngay!
          </Text>

          <View style={styles.divider} />

          {/* KHỐI ĐÁNH GIÁ & NHẬN XÉT (REVIEWS & RATINGS) */}
          <View style={styles.reviewSectionHeader}>
            <Text style={styles.sectionTitle}>Đánh giá & Nhận xét</Text>
            <TouchableOpacity
              style={styles.writeReviewBtn}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons name="create-outline" size={16} color="#C5532A" />
              <Text style={styles.writeReviewBtnText}>Viết đánh giá</Text>
            </TouchableOpacity>
          </View>

          {/* Bảng tổng hợp điểm số & phân bố sao */}
          <View style={styles.ratingCard}>
            <View style={styles.ratingLeftBox}>
              <Text style={styles.ratingBigNumber}>
                {averageRating > 0 ? averageRating.toFixed(1) : '5.0'}
              </Text>
              <View style={{ flexDirection: 'row', marginVertical: 4 }}>
                {renderStars(averageRating > 0 ? averageRating : 5, 14)}
              </View>
              <Text style={styles.ratingTotalReviews}>{totalReviews} lượt đánh giá</Text>
            </View>

            <View style={styles.ratingDistributionBox}>
              {[5, 4, 3, 2, 1].map((star) => {
                const count = ratingCounts[star] || 0;
                const percent = totalReviews > 0 ? (count / totalReviews) * 100 : (star === 5 ? 100 : 0);
                return (
                  <View key={star} style={styles.distRow}>
                    <Text style={styles.distStarLabel}>{star}★</Text>
                    <View style={styles.distBarBg}>
                      <View style={[styles.distBarFill, { width: `${percent}%` }]} />
                    </View>
                    <Text style={styles.distCount}>{count}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Danh sách các bài đánh giá của độc giả */}
          {loadingReviews ? (
            <ActivityIndicator size="small" color="#C5532A" style={{ marginVertical: 20 }} />
          ) : reviews.length === 0 ? (
            <View style={styles.emptyReviewsBox}>
              <Ionicons name="chatbubble-ellipses-outline" size={36} color="#A89F91" />
              <Text style={styles.emptyReviewsText}>
                Chưa có nhận xét nào cho cuốn sách này.{'\n'}Hãy là người đầu tiên chia sẻ cảm nhận nhé!
              </Text>
            </View>
          ) : (
            <View style={styles.reviewsList}>
              {reviews.map((rev) => {
                const initialLetter = (rev.username || 'K').charAt(0).toUpperCase();
                const revDate = rev.createdAt
                  ? new Date(rev.createdAt).toLocaleDateString('vi-VN')
                  : 'Gần đây';

                return (
                  <View key={rev._id} style={styles.reviewItem}>
                    <View style={styles.reviewItemHeader}>
                      <View style={styles.avatarCircle}>
                        <Text style={styles.avatarLetter}>{initialLetter}</Text>
                      </View>
                      <View style={styles.reviewerInfo}>
                        <View style={styles.reviewerNameRow}>
                          <Text style={styles.reviewerName}>{rev.username || 'Khách hàng'}</Text>
                          <View style={styles.verifiedBadge}>
                            <Ionicons name="checkmark-circle" size={12} color="#2E7D32" />
                            <Text style={styles.verifiedText}>Đã mua hàng</Text>
                          </View>
                        </View>
                        <Text style={styles.reviewDate}>{revDate}</Text>
                      </View>
                    </View>

                    <View style={styles.reviewStars}>
                      {renderStars(rev.rating, 14)}
                    </View>

                    <Text style={styles.reviewComment}>{rev.comment}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Thanh nút đặt hàng cố định dưới đáy */}
      <View style={[styles.bottomBar, { paddingBottom: Platform.OS === 'android' ? 45 : 25 }]}>
        <TouchableOpacity style={styles.favOutlineBtn} onPress={handleToggleFavorite} disabled={loadingFav}>
          <Ionicons name={isFav ? "heart" : "heart-outline"} size={24} color="#E25842" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addToCartBtn}
          onPress={handleAddToCart}
          disabled={isAdding}
        >
          {isAdding ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="cart" size={20} color="#FFF" style={styles.btnIcon} />
              <Text style={styles.addToCartText}>Thêm vào giỏ</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* MODAL VIẾT ĐÁNH GIÁ & CHẤM SAO */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header Modal */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Đánh giá sách</Text>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Xem trước sách đang đánh giá */}
            <View style={styles.bookPreviewRow}>
              <Image source={{ uri: book.coverImage }} style={styles.modalBookCover} />
              <Text style={styles.modalBookName} numberOfLines={2}>
                {book.bookName}
              </Text>
            </View>

            {/* Chọn số sao (1 đến 5 sao tương tác) */}
            <Text style={styles.starPickerLabel}>Chất lượng cuốn sách:</Text>
            <View style={styles.starPickerContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  style={styles.starTouchable}
                  onPress={() => setSelectedRating(star)}
                >
                  <Ionicons
                    name={star <= selectedRating ? 'star' : 'star-outline'}
                    size={38}
                    color="#FFB800"
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.starMoodText}>{STAR_MOODS[selectedRating]}</Text>

            {/* Khung nhập nhận xét */}
            <Text style={styles.commentLabel}>Nhận xét của bạn:</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Chia sẻ cảm nhận về nội dung, bài học hay chất lượng in ấn cuốn sách này nhé..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              value={commentText}
              onChangeText={setCommentText}
            />

            {/* Nút gửi đánh giá */}
            <TouchableOpacity
              style={styles.submitReviewBtn}
              onPress={handleSubmitReview}
              disabled={submittingReview}
            >
              {submittingReview ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitReviewBtnText}>GỬI ĐÁNH GIÁ</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}