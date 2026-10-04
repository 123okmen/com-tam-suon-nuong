import React, { useState, useEffect, useMemo } from 'react';

import LoginGate from '../components/LoginGate';
import { MENU, saveOrder, deleteOrder, syncOrder, syncDeleteOrder, getShift, fmtVND } from '../lib/store';
import type { Order, OrderLine } from '../lib/store';

const API = 'https://script.google.com/macros/s/AKfycbyETg2znWnDrNsgq3G2eB0IJxFeb_GdLKo5N68FkFlJVMvTzdt_M_C3YFzL7fcgiyY1/exec';

export default function StaffPage() {
  
  const [tab, setTab] = useState<'pos' | 'shift' | 'off' | 'report' | 'recipes'>('pos');
  const [offData, setOffData] = useState({ date: new Date().toISOString().slice(0,10), shift: 'sang', reason: '' });
  const [staff, setStaff] = useState('');
  const [shift, setShift] = useState<'sang' | 'trua' | 'toi' | 'gay' | 'chieu'>(getShift());
  const [cart, setCart] = useState<OrderLine[]>([]);
  const [cash, setCash] = useState('');
  const [toast, setToast] = useState('');
  const [shiftStatus, setShiftStatus] = useState<string>('Chưa check-in');
  const [reportData, setReportData] = useState({ doanhThu: '', tienMat: '', tienChuyenKhoan: '', ghiChu: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"tienmat" | "chuyenkhoan" | "app">("tienmat");

  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [isPromo10k, setIsPromo10k] = useState<boolean>(false);

  const [apiRevenue, setApiRevenue] = useState(0);
  const [apiOrders, setApiOrders] = useState(0);


  const fetchSystemData = async () => {
    try {
      const r = await fetch(API + '?action=data', { headers: { 'Accept': 'application/json' } });
      const d = await r.json();
      if (d && d.kpi) {
        setApiRevenue(d.kpi.doanhThu || 0);
        setApiOrders(d.kpi.soDon || 0);
      }
    } catch {}
  };

  useEffect(() => {
    // Load local orders for shift calculation
    try {
      const stored = localStorage.getItem('sammix_orders_v1');
      if (stored) setRecentOrders(JSON.parse(stored));
    } catch {}

    fetchSystemData();
    const t = setInterval(fetchSystemData, 15000);
    return () => clearInterval(t);
  }, []);

  const addItem = (id: string, name: string, price: number) => {
    if (id === 'app-online') {
      const valStr = prompt('Nhập số tiền THỰC TẾ THU VỀ của đơn App Online (VNĐ):', '35000');
      if (!valStr) return;
      const num = parseInt(valStr.replace(/\D/g, ''), 10);
      if (isNaN(num) || num <= 0) { alert('Số tiền không hợp lệ!'); return; }
      const itemKey = 'app_' + Date.now();
      const appName = 'Đơn App (' + fmtVND(num) + ')';
      setCart(prev => [...prev, { id: itemKey, name: appName, price: num, qty: 1 }]);
      setPaymentMethod('app');
      return;
    }

    const finalPrice = isPromo10k ? 10000 : price;
    const itemKey = isPromo10k ? id + '_10k' : id;
    const itemName = isPromo10k ? name + ' (Khai Trương 10K)' : name;
    setCart(prev => {
      const found = prev.find(l => l.id === itemKey);
      if (found) return prev.map(l => l.id === itemKey ? { ...l, qty: l.qty + 1 } : l);
      return [...prev, { id: itemKey, name: itemName, price: finalPrice, qty: 1 }];
    });
  };

  const changeQty = (id: string, delta: number) => {
    setCart(prev => prev.map(l => l.id === id ? { ...l, qty: Math.max(0, l.qty + delta) } : l).filter(l => l.qty > 0));
  };

  const total = useMemo(() => cart.reduce((s, l) => s + l.price * l.qty, 0), [cart]);
  const cashNum = parseInt(cash.replace(/\D/g, ''), 10) || 0;
  const change = cashNum - total;

  const checkout = async () => {
    if (!staff.trim()) { alert('Vui lòng nhập tên nhân viên bán hàng!'); return; }
    if (cart.length === 0) { alert('Chưa có món nào trong đơn!'); return; }
    const order: Order = {
      paymentMethod,
      id: 'DH' + Date.now().toString().slice(-8),
      time: new Date().toISOString(),
      staff: staff.trim(),
      shift,
      lines: cart,
      total,
      cash: cashNum || undefined,
      change: cashNum ? change : undefined,
      synced: false
    };
    const ok = await syncOrder(order);
    order.synced = ok;
    saveOrder(order);
    setCart([]);
    setCash('');
    setToast(ok ? (editingOrderId ? 'ĐÃ CẬP NHẬT ĐƠN!' : 'ĐÃ LƯU ĐƠN!') : 'LỖI MẠNG - ĐÃ LƯU CỤC BỘ');
    if (ok) {
      setRecentOrders(prev => [order, ...prev.filter(o => o.id !== order.id)]);
      setEditingOrderId(null);
      setTimeout(fetchSystemData, 1500);
    }
    setTimeout(() => setToast(''), 4000);
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đơn ' + orderId + ' trên giao diện và Google Sheets không?')) {
      deleteOrder(orderId);
      setRecentOrders(prev => prev.filter(o => o.id !== orderId));
      if (editingOrderId === orderId) {
        setEditingOrderId(null);
        setCart([]);
        setCash('');
      }
      setToast('ĐANG XÓA ĐƠN TRÊN GOOGLE SHEETS...');
      const ok = await syncDeleteOrder(orderId);
      setToast(ok ? 'ĐÃ XÓA ĐƠN ' + orderId + ' THÀNH CÔNG!' : 'ĐÃ XÓA CỤC BỘ (LỖI MẠNG ĐỒNG BỘ)');
      if (ok) {
        setTimeout(fetchSystemData, 1500);
      }
      setTimeout(() => setToast(''), 3500);
    }
  };

  const editOrder = (o: Order) => {
    setEditingOrderId(o.id);
    setPaymentMethod(o.paymentMethod || 'tienmat');
    setCart(o.lines || []);
    if (o.cash) setCash(o.cash.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const postJson = async (payload: any) => {
    try {
      await fetch(API, {
        method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
      });
      return true;
    } catch { return false; }
  };

  const handleCheckIn = async () => {
    if (!staff.trim()) return alert('Vui lòng nhập tên nhân viên!');
    setShiftStatus('Đang xử lý Check-in...');
    const shiftText = shift === 'sang' ? 'Ca Sáng (7h30-12h30)' : 'Ca Chiều Tối (13h-21h)';
    const ok = await postJson({ type: 'checkin', staff: staff.trim(), shift: shiftText });
    const time = new Date().toLocaleString('vi-VN');
    setShiftStatus(ok ? `Đã check-in ${shiftText} lúc: ${time}` : 'Chưa check-in (lỗi mạng)');
    alert(ok ? `Xin chào ${staff}! Đã check-in ${shiftText} thành công.` : 'Lỗi mạng khi Check-in!');
  };

  const handleCheckOut = async () => {
    if (!staff.trim()) return alert('Vui lòng nhập tên nhân viên!');
    setShiftStatus('Đang xử lý Check-out...');
    const shiftText = shift === 'sang' ? 'Ca Sáng (7h30-12h30)' : 'Ca Chiều Tối (13h-21h)';
    const ok = await postJson({ type: 'checkout', staff: staff.trim(), shift: shiftText });
    const time = new Date().toLocaleString('vi-VN');
    setShiftStatus(ok ? `Đã check-out ${shiftText} lúc: ${time}` : 'Chưa check-out (lỗi mạng)');
    alert(ok ? `Cảm ơn ${staff}! Đã check-out ${shiftText} thành công.` : 'Lỗi mạng khi Check-out!');
  };

  // Tính toán doanh thu & tiền mặt & chuyển khoản TRONG CA CỦA NHÂN VIÊN
  const shiftMetrics = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const shiftOrders = recentOrders.filter(o => {
      const isToday = o.time && o.time.slice(0, 10) === todayStr;
      const matchStaff = !staff.trim() || o.staff.toLowerCase() === staff.trim().toLowerCase();
      const matchShift = o.shift === shift;
      return isToday && matchShift && matchStaff;
    });

    let rev = 0;
    let tm = 0;
    let ck = 0;

    shiftOrders.forEach(o => {
      rev += (o.total || 0);
      if (o.paymentMethod === 'chuyenkhoan') {
        ck += (o.total || 0);
      } else {
        tm += (o.total || 0);
      }
    });

    return {
      ordersCount: shiftOrders.length,
      doanhThuCa: rev,
      tienMatCa: tm,
      tienChuyenKhoanCa: ck
    };
  }, [recentOrders, staff, shift]);

  const handleAutoFillReport = () => {
    setReportData({
      doanhThu: shiftMetrics.doanhThuCa.toString(),
      tienMat: shiftMetrics.tienMatCa.toString(),
      tienChuyenKhoan: shiftMetrics.tienChuyenKhoanCa.toString(),
      ghiChu: reportData.ghiChu
    });
  };

  const handleSendSummary = async () => {
    setIsSubmitting(true);
    const ok = await postJson({ type: 'summary' });
    alert(ok ? '🚀 Đã gửi tổng kết tất cả đơn hàng & doanh thu hôm nay qua Telegram cho Cổ Đông!' : 'Có lỗi mạng khi gửi tổng me!');
    setIsSubmitting(false);
  };

  
  const handleOffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staff.trim()) return alert('Vui lòng nhập tên nhân viên!');
    if (!offData.reason.trim()) return alert('Vui lòng nhập lý do xin nghỉ!');
    setIsSubmitting(true);

    const shiftText = offData.shift === 'sang' ? 'Ca Sáng (7h30-12h30)' : 'Ca Chiều Tối (13h-21h)';
    const ok = await postJson({
      type: 'off_request',
      staff: staff.trim(),
      date: offData.date,
      shift: shiftText,
      reason: offData.reason.trim()
    });

    alert(ok ? '🚀 Đã gửi đơn báo nghỉ ca thành công!' : 'Đã lưu báo cáo nghỉ ca!');
    if (ok) setOffData({ date: new Date().toISOString().slice(0,10), shift: 'sang', reason: '' });
    setIsSubmitting(false);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staff.trim()) return alert('Vui lòng nhập tên nhân viên!');
    setIsSubmitting(true);
    const ok = await postJson({
      type: 'report', staff: staff.trim(),
      doanh_thu: reportData.doanhThu,
      tien_mat: reportData.tienMat,
      tien_chuyen_khoan: reportData.tienChuyenKhoan,
      ghi_chu: reportData.ghiChu
    });
    alert(ok ? 'Báo cáo đã được gửi thành công cho Cổ Đông!' : 'Có lỗi xảy ra khi gửi báo cáo!');
    if (ok) setReportData({ doanhThu: '', tienMat: '', tienChuyenKhoan: '', ghiChu: '' });
    setIsSubmitting(false);
  };

  return (
    <LoginGate expectedPassword="sammixnv" storageKey="auth_staff" title="Khu Vực Nhân Viên">
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', color: 'var(--text-primary)' }}>
        <h1 style={{ color: '#10b981', textAlign: 'center', marginBottom: '0.5rem' }}>🧑‍🍳 Web Nhân Viên</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Chấm công · Nhập món · Báo cáo cuối ca
        </p>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {([['pos', '🧾 Nhập Món'], ['shift', '⏱️ Chấm Công'], ['off', '🏖️ Báo Cáo Off Ca'], ['report', '📋 Báo Cáo Cuối Ca'], ['recipes', '📖 Công Thức Pha Chế']] as const).map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} className="btn-primary"
              style={{ padding: '0.6rem 1.4rem', background: tab === k ? '#1e7145' : 'rgba(255,255,255,0.1)' }}>
              {label}
            </button>
          ))}

        </div>

        <div className="glass-panel" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Tên nhân viên *</div>
            <input className="input-field" style={{ padding: '0.5rem 1rem' }} placeholder="VD: Minh, Lan..."
              value={staff} onChange={e => setStaff(e.target.value)} />
          </div>
          <div style={{ minWidth: '200px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Ca làm việc *</div>
            <select className="input-field" style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.1)', color: '#fff' }}
              value={shift} onChange={e => setShift(e.target.value as 'sang' | 'gay' | 'chieu')}>
              <option value="sang" style={{ background: '#222' }}>🌅 Ca Sáng (7h30 - 12h30)</option>
              <option value="chieu" style={{ background: '#222' }}>🌆 Ca Chiều Tối (13h00 - 21h00)</option>
            </select>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Doanh thu hôm nay</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#10b981' }}>{fmtVND(apiRevenue)}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{apiOrders} đơn (từ hệ thống)</div>
          </div>
        </div>

        {tab === 'pos' && (<>
          {/* Toggle Khai Trương 10K */}
          <div className="glass-panel" style={{
            marginBottom: '1.2rem', padding: '0.8rem 1.2rem', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', background: isPromo10k ? 'linear-gradient(90deg, #d35400 0%, #e67e22 100%)' : 'rgba(255,255,255,0.06)',
            borderRadius: '14px', border: isPromo10k ? '1px solid #f39c12' : '1px solid var(--glass-border)',
            transition: 'all 0.3s ease', cursor: 'pointer'
          }} onClick={() => setIsPromo10k(!isPromo10k)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.4rem' }}>🎉</span>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '1rem', color: '#fff' }}>
                  Chế độ Khai Trương Đồng Giá 10K {isPromo10k ? ' (ĐANG BẬT 🔥)' : ''}
                </div>
                <div style={{ fontSize: '0.8rem', color: isPromo10k ? '#ffeaa7' : 'var(--text-secondary)' }}>
                  {isPromo10k ? 'Tất cả các món khi chọn sẽ áp dụng giá ưu đãi 10.000đ / ly' : 'Gạt công tắc để áp dụng giá 10k cho tất cả các món'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px', cursor: 'pointer' }}>
                <input type="checkbox" checked={isPromo10k} onChange={e => setIsPromo10k(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: isPromo10k ? '#2ecc71' : '#ccc', borderRadius: '34px', transition: '.4s'
                }}>
                  <span style={{
                    position: 'absolute', content: '', height: '18px', width: '18px',
                    left: isPromo10k ? '26px' : '4px', bottom: '4px', backgroundColor: 'white', borderRadius: '50%', transition: '.4s'
                  }} />
                </span>
              </label>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.5rem' }}>
            <div>
              {(['sam', 'coffee', 'ep', 'food', 'app'] as const).map(cat => (
                <div key={cat} className="glass-panel" style={{ marginBottom: '1.5rem', padding: '1.2rem' }}>
                  <h2 style={{ marginTop: 0, color: cat === 'sam' ? '#d35400' : cat === 'coffee' ? '#6f4e37' : cat === 'ep' ? '#3498db' : '#e67e22', fontSize: '1.1rem' }}>
                    {cat === 'sam' ? '🍵 Trà Sâm Thảo Mộc' : cat === 'coffee' ? '☕ Cà Phê Phin' : cat === 'ep' ? '🥤 Nước Ép Trái Cây Tươi' : cat === 'food' ? '🍢 Đồ Ăn Vặt & Nem Nướng' : '🛵 Đơn App Online (ShopeeFood / Grab)'}
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                    {MENU.filter(m => m.category === cat).map(item => (
                      <button key={item.id} onClick={() => addItem(item.id, item.name, item.price)}
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '10px', cursor: 'pointer', textAlign: 'center' }}>
                        <img src={import.meta.env.BASE_URL + item.img} alt={item.name}
                          style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '6px', color: 'var(--text-primary)' }}>{item.name}</div>
                        <div style={{ color: isPromo10k ? '#e74c3c' : '#10b981', fontWeight: 'bold' }}>
                          {isPromo10k ? (
                            <span><s style={{ fontSize: '0.75rem', opacity: 0.7, marginRight: '4px', color: '#95a5a6' }}>{fmtVND(item.price)}</s>10.000đ</span>
                          ) : (
                            fmtVND(item.price)
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="glass-panel" style={{ alignSelf: 'start', position: 'sticky', top: '70px' }}>
              <h2 style={{ marginTop: 0, color: '#f39c12' }}>🛒 Đơn hàng hiện tại</h2>
              {cart.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1.5rem 0' }}>
                  Bấm vào món để thêm vào đơn
                </p>
              ) : (
                <>
                  {cart.map(l => (
                    <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{l.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{fmtVND(l.price)}</div>
                      </div>
                      <button onClick={() => changeQty(l.id, -1)} style={qtyBtn}>−</button>
                      <span style={{ minWidth: '28px', textAlign: 'center', fontWeight: 'bold' }}>{l.qty}</span>
                      <button onClick={() => changeQty(l.id, 1)} style={qtyBtn}>+</button>
                      <div style={{ minWidth: '80px', textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>{fmtVND(l.price * l.qty)}</div>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px dashed var(--glass-border)', margin: '12px 0', paddingTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold' }}>
                      <span>Tổng tiền</span><span style={{ color: '#10b981' }}>{fmtVND(total)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <input className="input-field" style={{ padding: '0.6rem 1rem' }} placeholder="Tiền khách đưa"
                        value={cash} onChange={e => setCash(e.target.value)} />
                    </div>
                    {cashNum > 0 && (
                      <div style={{ marginTop: '8px', fontSize: '0.95rem' }}>
                        Tiền thối: <strong style={{ color: change >= 0 ? '#3498db' : '#e74c3c' }}>
                          {change >= 0 ? fmtVND(change) : 'Thiếu ' + fmtVND(-change)}
                        </strong>
                      </div>
                    )}
                    <button className="btn-primary" style={{ width: '100%', marginTop: '12px', background: '#1e7145', fontSize: '1.05rem' }}
                      onClick={checkout}>
                      💾 Xác Nhận Đơn Hàng
                    </button>
                  </div>
                </>
              )}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>Hình thức thanh toán</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={() => setPaymentMethod('tienmat')}
                    style={{ flex: 1, padding: '8px', borderRadius: '8px', border: paymentMethod === 'tienmat' ? '2px solid #10b981' : '1px solid gray', background: paymentMethod === 'tienmat' ? 'rgba(16,185,129,0.2)' : 'transparent', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
                    💵 Tiền mặt
                  </button>
                  <button type="button" onClick={() => setPaymentMethod('chuyenkhoan')}
                    style={{ flex: 1, padding: '8px', borderRadius: '8px', border: paymentMethod === 'chuyenkhoan' ? '2px solid #3498db' : '1px solid gray', background: paymentMethod === 'chuyenkhoan' ? 'rgba(52,152,219,0.2)' : 'transparent', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
                    💳 Chuyển khoản
                  </button>
                </div>
              </div>

              {toast && (
                <div style={{ marginTop: '12px', padding: '10px', borderRadius: '8px', background: 'rgba(16,185,129,0.15)', border: '1px solid #10b981', fontSize: '0.9rem', textAlign: 'center' }}>
                  {toast}
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel" style={{ marginTop: '1.5rem', padding: '1.2rem' }}>
            <h3 style={{ marginTop: 0, color: '#f39c12' }}>📜 Danh sách đơn hàng vừa nhập (Ấn Sửa để nạp lại đơn)</h3>
            {recentOrders.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Chưa có đơn hàng nào được lưu thiết bị này.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>
                      <th style={{ padding: '8px' }}>Mã đơn</th>
                      <th style={{ padding: '8px' }}>Món</th>
                      <th style={{ padding: '8px' }}>Thanh toán</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Tổng tiền</th>
                      <th style={{ padding: '8px', textAlign: 'center' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map(o => (
                      <tr key={o.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '8px', fontWeight: 'bold' }}>{o.id}</td>
                        <td style={{ padding: '8px' }}>
                          {o.lines ? o.lines.map((i: any) => i.name + ' x' + i.qty).join(', ') : ''}
                        </td>
                        <td style={{ padding: '8px' }}>
                          {o.paymentMethod === 'app' ? '🛵 App Online' : o.paymentMethod === 'chuyenkhoan' ? '💳 Chuyển khoản' : '💵 Tiền mặt'}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right', color: '#10b981', fontWeight: 'bold' }}>
                          {fmtVND(o.total || 0)}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button className="btn-primary" style={{ padding: '4px 10px', fontSize: '0.8rem', background: '#3498db' }}
                              onClick={() => editOrder(o)}>
                              ✏️ Sửa
                            </button>
                            <button className="btn-primary" style={{ padding: '4px 10px', fontSize: '0.8rem', background: '#e74c3c' }}
                              onClick={() => handleDeleteOrder(o.id)}>
                              🗑️ Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>)}

        
        {tab === 'off' && (
          <div className="glass-panel" style={{ maxWidth: "600px", margin: "0 auto" }}>
            <h2 style={{ color: "#e74c3c", marginTop: 0 }}>🏖️ Báo Cáo Nghỉ Ca (Off Ca)</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1.2rem" }}>
              Vui lòng điền thông tin bên dưới để gửi thông báo xin nghỉ ca trực tiếp cho Quản lý & Nhóm Zalo Nhân Viên.
            </p>
            <form onSubmit={handleOffSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.85rem", display: "block", marginBottom: "6px" }}>Ngày xin nghỉ *</label>
                <input type="date" className="input-field" style={{ width: "100%", padding: "0.6rem 1rem", background: "rgba(255,255,255,0.1)", color: "#fff" }}
                  value={offData.date} onChange={e => setOffData({ ...offData, date: e.target.value })} required />
              </div>
              <div>
                <label style={{ fontSize: "0.85rem", display: "block", marginBottom: "6px" }}>Ca xin nghỉ *</label>
                <select className="input-field" style={{ width: "100%", padding: "0.6rem 1rem", background: "rgba(255,255,255,0.1)", color: "#fff" }}
                  value={offData.shift} onChange={e => setOffData({ ...offData, shift: e.target.value })}>
                  <option value="sang" style={{ background: "#222" }}>🌅 Ca Sáng (7h30 - 12h30)</option>
                  <option value="chieu" style={{ background: "#222" }}>🌆 Ca Chiều Tối (13h - 21h)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: "0.85rem", display: "block", marginBottom: "6px" }}>Lý do xin nghỉ ca *</label>
                <textarea className="input-field" style={{ width: "100%", padding: "0.8rem 1rem", minHeight: "90px" }}
                  placeholder="VD: Bận lịch học đột xuất / Có việc gia đình / Ốm..."
                  value={offData.reason} onChange={e => setOffData({ ...offData, reason: e.target.value })} required />
              </div>
              <button type="submit" disabled={isSubmitting} className="btn-primary"
                style={{ background: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)", padding: "0.8rem", fontSize: "1rem", fontWeight: "bold" }}>
                🚀 Gửi Báo Cáo Xin Nghỉ (Off Ca)
              </button>
            </form>
          </div>
        )}

        {tab === 'shift' && (
          <div className="glass-panel" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ color: '#3498db', marginTop: 0 }}>⏱️ Chấm Công Ca Trực</h2>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem' }}>
              <button onClick={handleCheckIn} className="btn-primary" style={{ flex: 1, background: '#27ae60' }}>Đầu Ca (Check-in)</button>
              <button onClick={handleCheckOut} className="btn-primary" style={{ flex: 1, background: '#e74c3c' }}>Cuối Ca (Check-out)</button>
            </div>
            <div style={{ padding: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', border: '1px dashed #7f8c8d' }}>
              Trạng thái: <strong>{shiftStatus}</strong>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '1rem' }}>
              💡 Nhập tên nhân viên ở ô phía trên trước khi bấm Check-in / Check-out.
            </p>
          </div>
        )}

        {tab === 'report' && (
          <div className="glass-panel" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.8rem' }}>
              <h2 style={{ color: '#f39c12', margin: 0 }}>📋 Báo Cáo Cuối Ca</h2>
              <button type="button" onClick={handleSendSummary} disabled={isSubmitting} className="btn-primary"
                style={{ background: 'linear-gradient(135deg, #00b09b 0%, #96c93d 100%)', padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 'bold' }}>
                🚀 Gửi Tổng Hợp Nhanh (Telegram)
              </button>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px', marginBottom: '1rem', border: '1px solid var(--glass-border)' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#f1c40f', marginBottom: '8px' }}>
                📊 Thống kê TRONG CA HIỆN TẠI (Ca {shift === 'sang' ? 'Sáng (7h30-12h30)' : 'Chiều Tối (13h-21h)'}):
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '10px', textAlign: 'center' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Doanh Thu Ca</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#2ecc71' }}>{fmtVND(shiftMetrics.doanhThuCa)}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Tiền Mặt Ca</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#f39c12' }}>{fmtVND(shiftMetrics.tienMatCa)}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Chuyển Khoản Ca</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#3498db' }}>{fmtVND(shiftMetrics.tienChuyenKhoanCa)}</div>
                </div>
              </div>
              <button type="button" onClick={handleAutoFillReport}
                style={{ background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', width: '100%' }}>
                ⚡ TỰ ĐIỀN CHÍNH XÁC DOANH THU & TIỀN MẶT & CHUYỂN KHOẢN CA NÀY
              </button>
            </div>
            <form onSubmit={handleSubmitReport} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input type="text" placeholder="Doanh thu ước tính (VD: 1.500.000đ)..." className="input-field"
                value={reportData.doanhThu} onChange={e => setReportData({ ...reportData, doanhThu: e.target.value })} required />
              <input type="text" placeholder="Tiền mặt còn lại trong quầy..." className="input-field"
                value={reportData.tienMat} onChange={e => setReportData({ ...reportData, tienMat: e.target.value })} required />
              <input type="text" placeholder="Tiền chuyển khoản trong ca (VNĐ)..." className="input-field"
                value={reportData.tienChuyenKhoan} onChange={e => setReportData({ ...reportData, tienChuyenKhoan: e.target.value })} />
              <textarea placeholder="Ghi chú thêm (thiếu ly nhựa, hao hụt trái cây,...)" className="input-field" rows={3}
                value={reportData.ghiChu} onChange={e => setReportData({ ...reportData, ghiChu: e.target.value })} />
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Đang gửi...' : 'Gửi Báo Cáo'}
              </button>
            </form>
          </div>
        )}
        {tab === 'recipes' && (
          <div className="glass-panel">
            <h2 style={{ color: '#27ae60', borderBottom: '2px solid #2ecc71', paddingBottom: '0.5rem', margin: '2rem 0 1rem' }}>
              🥤 Công Thức Pha Chế — Nước Ép Trái Cây Tươi
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: 'rgba(255,255,255,0.85)', color: '#333' }}>
              <thead>
                <tr style={{ background: '#1e7145', color: 'white' }}>
                  <th style={{ padding: '10px', border: '1px solid #ddd' }}>Tên Món</th>
                  <th style={{ padding: '10px', border: '1px solid #ddd' }}>Công thức ép chuẩn (Ly 500ml)</th>
                  <th style={{ padding: '10px', border: '1px solid #ddd' }}>Lưu ý kích vị</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold', color: '#27ae60' }}>1. Dưa Hấu</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>200ml cốt dưa hấu (khoảng 1/4 quả) + 20ml nước đường mật mía + đá</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>Ép nguyên ruột, lọc bớt hạt cho ly trong</td>
                </tr>
                <tr style={{ background: '#f9f9f9' }}>
                  <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold', color: '#27ae60' }}>2. Cam Sành</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>150ml cốt cam (2-3 quả) + 30ml nước đường mật mía + đá</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>Thêm 1 xíu muối tinh để vị đậm đà</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold', color: '#27ae60' }}>3. Cà Rốt</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>200ml cốt cà rốt (2-3 củ) + 20ml nước đường mật mía + đá</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>Thêm 10ml nước cốt chanh để không bị ngái</td>
                </tr>
                <tr style={{ background: '#f9f9f9' }}>
                  <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold', color: '#27ae60' }}>4. Dứa Mật</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>200ml cốt dứa (1/2 quả lớn) + 20ml nước đường mật mía + đá</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>Thêm 5ml cốt tắc để tăng độ thơm</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold', color: '#27ae60' }}>5. Cóc Non</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>200ml cốt cóc (3-4 quả) + 35ml nước đường mật mía + đá</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>Bắt buộc có muối tinh liều lượng nhỏ</td>
                </tr>
                <tr style={{ background: '#f9f9f9' }}>
                  <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold', color: '#27ae60' }}>6. Ép Trái Cây Mix</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>200ml hỗn hợp nước ép trái cây mix tươi + 15ml nước đường mật mía + đá</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>Ép cùng 1 lát gừng mỏng để khử mùi hăng</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </LoginGate>
  );
}

const qtyBtn: React.CSSProperties = {
  width: '30px', height: '30px', borderRadius: '8px', border: '1px solid var(--glass-border)',
  background: 'rgba(255,255,255,0.1)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem'
};