import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../config';

function Navbar({ user, onLogout, alertCount }) {
  const navigate = useNavigate();
  const location = useLocation();
  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE}/api/auth/logout`, { user_id: user.id });
    } catch (_) {}
    onLogout();
    navigate('/login');
  };

  const navLinks = [
    { path: '/dashboard', label: '📊 Dashboard', roles: ['patient', 'doctor', 'ambulance_driver', 'traffic_controller', 'admin'] },
    { path: '/map', label: '🗺️ Map', roles: ['patient', 'doctor', 'ambulance_driver', 'traffic_controller', 'admin'] },
    { path: '/ambulance', label: '🚑 Ambulance', roles: ['patient', 'ambulance_driver', 'admin'] },
    { path: '/chat', label: '💬 Chat', roles: ['patient', 'doctor', 'ambulance_driver', 'traffic_controller', 'admin'] },
    { path: '/bookings', label: '📋 Bookings', roles: ['patient', 'doctor', 'admin'] },
    { path: '/health', label: '❤️ Health', roles: ['patient', 'doctor', 'admin'] },
  ];

  const visibleLinks = navLinks.filter(l => l.roles.includes(user.role));

  const roleColors = {
    patient: '#28a745',
    doctor: '#007bff',
    ambulance_driver: '#fd7e14',
    traffic_controller: '#6f42c1',
    admin: '#dc3545'
  };
  const roleColor = roleColors[user.role] || '#007bff';

  return (
    <nav style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', color: 'white', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px', boxShadow: '0 2px 10px rgba(0,0,0,0.3)', position: 'sticky', top: 0, zIndex: 1000 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>🏥</span>
        <span style={{ fontWeight: 'bold', fontSize: '1rem', color: '#00d4ff' }}>Health Highway</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
        {visibleLinks.map(link => (
          <Link
            key={link.path}
            to={link.path}
            style={{
              color: location.pathname === link.path ? '#00d4ff' : '#ccc',
              textDecoration: 'none',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '0.85rem',
              background: location.pathname === link.path ? 'rgba(0,212,255,0.15)' : 'transparent',
              transition: 'all 0.2s'
            }}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {alertCount > 0 && (
          <span style={{ background: '#dc3545', color: 'white', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>
            {alertCount}
          </span>
        )}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{user.full_name}</div>
          <div style={{ fontSize: '0.7rem', color: roleColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{user.role.replace('_', ' ')}</div>
        </div>
        <button
          onClick={handleLogout}
          style={{ background: '#dc3545', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
