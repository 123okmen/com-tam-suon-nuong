import { useState, useEffect } from 'react';
import TableOrderPage from './pages/TableOrderPage';
import PosPage from './pages/PosPage';
import StaffPage from './pages/StaffPage';
import PlannerPage from './pages/PlannerPage';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState<'order' | 'pos' | 'staff' | 'planner'>(() => {
    const hash = window.location.hash.toLowerCase();
    if (hash.includes('planner')) return 'planner';
    if (hash.includes('staff') || hash.includes('recipes')) return 'staff';
    if (hash.includes('pos')) return 'pos';
    return 'order';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('planner')) setActiveTab('planner');
      else if (hash.includes('staff') || hash.includes('recipes')) setActiveTab('staff');
      else if (hash.includes('pos')) setActiveTab('pos');
      else setActiveTab('order');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const changeTab = (tab: 'order' | 'pos' | 'staff' | 'planner') => {
    setActiveTab(tab);
    window.location.hash = '#/' + tab;
  };

  return (
    <div className="app-container">
      <header className="app-header" style={{ background: '#0f172a', borderBottom: '2px solid #f59e0b', position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="header-content" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', gap: '0.75rem' }}>
          <div className="brand" onClick={() => changeTab('order')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span className="brand-icon" style={{ fontSize: '1.6rem' }}>🍖</span>
            <div>
              <div className="brand-title" style={{ color: '#f59e0b', fontWeight: '900', fontSize: '1.25rem', letterSpacing: '0.5px', lineHeight: '1.1' }}>TRẠM KHỞI NGHIỆP</div>
              <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>Cơm Tấm Sườn Nướng & Cơm Chiên</div>
            </div>
          </div>
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
              className={activeTab === 'pos' ? 'nav-tab active' : 'nav-tab'}
              onClick={() => changeTab('pos')}
              style={{
                padding: '0.5rem 0.85rem',
                borderRadius: '8px',
                border: activeTab === 'pos' ? '2px solid #f59e0b' : '1px solid #334155',
                background: activeTab === 'pos' ? '#f59e0b' : 'rgba(30, 41, 59, 0.8)',
                color: activeTab === 'pos' ? '#0f172a' : '#cbd5e1',
                fontWeight: '800',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              💻 Bán Hàng (POS)
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
        </div>
      </header>

      <main className="app-main">
        {activeTab === 'order' && <TableOrderPage />}
        {activeTab === 'pos' && <PosPage />}
        {activeTab === 'staff' && <StaffPage />}
        {activeTab === 'planner' && <PlannerPage />}
      </main>
    </div>
  );
}
