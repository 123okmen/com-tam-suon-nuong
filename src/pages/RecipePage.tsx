import React, { useState, useEffect } from 'react';
import LoginGate from '../components/LoginGate';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

interface Order {
  id: string;
  time: string;
  staff: string;
  items: OrderItem[];
  total: number;
  paymentMethod: 'tienmat' | 'chuyenkhoan';
  isPromo: boolean;
  note: string;
}

const MENU_ITEMS = [
  { id: 'sam_cuc', name: 'Sâm Bông Cúc Nhãn Nhục', originalPrice: 15000 },
  { id: 'sam_nang', name: 'Sâm Củ Năng Táo Đỏ', originalPrice: 15000 },
  { id: 'sam_mia', name: 'Sâm Mía Lau', originalPrice: 15000 },
  { id: 'ep_cam', name: 'Cam Sành Miền Tây', originalPrice: 25000 },
  { id: 'ep_carot', name: 'Cà Rốt Đà Lạt', originalPrice: 20000 },
  { id: 'ep_dua', name: 'Dứa Mật', originalPrice: 20000 },
  { id: 'ep_coc', name: 'Cóc Non', originalPrice: 20000 },
  { id: 'ep_cantay', name: 'Cần Tây Mix Táo', originalPrice: 30000 },
  { id: 'nem_nuong', name: 'Nem Nướng', originalPrice: 15000 },
  { id: 'oc_buou_nhoi_thit', name: 'Ốc Bươu Nhồi Thịt', originalPrice: 50000 },
  { id: 'long_bo_sua_nuong', name: 'Lòng Bò Sữa Nướng', originalPrice: 60000 },
  { id: 'vu_heo_dau_bap', name: 'Vú Heo Đậu Bắp', originalPrice: 60000 },
];

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz-75MfvgUDcWexbQ6hJbyT42P3gVm5R6l585fnRMBC8sd_pMZyh9mJbMAa98HpsfAk/exec";

export default function RecipePage() {
  const [shiftStatus, setShiftStatus] = useState<string>('Chưa check-in');
  const [staffName, setStaffName] = useState<string>(() => localStorage.getItem('sam_staff_name') || '');
  
  // Order state
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('sam_shift_orders');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  
  const [isPromo10k, setIsPromo10k] = useState<boolean>(true); // Khai trương đồng giá 10k mặc định bật
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [orderPaymentMethod, setOrderPaymentMethod] = useState<'tienmat' | 'chuyenkhoan'>('tienmat');
  const [orderNote, setOrderNote] = useState<string>('');

  // Report state
  const [reportData, setReportData] = useState({
    doanhThu: '',
    tienMat: '',
    tienChuyenKhoan: '',
    ghiChu: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Save staff name & orders to localStorage
  useEffect(() => {
    if (staffName) localStorage.setItem('sam_staff_name', staffName);
  }, [staffName]);

  useEffect(() => {
    localStorage.setItem('sam_shift_orders', JSON.stringify(orders));
  }, [orders]);

  // Update report auto calculation from orders
  const autoTotalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const autoTotalCash = orders.filter(o => o.paymentMethod === 'tienmat').reduce((sum, o) => sum + o.total, 0);
  const autoTotalTransfer = orders.filter(o => o.paymentMethod === 'chuyenkhoan').reduce((sum, o) => sum + o.total, 0);

  const fillReportFromOrders = () => {
    setReportData({
      doanhThu: autoTotalRevenue.toLocaleString('vi-VN') + 'đ',
      tienMat: autoTotalCash.toLocaleString('vi-VN') + 'đ',
      tienChuyenKhoan: autoTotalTransfer.toLocaleString('vi-VN') + 'đ',
      ghiChu: `Tổng ${orders.length} đơn hàng (${orders.reduce((acc, o) => acc + o.items.reduce((iAcc, item) => iAcc + item.qty, 0), 0)} ly).`
    });
  };

  // Cart operations
  const getItemPrice = (originalPrice: number) => isPromo10k ? 10000 : originalPrice;

  const updateCartQty = (itemId: string, delta: number) => {
    setCart(prev => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: next };
    });
  };

  const currentCartTotal = MENU_ITEMS.reduce((sum, item) => {
    const qty = cart[item.id] || 0;
    return sum + qty * getItemPrice(item.originalPrice);
  }, 0);

  const handleSaveOrder = async () => {
    if (!staffName) return alert('Vui lòng nhập tên nhân viên trước khi nhập đơn!');
    
    const cartEntries = Object.entries(cart).filter(([_, qty]) => qty > 0);
    if (cartEntries.length === 0) return alert('Vui lòng chọn ít nhất 1 món!');

    const orderItems: OrderItem[] = cartEntries.map(([itemId, qty]) => {
      const item = MENU_ITEMS.find(m => m.id === itemId)!;
      return {
        id: itemId,
        name: item.name,
        price: getItemPrice(item.originalPrice),
        qty
      };
    });

    const total = orderItems.reduce((sum, i) => sum + i.price * i.qty, 0);
    const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    let updatedOrders: Order[];

    if (editingOrderId) {
      // Edit existing order
      updatedOrders = orders.map(o => {
        if (o.id === editingOrderId) {
          return {
            ...o,
            items: orderItems,
            total,
            paymentMethod: orderPaymentMethod,
            isPromo: isPromo10k,
            note: orderNote
          };
        }
        return o;
      });
      alert(`Đã cập nhật đơn hàng #${editingOrderId}!`);
      setEditingOrderId(null);
    } else {
      // Create new order
      const newOrder: Order = {
        id: 'DH' + Math.floor(1000 + Math.random() * 9000),
        time: nowTime,
        staff: staffName,
        items: orderItems,
        total,
        paymentMethod: orderPaymentMethod,
        isPromo: isPromo10k,
        note: orderNote
      };
      updatedOrders = [newOrder, ...orders];

      // Send order async to Google Sheets
      try {
        fetch(APPS_SCRIPT_URL, {
          method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({
            type: 'order',
            orderId: newOrder.id,
            staff: staffName,
            total: newOrder.total,
            paymentMethod: newOrder.paymentMethod,
            detail: newOrder.items,
            note: newOrder.note + (isPromo10k ? ' (Khai trương 10k)' : '')
          })
        });
      } catch (err) { console.error('Order sync error', err); }

      alert(`Đã tạo thành công Đơn hàng #${newOrder.id} - ${total.toLocaleString('vi-VN')}đ!`);
    }

    setOrders(updatedOrders);
    setCart({});
    setOrderNote('');
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrderId(order.id);
    setIsPromo10k(order.isPromo);
    setOrderPaymentMethod(order.paymentMethod);
    setOrderNote(order.note || '');

    const newCart: { [key: string]: number } = {};
    order.items.forEach(i => {
      newCart[i.id] = i.qty;
    });
    setCart(newCart);

    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleDeleteOrder = (orderId: string) => {
    if (confirm(`Bạn có chắc muốn xóa đơn hàng #${orderId}?`)) {
      setOrders(orders.filter(o => o.id !== orderId));
      if (editingOrderId === orderId) {
        setEditingOrderId(null);
        setCart({});
      }
    }
  };

  const handleCheckIn = async () => {
    if (!staffName) return alert('Vui lòng nhập tên nhân viên!');
    const time = new Date().toLocaleString('vi-VN');
    setShiftStatus(`Đang xử lý Check-in...`);
    try {
      await fetch(APPS_SCRIPT_URL, {
        method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ type: 'checkin', name: staffName })
      });
      setShiftStatus(`Đã check-in lúc: ${time}`);
      alert(`Xin chào ${staffName}! Đã lưu hệ thống. Chúc bạn một ca làm việc năng suất!`);
    } catch (e) {
      alert('Lỗi mạng khi Check-in!');
      setShiftStatus(`Chưa check-in`);
    }
  };

  const handleCheckOut = async () => {
    if (!shiftStatus.includes('Đã check-in')) return alert('Bạn chưa check-in!');
    const time = new Date().toLocaleString('vi-VN');
    setShiftStatus(`Đang xử lý Check-out...`);
    try {
      await fetch(APPS_SCRIPT_URL, {
        method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ type: 'checkout', name: staffName })
      });
      setShiftStatus(`Đã check-out lúc: ${time}`);
      alert(`Cảm ơn ${staffName}! Đã lưu dữ liệu kết thúc ca làm việc.`);
    } catch (e) {
      alert('Lỗi mạng khi Check-out!');
      setShiftStatus(`Đã check-in lúc...`);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName) return alert('Vui lòng nhập tên nhân viên!');
    
    setIsSubmitting(true);
    try {
      const payload = {
        type: 'report',
        name: staffName,
        revenue: reportData.doanhThu,
        cash: reportData.tienMat,
        transfer: reportData.tienChuyenKhoan,
        note: reportData.ghiChu
      };
      
      await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(payload),
      });
      
      alert('Báo cáo đã được gửi thành công cho Cổ Đông!');
      setReportData({ doanhThu: '', tienMat: '', tienChuyenKhoan: '', ghiChu: '' });
    } catch (error) {
      alert('Có lỗi xảy ra khi gửi báo cáo, nhưng hệ thống đã lưu nháp nội bộ!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LoginGate expectedPassword="sammixnv" storageKey="auth_recipes" title="Khu Vực Nhân Viên">
      <div style={{ padding: '1.5rem', maxWidth: '1100px', margin: '0 auto', color: 'var(--text-primary)', fontFamily: 'sans-serif' }}>
        <h1 style={{ color: '#10b981', textAlign: 'center', marginBottom: '0.5rem', fontSize: '2rem' }}>🧑‍🍳 Trang Nhập Đơn & Báo Cáo Nhân Viên</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem' }}>Chấm công, Nhập đơn bán hàng, Quản lý đơn & Báo cáo doanh thu ca</p>

        {/* Chấm Công & Báo Cáo Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Check-in Card */}
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', background: 'rgba(255,255,255,0.9)', color: '#333' }}>
            <h2 style={{ color: '#27ae60', marginTop: 0, fontSize: '1.3rem' }}>⏱️ Chấm Công Ca Trực</h2>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontWeight: 'bold', fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>Tên Nhân Viên:</label>
              <input
                type="text"
                placeholder="Nhập tên của bạn..."
                className="input-field"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem' }}>
              <button onClick={handleCheckIn} className="btn-primary" style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#27ae60', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Đầu Ca (Check-in)</button>
              <button onClick={handleCheckOut} className="btn-primary" style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#e74c3c', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Cuối Ca (Check-out)</button>
            </div>
            <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '8px', border: '1px dashed #27ae60', fontSize: '0.9rem' }}>
              Trạng thái: <strong>{shiftStatus}</strong>
            </div>
          </div>

          {/* Báo Cáo Card */}
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', background: 'rgba(255,255,255,0.9)', color: '#333' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
              <h2 style={{ color: '#d35400', margin: 0, fontSize: '1.3rem' }}>📋 Báo Cáo Cuối Ca</h2>
              <button 
                type="button" 
                onClick={fillReportFromOrders} 
                style={{ padding: '4px 10px', background: '#3498db', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}
              >
                🔄 Tự lấy từ Đơn
              </button>
            </div>
            <form onSubmit={handleSubmitReport} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#555' }}>Tổng Doanh Thu:</label>
                <input
                  type="text"
                  placeholder="Doanh thu (VD: 1.500.000đ)..."
                  className="input-field"
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                  value={reportData.doanhThu}
                  onChange={(e) => setReportData({...reportData, doanhThu: e.target.value})}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#27ae60' }}>💵 Tiền Mặt:</label>
                  <input
                    type="text"
                    placeholder="Tiền mặt tại quầy..."
                    className="input-field"
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                    value={reportData.tienMat}
                    onChange={(e) => setReportData({...reportData, tienMat: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#2980b9' }}>💳 Chuyển Khoản:</label>
                  <input
                    type="text"
                    placeholder="Tiền chuyển khoản..."
                    className="input-field"
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                    value={reportData.tienChuyenKhoan}
                    onChange={(e) => setReportData({...reportData, tienChuyenKhoan: e.target.value})}
                    required
                  />
                </div>
              </div>

              <textarea
                placeholder="Ghi chú thêm (thiếu ly nhựa, hao hụt trái cây,...)"
                className="input-field"
                rows={2}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                value={reportData.ghiChu}
                onChange={(e) => setReportData({...reportData, ghiChu: e.target.value})}
              />
              <button type="submit" className="btn-primary" style={{ padding: '10px', borderRadius: '8px', background: '#d35400', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }} disabled={isSubmitting}>
                {isSubmitting ? 'Đang gửi...' : '🚀 Gửi Báo Cáo Cuối Ca'}
              </button>
            </form>
          </div>
        </div>

        {/* TAB NHẬP MÓN (ORDER POS ENTRY) */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', background: 'rgba(255,255,255,0.95)', color: '#333', marginBottom: '2rem', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '1rem', borderBottom: '2px solid #27ae60', paddingBottom: '0.8rem' }}>
            <h2 style={{ color: '#1e7145', margin: 0, fontSize: '1.4rem' }}>
              🛒 Tab Nhập Món {editingOrderId ? <span style={{ color: '#e67e22', fontSize: '1rem' }}>(Đang sửa Đơn #{editingOrderId})</span> : ''}
            </h2>

            {/* Toggle Khai Trương Đồng Giá 10k */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: isPromo10k ? '#fff3e0' : '#f0f0f0', padding: '6px 14px', borderRadius: '20px', border: isPromo10k ? '2px solid #e67e22' : '1px solid #ccc', fontWeight: 'bold', color: isPromo10k ? '#d35400' : '#666' }}>
              <input
                type="checkbox"
                checked={isPromo10k}
                onChange={(e) => setIsPromo10k(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              🎉 Khai trương đồng giá 10k / ly
            </label>
          </div>

          {/* Item Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px', marginBottom: '1.5rem' }}>
            {MENU_ITEMS.map((item) => {
              const qty = cart[item.id] || 0;
              const unitPrice = getItemPrice(item.originalPrice);
              return (
                <div key={item.id} style={{ border: qty > 0 ? '2px solid #27ae60' : '1px solid #e0e0e0', borderRadius: '10px', padding: '12px', background: qty > 0 ? '#e8f8f5' : '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#2c3e50', fontSize: '1rem' }}>{item.name}</div>
                    <div style={{ marginTop: '4px' }}>
                      <span style={{ fontWeight: 'bold', color: '#e74c3c', fontSize: '1.1rem' }}>{unitPrice.toLocaleString('vi-VN')}đ</span>
                      {isPromo10k && item.originalPrice > 10000 && (
                        <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '0.85rem', marginLeft: '6px' }}>{item.originalPrice.toLocaleString('vi-VN')}đ</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                    <button 
                      type="button" 
                      onClick={() => updateCartQty(item.id, -1)}
                      disabled={qty === 0}
                      style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #ccc', background: qty > 0 ? '#e74c3c' : '#f5f5f5', color: qty > 0 ? '#fff' : '#aaa', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      -
                    </button>
                    <span style={{ fontWeight: 'bold', fontSize: '1.2rem', minWidth: '24px', textAlign: 'center' }}>{qty}</span>
                    <button 
                      type="button" 
                      onClick={() => updateCartQty(item.id, 1)}
                      style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: '#27ae60', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cart Control & Summary */}
          <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '1rem' }}>
              <div>
                <label style={{ fontWeight: 'bold', fontSize: '0.9rem', display: 'block', marginBottom: '6px' }}>Hình thức thanh toán:</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setOrderPaymentMethod('tienmat')}
                    style={{ flex: 1, padding: '8px', borderRadius: '6px', border: orderPaymentMethod === 'tienmat' ? '2px solid #27ae60' : '1px solid #ccc', background: orderPaymentMethod === 'tienmat' ? '#27ae60' : '#fff', color: orderPaymentMethod === 'tienmat' ? '#fff' : '#333', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    💵 Tiền mặt
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderPaymentMethod('chuyenkhoan')}
                    style={{ flex: 1, padding: '8px', borderRadius: '6px', border: orderPaymentMethod === 'chuyenkhoan' ? '2px solid #2980b9' : '1px solid #ccc', background: orderPaymentMethod === 'chuyenkhoan' ? '#2980b9' : '#fff', color: orderPaymentMethod === 'chuyenkhoan' ? '#fff' : '#333', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    💳 Chuyển khoản (QR)
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontWeight: 'bold', fontSize: '0.9rem', display: 'block', marginBottom: '6px' }}>Ghi chú đơn hàng:</label>
                <input
                  type="text"
                  placeholder="Ghi chú (ít đá, nhiều đường,...)"
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '1rem', color: '#555' }}>Tổng cộng: </span>
                <span style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#e74c3c' }}>{currentCartTotal.toLocaleString('vi-VN')}đ</span>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                {editingOrderId && (
                  <button
                    type="button"
                    onClick={() => { setEditingOrderId(null); setCart({}); setOrderNote(''); }}
                    style={{ padding: '10px 16px', borderRadius: '8px', background: '#95a5a6', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Hủy sửa
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSaveOrder}
                  style={{ padding: '10px 24px', borderRadius: '8px', background: '#27ae60', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}
                >
                  {editingOrderId ? '💾 Cập Nhật Đơn Hàng' : '✅ Lưu Đơn Hàng'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CÁC ĐƠN HÀNG ĐÃ NHẬP TRONG CA (ORDER HISTORY & EDITING) */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', background: 'rgba(255,255,255,0.95)', color: '#333', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
            <h2 style={{ color: '#2980b9', margin: 0, fontSize: '1.3rem' }}>
              📜 Danh Sách Đơn Hàng Đã Nhập ({orders.length} đơn)
            </h2>
            <div style={{ fontSize: '0.9rem', background: '#ebf5fb', padding: '6px 12px', borderRadius: '8px', color: '#2980b9', fontWeight: 'bold' }}>
              Tổng: {autoTotalRevenue.toLocaleString('vi-VN')}đ | 💵 {autoTotalCash.toLocaleString('vi-VN')}đ | 💳 {autoTotalTransfer.toLocaleString('vi-VN')}đ
            </div>
          </div>

          {orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#7f8c8d', fontStyle: 'italic' }}>
              Chưa có đơn hàng nào trong ca này. Hãy dùng bảng trên để nhập món mới!
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: '#fff' }}>
                <thead>
                  <tr style={{ background: '#2c3e50', color: '#fff', fontSize: '0.9rem' }}>
                    <th style={{ padding: '10px', border: '1px solid #ddd' }}>Mã Đơn</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd' }}>Giờ</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd' }}>Chi Tiết Món</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd' }}>HTTT</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd' }}>Tổng Tiền</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} style={{ background: editingOrderId === o.id ? '#fef9e7' : '#fff', borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold', color: '#2c3e50' }}>#{o.id}</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd', fontSize: '0.85rem' }}>{o.time}</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd', fontSize: '0.9rem' }}>
                        {o.items.map((i, idx) => (
                          <div key={idx}>• {i.name} x{i.qty} ({i.price.toLocaleString('vi-VN')}đ)</div>
                        ))}
                        {o.note && <div style={{ fontSize: '0.8rem', color: '#7f8c8d', fontStyle: 'italic' }}>Ghi chú: {o.note}</div>}
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                        {o.paymentMethod === 'tienmat' ? (
                          <span style={{ background: '#d5f5e3', color: '#1e8449', padding: '3px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>💵 Tiền mặt</span>
                        ) : (
                          <span style={{ background: '#d4efdf', color: '#1f618d', padding: '3px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>💳 Chuyển khoản</span>
                        )}
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold', color: '#e74c3c' }}>
                        {o.total.toLocaleString('vi-VN')}đ
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleEditOrder(o)}
                          style={{ padding: '4px 10px', background: '#f39c12', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}
                        >
                          ✏️ Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteOrder(o.id)}
                          style={{ padding: '4px 10px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                        >
                          🗑️ Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recipe Table Section */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', background: 'rgba(255,255,255,0.9)', color: '#333' }}>
          <h2 style={{ color: '#d35400', borderBottom: '2px solid #e67e22', paddingBottom: '0.5rem', marginBottom: '1rem', fontSize: '1.3rem' }}>🍹 SOP Pha Chế Nước Ép & Nước Sâm</h2>
          
          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#eef9f5', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
            <h3 style={{ margin: '0 0 6px 0', color: '#047857', fontSize: '1.05rem' }}>🍵 1. Nước Sâm Mix (Nấu Sẵn & Rót Bình/Ly)</h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#374151' }}>
              Nước Sâm (Mía Lau, Củ Năng Táo Đỏ, Bông Cúc Nhãn Nhục) đã được <strong>nấu sẵn</strong>, ủ lạnh trong tủ mát. Nhân viên ca trực chỉ cần rót vào ly, thêm topping (nhãn nhục, táo đỏ, hạt chia) và đá theo định lượng.
            </p>
          </div>

          <h3 style={{ color: '#166534', margin: '0 0 10px 0', fontSize: '1.05rem' }}>🍉 2. Nước Ép Trái Cây Tươi (Ép Tại Chỗ Khi Có Đơn)</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: 'rgba(255,255,255,0.8)', color: '#333' }}>
            <thead>
              <tr style={{ background: '#1e7145', color: 'white' }}>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Tên Món</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Công thức ép tại chỗ (Ly 500ml)</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Lưu ý kích vị</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold', color: '#27ae60' }}>Dưa Hấu</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>200ml cốt dưa hấu ép tươi + 20ml nước đường mật mía + đá</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>Ép nguyên ruột, lọc bớt hạt cho ly trong</td>
              </tr>
              <tr style={{ background: '#f9f9f9' }}>
                <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold', color: '#27ae60' }}>Cam Sành</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>150ml cốt cam vắt tươi + 30ml nước đường mật mía + đá</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>Thêm 1 xíu muối tinh để vị đậm đà</td>
              </tr>
              <tr style={{ background: '#f9f9f9' }}>
                <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold', color: '#27ae60' }}>Cà Rốt</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>200ml cốt cà rốt ép tươi + 20ml nước đường mật mía + đá</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>Thêm 10ml nước cốt chanh để không bị ngái</td>
              </tr>
              <tr>
                <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold', color: '#27ae60' }}>Dứa Mật</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>200ml cốt dứa ép tươi + 20ml nước đường mật mía + đá</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>Thêm 5ml cốt tắc để tăng độ thơm</td>
              </tr>
              <tr style={{ background: '#f9f9f9' }}>
                <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold', color: '#27ae60' }}>Cóc Non</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>200ml cốt cóc ép tươi + 35ml nước đường mật mía + đá</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>Bắt buộc có muối tinh liều lượng nhỏ</td>
              </tr>
              <tr>
                <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold', color: '#27ae60' }}>Cần Tây Mix Táo</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>150ml cốt cần tây + 50ml cốt táo ép tươi + 10ml nước đường mật mía + đá</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>Ép cùng 1 lát gừng mỏng để khử mùi hăng</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </LoginGate>
  );
}