import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../config';

function LoginPage({ onLogin }) {
  const [abhaInput, setAbhaInput] = useState('');
  const [passInput, setPassInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/api/auth/login`, { abha_id: abhaInput, password: passInput });
      if (res.data.success) {
        localStorage.setItem('hh_user', JSON.stringify(res.data.user));
        localStorage.setItem('hh_token', res.data.token);
        onLogin(res.data.user);
      } else {
        setError(res.data.message || 'Login failed');
      }
    } catch (err) {
      setError('Cannot connect to server. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { label: 'Patient', abha: '91-8888-7777-1234', pass: 'password123' },
    { label: 'Doctor', abha: '91-1111-2222-3333', pass: 'doctor123' },
    { label: 'Ambulance Driver', abha: '91-4444-5555-6666', pass: 'driver123' },
    { label: 'Traffic Control', abha: '91-7777-8888-9999', pass: 'traffic123' },
    { label: 'Admin', abha: '91-0000-0000-0000', pass: 'admin123' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Segoe UI, Arial, sans-serif', padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🏥</div>
          <h2 style={{ color: '#1a1a2e', margin: '0 0 6px', fontSize: '1.5rem', fontWeight: 'bold' }}>Smart City Health Highway</h2>
          <p style={{ color: '#666', margin: 0, fontSize: '0.9rem' }}>Login with your ABHA (Ayushman Bharat Health Account)</p>
        </div>

        {error && (
          <div style={{ background: '#fff3f3', border: '1px solid #ffcccc', color: '#dc3545', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.88rem' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#444', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>ABHA ID</label>
            <input
              type="text"
              value={abhaInput}
              onChange={e => setAbhaInput(e.target.value)}
              placeholder="e.g. 91-8888-7777-1234"
              required
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: '#444', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Password</label>
            <input
              type="password"
              value={passInput}
              onChange={e => setPassInput(e.target.value)}
              placeholder="Enter your password"
              required
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '12px', background: loading ? '#ccc' : 'linear-gradient(135deg, #007bff, #0056b3)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
          >
            {loading ? '⏳ Logging in...' : '🔐 Login via ABDM'}
          </button>
        </form>

        <div style={{ marginTop: '24px', padding: '16px', background: '#f8f9fa', borderRadius: '10px' }}>
          <p style={{ color: '#555', fontSize: '0.82rem', fontWeight: '600', marginBottom: '10px', textAlign: 'center' }}>🧪 Quick Demo Logins</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {demoAccounts.map(acc => (
              <button
                key={acc.label}
                onClick={() => { setAbhaInput(acc.abha); setPassInput(acc.pass); }}
                style={{ padding: '6px 8px', background: 'white', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', color: '#333', textAlign: 'left' }}
              >
                <strong>{acc.label}</strong>
                <br /><span style={{ color: '#888', fontSize: '0.72rem' }}>{acc.abha}</span>
              </button>
            ))}
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.88rem', color: '#666' }}>
          New user?{' '}
          <Link to="/register" style={{ color: '#007bff', fontWeight: '600', textDecoration: 'none' }}>Register here</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
