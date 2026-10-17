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
        <header className="app-header" style={{ background: '#0a0a0a', borderBottom: '3px solid #e31837', position: 'sticky', top: 0, zIndex: 100 }}>
          <div className="header-content" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', gap: '0.75rem' }}>
            <div className="brand" onClick={() => changeTab('order')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span className="brand-icon" style={{ fontSize: '1.6rem' }}>🥩</span>
            <div>
              <div className="brand-title" style={{ color: '#f59e0b', fontWeight: '900', fontSize: '1.25rem', letterSpacing: '0.5px', lineHeight: '1.1' }}>TRẠM KHỞI NGHIỆP</div>
              <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>
                {isShareholder ? '📊 Báo Cáo Doanh Thu Dành Cho Cổ Đông' : 'Cơm Tấm Sườn Nướng & Cơm Chiên'}
              </div>
            </div>
          </div>
          {isShareholder ? (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                padding: '0.4rem 0.85rem',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                Cổng Thông Tin Cổ Đông (Trực Tuyến)
              </span>
            </div>
          ) : (
          <nav className="nav-tabs" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            <button 
              className={activeTab === 'order' ? 'nav-tab active' : 'nav-tab'}
              onClick={() => changeTab('order')}
              style={{
                padding: '0.5rem 0.85rem',
                borderRadius: '8px',
                border: activeTab === 'order' ? '2px solid #f59e0b' : '1px solid #334155',
                background: activeTab === 'order' ? '#f59e0b' : 'rgba(30, 41, 59, 0.8)',
                color: activeTab === 'order' ? '#0f172a' : '#cbd5e1',
                fontWeight: '800',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              🍽️ Gọi Món Tại Bàn
            </button>
            <button 
              className={activeTab === 'staff' ? 'nav-tab active' : 'nav-tab'}
              onClick={() => changeTab('staff')}
              style={{
                padding: '0.5rem 0.85rem',
                borderRadius: '8px',
                border: activeTab === 'staff' ? '2px solid #f59e0b' : '1px solid #334155',
                background: activeTab === 'staff' ? '#f59e0b' : 'rgba(30, 41, 59, 0.8)',
                color: activeTab === 'staff' ? '#0f172a' : '#cbd5e1',
                fontWeight: '800',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              👥 Ca Làm / Bếp
            </button>
            <button 
              className={activeTab === 'planner' ? 'nav-tab active' : 'nav-tab'}
              onClick={() => changeTab('planner')}
              style={{
                padding: '0.5rem 0.85rem',
                borderRadius: '8px',
                border: activeTab === 'planner' ? '2px solid #f59e0b' : '1px solid #334155',
                background: activeTab === 'planner' ? '#f59e0b' : 'rgba(30, 41, 59, 0.8)',
                color: activeTab === 'planner' ? '#0f172a' : '#cbd5e1',
                fontWeight: '800',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              📊 Báo Cáo
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
