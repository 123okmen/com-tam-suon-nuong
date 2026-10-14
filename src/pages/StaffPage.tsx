import React, { useState, useEffect, useMemo, useRef } from 'react';

import LoginGate from '../components/LoginGate';
import MenuItemCard from '../components/MenuItemCard';
import {
  MENU, CATEGORIES, STORE_SCHEDULE,
  getOrders, saveOrder, deleteOrder, clearAllOrders, syncOrder, syncDeleteOrder,
  getShift, shiftLabel, newOrderId, localDateKey, fmtVND,
  getScriptUrl, findMenuPrice, parseOrderItems
} from '../lib/store';
import type { Order, OrderLine, Shift } from '../lib/store';
import { printReceipt } from '../utils/print';

export default function StaffPage() {
  
  const [tab, setTab] = useState<'pos' | 'shift' | 'schedule' | 'off' | 'report'>('pos');
  const [offData, setOffData] = useState({ date: localDateKey(), shift: 'sang', reason: '' });
  const [staff, setStaff] = useState('');
  const [shift, setShift] = useState<Shift>(getShift());
  const [cart, setCart] = useState<OrderLine[]>([]);
  const [cash, setCash] = useState('');
  const [toast, setToast] = useState('');
  const [shiftStatus, setShiftStatus] = useState<string>('Chưa check-in');
  const [reportData, setReportData] = useState({ doanhThu: '', tienMat: '', tienChuyenKhoan: '', ghiChu: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"tienmat" | "chuyenkhoan" | "app">("tienmat");
  const [orderType, setOrderType] = useState<"tai-quan" | "mang-ve">("tai-quan");

  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);


  const [apiRevenue, setApiRevenue] = useState(0);
  const [apiOrders, setApiOrders] = useState(0);

  const [onlineOrders, setOnlineOrders] = useState<any[]>([]);
  const seenOnlineOrders = useRef<Set<string>>(new Set());
  const audioCtxRef = useRef<any>(null);

  useEffect(() => {
    const initAudio = () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    };
    window.addEventListener('click', initAudio);
    window.addEventListener('touchstart', initAudio);
    return () => {
      window.removeEventListener('click', initAudio);
      window.removeEventListener('touchstart', initAudio);
    };
  }, []);

  const playDingDong = () => {
    try {
      const ctx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      gain1.gain.setValueAtTime(0.5, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc1.connect(gain1); gain1.connect(ctx.destination);
      osc1.start(); osc1.stop(ctx.currentTime + 0.5);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.3);
      gain2.gain.setValueAtTime(0.5, ctx.currentTime + 0.3);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.0);
      osc2.connect(gain2); gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.3); osc2.stop(ctx.currentTime + 1.0);
    } catch (e) {}
  };

  const fetchSystemData = async () => {
    try {
      const r = await fetch(getScriptUrl() + '?action=data', { headers: { 'Accept': 'application/json' } });
      const d = await r.json();
      if (d && d.kpi) {
        setApiRevenue(d.kpi.doanhThu || 0);
        setApiOrders(d.kpi.soDon || 0);
      }
      if (d && d.donHang) {
        // Lọc ra các đơn hàng từ Bàn hoặc Mang về (không phải từ POS)
        const dDate = new Date();
        const today = `${dDate.getDate().toString().padStart(2, '0')}/${(dDate.getMonth() + 1).toString().padStart(2, '0')}/${dDate.getFullYear()}`;
        const localIds = new Set(getOrders().map(o => o.id));
        const newOnline = d.donHang.filter((o: any) => o.source && o.source !== 'POS Thu ngân' && o.date === today && !localIds.has(o.id));
        
        let hasNew = false;
        newOnline.forEach((o: any) => {
          if (!seenOnlineOrders.current.has(o.id)) {
            hasNew = true;
            seenOnlineOrders.current.add(o.id);
          }
        });
        
        if (hasNew) {
          playDingDong();
        }
        setOnlineOrders(newOnline);
      }
    } catch {}
  };

  useEffect(() => {
    // Load local orders for shift calculation using shared store
    setRecentOrders(getOrders());

    const handleSync = () => setRecentOrders(getOrders());
    window.addEventListener('storage', handleSync);
    window.addEventListener('comtam_orders_changed', handleSync);

    fetchSystemData();
    const t = setInterval(fetchSystemData, 15000);
    return () => {
      clearInterval(t);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('comtam_orders_changed', handleSync);
    };
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

    const finalPrice = price;
    const itemKey = id;
    const itemName = name;
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
  const qtyById = useMemo(() => Object.fromEntries(cart.map(l => [l.id, l.qty])), [cart]);
  const cashNum = parseInt(cash.replace(/\D/g, ''), 10) || 0;
  const change = cashNum - total;

  const checkout = async () => {
    if (!staff.trim()) { alert('Vui lòng nhập tên nhân viên bán hàng!'); return; }
    if (cart.length === 0) { alert('Chưa có món nào trong đơn!'); return; }
    const orderId = editingOrderId || newOrderId();
    const originalOrder = editingOrderId ? recentOrders.find(o => o.id === editingOrderId) : undefined;
    const order: Order = {
      paymentMethod,
      orderType,
      id: orderId,
      time: originalOrder?.time || new Date().toISOString(),
      tableNo: originalOrder?.tableNo,
      source: originalOrder?.source,
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
    const wasEditing = Boolean(editingOrderId);
    setCart([]);
    setCash('');
    setOrderType('tai-quan');
    setPaymentMethod('tienmat');
    setToast(ok ? (wasEditing ? 'ĐÃ CẬP NHẬT ĐƠN HÀNG THÀNH CÔNG!' : 'ĐÃ LƯU ĐƠN!') : 'LỖI MẠNG - ĐÃ LƯU CỤC BỘ');
    setRecentOrders(getOrders());
    setEditingOrderId(null);
    if (ok) {
      setTimeout(fetchSystemData, 1500);
    }
    setTimeout(() => setToast(''), 4000);
    
    // In bill sau khi tạo đơn hoặc vừa sửa cập nhật xong
    printReceipt(order);
  };

  const handleConfirmOnlineOrder = async (o: any) => {
    if (!staff.trim()) { alert('Vui lòng nhập tên nhân viên (Thu ngân) trước khi xác nhận đơn!'); return; }
    
    let lines: OrderLine[] = [];
    if (Array.isArray(o.lines) && o.lines.length > 0) {
      lines = o.lines;
    } else if (o.items) {
      lines = parseOrderItems(o.items, o.total);
    }

    if (lines.length === 0 && o.total > 0) {
      lines = [{
        id: `ol-${Date.now()}`,
        name: o.items || `Món ăn bàn ${o.source || ''}`,
        price: Number(o.total),
        qty: 1
      }];
    }
    
    const tableNum = o.source ? o.source.replace('Bàn ', '').trim() : '';

    const newOrder: Order = {
      paymentMethod: o.paymentMethod === 'Chuyển khoản' ? 'chuyenkhoan' : 'tienmat',
      id: o.id, // Giữ nguyên ID của khách
      time: new Date().toISOString(),
      tableNo: parseInt(tableNum, 10) || undefined,
      orderType: 'tai-quan',
      source: o.source || (tableNum ? `Bàn ${tableNum}` : '📱 QR Bàn'),
      staff: staff.trim(),
      shift,
      lines: lines,
      total: o.total,
      synced: false
    };
    
    // Đẩy vào sheet "Don hang" để tính doanh thu chính thức
    setToast('Đang xử lý đơn từ bàn...');
    const ok = await syncOrder(newOrder);
    newOrder.synced = ok;
    saveOrder(newOrder);
    
    setRecentOrders(getOrders());
    printReceipt(newOrder);
    
    setOnlineOrders(prev => prev.filter(x => x.id !== o.id));
    setToast('Đã xác nhận & In Bill đơn từ bàn!');
    setTimeout(() => setToast(''), 4000);
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đơn ' + orderId + ' trên giao diện và Google Sheets không?')) {
      deleteOrder(orderId);
      setRecentOrders(getOrders());
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

  const editOrder = (o: Order | any) => {
    setEditingOrderId(o.id);
    if (o.orderType) setOrderType(o.orderType);
    if (o.paymentMethod) setPaymentMethod(o.paymentMethod);
    if (o.staff && !staff) setStaff(o.staff);
    if (o.cash) setCash(o.cash.toString());

    // Phục hồi chi tiết món ăn (lines) thông minh, cam kết KHÔNG BAO GIỜ bị 0đ hay mất số tiền
    let resolvedLines: OrderLine[] = [];
    if (Array.isArray(o.lines) && o.lines.length > 0) {
      resolvedLines = o.lines.map((l: any, idx: number) => {
        let p = Number(l.price) || 0;
        const q = Number(l.qty) || 1;
        if (p <= 0 && l.name) {
          p = findMenuPrice(l.name);
        }
        if (p <= 0 && o.total && o.lines.length === 1) {
          p = Math.round(Number(o.total) / q);
        }
        return {
          id: l.id || `line-${Date.now()}-${idx}`,
          name: l.name || 'Món ăn',
          price: p,
          qty: q,
          note: l.note
        };
      });
    }

    if (resolvedLines.length === 0 && o.items) {
      resolvedLines = parseOrderItems(o.items, o.total);
    }

    // Nếu vẫn rỗng nhưng đơn có tổng tiền > 0:
    if (resolvedLines.length === 0 && o.total > 0) {
      resolvedLines = [{
        id: `custom-${Date.now()}`,
        name: o.items || `Đơn hàng #${o.id}`,
        price: Number(o.total),
        qty: 1
      }];
    }

    setCart(resolvedLines);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const postJson = async (payload: any) => {
    try {
      await fetch(getScriptUrl(), {
        method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
      });
      return true;
    } catch { return false; }
  };

  const handleCheckIn = async () => {
    if (!staff.trim()) return alert('Vui lòng nhập tên nhân viên!');
    setShiftStatus('Đang xử lý Check-in...');
    const shiftText = shiftLabel(shift);
    const ok = await postJson({ type: 'checkin', staff: staff.trim(), shift: shiftText });
    const time = new Date().toLocaleString('vi-VN');
    setShiftStatus(ok ? `Đã check-in ${shiftText} lúc: ${time}` : 'Chưa check-in (lỗi mạng)');
    alert(ok ? `Xin chào ${staff}! Đã check-in ${shiftText} thành công.` : 'Lỗi mạng khi Check-in!');
  };

  const handleCheckOut = async () => {
    if (!staff.trim()) return alert('Vui lòng nhập tên nhân viên!');
    setShiftStatus('Đang xử lý Check-out...');
    const shiftText = shiftLabel(shift);
    const ok = await postJson({ type: 'checkout', staff: staff.trim(), shift: shiftText });
    const time = new Date().toLocaleString('vi-VN');
    setShiftStatus(ok ? `Đã check-out ${shiftText} lúc: ${time}` : 'Chưa check-out (lỗi mạng)');
    alert(ok ? `Cảm ơn ${staff}! Đã check-out ${shiftText} thành công.` : 'Lỗi mạng khi Check-out!');
  };

  // Tính toán doanh thu & tiền mặt & chuyển khoản TRONG CA CỦA NHÂN VIÊN
  const shiftMetrics = useMemo(() => {
    const todayStr = localDateKey();
    const shiftOrders = recentOrders.filter(o => {
      const isToday = o.time && localDateKey(new Date(o.time)) === todayStr;
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
      } else if (o.paymentMethod === 'tienmat') {
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
    alert(ok ? '🚀 Đã gửi tổng kết tất cả đơn hàng & doanh thu hôm nay qua Telegram cho Cổ Đông!' : 'Có lỗi mạng khi gửi tổng kết!');
    setIsSubmitting(false);
  };

  const handleOffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staff.trim()) return alert('Vui lòng nhập tên nhân viên!');
    if (!offData.reason.trim()) return alert('Vui lòng nhập lý do xin nghỉ!');
    setIsSubmitting(true);

    const shiftText = offData.shift === 'sang' ? 'Ca Sáng (06h30-10h00)' : (offData.shift === 'trua' ? 'Ca Trưa (10h00-14h00)' : 'Ca Chiều - Tối (16h00-21h00)');
    const ok = await postJson({
      type: 'off_request',
      staff: staff.trim(),
      date: offData.date,
      shift: shiftText,
      reason: offData.reason.trim()
    });

    alert(ok ? '🚀 Đã gửi đơn báo nghỉ ca thành công lên Google Sheet & Telegram!' : 'Đã lưu báo cáo nghỉ ca!');
    if (ok) setOffData({ date: new Date().toISOString().slice(0,10), shift: 'sang', reason: '' });
    setIsSubmitting(false);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staff.trim()) return alert('Vui lòng nhập tên nhân viên!');
    setIsSubmitting(true);
    const ok = await postJson({
      type: 'report',
      staff: staff.trim(),
      shift: shiftLabel(shift),
      revenue: reportData.doanhThu,
      cash: reportData.tienMat,
      transfer: reportData.tienChuyenKhoan,
      note: reportData.ghiChu
    });
    alert(ok ? 'Báo cáo ca đã được gửi thành công lên Google Sheet & Telegram!' : 'Có lỗi xảy ra khi gửi báo cáo!');
    if (ok) setReportData({ doanhThu: '', tienMat: '', tienChuyenKhoan: '', ghiChu: '' });
    setIsSubmitting(false);
  };

  return (
    <LoginGate expectedPassword="khoinghiep123" storageKey="auth_staff" title="Khu Vực Nhân Viên">
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', color: 'var(--text-primary)' }}>
        <h1 style={{ color: '#10b981', textAlign: 'center', marginBottom: '0.5rem' }}>🧑‍🍳 Web Nhân Viên</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Chấm công · Nhập món · Báo cáo cuối ca · Lịch làm việc
        </p>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {([
            ['pos', '🧾 Nhập Món'],
            ['shift', '⏱️ Chấm Công'],
            ['report', '📋 Báo Cáo Cuối Ca'],
            ['off', '🏖️ Nghỉ Ca'],
            ['schedule', '⏰ Khung Giờ & Phối Hợp']
          ] as const).map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} className="btn-primary"
              style={{ padding: '0.6rem 1.1rem', fontSize: '0.88rem', background: tab === k ? '#1e7145' : 'rgba(255,255,255,0.1)' }}>
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
          <div style={{ minWidth: '220px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Ca làm việc *</div>
            <select className="input-field" style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.1)', color: '#fff' }}
              value={shift} onChange={e => setShift(e.target.value as Shift)}>
              <option value="sang" style={{ background: '#222' }}>🌅 Ca Sáng (06h30 - 10h00)</option>
              <option value="trua" style={{ background: '#222' }}>☀️ Ca Trưa (10h00 - 14h00)</option>
              <option value="chieu-toi" style={{ background: '#222' }}>🌆 Ca Chiều - Tối (16h00 - 21h00)</option>
            </select>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Doanh thu hôm nay</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#10b981' }}>{fmtVND(apiRevenue)}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{apiOrders} đơn (từ hệ thống)</div>
          </div>
        </div>

        {tab === 'pos' && (<>

          
          {onlineOrders.length > 0 && (
            <div className="glass-panel" style={{ marginBottom: '1.5rem', padding: '1rem', border: '2px solid #e74c3c', background: 'rgba(231, 76, 60, 0.1)' }}>
              <h2 style={{ marginTop: 0, color: '#e74c3c', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="blink">🔔</span> CÓ ĐƠN HÀNG MỚI TỪ KHÁCH GỌI TẠI BÀN!
              </h2>
              <div style={{ display: 'grid', gap: '10px' }}>
                {onlineOrders.map(o => (
                  <div key={o.id} style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#f1c40f' }}>{o.source} <span style={{ fontSize: '0.8rem', color: '#ccc' }}>({o.time})</span></div>
                      <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', margin: '4px 0' }}>{o.items}</div>
                      <div style={{ fontWeight: 'bold', color: '#10b981' }}>Tổng: {fmtVND(o.total)} - {o.paymentMethod}</div>
                    </div>
                    <button className="btn-primary" style={{ background: '#27ae60', padding: '10px 15px', fontWeight: 'bold' }} onClick={() => handleConfirmOnlineOrder(o)}>
                      ✅ NHẬN ĐƠN & IN BILL
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="order-layout">
            <div>
              {CATEGORIES.map(cat => (
                <div key={cat.id} className="glass-panel" style={{ marginBottom: '1.5rem', padding: '1.2rem' }}>
                  <h2 style={{ marginTop: 0, color: cat.color, fontSize: '1.1rem' }}>
                    {cat.emoji} {cat.label}
                  </h2>
                  <div className="menu-grid">
                    {MENU.filter(m => m.category === cat.id).map(item => (
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        onAdd={(it) => addItem(it.id, it.name, it.price)}
                        qtyInCart={qtyById[item.id] || 0}
                      />
                    ))}
                  </div>
                </div>
              ))}

              <div className="glass-panel" style={{ marginBottom: '1.5rem', padding: '1.2rem' }}>
                <h2 style={{ marginTop: 0, color: '#3498db', fontSize: '1.1rem' }}>
                  🛵 Đơn App Online (ShopeeFood / Grab)
                </h2>
                <button
                  type="button"
                  onClick={() => addItem('app-online', 'Đơn App Online', 0)}
                  className="btn-primary"
                  style={{ background: '#3498db', width: '100%', padding: '0.8rem', fontSize: '0.95rem' }}
                >
                  ➕ Nhập Số Tiền Thu Về Đơn App
                </button>
              </div>
            </div>

            <div className="glass-panel order-layout__cart">
              {editingOrderId ? (
                <div style={{ background: '#f59e0b', color: '#0f172a', padding: '10px 12px', borderRadius: '8px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(245,158,11,0.3)' }}>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: '0.95rem' }}>✏️ ĐANG CHỈNH SỬA #{editingOrderId}</div>
                    <div style={{ fontSize: '0.78rem', marginTop: '2px', opacity: 0.9 }}>Thay đổi món hoặc số lượng rồi bấm Lưu</div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => { setEditingOrderId(null); setCart([]); setCash(''); }}
                    style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    ✖ Hủy sửa
                  </button>
                </div>
              ) : (
                <h2 style={{ marginTop: 0, color: '#f39c12' }}>🛒 Đơn hàng hiện tại</h2>
              )}
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
                        <div style={{ fontSize: '0.8rem', color: l.price === 0 ? '#ef4444' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{fmtVND(l.price)}</span>
                          {l.price === 0 && (
                            <button 
                              type="button" 
                              style={{ fontSize: '0.72rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '1px 6px', cursor: 'pointer' }}
                              onClick={() => {
                                const p = prompt(`Nhập đơn giá cho món "${l.name}":`, '30000');
                                if (p) {
                                  const val = parseInt(p.replace(/\D/g, ''), 10);
                                  if (val > 0) {
                                    setCart(prev => prev.map(item => item.id === l.id ? { ...item, price: val } : item));
                                  }
                                }
                              }}
                            >
                              ⚙️ Nhập giá
                            </button>
                          )}
                        </div>
                      </div>
                      <button className="qty-btn" onClick={() => changeQty(l.id, -1)}>−</button>
                      <span style={{ minWidth: '28px', textAlign: 'center', fontWeight: 'bold' }}>{l.qty}</span>
                      <button className="qty-btn" onClick={() => changeQty(l.id, 1)}>+</button>
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
                    <button className="btn-primary" style={{ width: '100%', marginTop: '12px', background: editingOrderId ? '#d97706' : '#1e7145', fontSize: '1.05rem', fontWeight: 'bold' }}
                      onClick={checkout}>
                      {editingOrderId ? '💾 Lưu Cập Nhật Đơn Hàng' : '💾 Xác Nhận Đơn Hàng'}
                    </button>
                  </div>
                </>
              )}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>Loại đơn hàng</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={() => setOrderType('tai-quan')}
                    style={{ flex: 1, padding: '8px', borderRadius: '8px', border: orderType === 'tai-quan' ? '2px solid #f39c12' : '1px solid gray', background: orderType === 'tai-quan' ? 'rgba(243, 156, 18, 0.2)' : 'transparent', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
                    🍽️ Tại chỗ
                  </button>
                  <button type="button" onClick={() => setOrderType('mang-ve')}
                    style={{ flex: 1, padding: '8px', borderRadius: '8px', border: orderType === 'mang-ve' ? '2px solid #e67e22' : '1px solid gray', background: orderType === 'mang-ve' ? 'rgba(230, 126, 34, 0.2)' : 'transparent', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
                    📦 Mang về
                  </button>
                </div>
              </div>

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

              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed var(--glass-border)' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  flexWrap: 'wrap', 
                  gap: '8px', 
                  background: 'rgba(16, 185, 129, 0.1)', 
                  border: '1px solid #10b981', 
                  borderRadius: '8px', 
                  padding: '10px 14px' 
                }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>🖨️</span> <span>Khổ in: 58mm Bluetooth (Mặc định)</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Chuẩn UTF-8 · Hỗ trợ in cả iPhone, Android & Máy tính (EG-58BT)
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => {
                      printReceipt({
                        id: 'TEST-58MM',
                        time: new Date().toISOString(),
                        tableNo: 1,
                        orderType: 'tai-quan',
                        staff: staff.trim() || 'Thu ngân',
                        shift,
                        lines: [
                          { id: 'test-1', name: 'Cơm Tấm Sườn Bì Chả', price: 40000, qty: 1, note: 'Ít mỡ' },
                          { id: 'test-2', name: 'Trà đá', price: 5000, qty: 1 }
                        ],
                        total: 45000,
                        paymentMethod: 'tienmat',
                        synced: true
                      });
                    }}
                    style={{ 
                      background: '#10b981', 
                      color: '#0f172a', 
                      border: 'none', 
                      borderRadius: '6px', 
                      padding: '6px 14px', 
                      fontSize: '0.82rem', 
                      fontWeight: 'bold', 
                      cursor: 'pointer' 
                    }}
                  >
                    🖨️ In thử bill 58mm
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ marginTop: '1.5rem', padding: '1.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ margin: 0, color: '#f39c12' }}>📜 Danh sách đơn hàng vừa nhập (Ấn Sửa để nạp lại đơn)</h3>
              {recentOrders.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Bạn có muốn xóa sạch danh sách đơn hàng đã lưu trên thiết bị này không? (Dành cho sau khi test xong để bắt đầu bán thật)')) {
                      clearAllOrders();
                      setRecentOrders([]);
                      setToast('ĐÃ XÓA SẠCH DANH SÁCH ĐƠN TEST TRÊN MÁY NÀY!');
                      setTimeout(() => setToast(''), 3000);
                    }
                  }}
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid #ef4444',
                    color: '#fca5a5',
                    borderRadius: '6px',
                    padding: '5px 12px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  🧹 Xóa đơn test trên máy này
                </button>
              )}
            </div>
            {recentOrders.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Chưa có đơn hàng nào được lưu thiết bị này.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>
                      <th style={{ padding: '8px' }}>Mã đơn</th>
                      <th style={{ padding: '8px' }}>Món</th>
                      <th style={{ padding: '8px' }}>Nguồn gốc</th>
                      <th style={{ padding: '8px' }}>Thanh toán</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Tổng tiền</th>
                      <th style={{ padding: '8px', textAlign: 'center' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map(o => {
                      let origin = o.source || '';
                      if (!origin) {
                        if (o.orderType === 'mang-ve') origin = '📦 Mang Về';
                        else if (o.paymentMethod === 'app') origin = '🛵 App Onl (Grab/Shopee)';
                        else if (o.tableNo) origin = '📱 QR Bàn';
                        else origin = '💻 Tại Quầy';
                      }

                      return (
                      <tr key={o.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '8px', fontWeight: 'bold' }}>{o.id}</td>
                        <td style={{ padding: '8px' }}>
                          {o.lines && o.lines.length > 0 ? o.lines.map((i: any) => i.name + ' x' + i.qty).join(', ') : ((o as any).items || '')}
                        </td>
                        <td style={{ padding: '8px' }}>
                          <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                            {origin}
                          </span>
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
                            <button className="btn-primary" style={{ padding: '4px 10px', fontSize: '0.8rem', background: '#9b59b6' }}
                              onClick={() => printReceipt(o)}>
                              🖨️ In
                            </button>
                            <button className="btn-primary" style={{ padding: '4px 10px', fontSize: '0.8rem', background: '#e74c3c' }}
                              onClick={() => handleDeleteOrder(o.id)}>
                              🗑️ Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    )})}
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
                  <option value="sang" style={{ background: "#222" }}>🌅 Ca Sáng (06h30 - 10h00)</option>
                  <option value="trua" style={{ background: "#222" }}>☀️ Ca Trưa (10h00 - 14h00)</option>
                  <option value="chieu-toi" style={{ background: "#222" }}>🌆 Ca Chiều - Tối (16h00 - 21h00)</option>
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
              💡 Nhập tên nhân viên và chọn đúng ca ở ô phía trên trước khi bấm Check-in / Check-out.
            </p>
          </div>
        )}

        {tab === 'schedule' && (
          <div className="glass-panel" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h2 style={{ color: '#f59e0b', marginTop: 0, borderBottom: '2px solid #f59e0b', paddingBottom: '0.5rem' }}>
              ⏰ Khung Giờ Vận Hành & Phối Hợp Bán Hàng
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.2rem' }}>
              Chi tiết các khung giờ hoạt động, cao điểm bán hàng và nhiệm vụ phối hợp giữa các mảng tại quán.
            </p>

            <div style={{ display: 'grid', gap: '12px', marginBottom: '1.5rem' }}>
              {STORE_SCHEDULE.map(s => {
                const isHighlight = s.id === shift;
                return (
                  <div key={s.id} style={{
                    padding: '1rem',
                    borderRadius: '12px',
                    border: isHighlight ? '2px solid #10b981' : '1px solid var(--glass-border)',
                    background: isHighlight ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255,255,255,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          background: s.id === 'prep' ? '#e67e22' : s.id === 'break' ? '#475569' : s.id === 'close' ? '#dc2626' : '#1e7145',
                          padding: '3px 10px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold'
                        }}>
                          {s.time}
                        </span>
                        <strong style={{ fontSize: '1.05rem', color: isHighlight ? '#10b981' : '#fff' }}>
                          {s.name}
                        </strong>
                      </div>
                      {isHighlight && (
                        <span style={{ fontSize: '0.8rem', background: '#10b981', color: '#0f172a', fontWeight: 'bold', padding: '2px 8px', borderRadius: '12px' }}>
                          👉 CA BẠN ĐANG CHỌN
                        </span>
                      )}
                    </div>
                    <div style={{ color: '#cbd5e1', fontSize: '0.92rem', paddingLeft: '4px', lineHeight: '1.5' }}>
                      {s.tasks}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Checklist nhắc việc đầu ca & cuối ca */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <div style={{ background: 'rgba(230, 126, 34, 0.12)', border: '1px solid #e67e22', borderRadius: '12px', padding: '1rem' }}>
                <h3 style={{ margin: '0 0 8px 0', color: '#e67e22', fontSize: '1rem' }}>🔥 06h00: Chuẩn Bị Đầu Ca</h3>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.88rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                  <li>Nhóm than bếp nướng, giữ tàn đỏ êm</li>
                  <li>Vo gạo cắm cơm tấm mẻ đầu tiên</li>
                  <li>Ướp thịt cốt lết, chuẩn bị bì chả & rau đồ chua</li>
                  <li>Bật đun nước mắm kẹo và phi mỡ hành</li>
                </ul>
              </div>

              <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid #ef4444', borderRadius: '12px', padding: '1rem' }}>
                <h3 style={{ margin: '0 0 8px 0', color: '#ef4444', fontSize: '1rem' }}>🔒 21h00 - 21h30: Đóng Cửa & Chốt Ca</h3>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.88rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                  <li>Vệ sinh vỉ nướng, cạo sạch muội than</li>
                  <li>Dập tắt than ủ an toàn, khóa van bình gas</li>
                  <li>Dọn dẹp rác, lau bàn ghế, quét sàn sạch sẽ</li>
                  <li>Kiểm kê tiền két và bấm Báo Cáo Cuối Ca</li>
                </ul>
              </div>
            </div>
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
                📊 Thống kê TRONG CA HIỆN TẠI ({shiftLabel(shift)}):
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
      </div>
    </LoginGate>
  );
}