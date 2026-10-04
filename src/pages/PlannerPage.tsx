import { useEffect, useState, useMemo } from 'react';
import LoginGate from '../components/LoginGate';
import {
  getOrders,
  localDateKey,
  fmtVND,
  ORDERS_CHANGED_EVENT,
  parseOrderDate
} from '../lib/store';
import type { Order, Shift } from '../lib/store';
import './PlannerPage.css';

const API_DATA_URL = 'https://script.google.com/macros/s/AKfycbyETg2znWnDrNsgq3G2eB0IJxFeb_GdLKo5N68FkFlJVMvTzdt_M_C3YFzL7fcgiyY1/exec?action=data';

interface DailyStat {
  dateKey: string; // YYYY-MM-DD
  displayDate: string; // DD/MM
  dayName: string; // Thứ 2, Thứ 3...
  total: number;
  orders: number;
  cash: number;
  bank: number;
  app: number;
  isToday: boolean;
}

export default function PlannerPage() {
  const [orders, setOrders] = useState<Order[]>(() => getOrders());
  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'month' | 'orders'>('today');
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => new Date().toLocaleTimeString('vi-VN'));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiData, setApiData] = useState<any>(null);

  // Chọn tuần: 0 = tuần này, -1 = tuần trước
  const [weekOffset, setWeekOffset] = useState<number>(0);

  // Chọn tháng: YYYY-MM (mặc định tháng hiện tại)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Tải dữ liệu từ LocalStorage & Google Sheets
  const refreshAllData = async () => {
    setIsRefreshing(true);
    setOrders(getOrders());
    try {
      const res = await fetch(API_DATA_URL, { headers: { Accept: 'application/json' } });
      const d = await res.json();
      if (d && d.ok) {
        setApiData(d);
      }
    } catch {
      // Bỏ qua lỗi mạng Google Sheets, số liệu cục bộ vẫn hoạt động chính xác
    }
    setLastSyncTime(new Date().toLocaleTimeString('vi-VN'));
    setIsRefreshing(false);
  };

  useEffect(() => {
    refreshAllData();

    // Lắng nghe sự kiện khi có đơn mới từ tab Nhập Món hoặc Gọi Món Tại Bàn
    const handleOrderChange = () => {
      setOrders(getOrders());
      setLastSyncTime(new Date().toLocaleTimeString('vi-VN'));
    };

    window.addEventListener(ORDERS_CHANGED_EVENT, handleOrderChange);
    window.addEventListener('storage', handleOrderChange);
    window.addEventListener('focus', handleOrderChange);

    // Tự động kiểm tra đồng bộ mỗi 12 giây
    const interval = setInterval(refreshAllData, 12000);

    return () => {
      clearInterval(interval);
      window.removeEventListener(ORDERS_CHANGED_EVENT, handleOrderChange);
      window.removeEventListener('storage', handleOrderChange);
      window.removeEventListener('focus', handleOrderChange);
    };
  }, []);

  // ----------------------------------------------------
  // 1. THANH TRÊN: TÍNH DOANH THU TRONG NGÀY (HÔM NAY)
  // ----------------------------------------------------
  const todayKey = localDateKey();

  const todayOrders = useMemo(() => {
    return orders.filter(o => {
      const orderDate = parseOrderDate(o.time);
      return localDateKey(orderDate) === todayKey;
    });
  }, [orders, todayKey]);

  const todayMetrics = useMemo(() => {
    let revenue = 0;
    let cash = 0;
    let bank = 0;
    let app = 0;

    for (const o of todayOrders) {
      const total = o.total || 0;
      revenue += total;
      if (o.paymentMethod === 'chuyenkhoan') {
        bank += total;
      } else if (o.paymentMethod === 'app') {
        app += total;
      } else {
        cash += total;
      }
    }

    return {
      revenue,
      orderCount: todayOrders.length,
      cash,
      bank,
      app
    };
  }, [todayOrders]);

  // Phân bổ theo 3 ca trong ngày
  const shiftBreakdown = useMemo(() => {
    const shifts: Record<Shift, { name: string; time: string; revenue: number; orders: number; cash: number; bank: number; app: number }> = {
      sang: { name: 'Ca Sáng (Điểm tâm & Cafe)', time: '06h30 - 10h00', revenue: 0, orders: 0, cash: 0, bank: 0, app: 0 },
      trua: { name: 'Ca Trưa (Cao điểm cơm trưa)', time: '10h00 - 14h00', revenue: 0, orders: 0, cash: 0, bank: 0, app: 0 },
      'chieu-toi': { name: 'Ca Chiều - Tối (BBQ & Ăn vặt)', time: '16h00 - 21h00', revenue: 0, orders: 0, cash: 0, bank: 0, app: 0 }
    };

    for (const o of todayOrders) {
      const s = o.shift || 'sang';
      if (shifts[s]) {
        const amt = o.total || 0;
        shifts[s].revenue += amt;
        shifts[s].orders += 1;
        if (o.paymentMethod === 'chuyenkhoan') shifts[s].bank += amt;
        else if (o.paymentMethod === 'app') shifts[s].app += amt;
        else shifts[s].cash += amt;
      }
    }

    return shifts;
  }, [todayOrders]);

  // Top món bán chạy nhất hôm nay
  const todayTopDishes = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; total: number }>();
    for (const o of todayOrders) {
      if (Array.isArray(o.lines)) {
        for (const l of o.lines) {
          const prev = map.get(l.name) || { name: l.name, qty: 0, total: 0 };
          prev.qty += (l.qty || 1);
          prev.total += (l.price * (l.qty || 1));
          map.set(l.name, prev);
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [todayOrders]);

  // ----------------------------------------------------
  // 2. BÁO CÁO TUẦN (WEEKLY REPORT)
  // ----------------------------------------------------
  const weekData = useMemo(() => {
    const now = new Date();
    // Điều chỉnh tuần theo weekOffset (0 = tuần này, -1 = tuần trước)
    const baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (weekOffset * 7));
    
    // Tìm Thứ Hai của tuần (Thứ 2 là ngày bắt đầu tuần)
    const day = baseDate.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    const monday = new Date(baseDate);
    monday.setDate(baseDate.getDate() + diff);
    monday.setHours(0, 0, 0, 0);

    const daysName = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
    const days: DailyStat[] = [];

    let weekRevenue = 0;
    let weekOrders = 0;
    let weekCash = 0;
    let weekBank = 0;
    let weekApp = 0;

    for (let i = 0; i < 7; i++) {
      const cur = new Date(monday);
      cur.setDate(monday.getDate() + i);
      const key = localDateKey(cur);
      const displayDate = `${String(cur.getDate()).padStart(2, '0')}/${String(cur.getMonth() + 1).padStart(2, '0')}`;
      const isCurToday = key === todayKey;

      // Tìm các đơn trong ngày này
      const matchingOrders = orders.filter(o => localDateKey(parseOrderDate(o.time)) === key);

      let dTotal = 0;
      let dOrders = matchingOrders.length;
      let dCash = 0;
      let dBank = 0;
      let dApp = 0;

      for (const o of matchingOrders) {
        const amt = o.total || 0;
        dTotal += amt;
        if (o.paymentMethod === 'chuyenkhoan') dBank += amt;
        else if (o.paymentMethod === 'app') dApp += amt;
        else dCash += amt;
      }

      // Nếu không có đơn local nhưng có dữ liệu từ Google Sheets baoCao
      if (dTotal === 0 && apiData && Array.isArray(apiData.baoCao)) {
        const dStr = `${String(cur.getDate()).padStart(2, '0')}/${String(cur.getMonth() + 1).padStart(2, '0')}/${cur.getFullYear()}`;
        const sheetEntries = apiData.baoCao.filter((b: any) => b.ngay === dStr);
        if (sheetEntries.length > 0) {
          for (const se of sheetEntries) {
            const amt = Number(se.doanhThu) || 0;
            const cAmt = Number(se.tienMat) || 0;
            dTotal += amt;
            dCash += cAmt;
            dBank += Math.max(0, amt - cAmt);
            dOrders += 1;
          }
        }
      }

      weekRevenue += dTotal;
      weekOrders += dOrders;
      weekCash += dCash;
      weekBank += dBank;
      weekApp += dApp;

      days.push({
        dateKey: key,
        displayDate,
        dayName: daysName[i],
        total: dTotal,
        orders: dOrders,
        cash: dCash,
        bank: dBank,
        app: dApp,
        isToday: isCurToday
      });
    }

    const maxDayRevenue = Math.max(...days.map(d => d.total), 1);
    const avgRevenue = weekRevenue / 7;

    return {
      startDate: days[0].displayDate,
      endDate: days[6].displayDate,
      days,
      weekRevenue,
      weekOrders,
      weekCash,
      weekBank,
      weekApp,
      maxDayRevenue,
      avgRevenue
    };
  }, [orders, weekOffset, todayKey, apiData]);

  // ----------------------------------------------------
  // 3. BÁO CÁO THÁNG (MONTHLY REPORT)
  // ----------------------------------------------------
  const monthData = useMemo(() => {
    const [yStr, mStr] = selectedMonth.split('-');
    const year = parseInt(yStr, 10);
    const month = parseInt(mStr, 10) - 1; // 0-indexed

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: DailyStat[] = [];

    let monthRevenue = 0;
    let monthOrders = 0;
    let monthCash = 0;
    let monthBank = 0;
    let monthApp = 0;

    // Phân bổ 5 tuần trong tháng
    const weeksBreakdown = [
      { name: 'Tuần 1 (Ngày 1 - 7)', revenue: 0, orders: 0 },
      { name: 'Tuần 2 (Ngày 8 - 14)', revenue: 0, orders: 0 },
      { name: 'Tuần 3 (Ngày 15 - 21)', revenue: 0, orders: 0 },
      { name: 'Tuần 4 (Ngày 22 - 28)', revenue: 0, orders: 0 },
      { name: 'Tuần 5 (Ngày 29 - cuối tháng)', revenue: 0, orders: 0 },
    ];

    // Thu thập món bán chạy trong tháng
    const dishSalesMap = new Map<string, { name: string; qty: number; total: number }>();

    for (let day = 1; day <= daysInMonth; day++) {
      const cur = new Date(year, month, day);
      const key = localDateKey(cur);
      const displayDate = `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}`;
      const isCurToday = key === todayKey;

      const matchingOrders = orders.filter(o => localDateKey(parseOrderDate(o.time)) === key);

      let dTotal = 0;
      let dOrders = matchingOrders.length;
      let dCash = 0;
      let dBank = 0;
      let dApp = 0;

      for (const o of matchingOrders) {
        const amt = o.total || 0;
        dTotal += amt;
        if (o.paymentMethod === 'chuyenkhoan') dBank += amt;
        else if (o.paymentMethod === 'app') dApp += amt;
        else dCash += amt;

        if (Array.isArray(o.lines)) {
          for (const l of o.lines) {
            const p = dishSalesMap.get(l.name) || { name: l.name, qty: 0, total: 0 };
            p.qty += (l.qty || 1);
            p.total += (l.price * (l.qty || 1));
            dishSalesMap.set(l.name, p);
          }
        }
      }

      // Bổ sung dữ liệu lịch sử từ Google Sheets baoCao nếu có
      if (dTotal === 0 && apiData && Array.isArray(apiData.baoCao)) {
        const dStr = `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`;
        const sheetEntries = apiData.baoCao.filter((b: any) => b.ngay === dStr);
        if (sheetEntries.length > 0) {
          for (const se of sheetEntries) {
            const amt = Number(se.doanhThu) || 0;
            const cAmt = Number(se.tienMat) || 0;
            dTotal += amt;
            dCash += cAmt;
            dBank += Math.max(0, amt - cAmt);
            dOrders += 1;
          }
        }
      }

      monthRevenue += dTotal;
      monthOrders += dOrders;
      monthCash += dCash;
      monthBank += dBank;
      monthApp += dApp;

      // Tính vào các tuần trong tháng
      if (day <= 7) { weeksBreakdown[0].revenue += dTotal; weeksBreakdown[0].orders += dOrders; }
      else if (day <= 14) { weeksBreakdown[1].revenue += dTotal; weeksBreakdown[1].orders += dOrders; }
      else if (day <= 21) { weeksBreakdown[2].revenue += dTotal; weeksBreakdown[2].orders += dOrders; }
      else if (day <= 28) { weeksBreakdown[3].revenue += dTotal; weeksBreakdown[3].orders += dOrders; }
      else { weeksBreakdown[4].revenue += dTotal; weeksBreakdown[4].orders += dOrders; }

      days.push({
        dateKey: key,
        displayDate,
        dayName: `Ngày ${day}`,
        total: dTotal,
        orders: dOrders,
        cash: dCash,
        bank: dBank,
        app: dApp,
        isToday: isCurToday
      });
    }

    const activeDays = days.filter(d => d.total > 0 || d.orders > 0).length || 1;
    const avgDailyRevenue = monthRevenue / activeDays;
    const avgTicket = monthOrders > 0 ? Math.round(monthRevenue / monthOrders) : 0;
    const topDishes = Array.from(dishSalesMap.values()).sort((a, b) => b.qty - a.qty).slice(0, 6);

    return {
      monthLabel: `Tháng ${month + 1}/${year}`,
      daysInMonth,
      monthRevenue,
      monthOrders,
      monthCash,
      monthBank,
      monthApp,
      avgDailyRevenue,
      avgTicket,
      weeksBreakdown,
      topDishes,
      days: days.filter(d => d.total > 0 || d.orders > 0 || d.isToday)
    };
  }, [orders, selectedMonth, todayKey, apiData]);

  return (
    <LoginGate expectedPassword="khoinghiep123" storageKey="auth_planner" title="Khu Vực Báo Cáo Doanh Thu">
      <div className="rpt-container">
        
        {/* HEADER BÁO CÁO */}
        <header className="rpt-header">
          <div>
            <h1 className="rpt-title">
              <span>📊 Báo Cáo Doanh Thu Real-Time</span>
            </h1>
            <p className="rpt-subtitle">
              Cơm Tấm Sườn Nướng & Cơm Chiên – Cập nhật trực tiếp chính xác từ Tab Nhập Món
            </p>
          </div>

          <div className="rpt-header-actions">
            <span className="rpt-badge-live">
              <span className="rpt-pulse-dot" />
              <span>Real-time Live Sync</span>
              <span style={{ opacity: 0.8, fontSize: '0.72rem' }}>({lastSyncTime})</span>
            </span>

            <button 
              className="rpt-btn-refresh" 
              onClick={refreshAllData} 
              disabled={isRefreshing}
              title="Làm mới số liệu ngay"
            >
              🔄 {isRefreshing ? 'Đang tải...' : 'Làm mới'}
            </button>

            <button 
              className="rpt-btn-refresh"
              onClick={() => { window.location.hash = '#/staff'; }}
              style={{ background: '#10b981', color: '#0f172a', borderColor: '#10b981' }}
            >
              ➕ Tab Nhập Món
            </button>
          </div>
        </header>

        {/* ======================================================== */}
        {/* THANH TRÊN - HIỂN THỊ DOANH THU, SỐ ĐƠN, TIỀN MẶT, CHUYỂN KHOẢN TRONG NGÀY */}
        {/* ======================================================== */}
        <section className="rpt-top-bar" aria-label="Thanh chỉ số doanh thu hôm nay">
          {/* Card 1: Doanh thu trong ngày */}
          <div className="rpt-card rpt-card-revenue">
            <div className="rpt-card-label">
              <span>💰 Doanh Thu Trong Ngày</span>
              <span>HÔM NAY</span>
            </div>
            <div className="rpt-card-value">
              {fmtVND(todayMetrics.revenue)}
            </div>
            <div className="rpt-card-sub">
              <span>Thực thu trực tiếp từ đơn hàng</span>
            </div>
          </div>

          {/* Card 2: Số đơn hàng trong ngày */}
          <div className="rpt-card rpt-card-orders">
            <div className="rpt-card-label">
              <span>📦 Số Đơn Hàng</span>
              <span>HÔM NAY</span>
            </div>
            <div className="rpt-card-value">
              {todayMetrics.orderCount} <span style={{ fontSize: '1rem', fontWeight: 600 }}>đơn</span>
            </div>
            <div className="rpt-card-sub">
              <span>{todayMetrics.orderCount > 0 ? `TB ${fmtVND(Math.round(todayMetrics.revenue / todayMetrics.orderCount))}/đơn` : 'Chưa có đơn'}</span>
            </div>
          </div>

          {/* Card 3: Tiền mặt trong ngày */}
          <div className="rpt-card rpt-card-cash">
            <div className="rpt-card-label">
              <span>💵 Tiền Mặt</span>
              <span>{todayMetrics.revenue > 0 ? `${Math.round((todayMetrics.cash / todayMetrics.revenue) * 100)}%` : '0%'}</span>
            </div>
            <div className="rpt-card-value">
              {fmtVND(todayMetrics.cash)}
            </div>
            <div className="rpt-card-sub">
              <span>Tiền thu tại quầy</span>
            </div>
          </div>

          {/* Card 4: Tiền chuyển khoản trong ngày */}
          <div className="rpt-card rpt-card-bank">
            <div className="rpt-card-label">
              <span>💳 Tiền Chuyển Khoản</span>
              <span>{todayMetrics.revenue > 0 ? `${Math.round((todayMetrics.bank / todayMetrics.revenue) * 100)}%` : '0%'}</span>
            </div>
            <div className="rpt-card-value">
              {fmtVND(todayMetrics.bank)}
            </div>
            <div className="rpt-card-sub">
              <span>Quét QR / Ngân hàng</span>
            </div>
          </div>
        </section>

        {/* Dải thông tin phụ cho đơn App (ShopeeFood / Grab) nếu có */}
        {todayMetrics.app > 0 && (
          <div className="rpt-app-strip">
            <span>🛵 <strong>Đơn Giao App Online Hôm Nay:</strong> {fmtVND(todayMetrics.app)}</span>
            <span>Tự động tách riêng khỏi tiền thu trực tiếp tại quầy</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* THANH ĐIỀU HƯỚNG TAB: HÔM NAY | BÁO CÁO TUẦN | BÁO CÁO THÁNG | CHI TIẾT ĐƠN */}
        {/* ======================================================== */}
        <nav className="rpt-nav-tabs">
          <button 
            className={`rpt-tab-btn ${activeTab === 'today' ? 'active' : ''}`}
            onClick={() => setActiveTab('today')}
          >
            📅 Hôm Nay & Phân Bổ Ca
          </button>
          <button 
            className={`rpt-tab-btn ${activeTab === 'week' ? 'active' : ''}`}
            onClick={() => setActiveTab('week')}
          >
            📊 Báo Cáo Tuần
          </button>
          <button 
            className={`rpt-tab-btn ${activeTab === 'month' ? 'active' : ''}`}
            onClick={() => setActiveTab('month')}
          >
            📈 Báo Cáo Tháng
          </button>
          <button 
            className={`rpt-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            🧾 Bảng Kê Đơn Hàng ({todayOrders.length})
          </button>
        </nav>

        {/* ======================================================== */}
        {/* NỘI DUNG TAB 1: HÔM NAY & PHÂN BỔ CA */}
        {/* ======================================================== */}
        {activeTab === 'today' && (
          <div>
            {/* Phân bổ theo 3 ca làm */}
            <div className="rpt-panel">
              <h2 className="rpt-panel-title">
                <span>⏰ Phân Bổ Doanh Thu Theo Ca Làm Việc Hôm Nay</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f59e0b' }}>
                  {todayOrders.length} đơn đã phát sinh
                </span>
              </h2>

              <div className="rpt-shifts-grid">
                {(['sang', 'trua', 'chieu-toi'] as Shift[]).map(sKey => {
                  const s = shiftBreakdown[sKey];
                  return (
                    <div key={sKey} className="rpt-shift-box">
                      <div className="rpt-shift-box-title">
                        <span>{s.name}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginBottom: '0.75rem' }}>
                        Khung giờ: {s.time}
                      </div>

                      <div className="rpt-shift-stat">
                        <span>Số đơn ca:</span>
                        <strong>{s.orders} đơn</strong>
                      </div>
                      <div className="rpt-shift-stat">
                        <span>Tiền mặt:</span>
                        <strong>{fmtVND(s.cash)}</strong>
                      </div>
                      <div className="rpt-shift-stat">
                        <span>Chuyển khoản:</span>
                        <strong>{fmtVND(s.bank)}</strong>
                      </div>
                      {s.app > 0 && (
                        <div className="rpt-shift-stat">
                          <span>Đơn App:</span>
                          <strong style={{ color: '#60a5fa' }}>{fmtVND(s.app)}</strong>
                        </div>
                      )}

                      <div className="rpt-shift-total">
                        <span>Tổng doanh thu:</span>
                        <span>{fmtVND(s.revenue)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top món bán chạy hôm nay & Đơn gần nhất */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              <div className="rpt-panel">
                <h3 className="rpt-panel-title">
                  <span>🏆 Món Bán Chạy Nhất Hôm Nay</span>
                </h3>
                {todayTopDishes.length === 0 ? (
                  <div className="rpt-empty" style={{ padding: '1.5rem' }}>
                    <div className="rpt-empty-icon">🍳</div>
                    <div className="rpt-empty-title">Chưa có món bán ra hôm nay</div>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      Các món sẽ tự động hiển thị ngay khi nhập món vào bếp.
                    </p>
                  </div>
                ) : (
                  <div>
                    {todayTopDishes.map((item, idx) => (
                      <div key={item.name} className="rpt-dish-row">
                        <div className={`rpt-dish-rank rpt-rank-${idx < 3 ? idx + 1 : 'other'}`}>
                          {idx + 1}
                        </div>
                        <div className="rpt-dish-info">
                          <div className="rpt-dish-name">{item.name}</div>
                          <div className="rpt-dish-qty">Đã bán: <strong>{item.qty} phần</strong></div>
                        </div>
                        <div className="rpt-dish-total">{fmtVND(item.total)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tóm tắt thanh toán hôm nay */}
              <div className="rpt-panel">
                <h3 className="rpt-panel-title">
                  <span>💳 Tỷ Trọng Thanh Toán Hôm Nay</span>
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                      <span>💵 Tiền mặt</span>
                      <strong>{fmtVND(todayMetrics.cash)} ({todayMetrics.revenue > 0 ? Math.round((todayMetrics.cash / todayMetrics.revenue) * 100) : 0}%)</strong>
                    </div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${todayMetrics.revenue > 0 ? (todayMetrics.cash / todayMetrics.revenue) * 100 : 0}%`, background: '#10b981' }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                      <span>💳 Chuyển khoản (QR / Ngân hàng)</span>
                      <strong>{fmtVND(todayMetrics.bank)} ({todayMetrics.revenue > 0 ? Math.round((todayMetrics.bank / todayMetrics.revenue) * 100) : 0}%)</strong>
                    </div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${todayMetrics.revenue > 0 ? (todayMetrics.bank / todayMetrics.revenue) * 100 : 0}%`, background: '#a855f7' }} />
                    </div>
                  </div>

                  {todayMetrics.app > 0 && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                        <span>🛵 Đơn App Online</span>
                        <strong>{fmtVND(todayMetrics.app)} ({todayMetrics.revenue > 0 ? Math.round((todayMetrics.app / todayMetrics.revenue) * 100) : 0}%)</strong>
                      </div>
                      <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${todayMetrics.revenue > 0 ? (todayMetrics.app / todayMetrics.revenue) * 100 : 0}%`, background: '#3b82f6' }} />
                      </div>
                    </div>
                  )}

                  <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.85rem 1rem', borderRadius: '10px', marginTop: '0.5rem', fontSize: '0.82rem', color: '#94a3b8' }}>
                    💡 <strong>Mẹo thu ngân:</strong> Tiền chuyển khoản quét QR hiển thị trực tiếp từ đơn hàng, đối soát dễ dàng với sao kê tài khoản ngân hàng cuối ca.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* NỘI DUNG TAB 2: BÁO CÁO TUẦN (WEEKLY REPORT) */}
        {/* ======================================================== */}
        {activeTab === 'week' && (
          <div>
            <div className="rpt-panel">
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                <h2 className="rpt-panel-title" style={{ margin: 0 }}>
                  <span>📊 Doanh Thu Tuần ({weekData.startDate} – {weekData.endDate})</span>
                </h2>
                
                {/* Bộ chuyển tuần */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    className="rpt-btn-refresh"
                    style={{ background: weekOffset === -1 ? '#f59e0b' : undefined, color: weekOffset === -1 ? '#0f172a' : undefined }}
                    onClick={() => setWeekOffset(-1)}
                  >
                    Tuần Trước
                  </button>
                  <button 
                    className="rpt-btn-refresh"
                    style={{ background: weekOffset === 0 ? '#f59e0b' : undefined, color: weekOffset === 0 ? '#0f172a' : undefined }}
                    onClick={() => setWeekOffset(0)}
                  >
                    Tuần Này (Hiện Tại)
                  </button>
                </div>
              </div>

              {/* Tóm tắt tuần */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Tổng Doanh Thu Tuần</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#f59e0b', marginTop: '0.3rem' }}>{fmtVND(weekData.weekRevenue)}</div>
                </div>
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Tổng Đơn Hàng</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#60a5fa', marginTop: '0.3rem' }}>{weekData.weekOrders} đơn</div>
                </div>
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Doanh Thu TB / Ngày</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10b981', marginTop: '0.3rem' }}>{fmtVND(Math.round(weekData.avgRevenue))}</div>
                </div>
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Tiền Mặt / Chuyển Khoản</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e2e8f0', marginTop: '0.5rem' }}>
                    TM: {fmtVND(weekData.weekCash)} <br />
                    CK: {fmtVND(weekData.weekBank)}
                  </div>
                </div>
              </div>

              {/* BIỂU ĐỒ CỘT 7 NGÀY TRONG TUẦN */}
              <div className="rpt-chart-wrapper">
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.6rem' }}>
                  📈 Biểu đồ doanh thu 7 ngày (Thứ 2 → Chủ Nhật):
                </div>

                <div className="rpt-bars-container">
                  {weekData.days.map(d => {
                    const heightPercent = weekData.maxDayRevenue > 0 ? Math.max(6, Math.round((d.total / weekData.maxDayRevenue) * 100)) : 6;
                    return (
                      <div key={d.dateKey} className={`rpt-bar-col ${d.isToday ? 'is-today' : ''}`}>
                        <div className="rpt-bar-val">{d.total > 0 ? (d.total >= 1000000 ? `${(d.total/1000000).toFixed(1)}M` : `${Math.round(d.total/1000)}k`) : ''}</div>
                        <div className="rpt-bar-track">
                          <div 
                            className="rpt-bar-fill" 
                            style={{ height: `${heightPercent}%` }}
                            title={`${d.dayName} (${d.displayDate}): ${fmtVND(d.total)} (${d.orders} đơn)`}
                          />
                        </div>
                        <div className="rpt-bar-label">
                          <div>{d.dayName}</div>
                          <div className="rpt-bar-date">{d.displayDate}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bảng chi tiết từng ngày trong tuần */}
              <div style={{ marginTop: '1.8rem' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '0.6rem' }}>
                  📋 Chi tiết doanh thu từng ngày trong tuần
                </div>
                <div className="rpt-table-container">
                  <table className="rpt-table">
                    <thead>
                      <tr>
                        <th>Thứ & Ngày</th>
                        <th style={{ textAlign: 'center' }}>Số Đơn</th>
                        <th style={{ textAlign: 'right' }}>Tiền Mặt</th>
                        <th style={{ textAlign: 'right' }}>Chuyển Khoản</th>
                        <th style={{ textAlign: 'right' }}>Đơn App</th>
                        <th style={{ textAlign: 'right' }}>Tổng Doanh Thu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weekData.days.map(d => (
                        <tr key={d.dateKey} className={d.isToday ? 'highlight-today' : ''}>
                          <td>
                            <strong>{d.dayName}</strong> ({d.displayDate})
                            {d.isToday && <span style={{ marginLeft: '6px', color: '#10b981', fontSize: '0.75rem', fontWeight: 800 }}>● HÔM NAY</span>}
                          </td>
                          <td style={{ textAlign: 'center' }}>{d.orders} đơn</td>
                          <td style={{ textAlign: 'right' }}>{fmtVND(d.cash)}</td>
                          <td style={{ textAlign: 'right' }}>{fmtVND(d.bank)}</td>
                          <td style={{ textAlign: 'right' }}>{fmtVND(d.app)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: d.total > 0 ? '#f59e0b' : '#94a3b8' }}>
                            {fmtVND(d.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* NỘI DUNG TAB 3: BÁO CÁO THÁNG (MONTHLY REPORT) */}
        {/* ======================================================== */}
        {activeTab === 'month' && (
          <div>
            <div className="rpt-panel">
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                <h2 className="rpt-panel-title" style={{ margin: 0 }}>
                  <span>📈 Doanh Thu {monthData.monthLabel}</span>
                </h2>

                {/* Chọn Tháng */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Chọn tháng:</span>
                  <input 
                    type="month" 
                    value={selectedMonth} 
                    onChange={e => setSelectedMonth(e.target.value)}
                    className="input-field"
                    style={{ padding: '0.4rem 0.8rem', width: 'auto', background: 'rgba(15, 23, 42, 0.8)', color: '#fff', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              {/* Tóm tắt tháng */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Tổng Doanh Thu Tháng</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#f59e0b', marginTop: '0.3rem' }}>{fmtVND(monthData.monthRevenue)}</div>
                </div>
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Tổng Số Đơn Hàng</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#60a5fa', marginTop: '0.3rem' }}>{monthData.monthOrders} đơn</div>
                </div>
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Doanh Thu TB / Ngày</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10b981', marginTop: '0.3rem' }}>{fmtVND(Math.round(monthData.avgDailyRevenue))}</div>
                </div>
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Giá Trị TB / Đơn</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#c084fc', marginTop: '0.3rem' }}>{fmtVND(monthData.avgTicket)}</div>
                </div>
              </div>

              {/* Phân bổ theo 5 tuần trong tháng */}
              <div style={{ marginBottom: '1.8rem' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '0.75rem' }}>
                  🗓️ Phân bổ doanh thu theo từng tuần trong tháng:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                  {monthData.weeksBreakdown.map((w, idx) => (
                    <div key={idx} style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '0.85rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>{w.name}</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fbbf24', marginTop: '0.35rem' }}>{fmtVND(w.revenue)}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{w.orders} đơn hàng</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top món bán chạy nhất trong tháng */}
              {monthData.topDishes.length > 0 && (
                <div style={{ marginBottom: '1.8rem' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '0.75rem' }}>
                    🏆 Top món bán chạy nhất trong tháng ({monthData.monthLabel})
                  </div>
                  <div>
                    {monthData.topDishes.map((item, idx) => (
                      <div key={item.name} className="rpt-dish-row">
                        <div className={`rpt-dish-rank rpt-rank-${idx < 3 ? idx + 1 : 'other'}`}>
                          {idx + 1}
                        </div>
                        <div className="rpt-dish-info">
                          <div className="rpt-dish-name">{item.name}</div>
                          <div className="rpt-dish-qty">Đã bán: <strong>{item.qty} phần</strong></div>
                        </div>
                        <div className="rpt-dish-total">{fmtVND(item.total)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bảng kê ngày có doanh thu trong tháng */}
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '0.6rem' }}>
                  📋 Lịch sử các ngày bán hàng trong tháng
                </div>
                {monthData.days.length === 0 ? (
                  <div className="rpt-empty" style={{ padding: '1.5rem' }}>
                    <div className="rpt-empty-icon">📅</div>
                    <div className="rpt-empty-title">Chưa có đơn hàng trong tháng này</div>
                  </div>
                ) : (
                  <div className="rpt-table-container">
                    <table className="rpt-table">
                      <thead>
                        <tr>
                          <th>Ngày</th>
                          <th style={{ textAlign: 'center' }}>Số Đơn</th>
                          <th style={{ textAlign: 'right' }}>Tiền Mặt</th>
                          <th style={{ textAlign: 'right' }}>Chuyển Khoản</th>
                          <th style={{ textAlign: 'right' }}>Tổng Doanh Thu</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthData.days.map(d => (
                          <tr key={d.dateKey} className={d.isToday ? 'highlight-today' : ''}>
                            <td>
                              <strong>{d.displayDate}</strong>
                              {d.isToday && <span style={{ marginLeft: '6px', color: '#10b981', fontSize: '0.75rem', fontWeight: 800 }}>● HÔM NAY</span>}
                            </td>
                            <td style={{ textAlign: 'center' }}>{d.orders} đơn</td>
                            <td style={{ textAlign: 'right' }}>{fmtVND(d.cash)}</td>
                            <td style={{ textAlign: 'right' }}>{fmtVND(d.bank)}</td>
                            <td style={{ textAlign: 'right', fontWeight: 800, color: '#f59e0b' }}>{fmtVND(d.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* NỘI DUNG TAB 4: BẢNG KÊ ĐƠN HÀNG HÔM NAY */}
        {/* ======================================================== */}
        {activeTab === 'orders' && (
          <div className="rpt-panel">
            <h2 className="rpt-panel-title">
              <span>🧾 Danh Sách Đơn Hàng Hôm Nay ({todayOrders.length} đơn)</span>
              <span style={{ fontSize: '0.82rem', color: '#10b981' }}>
                Tổng thu: <strong>{fmtVND(todayMetrics.revenue)}</strong>
              </span>
            </h2>

            {todayOrders.length === 0 ? (
              <div className="rpt-empty">
                <div className="rpt-empty-icon">🍽️</div>
                <div className="rpt-empty-title">Hôm nay chưa có đơn hàng nào</div>
                <p>Mỗi khi nhân viên hoặc khách gọi món qua Tab Nhập Món, đơn hàng sẽ hiển thị real-time tại đây.</p>
                <button 
                  className="rpt-btn-goto-order"
                  onClick={() => { window.location.hash = '#/staff'; }}
                >
                  👉 Sang Tab Nhập Món Để Bán Hàng
                </button>
              </div>
            ) : (
              <div className="rpt-table-container">
                <table className="rpt-table">
                  <thead>
                    <tr>
                      <th>Giờ</th>
                      <th>Mã Đơn</th>
                      <th>Khách / Nhân Viên</th>
                      <th>Món Ăn</th>
                      <th style={{ textAlign: 'right' }}>Tổng Tiền</th>
                      <th style={{ textAlign: 'center' }}>Hình Thức TT</th>
                      <th style={{ textAlign: 'center' }}>Đồng Bộ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayOrders.map(o => {
                      const d = parseOrderDate(o.time);
                      const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                      return (
                        <tr key={o.id}>
                          <td><strong>{timeStr}</strong></td>
                          <td style={{ fontFamily: 'monospace', color: '#93c5fd' }}>{o.id}</td>
                          <td>
                            {o.tableNo ? <span style={{ color: '#f59e0b', fontWeight: 700 }}>Bàn {o.tableNo}</span> : (o.staff || 'Khách')}
                          </td>
                          <td style={{ maxWidth: '300px' }}>
                            {Array.isArray(o.lines) ? o.lines.map(l => `${l.name} x${l.qty}`).join(', ') : 'Chi tiết đơn'}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: '#fef08a' }}>
                            {fmtVND(o.total)}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {o.paymentMethod === 'chuyenkhoan' && <span className="rpt-badge rpt-badge-bank">Chuyển Khoản</span>}
                            {o.paymentMethod === 'app' && <span className="rpt-badge rpt-badge-app">Đơn App</span>}
                            {(!o.paymentMethod || o.paymentMethod === 'tienmat') && <span className="rpt-badge rpt-badge-cash">Tiền Mặt</span>}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {o.synced ? (
                              <span style={{ color: '#10b981', fontSize: '0.8rem' }} title="Đã đồng bộ lên Google Sheets">✅</span>
                            ) : (
                              <span style={{ color: '#f59e0b', fontSize: '0.8rem' }} title="Đã lưu máy (chờ mạng)">💾 Cục bộ</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </LoginGate>
  );
}
