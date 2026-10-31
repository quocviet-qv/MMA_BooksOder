import React, { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Alert } from 'react-native';
import { API_URL, apiFetch as fetch } from '../src/constants/api';
import { useAuth } from '../src/context/AuthContext';
import { useCart } from '../src/context/CartContext';
import './Bookstore.web.css';
const money = n => `${n.toLocaleString('vi-VN')} đ`;
export default function HomeScreen({ navigation }) {
  const { userId, userName, logout } = useAuth();
  const { cartCount, refreshCartCount } = useCart();
  const [books, setBooks] = useState([]), [favorites, setFavorites] = useState([]);
  const [query, setQuery] = useState(''), [category, setCategory] = useState('Tất cả'), [sort, setSort] = useState('newest');
  const [busy, setBusy] = useState({}), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const load = useCallback(async () => {
    try {
      const [b, f] = await Promise.all([fetch(`${API_URL}/books`), fetch(`${API_URL}/favorites/${userId}`)]);
      if (!b.ok || !f.ok) throw new Error('Không thể tải kho sách. Vui lòng thử lại.');
      setBooks(await b.json());
      setFavorites((await f.json()).map(item => item.bookId._id));
      setError('');
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }, [userId]);
  useFocusEffect(useCallback(() => { load(); refreshCartCount(); }, [load, refreshCartCount]));
  const categories = ['Tất cả', ...new Set(books.map(book => book.category))];
  const displayed = useMemo(() => {
    const normalized = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase();
    const filtered = books.filter(book => (category === 'Tất cả' || category === book.category) && normalized(`${book.bookName} ${book.author}`).includes(normalized(query.trim())));
    return filtered.sort((a, b) => sort === 'priceAsc' ? a.price - b.price : sort === 'priceDesc' ? b.price - a.price : sort === 'rating' ? b.averageRating - a.averageRating : new Date(b.createdAt) - new Date(a.createdAt));
  }, [books, category, query, sort]);
  const favorite = async book => {
    if (busy[book._id]) return;
    setBusy(prev => ({ ...prev, [book._id]: true }));
    try {
      const response = await fetch(`${API_URL}/favorites`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookId: book._id }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setFavorites(prev => data.status === 'added' ? [...prev, book._id] : prev.filter(id => id !== book._id));
    } catch (e) { Alert.alert('Không thể lưu yêu thích', e.message); }
    finally { setBusy(prev => ({ ...prev, [book._id]: false })); }
  };
  const add = async book => {
    if (busy[`cart-${book._id}`]) return;
    setBusy(prev => ({ ...prev, [`cart-${book._id}`]: true }));
    try {
      const response = await fetch(`${API_URL}/cart`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookId: book._id, quantity: 1 }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      await refreshCartCount();
      Alert.alert('Đã thêm vào giỏ', book.bookName, [{ text: 'Tiếp tục xem', style: 'cancel' }, { text: 'Xem giỏ hàng', onPress: () => navigation.navigate('Cart') }]);
    } catch (e) { Alert.alert('Không thể thêm sách', e.message); }
    finally { setBusy(prev => ({ ...prev, [`cart-${book._id}`]: false })); }
  };
  const details = book => navigation.navigate('Chi tiết', { book });
  return <div className="bookstore">
    <div className="store-topline"><div>Sách hay mỗi ngày, mở thêm một thế giới.<span>Miễn phí vận chuyển từ 300.000 đ</span></div></div>
    <header className="store-header"><div className="store-header-inner">
      <button className="store-brand" onClick={() => { setCategory('Tất cả'); setQuery(''); }}><span className="store-brand-mark">B<span>o</span></span><span>BOOKS ORDER<small>Nhà sách của bạn</small></span></button>
      <div className="store-search"><span aria-hidden="true">⌕</span><input aria-label="Tìm tên sách hoặc tác giả" placeholder="Bạn đang tìm cuốn sách nào?" value={query} onChange={e => setQuery(e.target.value)} />{query && <button aria-label="Xóa tìm kiếm" onClick={() => setQuery('')}>×</button>}</div>
      <nav aria-label="Tài khoản và mua sắm"><button onClick={() => navigation.navigate('Favorites')}>♡<small>Yêu thích</small></button><button onClick={() => navigation.navigate('Orders')}>☷<small>Đơn hàng</small></button><button className="store-cart" onClick={() => navigation.navigate('Cart')}>♧<b>{cartCount}</b><small>Giỏ hàng</small></button><button className="store-user" onClick={() => navigation.navigate('Profile')}><span>{userName?.slice(0, 1).toUpperCase()}</span><small>{userName}</small></button></nav>
    </div></header>
    <main className="store-main">
      <div className="store-welcome"><span>Xin chào, {userName} <span className="store-dot">·</span> Hôm nay bạn muốn đọc gì?</span><button onClick={logout}>Đăng xuất ↗</button></div>
      <section className="store-hero"><div className="store-hero-copy"><span className="store-eyebrow">MỘT TRANG SÁCH · MỘT KHỞI ĐẦU MỚI</span><h1>Cuốn sách tiếp theo.<br /><em>Cảm hứng tiếp theo.</em></h1><p>Từ những câu chuyện chạm đến trái tim đến tri thức<br className="desktop-break" /> mở rộng góc nhìn. Tìm cuốn sách dành riêng cho bạn.</p><button className="store-primary" onClick={() => document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth' })}>Khám phá kho sách <span>→</span></button><div className="store-hero-note">Đa dạng thể loại <span>•</span> Đặt hàng dễ dàng <span>•</span> Giao tận nơi</div></div>
        <div className="store-hero-art" aria-label="Những cuốn sách trong cửa hàng"><div className="store-orbit" /><span className="store-art-label">A LITTLE MORE READING,<br />A LITTLE MORE LIVING.</span>{books.slice(0, 3).map((book, index) => <button key={book._id} className={`store-hero-book hero-book-${index}`} onClick={() => details(book)} aria-label={`Xem ${book.bookName}`}><img src={book.coverImage} alt={book.bookName} /></button>)}<span className="store-art-stamp">Mở sách.<br />Mở thế giới.</span></div>
      </section>
      <section className="store-benefits" aria-label="Dịch vụ cửa hàng"><div><span>01</span><p><strong>Chọn sách theo sở thích</strong><small>Văn học, kinh tế, kỹ năng và nhiều hơn nữa</small></p></div><div><span>02</span><p><strong>Giao hàng tận nơi</strong><small>Miễn phí cho đơn từ 300.000 đ</small></p></div><div><span>03</span><p><strong>Thanh toán linh hoạt</strong><small>COD hoặc chuyển khoản được xác nhận</small></p></div></section>
      <section id="catalogue" className="store-catalogue"><div className="store-section-heading"><div><span className="store-eyebrow">TỦ SÁCH DÀNH CHO BẠN</span><h2>Khám phá sách hay<span>.</span></h2></div><label>Sắp xếp<select aria-label="Sắp xếp sách" value={sort} onChange={e => setSort(e.target.value)}><option value="newest">Mới nhất</option><option value="priceAsc">Giá thấp đến cao</option><option value="priceDesc">Giá cao đến thấp</option><option value="rating">Đánh giá cao</option></select></label></div>
      <div className="store-category-list" aria-label="Thể loại">{categories.map(item => <button key={item} onClick={() => setCategory(item)} aria-pressed={category === item} className={category === item ? 'active' : ''}>{item}</button>)}</div>
      <div className="store-results">{displayed.length} đầu sách{query ? ` cho “${query}”` : ' đang chờ bạn khám phá'}</div>
      {error && <div className="store-empty" role="alert"><p>{error}</p><button onClick={load}>Thử lại</button></div>}
      {loading ? <div className="store-empty">Đang chuẩn bị kho sách…</div> : <div className="store-grid">{displayed.map(book => <article key={book._id} className="store-book-card"><div className="store-cover"><button className="store-cover-link" onClick={() => details(book)} aria-label={`Chi tiết ${book.bookName}`}><img src={book.coverImage} alt={`Bìa sách ${book.bookName}`} loading="lazy" /></button><button className={`store-heart ${favorites.includes(book._id) ? 'saved' : ''}`} disabled={busy[book._id]} onClick={() => favorite(book)} aria-label={`${favorites.includes(book._id) ? 'Bỏ' : 'Thêm'} yêu thích ${book.bookName}`} aria-pressed={favorites.includes(book._id)}>{favorites.includes(book._id) ? '♥' : '♡'}</button>{book.stock < 5 && <span className="store-stock">{book.stock ? `Còn ${book.stock} cuốn` : 'Hết hàng'}</span>}</div><div className="store-book-info"><span className="store-category">{book.category}</span><button className="store-book-title" onClick={() => details(book)}>{book.bookName}</button><p>{book.author}</p><div className="store-review">{book.totalReviews ? <><span>★</span> {book.averageRating.toFixed(1)} <small>({book.totalReviews} đánh giá)</small></> : <small>Chưa có đánh giá</small>}</div><div className="store-book-bottom"><strong>{money(book.price)}</strong><button aria-label={`Thêm ${book.bookName} vào giỏ`} disabled={!book.stock || busy[`cart-${book._id}`]} onClick={() => add(book)}>{busy[`cart-${book._id}`] ? '…' : '+ Giỏ'}</button></div></div></article>)}</div>}
      {!loading && !displayed.length && !error && <div className="store-empty"><h3>Chưa tìm thấy cuốn sách phù hợp</h3><p>Thử một từ khóa hoặc thể loại khác nhé.</p><button onClick={() => { setQuery(''); setCategory('Tất cả'); }}>Xem tất cả sách</button></div>}
      </section>
      <section className="store-reading"><span>“</span><p>Một cuốn sách hay luôn có một chỗ<br />trên kệ — và trong lòng bạn.</p><button onClick={() => navigation.navigate('Favorites')}>Xem tủ sách yêu thích →</button></section>
      <footer className="store-footer"><strong>BOOKS ORDER<span>Nhà sách của bạn</span></strong><p>Mỗi ngày, một trang mới.</p><button onClick={() => navigation.navigate('Orders')}>Theo dõi đơn hàng ↗</button></footer>
    </main>
  </div>;
}
