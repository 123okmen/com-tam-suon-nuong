import { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import PosPage from './pages/PosPage';
import StaffPage from './pages/StaffPage';
import PlannerPage from './pages/PlannerPage';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState<'landing' | 'pos' | 'staff' | 'planner'>(() => {
    const hash = window.location.hash.toLowerCase();
    if (hash.includes('planner')) return 'planner';
    if (hash.includes('staff') || hash.includes('recipes')) return 'staff';
    if (hash.includes('pos')) return 'pos';
    return 'landing';
  });

  // Listen to Hash change in URL
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('planner')) setActiveTab('planner');
      else if (hash.includes('staff') || hash.includes('recipes')) setActiveTab('staff');
      else if (hash.includes('pos')) setActiveTab('pos');
      else setActiveTab('landing');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const changeTab = (tab: 'landing' | 'pos' | 'staff' | 'planner') => {
    setActiveTab(tab);
    window.location.hash = `#/${tab}`;
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div className="brand" onClick={() => changeTab('landing')} style={{ cursor: 'pointer' }}>
            <span className="brand-icon">🌿</span>
            <span className="brand-title">SÂM MIX</span>
          </div>
          <nav className="nav-tabs">
            <button 
              className={activeTab === 'landing' ? 'nav-tab active' : 'nav-tab'}
              onClick={() => changeTab('landing')}
            >
              🏠 Trang Chủ (Khách)
            </button>
            <button 
              className={activeTab === 'pos' ? 'nav-tab active' : 'nav-tab'}
              onClick={() => changeTab('pos')}
            >
              💻 Bán Hàng (POS)
            </button>
            <button 
              className={activeTab === 'staff' ? 'nav-tab active' : 'nav-tab'}
              onClick={() => changeTab('staff')}
            >
              👥 Nhân Viên
            </button>
            <button 
              className={activeTab === 'planner' ? 'nav-tab active' : 'nav-tab'}
              onClick={() => changeTab('planner')}
            >
              📊 Báo Cáo Cổ Đông
            </button>
          </nav>
        </div>
      </header>

      <main className="app-main">
        {activeTab === 'landing' && <LandingPage />}
        {activeTab === 'pos' && <PosPage />}
        {activeTab === 'staff' && <StaffPage />}
        {activeTab === 'planner' && <PlannerPage />}
      </main>
    </div>
  );
}
