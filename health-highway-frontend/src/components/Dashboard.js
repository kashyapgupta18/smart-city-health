import React, { useEffect, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import axios from 'axios';
import API_BASE from '../config';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

function StatCard({ icon, label, value, color, subtitle }) {
  return (
    <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', borderLeft: `4px solid ${color}`, flex: '1', minWidth: '160px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>{label}</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: color, lineHeight: 1.2 }}>{value}</div>
          {subtitle && <div style={{ fontSize: '0.78rem', color: '#aaa', marginTop: '2px' }}>{subtitle}</div>}
        </div>
        <div style={{ fontSize: '2.2rem', opacity: 0.8 }}>{icon}</div>
      </div>
    </div>
  );
}

function Dashboard({ user, socket }) {
  const [stats, setStats] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/dashboard/stats`);
      setStats(res.data.stats);
      setHospitals(res.data.hospitals || []);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('bed_update', () => fetchStats());
    return () => socket.off('bed_update');
  }, [socket]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontSize: '3rem', animation: 'spin 1s linear infinite' }}>⏳</div>
        <p style={{ color: '#666' }}>Loading dashboard...</p>
      </div>
    );
  }

  const bedData = {
    labels: hospitals.map(h => h.name.split(' ').slice(0, 2).join(' ')),
    datasets: [
      { label: 'Available Beds', data: hospitals.map(h => h.available_beds), backgroundColor: 'rgba(40, 167, 69, 0.8)', borderRadius: 4 },
      { label: 'ICU Available', data: hospitals.map(h => h.available_icu || 0), backgroundColor: 'rgba(255, 107, 53, 0.8)', borderRadius: 4 }
    ]
  };

  const occupancyData = {
    labels: ['Occupied', 'Available'],
    datasets: [{
      data: [
        (stats?.total_beds || 0) - (stats?.available_beds || 0),
        stats?.available_beds || 0
      ],
      backgroundColor: ['#dc3545', '#28a745'],
      borderWidth: 0
    }]
  };

  return (
    <div style={{ padding: '24px', background: '#f0f4f8', minHeight: '100vh', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#1a1a2e', fontSize: '1.5rem' }}>
            Welcome, {user.full_name} 👋
          </h2>
          <p style={{ margin: '4px 0 0', color: '#666', fontSize: '0.88rem' }}>
            Smart City Health Highway — Real-Time Dashboard
          </p>
        </div>
        <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#888' }}>
          🔄 Auto-refresh every 10s<br />
          Last updated: {lastUpdate}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
          <StatCard icon="🏥" label="Hospitals" value={stats.total_hospitals} color="#007bff" subtitle="Active" />
          <StatCard icon="🛏️" label="Available Beds" value={stats.available_beds} color="#28a745" subtitle={`of ${stats.total_beds} total`} />
          <StatCard icon="🏥" label="ICU Available" value={stats.available_icu} color="#fd7e14" subtitle={`of ${stats.total_icu} total`} />
          <StatCard icon="📋" label="Active Bookings" value={stats.active_bookings} color="#6f42c1" />
          <StatCard icon="🚑" label="Active Ambulances" value={stats.active_ambulances} color="#dc3545" subtitle="En route" />
          <StatCard icon="👥" label="Registered Users" value={stats.total_users} color="#20c997" />
          <StatCard icon="📊" label="Occupancy Rate" value={`${stats.occupancy_rate}%`} color={stats.occupancy_rate > 80 ? '#dc3545' : '#28a745'} subtitle={stats.occupancy_rate > 80 ? '⚠️ High' : '✅ Normal'} />
        </div>
      )}

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <h3 style={{ margin: '0 0 16px', color: '#1a1a2e', fontSize: '1rem' }}>🏥 Hospital Bed Availability (Real-Time)</h3>
          <div style={{ height: '280px' }}>
            <Bar data={bedData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } }} />
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <h3 style={{ margin: '0 0 16px', color: '#1a1a2e', fontSize: '1rem' }}>📊 Overall Occupancy</h3>
          <div style={{ height: '200px', display: 'flex', justifyContent: 'center' }}>
            <Doughnut data={occupancyData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
          </div>
          {stats && (
            <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.85rem', color: '#555' }}>
              <strong style={{ color: stats.occupancy_rate > 80 ? '#dc3545' : '#28a745', fontSize: '1.2rem' }}>{stats.occupancy_rate}%</strong> occupied
            </div>
          )}
        </div>
      </div>

      {/* Hospital Table */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <h3 style={{ margin: '0 0 16px', color: '#1a1a2e', fontSize: '1rem' }}>🏥 Hospital Status Overview</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                {['Hospital', 'Type', 'General Beds', 'ICU Beds', 'Status'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#555', fontWeight: '600', borderBottom: '2px solid #eee' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hospitals.map((h, i) => {
                const occupancyPct = h.total_beds > 0 ? Math.round(((h.total_beds - h.available_beds) / h.total_beds) * 100) : 0;
                return (
                  <tr key={h._id || i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '10px 12px', fontWeight: '500' }}>{h.name}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ background: h.type === 'Government' ? '#e3f2fd' : '#fff3e0', color: h.type === 'Government' ? '#1565c0' : '#e65100', padding: '2px 8px', borderRadius: '4px', fontSize: '0.78rem', fontWeight: '600' }}>{h.type}</span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ color: h.available_beds > 5 ? '#28a745' : '#dc3545', fontWeight: '600' }}>{h.available_beds}</span>
                      <span style={{ color: '#aaa' }}> / {h.total_beds}</span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ color: (h.available_icu || 0) > 2 ? '#28a745' : '#dc3545', fontWeight: '600' }}>{h.available_icu || 0}</span>
                      <span style={{ color: '#aaa' }}> / {h.icu_beds}</span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, background: '#eee', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                          <div style={{ width: `${occupancyPct}%`, height: '100%', background: occupancyPct > 80 ? '#dc3545' : occupancyPct > 60 ? '#ffc107' : '#28a745', transition: 'width 0.3s' }} />
                        </div>
                        <span style={{ fontSize: '0.78rem', color: '#666', whiteSpace: 'nowrap' }}>{occupancyPct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
