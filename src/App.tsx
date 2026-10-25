import { useState, useEffect } from 'react';
import TableOrderPage from './pages/TableOrderPage';
import StaffPage from './pages/StaffPage';
import PlannerPage from './pages/PlannerPage';
import './App.css';

export default function App() {
  const checkShareholder = () => {
    if (typeof window === 'undefined') return false;
    const h = window.location.hash.toLowerCase();
    const s = window.location.search.toLowerCase();
    return h.includes('codong') || h.includes('baocao') || h.includes('report') || h.includes('share') || s.includes('codong') || s.includes('share');
  };

  const [isShareholder, setIsShareholder] = useState<boolean>(checkShareholder);

  const [activeTab, setActiveTab] = useState<'order' | 'staff' | 'planner'>(() => {
    const hash = window.location.hash.toLowerCase();
    if (hash.includes('planner') || hash.includes('codong') || hash.includes('baocao') || hash.includes('report') || hash.includes('share')) return 'planner';
    if (hash.includes('staff') || hash.includes('recipes') || hash.includes('pos')) return 'staff';
    return 'order';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const isShare = checkShareholder();
      setIsShareholder(isShare);
      const hash = window.location.hash.toLowerCase();
      if (isShare || hash.includes('planner') || hash.includes('codong') || hash.includes('baocao') || hash.includes('report') || hash.includes('share')) {
        setActiveTab('planner');
      } else if (hash.includes('staff') || hash.includes('recipes') || hash.includes('pos')) {
        setActiveTab('staff');
      } else {
        setActiveTab('order');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const changeTab = (tab: 'order' | 'staff' | 'planner') => {
    setActiveTab(tab);
    window.location.hash = '#/' + tab;
  };

  const isKioskMode = window.location.hash.includes('ban=') || window.location.search.includes('ban=') || window.location.hash.includes('kiosk=');

  return (
    <div className="app-container">
      {!isKioskMode && (
        <header className="app-header">
          <div className="header-content">
            <div className="brand" onClick={() => changeTab('order')}>
              <span className="brand-icon">🥩</span>
              <div>
                <div className="brand-title">TRẠM KHỞI NGHIỆP</div>
                <div className="brand-subtitle">
                  {isShareholder ? '📊 Cổng Thông Tin Báo Cáo Doanh Thu Cổ Đông' : 'Cơm Tấm Sườn Nướng Than Hoa & Cơm Chiên'}
                </div>
              </div>
            </div>
            {isShareholder ? (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  padding: '0.45rem 1rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem'
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  Cổng Cổ Đông Trực Tuyến
                </span>
              </div>
            ) : (
              <nav className="nav-tabs">
                <button 
                  className={activeTab === 'order' ? 'nav-tab active' : 'nav-tab'}
                  onClick={() => changeTab('order')}
                >
                  🍽️ Gọi Món Tại Bàn
                </button>
                <button 
                  className={activeTab === 'staff' ? 'nav-tab active' : 'nav-tab'}
                  onClick={() => changeTab('staff')}
                >
                  👥 Ca Làm / Bếp POS
                </button>
                <button 
                  className={activeTab === 'planner' ? 'nav-tab active' : 'nav-tab'}
                  onClick={() => changeTab('planner')}
                >
                  📊 Báo Cáo Doanh Thu
                </button>
              </nav>
            )}
          </div>
        </header>
      )}

      <main className="app-main">
        {activeTab === 'order' && <TableOrderPage />}
        {activeTab === 'staff' && <StaffPage />}
        {activeTab === 'planner' && <PlannerPage />}
      </main>
    </div>
  );
}
