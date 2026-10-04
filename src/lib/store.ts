// Kho dữ liệu POS & Order — TRẠM KHỞI NGHIỆP – Cơm Tấm Sườn Nướng
// Menu chỉ gồm: Cơm tấm sườn, Topping phổ biến, Cơm chiên các loại.

export const BRAND_NAME = 'TRẠM KHỞI NGHIỆP';
export const BRAND_SUBTITLE = 'Cơm Tấm Sườn Nướng';

export type Category = 'com-tam' | 'com-chien' | 'topping';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: Category;
  /** Tên file ảnh trong thư mục public/. Không có ảnh → hiển thị emoji của danh mục. */
  img?: string;
  description?: string;
}

export interface CategoryInfo {
  id: Category;
  label: string;
  emoji: string;
  color: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { id: 'com-tam', label: 'Cơm Tấm Sườn', emoji: '🍖', color: '#f59e0b' },
  { id: 'com-chien', label: 'Cơm Chiên Các Loại', emoji: '🍳', color: '#ef4444' },
  { id: 'topping', label: 'Topping Thêm', emoji: '➕', color: '#10b981' },
];

export const MENU: MenuItem[] = [
  // --- CƠM TẤM SƯỜN ---
  { id: 'ct-1', name: 'Cơm Tấm Sườn Bì Chả Trứng (Đặc Biệt)', price: 45000, category: 'com-tam', img: 'com_tam_suon.jpg', description: 'Sườn nướng than + Bì + Chả trứng + Trứng ốp la' },
  { id: 'ct-2', name: 'Cơm Tấm Sườn Bì Chả', price: 40000, category: 'com-tam', img: 'com_tam_suon.jpg', description: 'Sườn nướng + Bì + Chả trứng hấp' },
  { id: 'ct-3', name: 'Cơm Tấm Sườn Ốp La', price: 38000, category: 'com-tam', img: 'com_tam_suon.jpg', description: 'Sườn cốt lết nướng + Trứng ốp la' },
  { id: 'ct-4', name: 'Cơm Tấm Sườn Bì', price: 35000, category: 'com-tam', img: 'com_tam_suon.jpg', description: 'Sườn nướng mềm thơm + Bì thính' },
  { id: 'ct-5', name: 'Cơm Tấm Sườn Chả', price: 35000, category: 'com-tam', img: 'com_tam_suon.jpg', description: 'Sườn nướng + Chả trứng hấp' },
  { id: 'ct-6', name: 'Cơm Tấm Sườn', price: 30000, category: 'com-tam', img: 'com_tam_suon.jpg', description: 'Sườn cốt lết nướng than hồng' },
  { id: 'ct-7', name: 'Cơm Tấm 2 Sườn', price: 50000, category: 'com-tam', img: 'com_tam_suon.jpg', description: 'Hai miếng sườn nướng cho người ăn khỏe' },

  // --- CƠM CHIÊN CÁC LOẠI ---
  { id: 'cc-1', name: 'Cơm Chiên Dưa Bò', price: 45000, category: 'com-chien', description: 'Bắp bò xào dưa cải chua + Cơm chiên vàng hạt' },
  { id: 'cc-2', name: 'Cơm Chiên Dương Châu', price: 40000, category: 'com-chien', description: 'Lạp xưởng, tôm, trứng, đậu Hà Lan, cà rốt' },
  { id: 'cc-3', name: 'Cơm Chiên Hải Sản', price: 50000, category: 'com-chien', description: 'Tôm, mực tươi xào cùng cơm chiên' },
  { id: 'cc-4', name: 'Cơm Chiên Gà Xé', price: 40000, category: 'com-chien', description: 'Gà xé phay + Cơm chiên tỏi' },
  { id: 'cc-5', name: 'Cơm Chiên Xá Xíu', price: 40000, category: 'com-chien', description: 'Xá xíu thái lát + Cơm chiên trứng' },
  { id: 'cc-6', name: 'Cơm Chiên Cá Mặn', price: 40000, category: 'com-chien', description: 'Cá mặn chiên giòn đậm vị' },
  { id: 'cc-7', name: 'Cơm Chiên Trứng', price: 30000, category: 'com-chien', description: 'Cơm chiên trứng đơn giản, nhanh gọn' },

  // --- TOPPING PHỔ BIẾN ---
  { id: 'tp-1', name: 'Sườn Nướng Thêm', price: 20000, category: 'topping', img: 'com_tam_suon.jpg' },
  { id: 'tp-2', name: 'Bì Thêm', price: 7000, category: 'topping' },
  { id: 'tp-3', name: 'Chả Trứng Thêm', price: 8000, category: 'topping' },
  { id: 'tp-4', name: 'Trứng Ốp La', price: 7000, category: 'topping' },
  { id: 'tp-5', name: 'Lạp Xưởng', price: 10000, category: 'topping' },
  { id: 'tp-6', name: 'Dưa Cải Xào Bò Thêm', price: 20000, category: 'topping' },
  { id: 'tp-7', name: 'Cơm Thêm', price: 5000, category: 'topping' },
];

export interface OrderLine {
  id: string;
  name: string;
  price: number;
  qty: number;
  note?: string;
}

export type Shift = 'sang' | 'trua' | 'chieu-toi';

export interface ShiftSchedule {
  id: Shift | 'prep' | 'break' | 'close';
  time: string;
  name: string;
  tasks: string;
  isWorkShift?: boolean;
}

export const STORE_SCHEDULE: ShiftSchedule[] = [
  { id: 'prep', time: '06h00', name: 'Chuẩn bị đầu ca', tasks: 'Nhóm than, cắm cơm tấm, ướp thịt' },
  { id: 'sang', time: '06h30 - 10h00', name: 'Ca Sáng (Điểm Tâm & Cafe)', tasks: 'Bán điểm tâm sáng Cơm tấm sườn nướng + Cafe/nước uống + Thức ăn nhanh. Hai bên hỗ trợ giới thiệu khách cho nhau', isWorkShift: true },
  { id: 'trua', time: '10h00 - 14h00', name: 'Ca Trưa (Cao Điểm & Cơm Hộp)', tasks: 'Cao điểm cơm tấm trưa, tập trung toàn bộ bàn ghế phục vụ khách ăn tại quán và giao cơm hộp cho xưởng, văn phòng lân cận', isWorkShift: true },
  { id: 'break', time: '14h00 - 16h00', name: 'Nghỉ giữa ca', tasks: 'Vệ sinh sơ bộ, châm than ủ, nhân sự nghỉ ngơi' },
  { id: 'chieu-toi', time: '16h00 - 21h00', name: 'Ca Chiều - Tối (Cơm Tấm & BBQ)', tasks: 'Bán cơm tấm chiều tối kết hợp Bếp Nướng Mộc BBQ, đồ ăn vặt và mảng thức ăn nhanh', isWorkShift: true },
  { id: 'close', time: '21h00 - 21h30', name: 'Đóng cửa & Chốt ca', tasks: 'Vệ sinh vỉ nướng, dập than, khóa gas, dọn rác sạch sẽ trước khi rời quán' },
];

export type PaymentMethod = 'tienmat' | 'chuyenkhoan' | 'app';
export type OrderType = 'tai-quan' | 'mang-ve' | 'giao-hang';

export interface Order {
  paymentMethod?: PaymentMethod;
  id: string;
  time: string;
  tableNo?: number;
  orderType?: OrderType;
  staff: string;
  shift: Shift;
  lines: OrderLine[];
  total: number;
  cash?: number;
  change?: number;
  note?: string;
  synced: boolean;
}

export const APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyETg2znWnDrNsgq3G2eB0IJxFeb_GdLKo5N68FkFlJVMvTzdt_M_C3YFzL7fcgiyY1/exec";

/** Key localStorage dùng chung cho mọi trang (POS, Nhân viên, Gọi món). */
export const ORDERS_KEY = 'comtam_orders_v1';
export const ORDERS_CHANGED_EVENT = 'comtam_orders_changed';

export function getOrders(): Order[] {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    return raw ? JSON.parse(raw) as Order[] : [];
  } catch {
    return [];
  }
}

export function saveOrder(order: Order) {
  const orders = getOrders().filter(o => o.id !== order.id);
  orders.unshift(order);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(ORDERS_CHANGED_EVENT, { detail: order }));
  }
}

export function deleteOrder(orderId: string) {
  const orders = getOrders().filter(o => o.id !== orderId);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(ORDERS_CHANGED_EVENT, { detail: { id: orderId, deleted: true } }));
  }
}

export interface RevenueSummary {
  totalRevenue: number;
  totalOrders: number;
  cashRevenue: number;
  bankRevenue: number;
  appRevenue: number;
}

export function computeRevenueSummary(orders: Order[]): RevenueSummary {
  let totalRevenue = 0;
  let cashRevenue = 0;
  let bankRevenue = 0;
  let appRevenue = 0;

  for (const o of orders) {
    const amt = o.total || 0;
    totalRevenue += amt;
    if (o.paymentMethod === 'chuyenkhoan') {
      bankRevenue += amt;
    } else if (o.paymentMethod === 'app') {
      appRevenue += amt;
    } else {
      cashRevenue += amt;
    }
  }

  return {
    totalRevenue,
    totalOrders: orders.length,
    cashRevenue,
    bankRevenue,
    appRevenue,
  };
}

export function parseOrderDate(timeStr: string): Date {
  if (!timeStr) return new Date();
  if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(timeStr)) {
    const parts = timeStr.split(/[\/\s:]/);
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const hour = parts[3] ? parseInt(parts[3], 10) : 0;
    const min = parts[4] ? parseInt(parts[4], 10) : 0;
    return new Date(year, month, day, hour, min);
  }
  const d = new Date(timeStr);
  return isNaN(d.getTime()) ? new Date() : d;
}

export function newOrderId(): string {
  return 'DH' + Date.now().toString().slice(-8);
}

export function getScriptUrl(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('custom_app_script_url');
    if (custom && custom.startsWith('http')) return custom.trim();
  }
  return APP_SCRIPT_URL;
}

export function setCustomScriptUrl(url: string) {
  if (typeof window !== 'undefined') {
    if (!url.trim()) {
      localStorage.removeItem('custom_app_script_url');
    } else {
      localStorage.setItem('custom_app_script_url', url.trim());
    }
  }
}

/** Gửi dữ liệu lên Apps Script. Lưu ý: mode 'no-cors' chỉ phát hiện được lỗi mạng, không đọc được phản hồi. */
export async function postToScript(payload: Record<string, unknown>): Promise<boolean> {
  try {
    await fetch(getScriptUrl(), {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload)
    });
    return true;
  } catch {
    return false;
  }
}

function orderPayload(order: Order) {
  return {
    orderId: order.id,
    staff: order.staff,
    shift: order.shift, // Apps Script so sánh trực tiếp với 'sang'
    tableNo: order.tableNo || '',
    orderType: order.orderType || 'tai-quan',
    paymentMethod: order.paymentMethod || 'tienmat',
    items: order.lines.map(l => l.name + ' x' + l.qty + (l.note ? ' (' + l.note + ')' : '')).join(', '),
    detail: JSON.stringify(order.lines),
    note: order.note || '',
    total: order.total,
    cash: order.cash || '',
    change: order.change || '',
    time: order.time
  };
}

/** Đơn đã bán (POS / Nhân viên) → sheet "Don hang", tính vào doanh thu. */
export function syncOrder(order: Order): Promise<boolean> {
  return postToScript({ type: 'order', ...orderPayload(order) });
}

/** Khách tự gọi món tại bàn → sheet "Goi mon tai ban" + báo Telegram. KHÔNG tính doanh thu (nhân viên chốt lại ở POS). */
export function syncTableOrder(order: Order): Promise<boolean> {
  return postToScript({ type: 'table_order', ...orderPayload(order) });
}

/** Xóa đơn trên Google Sheets (Apps Script đã có handler 'delete_order'). */
export function syncDeleteOrder(orderId: string): Promise<boolean> {
  return postToScript({ type: 'delete_order', orderId });
}

/** 
 * Ca Sáng: 06h30 - 10h00
 * Ca Trưa: 10h00 - 14h00
 * Ca Chiều - Tối: 16h00 - 21h00
 */
export function getShift(): Shift {
  const d = new Date();
  const minutes = d.getHours() * 60 + d.getMinutes();
  if (minutes < 10 * 60) return 'sang';
  if (minutes < 15 * 60) return 'trua';
  return 'chieu-toi';
}

export function shiftLabel(s: string): string {
  if (s === 'sang') return '🌅 Ca Sáng (06h30-10h00)';
  if (s === 'trua') return '☀️ Ca Trưa (10h00-14h00)';
  return '🌆 Ca Chiều - Tối (16h00-21h00)';
}

/** Ngày theo giờ máy (VN), dạng YYYY-MM-DD — tránh lệch ngày do toISOString() dùng UTC. */
export function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fmtVND(n: number): string {
  return (n || 0).toLocaleString('vi-VN') + 'đ';
}

export function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('vi-VN');
}
