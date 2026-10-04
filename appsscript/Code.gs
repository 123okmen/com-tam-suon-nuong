// ============================================================
// TRẠM KHỞI NGHIỆP – CƠM TẤM SƯỜN NƯỚNG & CƠM CHIÊN
// Google Apps Script kết nối Web App: Đơn Hàng | Chấm Công | Báo Cáo Cuối Ca | Off Ca | Tổng Hợp KPI
// Hỗ trợ đồng bộ Real-time 2 chiều & Thông báo Telegram
// ============================================================

var STORE_NAME = 'TRẠM KHỞI NGHIỆP – Cơm Tấm Sườn Nướng';
var TG_BOT_TOKEN = '8755799868:AAHKmMYP9TAm3fAFiGO0zLDYIpcddV90oFc';
var TG_CHAT_ID = '7220726428';

// ================= TỰ ĐỘNG TẠO MENU KHI MỞ TRANG TÍNH =================
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🍖 Quản Lý Cơm Tấm')
    .addItem('⚡ Khởi tạo / Định dạng 5 Tabs Chuẩn', 'setupAllSheets')
    .addItem('📊 Cập nhật Công thức Tổng Hợp KPI', 'setupKpiDashboard')
    .addItem('📢 Gửi Tổng Kết Hôm Nay qua Telegram', 'sendTodaySummaryTelegram')
    .addToUi();
}

// ================= XỬ LÝ POST TỪ WEB APP =================
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonErr('Khong co du lieu POST');
    }
    var data = JSON.parse(e.postData.contents);
    var type = data.type;

    if (type === 'order' || type === 'table_order') return handleOrder(data, type);
    if (type === 'checkin' || type === 'checkout') return handleAttendance(data, type);
    if (type === 'report') return handleReport(data);
    if (type === 'off_request' || type === 'off') return handleOffRequest(data);
    if (type === 'delete_order') return handleDeleteOrder(data);
    if (type === 'summary') return handleSummary(data);

    return jsonOk('Da nhan nhung chua co handler cho type: ' + type);
  } catch (err) {
    return jsonErr('Loi xu ly doPost: ' + err.toString());
  }
}

// ================= XỬ LÝ GET (API DATA & SETUP) =================
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : '';

  if (action === 'data') return apiRealtimeData();
  if (action === 'setup') return apiSetupSheets();
  if (action === 'orders') return apiRecentOrders();
  if (action === 'reset') return handleResetAllData();

  // Mặc định: Dashboard HTML trực tiếp
  return renderLiveDashboard();
}

// ================= 1. XỬ LÝ ĐƠN HÀNG (NHẬP MÓN & TẠI BÀN) =================
function handleOrder(data, type) {
  var headers = [
    'Mã Đơn', 'Ngày', 'Giờ', 'Nguồn Đơn', 'Nhân Viên / Khách',
    'Ca Làm', 'Chi Tiết Món', 'Số Món', 'Tổng Tiền',
    'Phương Thức TT', 'Tiền Khách Đưa', 'Tiền Thối', 'Ghi Chú'
  ];
  var sheet = getOrCreateSheet('Đơn Hàng', headers, '#166534');
  var t = nowParts();

  var orderId = String(data.orderId || data.id || ('DH' + Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'HHmmss')));
  var dateStr = Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy');
  var timeStr = t.gio;

  var nguonDon = 'POS Thu ngân';
  if (type === 'table_order' || data.tableNo) {
    nguonDon = data.tableNo ? ('Bàn ' + data.tableNo) : 'Khách gọi bàn';
  } else if (data.orderType === 'mang-ve') {
    nguonDon = 'Mang về';
  } else if (data.orderType === 'giao-hang' || data.paymentMethod === 'app') {
    nguonDon = 'Đơn App / Giao hàng';
  }

  // Phân tích chi tiết món ăn
  var lines = [];
  var soMon = 0;
  var detail = data.detail;

  if (typeof detail === 'string') {
    try { detail = JSON.parse(detail); } catch (err) { detail = null; }
  }
  if (Array.isArray(detail)) {
    for (var i = 0; i < detail.length; i++) {
      var it = detail[i];
      var q = num(it.qty);
      var p = num(it.price);
      soMon += q;
      var noteStr = it.note ? ' (' + it.note + ')' : '';
      lines.push((it.name || 'Món') + ' x' + q + noteStr + ' = ' + moneyFmt(q * p));
    }
  }

  if (lines.length === 0 && data.items) {
    var raw = String(data.items);
    var parts = raw.split(',');
    for (var j = 0; j < parts.length; j++) {
      var pt = parts[j].trim();
      if (!pt) continue;
      var m = pt.match(/x(\d+)/);
      soMon += (m ? Number(m[1]) : 1);
      lines.push(pt);
    }
  }

  if (lines.length === 0) {
    lines.push('Đơn hàng cơm tấm');
    soMon = 1;
  }

  // Phương thức thanh toán
  var pt = 'Tiền mặt';
  if (data.paymentMethod === 'chuyenkhoan') pt = 'Chuyển khoản';
  else if (data.paymentMethod === 'app') pt = 'Đơn App';

  // Ca làm
  var caTxt = 'Ca Sáng (06h30-10h00)';
  if (data.shift === 'trua') caTxt = 'Ca Trưa (10h00-14h00)';
  else if (data.shift === 'chieu-toi') caTxt = 'Ca Chiều - Tối (16h00-21h00)';

  sheet.appendRow([
    orderId,
    dateStr,
    timeStr,
    nguonDon,
    data.staff || data.name || (data.tableNo ? 'Khách Bàn ' + data.tableNo : 'Khách'),
    caTxt,
    lines.join('\n'),
    soMon,
    num(data.total),
    pt,
    num(data.cash),
    num(data.change),
    data.note || ''
  ]);

  var r = sheet.getLastRow();
  sheet.getRange(r, 9).setNumberFormat('#,##0" đ"').setFontWeight('bold').setFontColor('#166534');
  sheet.getRange(r, 11).setNumberFormat('#,##0" đ"');
  sheet.getRange(r, 12).setNumberFormat('#,##0" đ"');
  sheet.getRange(r, 7).setWrap(true).setVerticalAlignment('top');

  // Thông báo Telegram
  var tgMsg = '🛒 ĐƠN HÀNG MỚI #' + orderId + '\n'
            + '📍 ' + nguonDon + ' | ' + caTxt + ' | ' + timeStr + '\n'
            + '👤 ' + (data.staff || 'Khách gọi món') + '\n'
            + '-----------------------------\n'
            + lines.join('\n') + '\n'
            + '-----------------------------\n'
            + '💰 TỔNG CỘNG: ' + moneyFmt(data.total) + ' (' + pt + ')';
  if (data.cash) tgMsg += '\n💵 Khách đưa: ' + moneyFmt(data.cash) + ' (Thối: ' + moneyFmt(data.change) + ')';
  if (data.note) tgMsg += '\n📝 Ghi chú: ' + data.note;

  sendTelegram(tgMsg);

  return jsonOk('Đã lưu đơn ' + orderId + ' (' + moneyFmt(data.total) + ') vào Sheet Đơn Hàng!');
}

// ================= 2. XỬ LÝ CHẤM CÔNG (CHECK-IN / CHECK-OUT) =================
function handleAttendance(data, type) {
  var headers = ['Ngày', 'Giờ', 'Tên Nhân Viên', 'Thao Tác', 'Ca Làm Việc', 'Ghi Chú'];
  var sheet = getOrCreateSheet('Chấm Công', headers, '#1e40af');
  var t = nowParts();

  var isCheckin = (type === 'checkin');
  var actionLabel = isCheckin ? 'CHECK-IN' : 'CHECK-OUT';
  var dateStr = Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy');

  sheet.appendRow([
    dateStr,
    t.gio,
    data.staff || data.name || 'Nhân viên',
    actionLabel,
    data.shift || t.ca,
    data.note || ''
  ]);

  var r = sheet.getLastRow();
  var cellAction = sheet.getRange(r, 4);
  if (isCheckin) {
    cellAction.setBackground('#dcfce7').setFontColor('#15803d').setFontWeight('bold');
  } else {
    cellAction.setBackground('#fee2e2').setFontColor('#b91c1c').setFontWeight('bold');
  }

  // Telegram
  var icon = isCheckin ? '✅' : '🚪';
  var tgMsg = icon + ' ' + actionLabel + ': ' + (data.staff || data.name) + '\n'
            + '⏰ Giờ: ' + t.gio + ' | Ngày: ' + dateStr + '\n'
            + '🕒 Ca: ' + (data.shift || t.ca);
  sendTelegram(tgMsg);

  return jsonOk('Đã ghi nhận ' + actionLabel + ' cho ' + (data.staff || data.name) + ' lúc ' + t.gio);
}

// ================= 3. XỬ LÝ BÁO CÁO CUỐI CA =================
function handleReport(data) {
  var headers = ['Ngày', 'Giờ Chốt', 'Tên Nhân Viên', 'Ca Làm Việc', 'Tổng Doanh Thu', 'Tiền Mặt', 'Chuyển Khoản', 'Ghi Chú Cuối Ca'];
  var sheet = getOrCreateSheet('Báo Cáo Cuối Ca', headers, '#b45309');
  var t = nowParts();
  var dateStr = Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy');

  var rev = num(data.revenue || data.doanhThu || data.doanh_thu);
  var cash = num(data.cash || data.tienMat || data.tien_mat);
  var bank = num(data.transfer || data.tienChuyenKhoan || data.tien_chuyen_khoan);

  sheet.appendRow([
    dateStr,
    t.gio,
    data.staff || data.name || '',
    data.shift || t.ca,
    rev,
    cash,
    bank,
    data.note || data.ghi_chu || data.ghiChu || ''
  ]);

  var r = sheet.getLastRow();
  sheet.getRange(r, 5).setNumberFormat('#,##0" đ"').setFontWeight('bold').setFontColor('#b45309');
  sheet.getRange(r, 6).setNumberFormat('#,##0" đ"');
  sheet.getRange(r, 7).setNumberFormat('#,##0" đ"');

  // Telegram
  var tgMsg = '📋 BÁO CÁO CUỐI CA\n'
            + '👤 ' + (data.staff || data.name) + ' | ' + (data.shift || t.ca) + '\n'
            + '📅 ' + dateStr + ' ' + t.gio + '\n'
            + '-----------------------------\n'
            + '💰 Doanh thu ca: ' + moneyFmt(rev) + '\n'
            + '💵 Tiền mặt: ' + moneyFmt(cash) + '\n'
            + '💳 Chuyển khoản: ' + moneyFmt(bank) + '\n';
  var note = data.note || data.ghi_chu || data.ghiChu;
  if (note) tgMsg += '📝 Ghi chú: ' + note;

  sendTelegram(tgMsg);

  return jsonOk('Đã lưu báo cáo ca ' + moneyFmt(rev) + ' của ' + (data.staff || data.name));
}

// ================= 4. XỬ LÝ XIN NGHỈ CA (OFF CA) =================
function handleOffRequest(data) {
  var headers = ['Thời Gian Gửi', 'Tên Nhân Viên', 'Ngày Xin Nghỉ', 'Ca Xin Nghỉ', 'Lý Do Nghỉ', 'Trạng Thái'];
  var sheet = getOrCreateSheet('Off Ca', headers, '#7c2d12');
  var t = nowParts();

  var sendTime = Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm:ss');
  var offDate = normDay(data.date) || Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy');

  sheet.appendRow([
    sendTime,
    data.staff || data.name || '',
    offDate,
    data.shift || 'Cả ngày',
    data.reason || 'Bận việc gia đình',
    'Chờ duyệt'
  ]);

  var r = sheet.getLastRow();
  sheet.getRange(r, 6).setBackground('#fef3c7').setFontColor('#b45309').setFontWeight('bold');

  // Telegram
  var tgMsg = '🏖️ ĐƠN XIN NGHỈ CA MỚI\n'
            + '👤 Nhân viên: ' + (data.staff || data.name) + '\n'
            + '📅 Ngày xin nghỉ: ' + offDate + '\n'
            + '🕒 Ca: ' + (data.shift || 'Cả ngày') + '\n'
            + '📝 Lý do: ' + (data.reason || 'Bận việc gia đình');
  sendTelegram(tgMsg);

  return jsonOk('Đã gửi đơn xin nghỉ ca cho ' + (data.staff || data.name));
}

// ================= 5. XÓA ĐƠN HÀNG =================
function handleDeleteOrder(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Đơn Hàng') || ss.getSheetByName('Don hang');
  var orderId = String(data.orderId || data.id || '').trim();
  if (!sheet || !orderId) return jsonErr('Không tìm thấy sheet Đơn Hàng hoặc Mã đơn');

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return jsonOk('Sheet trống');

  var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  var deleted = 0;

  for (var i = ids.length - 1; i >= 0; i--) {
    if (String(ids[i][0] || '').trim() === orderId) {
      sheet.deleteRow(i + 2);
      deleted++;
    }
  }

  if (deleted > 0) {
    sendTelegram('🗑️ ĐÃ XÓA ĐƠN HÀNG #' + orderId + ' trên Google Sheets');
    return jsonOk('Đã xóa ' + deleted + ' dòng cho đơn ' + orderId);
  }
  return jsonOk('Không tìm thấy đơn ' + orderId);
}

// ================= 6. TỰ ĐỘNG KHỞI TẠO 5 TABS CHUẨN =================
function setupAllSheets() {
  // 1. Tab Đơn Hàng
  getOrCreateSheet('Đơn Hàng', [
    'Mã Đơn', 'Ngày', 'Giờ', 'Nguồn Đơn', 'Nhân Viên / Khách',
    'Ca Làm', 'Chi Tiết Món', 'Số Món', 'Tổng Tiền',
    'Phương Thức TT', 'Tiền Khách Đưa', 'Tiền Thối', 'Ghi Chú'
  ], '#166534');

  // 2. Tab Chấm Công
  getOrCreateSheet('Chấm Công', [
    'Ngày', 'Giờ', 'Tên Nhân Viên', 'Thao Tác', 'Ca Làm Việc', 'Ghi Chú'
  ], '#1e40af');

  // 3. Tab Báo Cáo Cuối Ca
  getOrCreateSheet('Báo Cáo Cuối Ca', [
    'Ngày', 'Giờ Chốt', 'Tên Nhân Viên', 'Ca Làm Việc',
    'Tổng Doanh Thu', 'Tiền Mặt', 'Chuyển Khoản', 'Ghi Chú Cuối Ca'
  ], '#b45309');

  // 4. Tab Off Ca
  getOrCreateSheet('Off Ca', [
    'Thời Gian Gửi', 'Tên Nhân Viên', 'Ngày Xin Nghỉ', 'Ca Xin Nghỉ', 'Lý Do Nghỉ', 'Trạng Thái'
  ], '#7c2d12');

  // 5. Tab Tổng Hợp KPI
  setupKpiDashboard();

  return 'Đã khởi tạo thành công 5 tabs: Đơn Hàng, Chấm Công, Báo Cáo Cuối Ca, Off Ca, Tổng Hợp KPI!';
}

// Tạo trang Tổng Hợp KPI với các công thức tự động
function setupKpiDashboard() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Tổng Hợp KPI');
  if (!sheet) sheet = ss.insertSheet('Tổng Hợp KPI', 0); // Đưa lên đầu

  sheet.clear();
  sheet.setTabColor('#f59e0b');

  // Tiêu đề
  sheet.getRange('A1:F1').merge()
    .setValue('🍖 TRẠM KHỞI NGHIỆP – BẢNG ĐIỀU KHIỂN DOANH THU & KPI TỰ ĐỘNG')
    .setBackground('#0f172a').setFontColor('#f59e0b')
    .setFontWeight('bold').setFontSize(14)
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  sheet.setRowHeight(1, 40);

  // Khối 1: Hôm nay
  sheet.getRange('A3:F3').merge().setValue('📌 CHỈ SỐ HÔM NAY (REAL-TIME)').setFontWeight('bold').setBackground('#f1f5f9').setFontColor('#0f172a');
  
  sheet.getRange('A4').setValue('Chỉ số').setFontWeight('bold');
  sheet.getRange('B4').setValue('Giá trị').setFontWeight('bold');
  sheet.getRange('C4').setValue('Công thức / Nguồn').setFontWeight('bold');

  sheet.getRange('A5').setValue('Doanh Thu Hôm Nay:');
  sheet.getRange('B5').setFormula('=IFERROR(SUMIFS(\'Đơn Hàng\'!I:I, \'Đơn Hàng\'!B:B, TEXT(TODAY(), "dd/mm/yyyy")), 0)').setNumberFormat('#,##0" đ"').setFontWeight('bold').setFontSize(12).setFontColor('#166534');
  sheet.getRange('C5').setValue('Tổng tiền cột I từ sheet Đơn Hàng');

  sheet.getRange('A6').setValue('Số Đơn Hàng Hôm Nay:');
  sheet.getRange('B6').setFormula('=IFERROR(COUNTIF(\'Đơn Hàng\'!B:B, TEXT(TODAY(), "dd/mm/yyyy")), 0)').setFontWeight('bold');
  sheet.getRange('C6').setValue('Đếm số đơn cột B từ sheet Đơn Hàng');

  sheet.getRange('A7').setValue('Tiền Mặt Hôm Nay:');
  sheet.getRange('B7').setFormula('=IFERROR(SUMIFS(\'Đơn Hàng\'!I:I, \'Đơn Hàng\'!B:B, TEXT(TODAY(), "dd/mm/yyyy"), \'Đơn Hàng\'!J:J, "*Tiền mặt*"), 0)').setNumberFormat('#,##0" đ"');
  sheet.getRange('C7').setValue('Cột J = Tiền mặt');

  sheet.getRange('A8').setValue('Chuyển Khoản Hôm Nay:');
  sheet.getRange('B8').setFormula('=IFERROR(SUMIFS(\'Đơn Hàng\'!I:I, \'Đơn Hàng\'!B:B, TEXT(TODAY(), "dd/mm/yyyy"), \'Đơn Hàng\'!J:J, "*Chuyển khoản*"), 0)').setNumberFormat('#,##0" đ"');
  sheet.getRange('C8').setValue('Cột J = Chuyển khoản');

  // Khối 2: Tuần & Tháng
  sheet.getRange('A10:F10').merge().setValue('📈 TỔNG QUAN TOÀN BỘ HỆ THỐNG').setFontWeight('bold').setBackground('#f1f5f9').setFontColor('#0f172a');

  sheet.getRange('A11').setValue('Tổng Doanh Thu Đã Bán:');
  sheet.getRange('B11').setFormula('=IFERROR(SUM(\'Đơn Hàng\'!I2:I), 0)').setNumberFormat('#,##0" đ"').setFontWeight('bold').setFontColor('#b45309');

  sheet.getRange('A12').setValue('Tổng Số Đơn Đã Bán:');
  sheet.getRange('B12').setFormula('=IFERROR(COUNTA(\'Đơn Hàng\'!A2:A), 0)').setFontWeight('bold');

  sheet.getRange('A13').setValue('Tổng Lượt Chấm Công:');
  sheet.getRange('B13').setFormula('=IFERROR(COUNTA(\'Chấm Công\'!A2:A), 0)');

  sheet.getRange('A14').setValue('Số Đơn Xin Nghỉ Ca:');
  sheet.getRange('B14').setFormula('=IFERROR(COUNTA(\'Off Ca\'!A2:A), 0)');

  sheet.setColumnWidth(1, 200);
  sheet.setColumnWidth(2, 180);
  sheet.setColumnWidth(3, 260);

  return sheet;
}

// ================= 7. API TRẢ DỮ LIỆU REAL-TIME CHO WEB APP (?action=data) =================
function apiRealtimeData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var t = nowParts();

  var tongDoanhThu = 0, tongTienMat = 0, tongChuyenKhoan = 0, soDon = 0, soMon = 0;
  var recentOrders = [];
  var baoCaoList = [];
  var attendanceList = [];
  var offList = [];

  // 1. Đọc sheet Đơn Hàng
  var dh = ss.getSheetByName('Đơn Hàng') || ss.getSheetByName('Don hang');
  if (dh && dh.getLastRow() > 1) {
    var maxRows = Math.min(dh.getLastRow() - 1, 200);
    var startRow = Math.max(2, dh.getLastRow() - maxRows + 1);
    var numRows = dh.getLastRow() - startRow + 1;
    var dvals = dh.getRange(startRow, 1, numRows, dh.getLastColumn()).getValues();

    for (var i = dvals.length - 1; i >= 0; i--) {
      var row = dvals[i];
      var orderId = String(row[0] || '');
      var ngay = normDay(row[1]);
      var gio = normHour(row[2]);
      var total = num(row[8]);
      var pt = String(row[9] || '');

      if (ngay === t.ngay) {
        soDon++;
        tongDoanhThu += total;
        soMon += num(row[7]);
        if (pt.toLowerCase().indexOf('chuyen') >= 0 || pt.toLowerCase().indexOf('ck') >= 0) {
          tongChuyenKhoan += total;
        } else {
          tongTienMat += total;
        }
      }

      if (recentOrders.length < 50) {
        recentOrders.push({
          id: orderId,
          date: ngay,
          time: gio,
          staff: String(row[4] || ''),
          source: String(row[3] || ''),
          shift: String(row[5] || ''),
          items: String(row[6] || ''),
          total: total,
          paymentMethod: pt
        });
      }
    }
  }

  // 2. Đọc sheet Báo Cáo Cuối Ca
  var bc = ss.getSheetByName('Báo Cáo Cuối Ca') || ss.getSheetByName('Bao cao doanh thu');
  if (bc && bc.getLastRow() > 1) {
    var bvals = bc.getRange(2, 1, bc.getLastRow() - 1, Math.min(bc.getLastColumn(), 8)).getValues();
    for (var b = bvals.length - 1; b >= 0; b--) {
      var brow = bvals[b];
      baoCaoList.push({
        ngay: normDay(brow[0]),
        gio: normHour(brow[1]),
        nv: String(brow[2] || ''),
        ca: String(brow[3] || ''),
        doanhThu: num(brow[4]),
        tienMat: num(brow[5]),
        tienChuyenKhoan: num(brow[6]),
        ghiChu: String(brow[7] || '')
      });
    }
  }

  var res = {
    ok: true,
    store: STORE_NAME,
    thoiGian: t.gio,
    ngay: t.ngay,
    ca: t.ca,
    kpi: {
      doanhThu: tongDoanhThu,
      tienMat: tongTienMat,
      tienChuyenKhoan: tongChuyenKhoan,
      soDon: soDon,
      soMon: soMon
    },
    donHang: recentOrders,
    baoCao: baoCaoList
  };

  return ContentService.createTextOutput(JSON.stringify(res))
    .setMimeType(ContentService.MimeType.JSON);
}

function apiSetupSheets() {
  var msg = setupAllSheets();
  return jsonOk(msg);
}

function apiRecentOrders() {
  return apiRealtimeData();
}

// ================= TIỆN ÍCH TẠO SHEET =================
function getOrCreateSheet(name, headers, headerColor) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }

  // Kiểm tra header dòng 1
  var needHeader = false;
  if (sheet.getLastRow() < 1) {
    needHeader = true;
  } else {
    var firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
    for (var i = 0; i < headers.length; i++) {
      if (String(firstRow[i] || '') !== headers[i]) {
        needHeader = true;
        break;
      }
    }
  }

  if (needHeader) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  // Định dạng dòng tiêu đề
  var hr = sheet.getRange(1, 1, 1, headers.length);
  hr.setFontWeight('bold')
    .setBackground(headerColor || '#14663c')
    .setFontColor('#ffffff')
    .setVerticalAlignment('middle')
    .setHorizontalAlignment('center');

  sheet.setFrozenRows(1);
  sheet.setRowHeight(1, 32);

  return sheet;
}

function nowParts() {
  var now = new Date();
  var h = now.getHours();
  var ca = 'Ca Chiều - Tối (16h00-21h00)';
  if (h >= 6 && h < 10) ca = 'Ca Sáng (06h30-10h00)';
  else if (h >= 10 && h < 15) ca = 'Ca Trưa (10h00-14h00)';

  return {
    ngay: Utilities.formatDate(now, 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy'),
    gio: Utilities.formatDate(now, 'Asia/Ho_Chi_Minh', 'HH:mm:ss'),
    ca: ca
  };
}

function num(v) {
  var n = Number(v);
  return isNaN(n) ? 0 : n;
}

function moneyFmt(v) {
  var n = Number(v);
  if (isNaN(n) || n === 0) return '0 đ';
  return n.toLocaleString('vi-VN') + ' đ';
}

function normDay(v) {
  if (!v) return '';
  if (v instanceof Date) return Utilities.formatDate(v, 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy');
  var s = String(v).trim();
  if (s.length > 10 && s.indexOf('/') < 0) {
    var d = new Date(s);
    if (!isNaN(d.getTime())) return Utilities.formatDate(d, 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy');
  }
  return s.substring(0, 10);
}

function normHour(v) {
  if (!v) return '';
  if (v instanceof Date) return Utilities.formatDate(v, 'Asia/Ho_Chi_Minh', 'HH:mm:ss');
  var s = String(v).trim();
  var m = s.match(/(\d{1,2}):(\d{2})/);
  if (m) return (m[1].length === 1 ? '0' + m[1] : m[1]) + ':' + m[2];
  return s.substring(0, 8);
}

function jsonOk(msg) {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, msg: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonErr(msg) {
  return ContentService.createTextOutput(JSON.stringify({ ok: false, msg: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}

function sendTelegram(text) {
  if (!TG_BOT_TOKEN || !TG_CHAT_ID) return;
  try {
    var payload = {
      method: 'post',
      payload: {
        chat_id: TG_CHAT_ID,
        text: text,
        disable_web_page_preview: true
      }
    };
    UrlFetchApp.fetch('https://api.telegram.org/bot' + TG_BOT_TOKEN + '/sendMessage', payload);
  } catch (err) {
    Logger.log('Telegram error: ' + err);
  }
}

function sendTodaySummaryTelegram() {
  var t = nowParts();
  var data = apiRealtimeData();
  var d = JSON.parse(data.getContent());
  var k = d.kpi;

  var msg = '📊 TỔNG KẾT DOANH THU HÔM NAY (' + t.ngay + ')\n'
          + '⏰ Cập nhật lúc: ' + t.gio + '\n'
          + '-----------------------------\n'
          + '💰 TỔNG THU: ' + moneyFmt(k.doanhThu) + '\n'
          + '📦 SỐ ĐƠN: ' + k.soDon + ' đơn (' + k.soMon + ' phần)\n'
          + '💵 TIỀN MẶT: ' + moneyFmt(k.tienMat) + '\n'
          + '💳 CHUYỂN KHOẢN: ' + moneyFmt(k.tienChuyenKhoan);
  sendTelegram(msg);
}

// Reset sạch dữ liệu test nhưng giữ nguyên Header 5 tabs
function handleResetAllData() {
  setupAllSheets();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var names = ['Đơn Hàng', 'Chấm Công', 'Báo Cáo Cuối Ca', 'Off Ca'];
  for (var i = 0; i < names.length; i++) {
    var s = ss.getSheetByName(names[i]);
    if (s && s.getLastRow() > 1) {
      s.getRange(2, 1, s.getLastRow() - 1, s.getLastColumn()).clearContent();
    }
  }
  return jsonOk('Đã xóa dữ liệu test trên 4 tabs, giữ nguyên header chuẩn!');
}

// HTML Dashboard xem trực tiếp
function renderLiveDashboard() {
  var t = nowParts();
  var html = '<!DOCTYPE html><html><head><meta charset="utf-8">'
           + '<meta name="viewport" content="width=device-width,initial-scale=1">'
           + '<title>' + STORE_NAME + '</title>'
           + '<style>'
           + 'body{font-family:system-ui,-apple-system,sans-serif;background:#0f172a;color:#f8fafc;padding:20px;text-align:center;margin:0}'
           + '.card{max-width:480px;margin:20px auto;background:#1e293b;padding:24px;border-radius:16px;border:1px solid #334155;box-shadow:0 10px 25px rgba(0,0,0,0.3)}'
           + 'h1{color:#f59e0b;font-size:1.4rem;margin-top:0}'
           + '.btn{display:inline-block;padding:10px 20px;background:#10b981;color:#0f172a;text-decoration:none;border-radius:8px;font-weight:bold;margin-top:15px}'
           + '</style></head><body>'
           + '<div class="card">'
           + '<h1>🍖 ' + STORE_NAME + '</h1>'
           + '<p>Hệ thống kết nối Google Sheets & Web App đang hoạt động tốt!</p>'
           + '<p style="color:#94a3b8;font-size:0.9rem">Hôm nay: ' + t.ngay + ' lúc ' + t.gio + '</p>'
           + '<a class="btn" href="?action=data">Xem JSON Data</a>'
           + '</div></body></html>';
  return HtmlService.createHtmlOutput(html).setTitle(STORE_NAME);
}