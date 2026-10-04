import os
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

pdfmetrics.registerFont(TTFont('Arial', r'C:/Windows/Fonts/arial.ttf'))
pdfmetrics.registerFont(TTFont('Arial-Bold', r'C:/Windows/Fonts/arialbd.ttf'))

pdf_paths = [
    r'C:/Users/pc/Desktop/b2-quiz-app/public/Meo_Thi_Ly_Thuyet_O_To_Bang_B_Chuan.pdf',
    r'C:/Users/pc/Desktop/b2-quiz-app/dist/Meo_Thi_Ly_Thuyet_O_To_Bang_B_Chuan.pdf',
    r'C:/Users/pc/Desktop/Meo_Thi_Ly_Thuyet_O_To_Bang_B_Chuan.pdf'
]

for pdf_path in pdf_paths:
    os.makedirs(os.path.dirname(pdf_path), exist_ok=True)
    doc = SimpleDocTemplate(pdf_path, pagesize=A4, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitle',
        fontName='Arial-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#1e3a8a'),
        alignment=1,
        spaceAfter=10
    )

    subtitle_style = ParagraphStyle(
        'SubTitle',
        fontName='Arial',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#475569'),
        alignment=1,
        spaceAfter=20
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        fontName='Arial-Bold',
        fontSize=13,
        leading=17,
        textColor=colors.HexColor('#1e40af'),
        spaceBefore=12,
        spaceAfter=8
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        fontName='Arial',
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor('#0f172a'),
        leftIndent=12,
        spaceAfter=4
    )

    story = []

    story.append(Paragraph('<b>BỘ BÍ KÍP MẸO THI LÝ THUYẾT LÁI XE Ô TÔ HẠNG B (B1, B2, B)</b>', title_style))
    story.append(Paragraph('<i>Tối Ưu Cho Bộ 600 Câu Hỏi Mới Nhất — Học Nhanh, Dễ Nhớ, Chọn Đúng 100%</i>', subtitle_style))
    story.append(HRFlowable(width='100%', thickness=1.5, color=colors.HexColor('#3b82f6'), spaceAfter=15))

    story.append(Paragraph('<b>🔥 PHẦN 1: MẸO TỪ KHÓA NHÌN LÀ CHỌN NGAY (100% ĐÚNG)</b>', h1_style))
    tips_p1 = [
        '<b>Gặp câu hỏi có các từ sau ở đáp án -> CHỌN NGAY KHÔNG CẦN SUY NGHĨ:</b>',
        '• <b>"Bị nghiêm cấm"</b> hoặc <b>"Khai trừ"</b>',
        '• <b>"Không được phép"</b> / <b>"Không được quay đầu"</b> / <b>"Không được mang vật"</b>',
        '• <b>"Bắt buộc"</b> / <b>"Chấp hành"</b> / <b>"Phải có giấy phép của cơ quan thẩm quyền"</b>',
        '• <b>"Về số thấp... đi chậm"</b> / <b>"Giảm tốc độ... nhường đường"</b>',
        '• <b>"Tất cả các ý trên"</b> (Áp dụng cho câu hỏi về Đạo đức lái xe, Văn hóa giao thông & Cấu tạo sửa chữa cơ bản).'
    ]
    for t in tips_p1:
        story.append(Paragraph(t, bullet_style))

    story.append(Spacer(1, 10))

    story.append(Paragraph('<b>📊 PHẦN 2: MẸO CON SỐ & ĐỘ TUỔI QUY ĐỊNH</b>', h1_style))
    tips_p2 = [
        '• <b>18 tuổi:</b> Hạng B1, B2 (Lái ô tô chở người đến 9 chỗ, xe tải dưới 3.5 tấn).',
        '• <b>21 tuổi:</b> Hạng C, FB2.',
        '• <b>24 tuổi:</b> Hạng D, FC.',
        '• <b>27 tuổi:</b> Hạng E, FE.',
        '• <b>Tuổi tối đa lái xe hạng E:</b> Nam 55 tuổi, Nữ 50 tuổi.',
        '• <b>Thời hạn bằng B2:</b> 10 năm. (B1: Nam 60 tuổi, Nữ 55 tuổi).',
        '• <b>Niên hạn sử dụng xe:</b> Xe tải: 25 năm | Xe chở người > 9 chỗ: 20 năm | Xe con (dưới 9 chỗ): Không niên hạn.'
    ]
    for t in tips_p2:
        story.append(Paragraph(t, bullet_style))

    story.append(Spacer(1, 10))

    story.append(Paragraph('<b>🚗 PHẦN 3: TỐC ĐỘ VÀ KHOẢNG CÁCH AN TOÀN</b>', h1_style))
    tips_p3 = [
        '<b>Tốc độ tối đa trong khu đông dân cư:</b>',
        '  - Đường đôi (có dải phân cách giữa): <b>60 km/h</b>',
        '  - Đường 2 chiều (không dải phân cách): <b>50 km/h</b>',
        '<b>Tốc độ tối đa ngoài khu đông dân cư (Xe con B2):</b>',
        '  - Đường đôi: <b>90 km/h</b> | Đường 2 chiều: <b>80 km/h</b>',
        '<b>Khoảng cách an toàn tối thiểu giữa 2 xe:</b>',
        '  - V = 60 km/h: <b>35m</b> | V = 60-80 km/h: <b>55m</b> | V = 80-100 km/h: <b>70m</b> | V = 100-120 km/h: <b>100m</b>',
        '  - V < 60 km/h: Giữ khoảng cách chủ động an toàn.'
    ]
    for t in tips_p3:
        story.append(Paragraph(t, bullet_style))

    story.append(Spacer(1, 10))

    story.append(Paragraph('<b>🚦 PHẦN 4: THỨ TỰ ƯU TIÊN VÀ XỬ LÝ SA HÌNH (5 BƯỚC THẦN THÁNH)</b>', h1_style))
    tips_p4 = [
        '<b>Thứ tự ưu tiên đi trước tại giao lộ:</b>',
        '1. <b>Xe đã vào trong giao lộ (ngã tư) trước:</b> Đi trước nhất.',
        '2. <b>Xe ưu tiên theo luật:</b> Hỏa (Chữa cháy) -> Quân (Quân sự) -> Công (Công an) -> Thương (Cứu thương).',
        '3. <b>Đường ưu tiên:</b> Xe nằm trên đường có biển "Bắt đầu đường ưu tiên" (biển hình thoi vàng).',
        '4. <b>Quyền bên phải không vướng:</b> Tại ngã tư không biển báo, xe nào bên phải trống thì được đi trước.',
        '5. <b>Hướng rẽ ưu tiên:</b> Rẽ phải đi trước -> Đi thẳng -> Rẽ trái đi sau cùng.'
    ]
    for t in tips_p4:
        story.append(Paragraph(t, bullet_style))

    story.append(Spacer(1, 10))

    story.append(Paragraph('<b>🛑 PHẦN 5: MẸO BIỂN BÁO GIAO THÔNG</b>', h1_style))
    tips_p5 = [
        '• <b>Biển Cấm:</b> Cấm xe nhỏ -> Cấm xe lớn | Cấm xe lớn -> KHÔNG cấm xe nhỏ (VD: Cấm ô tô con -> Cấm luôn xe tải; Cấm xe tải -> Ô tô con vẫn được đi).',
        '• <b>Cấm rẽ trái:</b> Cấm luôn quay đầu | <b>Cấm quay đầu:</b> ĐƯỢC RẼ TRÁI (Theo quy chuẩn mới nhất QC41).',
        '• <b>Biển hình tròn viền đỏ:</b> Biển báo CẤM.',
        '• <b>Biển tam giác vàng viền đỏ:</b> Biển báo NGUY HIỂM.',
        '• <b>Biển hình tròn nền xanh:</b> Biển HỆU LỆNH PHẢI THỰC HIỆN.',
        '• <b>Biển hình vuông / chữ nhật nền xanh:</b> Biển CHỈ DẪN.'
    ]
    for t in tips_p5:
        story.append(Paragraph(t, bullet_style))

    story.append(Spacer(1, 15))
    story.append(HRFlowable(width='100%', thickness=1, color=colors.HexColor('#cbd5e1'), spaceAfter=10))
    story.append(Paragraph('<i>Bản quyền tổng hợp bởi B2 Quiz App — Chúc bạn ôn tập tốt và thi đạt 100% kết quả!</i>', ParagraphStyle('Footer', fontName='Arial', fontSize=8.5, alignment=1, textColor=colors.HexColor('#64748b'))))

    doc.build(story)
    print('CREATED:', pdf_path, 'SIZE:', os.path.getsize(pdf_path))
