import React from 'react';

function AlertBanner({ alerts, onDismiss }) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div style={{ position: 'fixed', top: '64px', right: '16px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '360px' }}>
      {alerts.map((alert, idx) => (
        <div
          key={idx}
          style={{
            background: alert.type === 'panic' ? '#dc3545' : alert.type === 'emergency' ? '#fd7e14' : '#007bff',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            animation: 'slideIn 0.3s ease'
          }}
        >
          <span style={{ fontSize: '1.4rem' }}>
            {alert.type === 'panic' ? '🚨' : alert.type === 'emergency' ? '⚠️' : 'ℹ️'}
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{alert.title || 'Alert'}</div>
            <div style={{ fontSize: '0.82rem', opacity: 0.9 }}>{alert.message}</div>
            {alert.name && <div style={{ fontSize: '0.75rem', opacity: 0.75, marginTop: '2px' }}>From: {alert.name}</div>}
          </div>
          <button
            onClick={() => onDismiss(idx)}
            style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.1rem', padding: '0', lineHeight: 1 }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

export default AlertBanner;
