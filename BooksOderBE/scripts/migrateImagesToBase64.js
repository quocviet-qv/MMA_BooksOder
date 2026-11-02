require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('../models/Book');

// Fallback SVG generator nếu link URL bị hỏng hoặc lỗi 403/404
function generateSvgCover(title, author, index = 0) {
  const colors = [
    ['#1E293B', '#0F172A'],
    ['#B91C1C', '#991B1B'],
    ['#047857', '#065F46'],
    ['#1D4ED8', '#1E40AF'],
    ['#B45309', '#92400E'],
    ['#6D28D9', '#5B21B6'],
    ['#0F766E', '#115E59'],
    ['#BE185D', '#9D174D']
  ];
  const [bg1, bg2] = colors[index % colors.length];
  const displayTitle = (title || 'SÁCH HAY').length > 22 ? (title || 'SÁCH HAY').slice(0, 20) + '...' : (title || 'SÁCH HAY');
  const displayAuthor = (author || 'Tác giả').length > 25 ? (author || 'Tác giả').slice(0, 23) + '...' : (author || 'Tác giả');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="520" viewBox="0 0 360 520">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bg1}" />
        <stop offset="100%" stop-color="${bg2}" />
      </linearGradient>
    </defs>
    <rect width="360" height="520" rx="12" fill="url(#grad)" />
    <rect x="22" y="0" width="6" height="520" fill="rgba(255,255,255,0.18)" />
    <rect x="34" y="24" width="292" height="472" rx="8" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="2" stroke-dasharray="4 4" />
    <text x="180" y="160" font-size="14" font-weight="bold" font-family="sans-serif" text-anchor="middle" fill="#F8FAFC" letter-spacing="3">BOOKS ORDER</text>
    <line x1="120" y1="180" x2="240" y2="180" stroke="rgba(255,255,255,0.4)" stroke-width="2" />
    <text x="180" y="240" font-size="22" font-weight="bold" font-family="sans-serif" text-anchor="middle" fill="#FFFFFF">${displayTitle}</text>
    <text x="180" y="280" font-size="15" font-family="sans-serif" text-anchor="middle" fill="#CBD5E1">${displayAuthor}</text>
    <circle cx="180" cy="360" r="32" fill="rgba(255,255,255,0.12)" />
    <text x="180" y="367" font-size="24" text-anchor="middle" fill="#FFFFFF">📖</text>
  </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

async function convertUrlToBase64(url, title, author, index) {
  let cleanUrl = (url || '').trim().replace(/^\[+|\]+$/g, '');
  if (!cleanUrl) return generateSvgCover(title, author, index);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(cleanUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`⚠️ HTTP ${res.status} khi tải ảnh: ${cleanUrl.slice(0, 40)} -> Dùng SVG fallback`);
      return generateSvgCover(title, author, index);
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const mime = contentType.split(';')[0].trim();
    const buffer = Buffer.from(await res.arrayBuffer());

    if (buffer.length === 0) {
      return generateSvgCover(title, author, index);
    }

    return `data:${mime};base64,${buffer.toString('base64')}`;
  } catch (err) {
    console.warn(`⚠️ Lỗi tải ảnh (${err.message}): ${cleanUrl.slice(0, 40)} -> Dùng SVG fallback`);
    return generateSvgCover(title, author, index);
  }
}

async function migrate() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Thiếu MONGODB_URI trong .env');
    process.exit(1);
  }

  console.log('🔄 Đang kết nối MongoDB...');
  await mongoose.connect(uri);
  console.log('✅ Đã kết nối MongoDB.');

  const books = await Book.find({});
  console.log(`📚 Tìm thấy ${books.length} cuốn sách cần kiểm tra ảnh.`);

  let updatedCount = 0;
  for (let i = 0; i < books.length; i++) {
    const b = books[i];
    const img = (b.coverImage || '').trim();

    if (img.startsWith('data:image/')) {
      console.log(`⏩ [${i + 1}/${books.length}] "${b.bookName}" đã là Base64 -> Bỏ qua`);
      continue;
    }

    console.log(`⏳ [${i + 1}/${books.length}] Đang chuyển đổi ảnh cho: "${b.bookName}"...`);
    const base64Img = await convertUrlToBase64(img, b.bookName, b.author, i);
    b.coverImage = base64Img;
    await b.save();
    updatedCount++;
    console.log(`   ✅ Đã cập nhật ảnh Base64 cho "${b.bookName}" (Độ dài: ${base64Img.length} chars)`);
  }

  console.log(`\n🎉 Hoàn thành! Đã chuyển đổi ${updatedCount}/${books.length} cuốn sách sang Base64.`);
  await mongoose.disconnect();
}

migrate().catch(e => {
  console.error('Lỗi migration:', e);
  process.exit(1);
});
