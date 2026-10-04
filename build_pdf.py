import os, shutil
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib import colors
pdfmetrics.registerFont(TTFont("SegoeUI", "C:/Windows/Fonts/segoeui.ttf"))
pdfmetrics.registerFont(TTFont("SegoeUI-Bold", "C:/Windows/Fonts/segoeuib.ttf"))
pdfmetrics.registerFont(TTFont("SegoeUI-Italic", "C:/Windows/Fonts/segoeuii.ttf"))
pdf_path = "C:/Users/pc/Desktop/Menu_Sam_Mix.pdf"
pdf_path_project = "C:/Users/pc/Desktop/Plan quán nước/sam-mix-planner/Menu_Sam_Mix.pdf"
c = canvas.Canvas(pdf_path, pagesize=A4)
w, h = A4
c.setFillColor(colors.HexColor("#FDFBF7"))
c.rect(0, 0, w, h, fill=True, stroke=False)
c.setStrokeColor(colors.HexColor("#1E5631"))
c.setLineWidth(3)
c.rect(15, 15, w-30, h-30)
c.setLineWidth(1)
c.rect(19, 19, w-38, h-38)
c.setFillColor(colors.HexColor("#1E5631"))
c.roundRect(40, h - 90, w - 80, 55, 10, fill=True, stroke=False)
c.setFillColor(colors.white)
c.setFont("SegoeUI-Bold", 24)
c.drawCentredString(w/2, h - 58, "SÂM MIX & NƯỚC ÉP TƯƠI")
c.setFont("SegoeUI-Italic", 11)
c.drawCentredString(w/2, h - 78, "Thanh mát từ thiên nhiên • Nạp năng lượng mỗi ngày")
badges = [("TỰ NHIÊN", 100), ("THANH MÁT", 297), ("TỐT CHO SỨC KHỎE", 495)]
for text, xpos in badges:
    c.setFillColor(colors.HexColor("#E8F5E9"))
    c.setStrokeColor(colors.HexColor("#2E7D32"))
    c.roundRect(xpos - 60, h - 130, 120, 25, 12, fill=True, stroke=True)
    c.setFillColor(colors.HexColor("#1B5E20"))
    c.setFont("SegoeUI-Bold", 10)
    c.drawCentredString(xpos, h - 123, text)
c.setFillColor(colors.HexColor("#FFFFFF"))
c.setStrokeColor(colors.HexColor("#A5D6A7"))
c.roundRect(40, h - 330, w - 80, 180, 12, fill=True, stroke=True)
c.setFillColor(colors.HexColor("#2E7D32"))
c.setFont("SegoeUI-Bold", 14)
c.drawString(60, h - 165, "ĐẶC ĐIỂM NỔI BẬT NGUYÊN LIỆU & CHẤT LƯỢNG")
features = [
    ("1. Nước Sâm Thảo Mộc Truyền Thống:", "Nấu thủ công từ mía lau, la hán quả, củ năng, nhãn nhục, hạt chia 100% tự nhiên."),
    ("2. Nước Ép Trái Cây Nguyên Chất:", "Ép tươi nguyên chất ngay khi khách gọi món, không pha loãng."),
    ("3. Không Phẩm Màu - Không Bảo Quản:", "Giữ trọn vẹn vitamin, dưỡng chất tươi ngon và độ ngọt tự nhiên từ mật mía."),
    ("4. Ép Tươi & Ủ Lạnh Mỗi Ngày:", "Đảm bảo vệ sinh an toàn thực phẩm, phục vụ mát lạnh sảng khoái.")
]
y = h - 195
for title, desc in features:
    c.setFillColor(colors.HexColor("#1B5E20"))
    c.setFont("SegoeUI-Bold", 10.5)
    c.drawString(70, y, title)
    c.setFillColor(colors.HexColor("#333333"))
    c.setFont("SegoeUI", 9.5)
    c.drawString(70, y - 14, desc)
    y -= 38
half_w = (w - 90) / 2
c.setFillColor(colors.HexColor("#1B5E20"))
c.roundRect(40, h - 375, half_w, 32, 8, fill=True, stroke=False)
c.setFillColor(colors.white)
c.setFont("SegoeUI-Bold", 12)
c.drawCentredString(40 + half_w/2, h - 355, "NƯỚC SÂM THẢO MỘC")
c.setFillColor(colors.HexColor("#E65100"))
c.roundRect(40 + half_w + 10, h - 375, half_w, 32, 8, fill=True, stroke=False)
c.setFillColor(colors.white)
c.setFont("SegoeUI-Bold", 12)
c.drawCentredString(40 + half_w + 10 + half_w/2, h - 355, "NƯỚC ÉP TRÁI CÂY TƯƠI")
c.setFillColor(colors.HexColor("#FAFAFA"))
c.setStrokeColor(colors.HexColor("#E0E0E0"))
c.roundRect(40, h - 680, w - 80, 290, 8, fill=True, stroke=True)
sam_items = [
    ("• Sâm Mía Lau Hạt Chia", "Thanh nhiệt, mát gan"),
    ("• Sâm Bông Cúc Nhãn Nhục", "An thần, dịu ngọt"),
    ("• Sâm Củ Năng Táo Đỏ", "Bổ dưỡng, giòn ngọt"),
    ("• Sâm Mix Đặc Biệt", "Hương vị đặc trưng")
]
y_sam = h - 415
for title, desc in sam_items:
    c.setFillColor(colors.HexColor("#1B5E20"))
    c.setFont("SegoeUI-Bold", 11)
    c.drawString(55, y_sam, title)
    c.setFillColor(colors.HexColor("#555555"))
    c.setFont("SegoeUI", 9.5)
    c.drawString(70, y_sam - 14, desc)
    y_sam -= 42
c.setStrokeColor(colors.HexColor("#CCCCCC"))
c.line(w/2, h - 390, w/2, h - 660)
juice_items = [
    ("• Nước Ép Dưa Hấu", "Ép nguyên ruột tươi mát"),
    ("• Nước Ép Cam Sành", "Vắt tươi + muối đậm đà"),
    ("• Nước Ép Cà Rốt", "Kích vị cốt chanh tươi"),
    ("• Nước Ép Dứa Mật", "Thơm lừng thêm cốt tắc"),
    ("• Nước Ép Cóc Non", "Chua ngọt chuẩn vị"),
    ("• Nước Ép Cần Tây Mix Táo", "Ép cùng lát gừng thơm")
]
y_juice = h - 410
for title, desc in juice_items:
    c.setFillColor(colors.HexColor("#BF360C"))
    c.setFont("SegoeUI-Bold", 10.5)
    c.drawString(w/2 + 20, y_juice, title)
    c.setFillColor(colors.HexColor("#555555"))
    c.setFont("SegoeUI", 9)
    c.drawString(w/2 + 32, y_juice - 12, desc)
    y_juice -= 38
c.setFillColor(colors.HexColor("#1E5631"))
c.roundRect(40, 35, w - 80, 75, 10, fill=True, stroke=False)
c.setFillColor(colors.white)
c.setFont("SegoeUI-Bold", 12)
c.drawCentredString(w/2, 90, "ĐỊA CHỈ: Conic Garden A - A.01.12")
c.drawCentredString(w/2, 70, "HOTLINE ĐẶT HÀNG: 0765 620 195")
c.setFont("SegoeUI-Italic", 10)
c.setFillColor(colors.HexColor("#C8E6C9"))
c.drawCentredString(w/2, 48, "Tự nhiên - Thanh mát - Tốt cho sức khỏe")
c.showPage()
c.setFillColor(colors.HexColor("#FDFBF7"))
c.rect(0, 0, w, h, fill=True, stroke=False)
c.setStrokeColor(colors.HexColor("#1E5631"))
c.setLineWidth(3)
c.rect(15, 15, w-30, h-30)
c.setLineWidth(1)
c.rect(19, 19, w-38, h-38)
c.setFillColor(colors.HexColor("#D32F2F"))
c.roundRect(40, h - 80, w - 80, 45, 8, fill=True, stroke=False)
c.setFillColor(colors.white)
c.setFont("SegoeUI-Bold", 18)
c.drawCentredString(w/2, h - 53, "BẢNG CÔNG THỨC & QUY TRÌNH PHA CHẾ CHUẨN")
c.setFont("SegoeUI", 10)
c.drawCentredString(w/2, h - 70, "DÀNH CHO NHÂN VIÊN PHA CHẾ • CHUẨN VỊ & ĐỒNG ĐỀU MỌI LY 500ML")
c.setFillColor(colors.HexColor("#E65100"))
c.setFont("SegoeUI-Bold", 12.5)
c.drawString(40, h - 108, "1. BẢNG CÔNG THỨC NƯỚC ÉP TRÁI CÂY TƯƠI (ÉP TẠI CHỖ)")
c.setFillColor(colors.HexColor("#FF6B52"))
c.rect(40, h - 138, w - 80, 22, fill=True, stroke=False)
c.setFillColor(colors.white)
c.setFont("SegoeUI-Bold", 9.5)
c.drawString(48, h - 132, "STT")
c.drawString(80, h - 132, "Tên Món")
c.drawString(175, h - 132, "Công Thức Chuẩn (Ly 500ml)")
c.drawString(380, h - 132, "Lưu Ý Kích Vị / Bí Quyết")
sop_juice = [
    ("1", "Dưa Hấu", "200ml cốt dưa hấu + 20ml đường mật mía + đá", "Ép nguyên ruột, lọc bớt hạt cho ly trong"),
    ("2", "Cam Sành", "150ml cốt cam (2-3 quả) + 30ml đường mật mía + đá", "Thêm 1 xíu muối tinh để vị đậm đà"),
    ("3", "Cà Rốt", "200ml cốt cà rốt (2-3 củ) + 20ml đường mật mía + đá", "Thêm 10ml nước cốt chanh để không bị ngái"),
    ("4", "Dứa Mật", "200ml cốt dứa (1/2 quả lớn) + 20ml đường mật mía + đá", "Thêm 5ml cốt tắc để tăng độ thơm"),
    ("5", "Cóc Non", "200ml cốt cóc (3-4 quả) + 35ml đường mật mía + đá", "Bắt buộc có muối tinh liều lượng nhỏ"),
    ("6", "Cần Tây Mix Táo", "150ml cốt cần tây + 50ml cốt táo + 10ml đường + đá", "Ép cùng 1 lát gừng mỏng để khử mùi hăng")
]
y = h - 162
for stt, name, formula, note in sop_juice:
    c.setFillColor(colors.HexColor("#FFF3E0") if int(stt)%2==0 else colors.white)
    c.rect(40, y - 5, w - 80, 24, fill=True, stroke=True)
    c.setFillColor(colors.HexColor("#333333"))
    c.setFont("SegoeUI-Bold", 9)
    c.drawString(53, y + 2, stt)
    c.setFillColor(colors.HexColor("#D84315"))
    c.drawString(80, y + 2, name)
    c.setFillColor(colors.HexColor("#222222"))
    c.setFont("SegoeUI", 8.5)
    c.drawString(175, y + 2, formula)
    c.setFillColor(colors.HexColor("#555555"))
    c.drawString(380, y + 2, note)
    y -= 26
c.setFillColor(colors.HexColor("#1B5E20"))
c.setFont("SegoeUI-Bold", 12.5)
c.drawString(40, y - 20, "2. BẢNG QUY TRÌNH NƯỚC SÂM MIX (NẤU SẴN & Ủ LẠNH)")
y_sam_hdr = y - 48
c.setFillColor(colors.HexColor("#2E7D32"))
c.rect(40, y_sam_hdr, w - 80, 22, fill=True, stroke=False)
c.setFillColor(colors.white)
c.setFont("SegoeUI-Bold", 9.5)
c.drawString(48, y_sam_hdr + 6, "STT")
c.drawString(80, y_sam_hdr + 6, "Tên Món Sâm")
c.drawString(175, y_sam_hdr + 6, "Định Lượng Phục Vụ (Ly 500ml)")
c.drawString(380, y_sam_hdr + 6, "Topping & Decor Chuẩn")
sop_sam = [
    ("1", "Sâm Mía Lau", "300ml nước sâm mía lau ủ lạnh + đầy đá", "1 muỗng hạt chia ngâm nở / Lá dứa tươi decor"),
    ("2", "Sâm Bông Cúc Nhãn Nhục", "280ml cốt sâm bông cúc ủ lạnh + đầy đá", "2-3 quả nhãn nhục mọng nước + 1 muỗng hạt chia"),
    ("3", "Sâm Củ Năng Táo Đỏ", "280ml cốt sâm củ năng ủ lạnh + đầy đá", "2 củ năng giòn ngọt + 2 lát táo đỏ cắt mỏng")
]
y = y_sam_hdr - 22
for stt, name, formula, note in sop_sam:
    c.setFillColor(colors.HexColor("#E8F5E9") if int(stt)%2==0 else colors.white)
    c.rect(40, y - 5, w - 80, 24, fill=True, stroke=True)
    c.setFillColor(colors.HexColor("#333333"))
    c.setFont("SegoeUI-Bold", 9)
    c.drawString(53, y + 2, stt)
    c.setFillColor(colors.HexColor("#2E7D32"))
    c.drawString(80, y + 2, name)
    c.setFillColor(colors.HexColor("#222222"))
    c.setFont("SegoeUI", 8.5)
    c.drawString(175, y + 2, formula)
    c.setFillColor(colors.HexColor("#555555"))
    c.drawString(380, y + 2, note)
    y -= 26
c.setFillColor(colors.HexColor("#333333"))
c.setFont("SegoeUI-Bold", 11.5)
c.drawString(40, y - 25, "LƯU Ý VẬN HÀNH & CHUẨN BỊ CA TRỰC (SOP):")
sop_steps = [
    "1. Ca sáng 6h00: Kiểm tra tủ lạnh, lấy các bình Nước Sâm đã nấu sẵn từ tủ mát ra vị trí rót quầy.",
    "2. Sơ chế trái cây tươi: Rửa sạch dưa hấu, cam, cà rốt, dứa, cóc, cần tây, táo, gừng và bảo quản mát.",
    "3. Đơn Nước Sâm: Rót đúng định lượng cốt sâm ủ lạnh -> thêm topping -> thêm đầy đá -> đóng nắp/dập màng.",
    "4. Đơn Nước Ép: Ép trực tiếp trái cây tươi -> đong đường mật mía & gia vị kích vị theo bảng -> lắc đều với đá."
]
y_step = y - 48
c.setFont("SegoeUI", 9)
c.setFillColor(colors.HexColor("#424242"))
for step in sop_steps:
    c.drawString(50, y_step, step)
    y_step -= 20
c.setFillColor(colors.HexColor("#1E5631"))
c.roundRect(40, 35, w - 80, 45, 8, fill=True, stroke=False)
c.setFillColor(colors.white)
c.setFont("SegoeUI-Bold", 10.5)
c.drawCentredString(w/2, 60, "SÂM MIX • CHUẨN VỊ & ĐỒNG ĐỀU MỌI LY")
c.setFont("SegoeUI", 9)
c.drawCentredString(w/2, 44, "Hotline hỗ trợ & Đặt hàng: 0765 620 195 | Địa chỉ: Conic Garden A - A.01.12")
c.save()
os.makedirs(os.path.dirname(pdf_path_project), exist_ok=True)
shutil.copy(pdf_path, pdf_path_project)
print("PDF_GENERATED_SUCCESSFULLY")
