import { useMemo, useState } from 'react';
import MenuItemCard from '../components/MenuItemCard';
import {
  CATEGORIES, MENU,
  getShift, newOrderId, saveOrder, syncTableOrder, fmtVND,
} from '../lib/store';
import type { Category, MenuItem, Order, OrderLine, OrderType } from '../lib/store';
import './TableOrderPage.css';

const TABLE_COUNT = 20;
const QUICK_NOTES = ['Ít cơm', 'Nhiều cơm', 'Không hành', 'Thêm mỡ hành', 'Nước mắm riêng', 'Không dưa leo'];

/** Đọc số bàn từ URL, vd: .../#/order?ban=5 (dùng cho mã QR dán ở từng bàn). */
function tableFromUrl(): number | '' {
  const q = window.location.hash.split('?')[1] || window.location.search.slice(1);
  const n = parseInt(new URLSearchParams(q).get('ban') || '', 10);
  return n >= 1 && n <= 99 ? n : '';
}

export default function TableOrderPage() {
  const [activeCat, setActiveCat] = useState<Category | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<OrderLine[]>([]);
  const [tableNo, setTableNo] = useState<number | ''>(tableFromUrl);
  const [orderType, setOrderType] = useState<OrderType>('tai-quan');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [sentOrder, setSentOrder] = useState<Order | null>(null);
  const [sendFailed, setSendFailed] = useState(false);

  const visibleCats = activeCat === 'all' ? CATEGORIES : CATEGORIES.filter(c => c.id === activeCat);
  const qtyById = useMemo(() => Object.fromEntries(cart.map(l => [l.id, l.qty])), [cart]);
  const total = useMemo(() => cart.reduce((s, l) => s + l.price * l.qty, 0), [cart]);
  const itemCount = useMemo(() => cart.reduce((s, l) => s + l.qty, 0), [cart]);

  const addItem = (item: MenuItem) => {
    setCart(prev => {
      const found = prev.find(l => l.id === item.id);
      if (found) return prev.map(l => l.id === item.id ? { ...l, qty: l.qty + 1 } : l);
      return [...prev, { id: item.id, name: item.name, price: item.price, qty: 1 }];
    });
  };

  const changeQty = (id: string, delta: number) => {
    setCart(prev => prev.map(l => l.id === id ? { ...l, qty: Math.max(0, l.qty + delta) } : l).filter(l => l.qty > 0));
  };

  const setLineNote = (id: string, value: string) => {
    setCart(prev => prev.map(l => l.id === id ? { ...l, note: value } : l));
  };

  const toggleQuickNote = (q: string) => {
    setNote(prev => {
      const parts = prev.split(',').map(s => s.trim()).filter(Boolean);
      return (parts.includes(q) ? parts.filter(p => p !== q) : [...parts, q]).join(', ');
    });
  };

  const submit = async () => {
    if (cart.length === 0) return;
    if (orderType === 'tai-quan' && !tableNo) {
      alert('Vui lòng chọn số bàn bạn đang ngồi!');
      return;
    }
    setSending(true);
    const order: Order = {
      id: newOrderId(),
      time: new Date().toISOString(),
      tableNo: orderType === 'tai-quan' ? Number(tableNo) : undefined,
      orderType,
      staff: orderType === 'tai-quan' ? `Khách - Bàn ${tableNo}` : 'Khách - Mang về',
      shift: getShift(),
      lines: cart,
      total,
      note: note.trim() || undefined,
      synced: false,
    };
    saveOrder(order);
    const ok = await syncTableOrder(order);
    order.synced = ok;
    saveOrder(order);
    setSending(false);
    setSendFailed(!ok);
    setSentOrder(order);
    if (ok) {
      setCart([]);
      setNote('');
    }
  };

  // ---------- Màn hình xác nhận ----------
  if (sentOrder) {
    return (
      <div className="tor">
        <div className="glass-panel tor-done">
          <div className="tor-done__icon">{sendFailed ? '⚠️' : '✅'}</div>
          <h2>{sendFailed ? 'Chưa gửi được đơn' : 'Đã gửi đơn vào bếp!'}</h2>
          <p className="tor-muted">
            {sendFailed
              ? 'Mạng đang lỗi. Vui lòng đưa màn hình này cho nhân viên hoặc thử gửi lại.'
              : 'Quán đang chuẩn bị món. Bạn thanh toán tại quầy khi dùng xong nhé.'}
          </p>
          <div className="tor-done__meta">
            <span>Mã đơn: <strong>{sentOrder.id}</strong></span>
            <span>{sentOrder.tableNo ? `Bàn ${sentOrder.tableNo}` : 'Mang về'}</span>
          </div>
          <ul className="tor-done__lines">
            {sentOrder.lines.map(l => (
              <li key={l.id}>
                <span>{l.qty} × {l.name}{l.note ? <em> ({l.note})</em> : null}</span>
                <strong>{fmtVND(l.price * l.qty)}</strong>
              </li>
            ))}
          </ul>
          {sentOrder.note && <p className="tor-muted">Ghi chú: {sentOrder.note}</p>}
          <div className="tor-total"><span>Tổng tạm tính</span><strong>{fmtVND(sentOrder.total)}</strong></div>
          <div className="tor-done__actions">
            {sendFailed && (
              <button className="btn-primary" disabled={sending} onClick={() => { setSentOrder(null); }}>
                ↩️ Quay lại thử gửi lại
              </button>
            )}
            {!sendFailed && (
              <button className="btn-primary" onClick={() => setSentOrder(null)}>➕ Gọi thêm món</button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---------- Màn hình gọi món ----------
  return (
    <div className="tor">
      {/* Banner nhà hàng sang trọng */}
      <section className="tor-hero">
        <div className="tor-hero__badge-row">
          <span className="tor-hero__badge">
            ★ CƠM TẤM SƯỜN NƯỚNG THAN HOA
          </span>
          <span className="tor-hero__pill">
            🟢 Đang mở cửa phục vụ
          </span>
          <span className="tor-hero__pill" style={{ color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.4)', background: 'rgba(245, 158, 11, 0.15)' }}>
            🥩 Suất 2 Sườn Cho Gymer (55K) · Sườn Bì Chả Trứng (50K)
          </span>
        </div>
        <h1>🥩 TRẠM KHỞI NGHIỆP — CƠM TẤM SƯỜN NƯỚNG THAN HOA</h1>
        <div className="tor-hero__info-row">
          <span>📍 <strong>Cơ sở:</strong> Trạm Khởi Nghiệp Cơm Tấm</span>
          <span>📞 <strong>Hotline/Zalo đặt cơm:</strong> <a href="tel:0931811872" style={{ color: '#fbbf24', textDecoration: 'none' }}>0931.811.872</a></span>
          <span>🛵 <strong>Giao cơm hộp:</strong> Tận nơi cho văn phòng, xưởng, công ty</span>
        </div>
      </section>

      {/* Thanh tìm kiếm & lọc danh mục sticky */}
      <div className="tor-filter-bar">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <input
            className="input-field"
            style={{ flex: '1 1 240px', padding: '0.6rem 1rem', fontSize: '0.9rem' }}
            placeholder="🔍 Tìm món cơm tấm, cơm chiên (sườn bì chả, 2 sườn, dưa bò...)"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <div className="tor-chips" role="tablist" aria-label="Danh mục món">
            <button className={activeCat === 'all' ? 'tor-chip active' : 'tor-chip'} onClick={() => setActiveCat('all')}>
              🍽️ Tất cả ({MENU.length})
            </button>
            {CATEGORIES.map(c => (
              <button key={c.id} className={activeCat === c.id ? 'tor-chip active' : 'tor-chip'} onClick={() => setActiveCat(c.id)}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="order-layout">
        <div>
          {visibleCats.map(c => (
            <section key={c.id} className="glass-panel tor-section">
              <h2 style={{ color: c.color }}>{c.emoji} {c.label}</h2>
              <div className="menu-grid">
                {MENU.filter(m => {
                    if (m.category !== c.id) return false;
                    if (!searchQuery.trim()) return true;
                    return m.name.toLowerCase().includes(searchQuery.trim().toLowerCase());
                  }).map(item => (
                  <MenuItemCard key={item.id} item={item} onAdd={addItem} qtyInCart={qtyById[item.id] || 0} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside id="tor-cart" className="glass-panel order-layout__cart tor-cart">
          <h2>🛒 Đơn của bạn</h2>

          <div className="tor-type">
            <button className={orderType === 'tai-quan' ? 'tor-chip active' : 'tor-chip'} onClick={() => setOrderType('tai-quan')}>🪑 Ăn tại quán</button>
            <button className={orderType === 'mang-ve' ? 'tor-chip active' : 'tor-chip'} onClick={() => setOrderType('mang-ve')}>🥡 Mang về</button>
          </div>

          {orderType === 'tai-quan' && (
            <label className="tor-field">
              <span>Số bàn *</span>
              <select className="input-field" value={tableNo} onChange={e => setTableNo(e.target.value ? Number(e.target.value) : '')}>
                <option value="">-- Chọn bàn --</option>
                {Array.from({ length: TABLE_COUNT }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>Bàn {n}</option>
                ))}
              </select>
            </label>
          )}

          {cart.length === 0 ? (
            <p className="tor-muted tor-empty">Bấm vào món để thêm vào đơn</p>
          ) : (
            <>
              {cart.map(l => (
                <div key={l.id} className="tor-line">
                  <div className="tor-line__row">
                    <div className="tor-line__name">
                      <div>{l.name}</div>
                      <small>{fmtVND(l.price)}</small>
                    </div>
                    <div className="qty-stepper">
                      <button type="button" aria-label="Bớt" onClick={() => changeQty(l.id, -1)}>−</button>
                      <span>{l.qty}</span>
                      <button type="button" aria-label="Thêm" onClick={() => changeQty(l.id, 1)}>+</button>
                    </div>
                  </div>
                  <input
                    className="input-field tor-line__note"
                    placeholder="Ghi chú món (vd: sườn cháy cạnh)"
                    value={l.note || ''}
                    onChange={e => setLineNote(l.id, e.target.value)}
                  />
                </div>
              ))}

              <div className="tor-quick">
                {QUICK_NOTES.map(q => (
                  <button key={q} type="button"
                    className={note.split(',').map(s => s.trim()).includes(q) ? 'tor-chip small active' : 'tor-chip small'}
                    onClick={() => toggleQuickNote(q)}>
                    {q}
                  </button>
                ))}
              </div>
              <textarea className="input-field" rows={2} placeholder="Ghi chú chung cho cả đơn..."
                value={note} onChange={e => setNote(e.target.value)} />

              <div className="tor-total-row">
                <span className="tor-total-label">Tổng cộng:</span>
                <span className="tor-total-amount">{fmtVND(total)}</span>
              </div>
              <button className="tor-submit-btn" disabled={sending} onClick={submit}>
                {sending ? 'Đang gửi...' : '🔔 GỬI ĐƠN VÀO BẾP NGAY'}
              </button>
              <p className="tor-muted" style={{ textAlign: 'center', fontSize: '0.75rem', marginTop: '8px' }}>
                Thanh toán tại quầy hoặc quét mã VietQR sau khi dùng bữa.
              </p>
            </>
          )}
        </aside>
      </div>

      {/* Thanh giỏ hàng nổi trên điện thoại */}
      {itemCount > 0 && (
        <a href="#tor-cart" className="tor-floatbar" onClick={e => { e.preventDefault(); document.getElementById('tor-cart')?.scrollIntoView({ behavior: 'smooth' }); }}>
          <span>🛒 {itemCount} món</span>
          <strong>{fmtVND(total)} · Xem đơn ›</strong>
        </a>
      )}
    </div>
  );
}
