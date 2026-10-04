// Kho dữ liệu POS & Order Quán Cơm Tấm Sườn Nướng & Cơm Chiên Dưa Bò

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: 'com-tam' | 'com-chien' | 'do-nuong' | 'topping' | 'nuoc-uong';
  img: string;
  description?: string;
}

export const MENU: MenuItem[] = [
  // --- CƠM TẤM SƯỜN NƯỚNG ---
  { id: 'ct-1', name: 'Cơm Tấm Sườn Nướng Đặc Biệt', price: 45000, category: 'com-tam', img: 'com_tam_suon.jpg', description: 'Sườn nướng cốt lết ướp đậm đà + Bì + Chả trứng + Trứng ốp la' },
  { id: 'ct-2', name: 'Cơm Tấm Sườn Nướng Chả Trứng', price: 38000, category: 'com-tam', img: 'com_tam_suon.jpg', description: 'Sườn nướng than hồng + Chả trứng hấp truyền thống' },
  { id: 'ct-3', name: 'Cơm Tấm Sườn Nướng Ốp La', price: 38000, category: 'com-tam', img: 'com_tam_suon.jpg', description: 'Sườn cốt lết + Trứng ốp la lòng đào' },
  { id: 'ct-4', name: 'Cơm Tấm Sườn Nướng Bì Hạt', price: 35000, category: 'com-tam', img: 'com_tam_suon.jpg', description: 'Sườn nướng mềm thơm + Bì thố dai ngon' },

  // --- CƠM CHIÊN DƯA BÒ ---
  { id: 'cc-1', name: 'Cơm Chiên Dưa Bò Hà Nội (Đặc Biệt)', price: 45000, category: 'com-chien', img: 'com_tam_suon.jpg', description: 'Bắp bò xào dưa chua giòn + Cơm chiên dơ hạt vàng ươm' },
  { id: 'cc-2', name: 'Cơm Chiên Dưa Bò Trứng Cháy', price: 48000, category: 'com-chien', img: 'com_tam_suon.jpg', description: 'Cơm chiên dưa bò áp chảo phủ trứng giòn rụm' },
  { id: 'cc-3', name: 'Cơm Chiên Dưa Bò Phần Vừa', price: 35000, category: 'com-chien', img: 'com_tam_suon.jpg', description: 'Định lượng nhẹ nhàng vừa đủ 1 người ăn' },

  // --- ĐỒ NƯỚNG ĐÊM ---
  { id: 'dn-1', name: 'Khay Thịt Xiên Nướng Riềng Sả', price: 50000, category: 'do-nuong', img: 'long_bo_sua_nuong.jpg', description: '5 xiên thịt nướng mắm tôm riềng sả thơm ngất ngây' },
  { id: 'dn-2', name: 'Sườn Bò Nướng Sốt BBQ', price: 75000, category: 'do-nuong', img: 'long_bo_sua_nuong.jpg', description: 'Sườn bò tươi nướng than hồng mềm ngọt' },
  { id: 'dn-3', name: 'Bạch Tuộc Nướng Sa Tế', price: 65000, category: 'do-nuong', img: 'long_bo_sua_nuong.jpg', description: 'Bạch tuộc tươi giòn sần sật cay sa tế' },

  // --- TOPPING THÊM ---
  { id: 'tp-1', name: 'Miếng Sườn Nướng Thêm', price: 20000, category: 'topping', img: 'com_tam_suon.jpg', description: 'Sườn nướng cốt lết ướp đậm vị' },
  { id: 'tp-2', name: 'Chả Trứng Hấp', price: 8000, category: 'topping', img: 'com_tam_suon.jpg', description: 'Chả trứng thịt băm miến mộc nhĩ' },
  { id: 'tp-3', name: 'Trứng Ốp La Lòng Đào', price: 7000, category: 'topping', img: 'com_tam_suon.jpg', description: 'Trứng gà tươi ốp la' },
  { id: 'tp-4', name: 'Tô Dưa Cải Xào Bò Thêm', price: 25000, category: 'topping', img: 'com_tam_suon.jpg', description: 'Dưa chua xào bắp bò đậm đà' },

  // --- NƯỚC UỐNG & SÂM ---
  { id: 'nu-1', name: 'Nước Sâm Mix Hạt Chia & Mủ Trôm', price: 15000, category: 'nuoc-uong', img: 'sam_mia_lau_v2.jpg', description: 'Sâm 24 vị mát gan giải nhiệt' },
  { id: 'nu-2', name: 'Trà Tắc Mật Ong Lạnh', price: 12000, category: 'nuoc-uong', img: 'sam_bong_cuc_v2.jpg', description: 'Trà tắc tươi mát ngọt dịu' },
  { id: 'nu-3', name: 'Nước Mía Siêu Sạch', price: 10000, category: 'nuoc-uong', img: 'sam_cu_nang_v2.jpg', description: 'Nước mía ép tươi nguyên chất' },
  { id: 'nu-4', name: 'Bia / Nước Ngọt Các Loại', price: 15000, category: 'nuoc-uong', img: 'logo_v2.jpg', description: 'Tiger, Larue, Coca, Redbull' }
];

export interface OrderLine {
  id: string;
  name: string;
  price: number;
  qty: number;
  note?: string;
}

export interface Order {
  paymentMethod?: 'tienmat' | 'chuyenkhoan' | 'app';
  id: string;
  time: string;
  tableNo?: number;
  orderType?: 'tai-quan' | 'mang-ve' | 'giao-hang';
  staff: string;
  shift: 'sang' | 'trua' | 'toi' | 'gay' | 'chieu';
  lines: OrderLine[];
  total: number;
  cash?: number;
  change?: number;
  synced: boolean;
}

export const APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyETg2znWnDrNsgq3G2eB0IJxFeb_GdLKo5N68FkFlJVMvTzdt_M_C3YFzL7fcgiyY1/exec";

const ORDERS_KEY = 'comtam_orders_v1';

export function getOrders(): Order[] {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    return raw ? JSON.parse(raw) as Order[] : [];
  } catch {
    return [];
  }
}

export function saveOrder(order: Order) {
  const orders = getOrders();
  orders.unshift(order);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

export function deleteOrder(orderId: string) {
  const orders = getOrders().filter(o => o.id !== orderId);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

export async function syncOrder(order: Order): Promise<boolean> {
  try {
    await fetch(APP_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        type: 'order',
        orderId: order.id,
        staff: order.staff,
        shift: order.shift,
        tableNo: order.tableNo || '',
        paymentMethod: order.paymentMethod || 'tienmat',
        items: order.lines.map(l => l.name + 'x' + l.qty + (l.note ? ' (' + l.note + ')' : '')).join(', '),
        detail: JSON.stringify(order.lines),
        total: order.total,
        cash: order.cash || '',
        change: order.change || '',
        time: order.time
      })
    });
    return true;
  } catch {
    return false;
  }
}

export async function syncDeleteOrder(orderId: string): Promise<boolean> {
  return true;
}

export function getShift(): 'sang' | 'trua' | 'toi' | 'gay' | 'chieu' {
  const h = new Date().getHours();
  if (h >= 7 && h < 12) return 'sang';
  if (h >= 12 && h < 16) return 'trua';
  return 'toi';
}

export function shiftLabel(s: string): string {
  return 'Ca Chiều Tối (13h-21h)';
}

export function fmtVND(n: number): string {
  return n.toLocaleString('vi-VN') + 'đ';
}

export function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('vi-VN');
}
