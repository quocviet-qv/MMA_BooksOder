const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Book = require('../models/Book');
const Order = require('../models/Order');
const Review = require('../models/Review');
let database, server, base, admin, user1, user2;
async function api(path, auth, body, method = body ? 'POST' : 'GET') {
  const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: `Bearer ${auth.token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, data: await response.json() };
}
const bookData = { bookName: 'Test book', author: 'Test author', category: 'Công nghệ', price: 100000, stock: 4, coverImage: 'https://example.com/cover.jpg', description: 'A test book' };
const delivery = { recipientName: 'Test Customer', phone: '0901234567', address: '123 Test Street, Ho Chi Minh City', paymentMethod: 'COD' };
let sequence = 0;
async function checkout(user, extras = {}) { return api('/checkout', user, { ...delivery, checkoutKey: `integration-key-${++sequence}`, ...extras }); }
async function createBook(data = {}) { const r = await api('/books', admin, { ...bookData, ...data }); assert.equal(r.status, 201); return r.data.newBook; }
before(async () => {
  process.env.JWT_SECRET = 'integration-test-only-secret';
  database = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
  await mongoose.connect(database.getUri());
  for (const username of ['admin', 'user1', 'user2']) await User.create({ username, password: await bcrypt.hash('test123', 4), role: username === 'admin' ? 'admin' : 'user' });
  await Promise.all([Order.init(), Review.init(), require('../models/Cart').init(), require('../models/Favorite').init()]);
  server = require('../app').listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}`;
  [admin, user1, user2] = await Promise.all(['admin', 'user1', 'user2'].map(async username => (await api('/login', null, { username, password: 'test123' })).data));
});
after(async () => { if (server) await new Promise(resolve => server.close(resolve)); await mongoose.disconnect(); if (database) await database.stop(); });
test('registration validates input and cannot grant admin privileges', async () => {
  assert.equal((await api('/register', null, { username: 'newuser', password: '123' })).status, 400);
  assert.equal((await api('/register', null, { username: 'newuser', password: 'strong123', role: 'admin' })).status, 201);
  assert.equal((await api('/login', null, { username: 'newuser', password: 'strong123' })).data.role, 'user');
  assert.equal((await api('/register', null, { username: 'newuser', password: 'strong123' })).status, 400);
  assert.equal((await api('/login', null, { username: 'newuser', password: 'wrong' })).status, 400);
});
test('book CRUD requires admin; invalid price and stock are rejected', async () => {
  assert.equal((await api('/books', null, bookData)).status, 401);
  assert.equal((await api('/books', user1, bookData)).status, 403);
  assert.equal((await api('/books', admin, { ...bookData, price: -1 })).status, 400);
  assert.equal((await api('/books', admin, { ...bookData, stock: 1.5 })).status, 400);
  const b = await createBook();
  assert.equal((await api(`/books/${b._id}`, admin, { ...bookData, bookName: 'Updated book' }, 'PUT')).data.updatedBook.bookName, 'Updated book');
  assert.equal((await api(`/books/${b._id}`, admin, null, 'DELETE')).status, 200);
});
test('favorites and cart are isolated per account; quantity and ownership are enforced', async () => {
  const b = await createBook();
  assert.equal((await api('/favorites', user1, { bookId: b._id, userId: user2.userId })).data.status, 'added');
  assert.equal((await api(`/favorites/${user1.userId}`, user1)).data.length, 1);
  assert.equal((await api(`/favorites/${user2.userId}`, user2)).data.length, 0);
  assert.equal((await api(`/favorites/${user1.userId}`, user2)).status, 403);
  assert.equal((await api('/favorites', user1, { bookId: b._id })).data.status, 'removed');
  assert.equal((await api('/cart', user1, { bookId: b._id, quantity: -1 })).status, 400);
  assert.equal((await api('/cart', user1, { bookId: b._id, quantity: 5 })).status, 400);
  const cart = await api('/cart', user1, { bookId: b._id, userId: user2.userId, quantity: 1 });
  assert.equal(cart.status, 200);
  assert.equal((await api(`/cart/${cart.data._id}`, user2, { quantity: 2 }, 'PUT')).status, 404);
  assert.equal((await api(`/cart/${cart.data._id}`, user2, null, 'DELETE')).status, 404);
  assert.equal((await api(`/cart/${cart.data._id}`, user1, { quantity: 5 }, 'PUT')).status, 400);
  assert.equal((await api(`/cart/${cart.data._id}`, user1, null, 'DELETE')).status, 200);
});
test('checkout uses server prices, persists contact and fees, and duplicate submit creates one order', async () => {
  const b = await createBook();
  await api('/cart', user1, { bookId: b._id, quantity: 1 });
  const summary = await api('/checkout/summary', user1);
  assert.equal(summary.data.totalAmount, 125000);
  assert.equal((await checkout(user1, { phone: 'invalid' })).status, 400);
  const result = await checkout(user1, { totalAmount: 1, checkoutKey: 'same-checkout-key-123' });
  assert.equal(result.status, 201);
  assert.equal(result.data.order.totalAmount, 125000);
  assert.equal(result.data.order.paymentStatus, 'unpaid');
  assert.equal(result.data.order.phone, delivery.phone);
  const duplicate = await checkout(user1, { checkoutKey: 'same-checkout-key-123' });
  assert.equal(duplicate.data.order._id, result.data.order._id);
  assert.equal((await Book.findById(b._id)).stock, 3);
  assert.equal((await api(`/cart/${user1.userId}`, user1)).data.length, 0);
  assert.equal((await api(`/orders/detail/${result.data.order._id}`, user2)).status, 404);
  assert.equal((await api('/orders', user1)).status, 403);
  assert.equal((await api(`/orders/${user1.userId}`, user1)).data.some(o => o._id === result.data.order._id), true);
  assert.equal((await api(`/orders/${result.data.order._id}/status`, user1, { status: 'Đang vận chuyển' }, 'PUT')).status, 403);
});
test('concurrent buyers cannot oversell the last book; losing checkout rolls back', async () => {
  const b = await createBook({ stock: 1 });
  await api('/cart', user1, { bookId: b._id, quantity: 1 });
  await api('/cart', user2, { bookId: b._id, quantity: 1 });
  const results = await Promise.all([checkout(user1), checkout(user2)]);
  assert.deepEqual(results.map(r => r.status).sort(), [201, 409]);
  assert.equal((await Book.findById(b._id)).stock, 0);
  const winner = results[0].status === 201 ? user1 : user2;
  const loser = results[0].status === 201 ? user2 : user1;
  const order = results.find(r => r.status === 201).data.order;
  assert.equal((await api(`/orders/${order._id}/cancel`, winner, {}, 'PUT')).status, 200);
  assert.equal((await Book.findById(b._id)).stock, 1);
  assert.equal((await api(`/orders/${order._id}/cancel`, winner, {}, 'PUT')).status, 400);
  const loserCart = (await api(`/cart/${loser.userId}`, loser)).data;
  assert.equal(loserCart.length, 1);
  await api(`/cart/${loserCart[0]._id}`, loser, null, 'DELETE');
});
test('bank transfer requires admin confirmation; cancellation refunds once; terminal states are locked', async () => {
  const b = await createBook({ price: 300000 });
  await api('/cart', user1, { bookId: b._id, quantity: 1 });
  const order = (await checkout(user1, { paymentMethod: 'BANK_TRANSFER' })).data.order;
  assert.equal(order.shippingFee, 0);
  assert.equal(order.paymentStatus, 'pending');
  assert.equal((await api(`/orders/${order._id}/status`, admin, { status: 'Đang vận chuyển' }, 'PUT')).status, 400);
  assert.equal((await api(`/orders/${order._id}/payment`, user1, { paymentStatus: 'paid' }, 'PUT')).status, 403);
  assert.equal((await api(`/orders/${order._id}/payment`, admin, { paymentStatus: 'paid' }, 'PUT')).data.order.paymentStatus, 'paid');
  assert.equal((await api(`/orders/${order._id}/payment`, admin, { paymentStatus: 'paid' }, 'PUT')).status, 400);
  assert.equal((await api(`/orders/${order._id}/cancel`, user1, {}, 'PUT')).data.order.paymentStatus, 'refund_pending');
  assert.equal((await api(`/orders/${order._id}/payment`, admin, { paymentStatus: 'refunded' }, 'PUT')).data.order.paymentStatus, 'refunded');
  assert.equal((await api(`/orders/${order._id}/status`, admin, { status: 'Đang vận chuyển' }, 'PUT')).status, 400);
  assert.equal((await Book.findById(b._id)).stock, 4);
});
test('COD requires collection before completion; historical book snapshots survive deletion', async () => {
  const b = await createBook();
  await api('/cart', user1, { bookId: b._id, quantity: 1 });
  const order = (await checkout(user1)).data.order;
  assert.equal((await api(`/orders/${order._id}/status`, admin, { status: 'Đang vận chuyển' }, 'PUT')).status, 200);
  assert.equal((await api(`/orders/${order._id}/status`, admin, { status: 'Hoàn thành' }, 'PUT')).status, 400);
  assert.equal((await api(`/orders/${order._id}/cancel`, user1, {}, 'PUT')).status, 400);
  await api(`/orders/${order._id}/payment`, admin, { paymentStatus: 'paid' }, 'PUT');
  const completed = await api(`/orders/${order._id}/status`, admin, { status: 'Đã giao' }, 'PUT');
  assert.equal(completed.status, 200);
  assert.equal(completed.data.order.status, 'Hoàn thành');
  assert.equal(completed.data.order.isRevenueAdded, true);
  assert.equal((await User.findById(admin.userId)).walletBalance, 125000);
  assert.equal((await api(`/orders/${order._id}/status`, admin, { status: 'Hoàn thành' }, 'PUT')).status, 200);
  assert.equal((await User.findById(admin.userId)).walletBalance, 125000);
  await Order.updateOne({ _id: order._id }, { $set: { isRevenueAdded: false } });
  await User.updateOne({ _id: admin.userId }, { $set: { walletBalance: 0 } });
  const legacyCompletion = await api(`/orders/${order._id}/status`, admin, { status: 'Hoàn thành' }, 'PUT');
  assert.equal(legacyCompletion.data.order.isRevenueAdded, true);
  assert.equal((await User.findById(admin.userId)).walletBalance, 125000);
  await api(`/orders/${order._id}/status`, admin, { status: 'Hoàn thành' }, 'PUT');
  assert.equal((await User.findById(admin.userId)).walletBalance, 125000);
  await api(`/books/${b._id}`, admin, null, 'DELETE');
  const history = await api(`/orders/detail/${order._id}`, user1);
  assert.equal(history.data.items[0].bookId.bookName, b.bookName);
  assert.equal((await api(`/orders/${order._id}/status`, admin, { status: 'Đã hủy' }, 'PUT')).status, 400);
  assert.equal((await api('/orders/dashboard/stats', admin)).data.totalRevenue, 125000);
  assert.equal((await api('/orders/dashboard/stats', admin)).data.walletBalance, 125000);
});
test('only customers with a delivered order can create or update one review per book', async () => {
  const book = await createBook();
  const detail = await api(`/books/${book._id}`, null);
  assert.equal(detail.status, 200);
  assert.equal(detail.data._id, book._id);
  assert.equal((await api(`/books/${book._id}/can-review`, null)).status, 401);
  const eligibility = await api(`/books/${book._id}/can-review`, user1);
  assert.deepEqual(
    { canReview: eligibility.data.canReview, hasReviewed: eligibility.data.hasReviewed },
    { canReview: false, hasReviewed: false }
  );
  const publicReviews = await api(`/reviews/${book._id}`, null);
  assert.equal(publicReviews.status, 200);
  assert.equal(publicReviews.data.canReview, undefined);
  const signedInReviews = await api(`/reviews/${book._id}`, user1);
  assert.equal(signedInReviews.data.canReview, false);
  assert.equal((await api(`/books/${book._id}/reviews`, user1, { rating: 5, comment: 'Great book' })).status, 403);
  assert.equal((await api(`/books/${book._id}/reviews`, user2, { userId: user1.userId, rating: 5, comment: 'Spoofed' })).status, 403);

  await Order.create({
    userId: user1.userId,
    totalAmount: 125000,
    paymentStatus: 'paid',
    status: 'Hoàn thành',
    address: delivery.address,
    items: [{ bookId: book._id, quantity: 1, price: book.price }],
  });
  await Review.create({
    bookId: book._id,
    userId: user2.userId,
    username: 'user2',
    rating: 1,
    comment: 'Legacy unverified review',
  });
  const canReview = await api(`/books/${book._id}/can-review`, user1);
  assert.equal(canReview.data.canReview, true);
  assert.equal(canReview.data.hasReviewed, false);
  assert.equal((await api(`/reviews/${book._id}`, user1)).data.canReview, true);

  const created = await api(`/books/${book._id}/reviews`, user1, { rating: 4, comment: '  Good read  ' });
  assert.equal(created.status, 201);
  assert.equal(created.data.review.userId, user1.userId);
  assert.equal(created.data.review.username, 'user1');
  assert.equal(created.data.review.comment, 'Good read');
  const updated = await api(`/books/${book._id}/reviews`, user1, { rating: 5, comment: 'Excellent' });
  assert.equal(updated.status, 200);
  assert.equal(updated.data.review.rating, 5);
  assert.equal(await Review.countDocuments({ bookId: book._id, userId: user1.userId }), 1);
  const savedBook = await Book.findById(book._id);
  assert.equal(savedBook.averageRating, 5);
  assert.equal(savedBook.totalReviews, 1);
  assert.equal((await api(`/books/${book._id}/can-review`, user1)).data.hasReviewed, true);
  const listedReviews = await api(`/reviews/${book._id}`, null);
  assert.equal(listedReviews.data.reviews.length, 1);
  assert.equal(listedReviews.data.reviews[0].comment, 'Excellent');
  const bookWithRating = (await api('/books', null)).data.find(item => item._id === book._id);
  assert.equal(bookWithRating.averageRating, 5);
  assert.equal(bookWithRating.totalReviews, 1);
  assert.equal((await api(`/books/${book._id}/reviews`, user2, { rating: 3, comment: 'Not purchased' })).status, 403);
  assert.equal((await api(`/books/${book._id}/reviews`, user1, { rating: 6, comment: 'Invalid rating' })).status, 400);
});
