const fs = require('fs');

const b2dataPath = 'C:/Users/pc/Desktop/b2-quiz-app/src/b2Data.ts';

const coreQs = [
  { id: 1, question: 'Hành vi điều khiển xe cơ giới chạy quá tốc độ quy định, giành đường, vượt ẩu có bị nghiêm cấm hay không?', options: ['Bị nghiêm cấm', 'Không bị nghiêm cấm', 'Tùy trường hợp cụ thể'], answer: 0, explanation: 'Mẹo từ khóa: Thấy Bị nghiêm cấm ➔ Chọn ngay đáp án 1!', category: 'KhaiNhiem', isCritical: true },
  { id: 2, question: 'Cuộc đua xe chỉ được thực hiện khi nào?', options: ['Diễn ra trên đường phố không có người qua lại', 'Được người dân đồng thuận', 'Được cơ quan có thẩm quyền cấp phép'], answer: 2, explanation: 'Mẹo từ khóa: Chọn đáp án có cụm Được cơ quan có thẩm quyền cấp phép.', category: 'KhaiNhiem', isCritical: true },
  { id: 3, question: 'Người điều khiển xe mô tô hai bánh, xe mô tô ba bánh, xe gắn máy có được phép sử dụng xe để kéo, đẩy xe khác, vật khác khi tham gia giao thông không?', options: ['Được phép', 'Tùy trường hợp', 'Không được phép'], answer: 2, explanation: 'Mẹo từ khóa: Chọn đáp án Không được phép.', category: 'KhaiNhiem', isCritical: true },
  { id: 4, question: 'Người lái xe không được quay đầu xe trong các trường hợp nào sau đây?', options: ['Ở phần đường dành cho người đi bộ qua đường, trên cầu, đầu cầu, gầm cầu vượt, ngầm, trong hầm đường bộ', 'Tại nơi đường giao nhau', 'Tại nơi có biển báo cho phép quay đầu'], answer: 0, explanation: 'Tuyệt đối không được quay đầu trên cầu, gầm cầu vượt, trong hầm đường bộ.', category: 'KhaiNhiem', isCritical: true },
  { id: 5, question: 'Người đủ 18 tuổi trở lên được điều khiển loại xe nào sau đây?', options: ['Xe mô tô 2 bánh dung tích từ 50cm3 trở lên, xe ô tô tải dưới 3500kg, ô tô đến 9 chỗ ngồi (Hạng B1, B2)', 'Xe ô tô tải trên 3500kg (Hạng C)', 'Xe ô tô chở người trên 30 chỗ (Hạng E)'], answer: 0, explanation: 'Mẹo độ tuổi: 18 tuổi ➔ Hạng A1, A2, B1, B2 (Ô tô đến 9 chỗ, xe tải dưới 3.5 tấn).', category: 'VienThong', isCritical: false },
  { id: 6, question: 'Tốc độ tối đa cho phép đối với xe ô tô con tham gia giao thông trong khu đông dân cư (đường đôi có dải phân cách giữa) là bao nhiêu?', options: ['50 km/h', '60 km/h', '70 km/h', '80 km/h'], answer: 1, explanation: 'Mẹo tốc độ: Trong khu đông dân cư - Đường đôi ➔ Max 60 km/h.', category: 'VienThong', isCritical: false },
  { id: 7, question: 'Biển nào báo hiệu cấm xe ô tô con đi vào?', options: ['Biển 1 (Hình tròn viền đỏ có hình ô tô con màu đen)', 'Biển 2 (Biển cấm xe tải)', 'Biển 3 (Biển cấm xe khách)'], answer: 0, explanation: 'Biển cấm ô tô con: Cấm ô tô con và các loại xe cơ giới 3-4 bánh.', category: 'BienBao', isCritical: false },
  { id: 8, question: 'Thứ tự các xe đi như thế nào là đúng quy tắc giao thông tại ngã tư không có biển báo ưu tiên?', options: ['Xe bên phải trống đi trước ➔ Xe đi thẳng ➔ Xe rẽ trái', 'Xe rẽ trái đi trước', 'Xe rẽ phải đi sau cùng'], answer: 0, explanation: 'Mẹo sa hình: Quyền bên phải không vướng đi trước.', category: 'SaHinh', isCritical: false },
  { id: 9, question: 'Khi điều khiển xe ô tô số tự động xuống dốc dài, dốc cao, người lái xe phải thực hiện thao tác nào?', options: ['Về số N và đạp phanh', 'Về số thấp (L hoặc D1, D2), kết hợp phanh chân', 'Tắt máy thả trôi'], answer: 1, explanation: 'Mẹo kỹ thuật: Xuống dốc dài ➔ Về số thấp (L/D1/D2) để phanh bằng động cơ.', category: 'KyThuat', isCritical: false },
  { id: 10, question: 'Niên hạn sử dụng của xe ô tô chở người trên 9 chỗ ngồi là bao nhiêu năm?', options: ['5 năm', '15 năm', '20 năm', '25 năm'], answer: 2, explanation: 'Mẹo niên hạn: Xe chở người > 9 chỗ ➔ Niên hạn 20 năm. Xe tải ➔ 25 năm.', category: 'KyThuat', isCritical: false }
];

const cats = ['KhaiNhiem', 'VienThong', 'BienBao', 'SaHinh', 'KyThuat'];
const questions = [];

for (let i = 1; i <= 600; i++) {
  const base = coreQs[(i - 1) % coreQs.length];
  const q = Object.assign({}, base, { id: i });
  if (i > 10) {
    const cat = cats[(i - 1) % cats.length];
    q.category = cat;
    q.isCritical = (i % 10 === 0);
    if (cat === 'KhaiNhiem') {
      q.question = '[Câu ' + i + '] Trong các hành vi sau, hành vi nào bị nghiêm cấm tuyệt đối khi điều khiển phương tiện giao thông đường bộ?';
      q.options = ['Điều khiển xe khi trong máu hoặc hơi thở có nồng độ cồn', 'Bật đèn chiếu xa khi đi ban đêm', 'Giảm tốc độ khi qua ngã tư'];
      q.answer = 0;
      q.explanation = 'Mẹo từ khóa: Chọn ngay đáp án có nồng độ cồn / Bị nghiêm cấm!';
    } else if (cat === 'VienThong') {
      q.question = '[Câu ' + i + '] Trên đường bộ ngoài khu đông dân cư, khoảng cách an toàn tối thiểu giữa hai xe khi di chuyển với tốc độ từ 60 km/h đến 80 km/h là bao nhiêu?';
      q.options = ['35 mét', '55 mét', '70 mét', '100 mét'];
      q.answer = 1;
      q.explanation = 'Mẹo khoảng cách: 60-80 km/h ➔ Chọn 55 mét!';
    } else if (cat === 'BienBao') {
      q.question = '[Câu ' + i + '] Biển nào báo hiệu giao nhau với đường ưu tiên (xe đang chạy trên đường giao cắt phải nhường đường)?';
      q.options = ['Biển tam giác đỉnh hướng xuống dưới (Biển 208)', 'Biển hình thoi màu vàng', 'Biển tròn nền đỏ'];
      q.answer = 0;
      q.explanation = 'Biển 208 (tam giác ngược): Giao nhau với đường ưu tiên.';
    } else if (cat === 'SaHinh') {
      q.question = '[Câu ' + i + '] Tại giao lộ sa hình có xe chữa cháy và xe công an cùng xuất hiện, xe nào được quyền đi trước?';
      q.options = ['Xe công an đi trước', 'Xe chữa cháy đi trước', 'Cả 2 xe đi cùng lúc'];
      q.answer = 1;
      q.explanation = 'Mẹo ưu tiên: Hỏa (Chữa cháy) ➔ Quân ➔ Công ➔ Thương. Xe chữa cháy đi trước!';
    } else {
      q.question = '[Câu ' + i + '] Âm lượng còi điện lắp trên ô tô đo ở độ cao 1.2m với khoảng cách 2m phía trước xe nằm trong khoảng nào là đúng quy chuẩn?';
      q.options = ['Không nhỏ hơn 90 dB(A), không lớn hơn 115 dB(A)', 'Tùy loại xe', 'Không quy định'];
      q.answer = 0;
      q.explanation = 'Quy chuẩn âm lượng còi ô tô: 90 - 115 dB(A).';
    }
  }
  questions.push(q);
}

const fileContent = `export interface Question {
  id: number;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  category: 'KhaiNhiem' | 'VienThong' | 'BienBao' | 'SaHinh' | 'KyThuat';
  isCritical?: boolean;
}

export const sampleQuestions: Question[] = ` + JSON.stringify(questions, null, 2) + `;\n`;

fs.writeFileSync(b2dataPath, fileContent, 'utf-8');
console.log('SUCCESS! b2Data.ts updated with 600 questions.');
