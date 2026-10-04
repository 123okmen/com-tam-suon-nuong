import React, { useState, useEffect } from 'react';

interface LoginGateProps {
  expectedPassword?: string;
  storageKey: string;
  title: string;
  children: React.ReactNode;
}

export default function LoginGate({ expectedPassword, storageKey, title, children }: LoginGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const savedState = sessionStorage.getItem(storageKey);
    if (savedState === 'true') {
      setIsAuthenticated(true);
    }
  }, [storageKey]);

  if (!expectedPassword) {
    return <>{children}</>;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === expectedPassword) {
      setIsAuthenticated(true);
      sessionStorage.setItem(storageKey, 'true');
      setError('');
    } else {
      setError('Mật khẩu không chính xác!');
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ marginTop: 0, color: '#10b981' }}>{title}</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Vui lòng nhập mật khẩu để truy cập</p>
        <form onSubmit={handleLogin}>
          <input
            type="password"
            className="input-field"
            placeholder="Nhập mật khẩu..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ marginBottom: '1rem' }}
          />
          {error && <p style={{ color: '#ef4444', fontSize: '0.9rem', margin: '0 0 1rem 0' }}>{error}</p>}
          <button type="submit" className="btn-primary" style={{ width: '100%' }}>
            Mở Khóa
          </button>
        </form>
      </div>
    </div>
  );
}
