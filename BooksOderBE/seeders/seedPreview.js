const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Book = require('../models/Book');
module.exports = async function seedPreview() {
  for (const [username, password, role] of [['admin', 'admin123', 'admin'], ['user1', 'user123', 'user'], ['user2', 'user123', 'user']]) {
    if (!await User.exists({ username })) await User.create({ username, password: await bcrypt.hash(password, 10), role });
  }
  await Promise.all(['Order', 'Cart', 'Favorite'].map(name => require(`../models/${name}`).init()));
  if (await Book.countDocuments()) return;
  const books = [
    ['Nhà giả kim', 'Paulo Coelho', 79000, 'Tiểu thuyết', '9780061122415', 'Hành trình theo đuổi giấc mơ và lắng nghe tiếng nói của trái tim. Một câu chuyện giàu cảm hứng dành cho những người đang tìm kiếm con đường riêng.'],
    ['Đắc nhân tâm', 'Dale Carnegie', 108000, 'Kỹ năng sống', '9780671027032', 'Những nguyên tắc giao tiếp, thấu hiểu con người và xây dựng mối quan hệ bền vững trong cuộc sống.'],
    ['Tâm lý học về tiền', 'Morgan Housel', 139000, 'Kinh tế', '9780857197689', 'Những câu chuyện về hành vi, lựa chọn và cách chúng ta suy nghĩ về tiền bạc.'],
    ['Hoàng tử bé', 'Antoine de Saint-Exupéry', 65000, 'Văn học', '9780156012195', 'Câu chuyện dịu dàng về tình bạn, trách nhiệm và những điều quan trọng mà đôi mắt không thể nhìn thấy.'],
    ['Atomic Habits', 'James Clear', 169000, 'Kỹ năng sống', '9780735211292', 'Xây dựng thói quen nhỏ, tạo nên thay đổi lớn. Những phương pháp thực tế để tiến bộ mỗi ngày.'],
    ['Clean Code', 'Robert C. Martin', 325000, 'Công nghệ', '9780132350884', 'Những nguyên tắc viết mã dễ đọc, dễ bảo trì và làm việc hiệu quả trong đội ngũ phát triển phần mềm.'],
    ['Dế mèn phiêu lưu ký', 'Tô Hoài', 60000, 'Văn học', null, 'Cùng Dế Mèn khám phá thế giới, học cách trưởng thành, biết quan tâm và có trách nhiệm với những người xung quanh.'],
    ['Tư duy nhanh và chậm', 'Daniel Kahneman', 189000, 'Tâm lý học', '9780374533557', 'Khám phá hai hệ thống tư duy và những thiên kiến ảnh hưởng đến quyết định hằng ngày của con người.'],
  ];
  await Book.insertMany(books.map(([bookName, author, price, category, isbn, description], index) => {
    const colors = ['#d7b57b', '#b1443b', '#2d6859', '#e4c981', '#e5e0d3', '#244964', '#679c73', '#eec64a'];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="520"><rect width="360" height="520" fill="${colors[index]}"/><rect x="18" width="3" height="520" fill="#ffffff33"/><text x="180" y="180" font-size="22" font-family="serif" text-anchor="middle" fill="white">BOOKS ORDER</text><text x="180" y="270" font-size="18" font-family="sans-serif" text-anchor="middle" fill="white">${author}</text><path d="M130 320h100v60H130z M180 320v60" fill="none" stroke="white" stroke-width="3"/></svg>`;
    return { bookName, author, price, category, description, stock: index === 7 ? 3 : 25, coverImage: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}` };
  }));
};
