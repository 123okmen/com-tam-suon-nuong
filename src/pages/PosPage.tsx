import React, { useState, useEffect, useMemo } from 'react';
import LoginGate from '../components/LoginGate';
import { MENU, getOrders, saveOrder, syncOrder, getShift, shiftLabel, fmtVND, fmtTime } from '../lib/store';
import type { Order, OrderLine } from '../lib/store';

export default function PosPage() {
  const [staff, setStaff] = useState('');
  const [shift, setShift] = useState<'sang' | 'trua' | 'toi' | 'gay' | 'chieu'>(getShift());
  const [cart, setCart] = useState<OrderLine[]>([]);
  const [cash, setCash] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [toast, setToast] = useState('');

  useEffect(() => { setOrders(getOrders()); }, []);

  const addItem = (id: string, name: string, price: number) => {
    setCart(prev => {
      const found = prev.find(l => l.id === id);
      if (found) return prev.map(l => l.id === id ? { ...l, qty: l.qty + 1 } : l);
      return [...prev, { id, name, price, qty: 1 }];
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
    setOrders(getOrders());
    setCart([]);
    setCash('');
    setToast(ok ? 'DA LUU' : 'LOI MANG - DA LUU CUC BO');
    setTimeout(() => setToast(''), 4000);
  };

  const todayOrders = useMemo(() => {
    const today = new Date().toDateString();
    return orders.filter(o => new Date(o.time).toDateString() === today);
  }, [orders]);

  const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0);

  return (
    <LoginGate expectedPassword="sammixnv" storageKey="auth_pos" title="Khu Vực Bán Hàng">
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', color: 'var(--text-primary)' }}>
        <h1 style={{ color: '#10b981', textAlign: 'center', marginBottom: '0.5rem' }}>🧾 Nhập Món và Bán Hàng</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Mỗi đơn hàng gắn với nhân viên bán - kiểm soát lượng bán từng người
        </p>

        <div className="glass-panel" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Ca làm việc</div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button onClick={() => setShift('sang')} className="btn-primary"
                style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', background: shift === 'sang' ? '#1e7145' : 'rgba(255,255,255,0.1)' }}>
                🌅 Ca Sáng (7h30-12h30)
              </button>
              <button onClick={() => setShift('chieu')} className="btn-primary"
                style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', background: shift === 'chieu' ? '#d35400' : 'rgba(255,255,255,0.1)' }}>
                🌆 Ca Chiều Tối (13h-21h)
              </button>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Tên nhân viên bán *</div>
            <input className="input-field" style={{ padding: '0.5rem 1rem' }} placeholder="VD: Linh, Hoa..."
              value={staff} onChange={e => setStaff(e.target.value)} />
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Doanh thu hôm nay</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#10b981' }}>{fmtVND(todayRevenue)}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{todayOrders.length} đơn</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.5rem' }}>
          <div>
            {(['sam', 'ep', 'food'] as const).map(cat => (
              <div key={cat} className="glass-panel" style={{ marginBottom: '1.5rem', padding: '1.2rem' }}>
                <h2 style={{ marginTop: 0, color: cat === 'sam' ? '#d35400' : '#3498db', fontSize: '1.1rem' }}>
                  {cat === 'sam' ? '🍵 Trà Sâm Thảo Mộc' : cat === 'ep' ? '🥤 Nước Ép Trái Cây Tươi' : '🍢 Đồ Ăn Vặt & Nem Nướng'}
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                  {MENU.filter(m => m.category === cat).map(item => (
                    <button key={item.id} onClick={() => addItem(item.id, item.name, item.price)}
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '10px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}>
                      <img src={import.meta.env.BASE_URL + item.img} alt={item.name}
                        style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '6px', color: 'var(--text-primary)' }}>{item.name}</div>
                      <div style={{ color: '#10b981', fontWeight: 'bold' }}>{fmtVND(item.price)}</div>
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
            {toast && (
              <div style={{ marginTop: '12px', padding: '10px', borderRadius: '8px', background: 'rgba(16,185,129,0.15)', border: '1px solid #10b981', fontSize: '0.9rem', textAlign: 'center' }}>
                {toast}
              </div>
            )}
          </div>
        </div>

        <div className="glass-panel" style={{ marginTop: '1.5rem' }}>
          <h2 style={{ marginTop: 0, color: '#3498db' }}>📜 Đơn hàng hôm nay ({todayOrders.length})</h2>
          {todayOrders.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem 0' }}>Chưa có đơn nào</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ color: '#94a3b8', borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '8px' }}>Mã đơn</th>
                  <th style={{ padding: '8px' }}>Giờ</th>
                  <th style={{ padding: '8px' }}>Nhân viên</th>
                  <th style={{ padding: '8px' }}>Ca</th>
                  <th style={{ padding: '8px' }}>Món</th>
                  <th style={{ padding: '8px' }}>Tổng</th>
                  <th style={{ padding: '8px' }}>Đồng bộ</th>
                </tr>
              </thead>
              <tbody>
                {todayOrders.slice().reverse().map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold' }}>{o.id}</td>
                    <td style={{ padding: '8px' }}>{fmtTime(o.time)}</td>
                    <td style={{ padding: '8px' }}>{o.staff}</td>
                    <td style={{ padding: '8px' }}>{shiftLabel(o.shift)}</td>
                    <td style={{ padding: '8px', fontSize: '0.8rem' }}>{o.lines.map(l => l.name + ' x' + l.qty).join(', ')}</td>
                    <td style={{ padding: '8px', fontWeight: 'bold', color: '#10b981' }}>{fmtVND(o.total)}</td>
                    <td style={{ padding: '8px' }}>{o.synced ? '✅' : '⏳'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </LoginGate>
  );
}

const qtyBtn: React.CSSProperties = {
  width: '30px', height: '30px', borderRadius: '8px', border: '1px solid var(--glass-border)',
  background: 'rgba(255,255,255,0.1)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem'
};
