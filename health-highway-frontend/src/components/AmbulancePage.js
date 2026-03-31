import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../config';

const EMERGENCY_TYPES = [
  { value: 'cardiac', label: '❤️ Cardiac Arrest', color: '#dc3545' },
  { value: 'stroke', label: '🧠 Stroke', color: '#6f42c1' },
  { value: 'accident', label: '🚗 Road Accident', color: '#fd7e14' },
  { value: 'fracture', label: '🦴 Fracture / Fall', color: '#007bff' },
  { value: 'other', label: '🏥 Other Emergency', color: '#20c997' },
];

const SYMPTOMS = ['unconscious', 'bleeding', 'chest_pain', 'difficulty_breathing', 'seizure', 'severe_pain'];

const STATUS_COLORS = {
  pending: '#ffc107',
  assigned: '#17a2b8',
  en_route: '#007bff',
  arrived: '#28a745',
  completed: '#6c757d',
  cancelled: '#dc3545'
};

const STATUS_LABELS = {
  pending: '⏳ Pending',
  assigned: '✅ Driver Assigned',
  en_route: '🚑 En Route',
  arrived: '📍 Arrived',
  completed: '✓ Completed',
  cancelled: '✗ Cancelled'
};

function AmbulancePage({ user, socket, onAlert }) {
  const [hospitals, setHospitals] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [form, setForm] = useState({ pickup_address: '', emergency_type: 'other', destination_hospital: '', symptoms: [] });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [triageScore, setTriageScore] = useState(null);
  const [tab, setTab] = useState('request');

  useEffect(() => {
    fetchHospitals();
    if (user.role === 'patient') fetchMyRequests();
    if (['admin', 'ambulance_driver', 'traffic_controller'].includes(user.role)) fetchAllRequests();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!socket) return;
    socket.on('panic_alert', (data) => {
      if (onAlert) onAlert({ ...data, type: 'panic' });
    });
    return () => socket.off('panic_alert');
  }, [socket]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchHospitals = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/hospitals`);
      setHospitals(res.data);
    } catch (_) {}
  };

  const fetchMyRequests = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/ambulance/patient/${user.id}`);
      setMyRequests(res.data);
    } catch (_) {}
  };

  const fetchAllRequests = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/ambulance/requests`);
      setAllRequests(res.data);
    } catch (_) {}
  };

  const toggleSymptom = (s) => {
    setForm(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(s) ? prev.symptoms.filter(x => x !== s) : [...prev.symptoms, s]
    }));
  };

  const handlePanicButton = () => {
    if (!socket) return;
    const confirm = window.confirm('🚨 SEND PANIC ALERT?\nThis will alert ALL users immediately!');
    if (!confirm) return;
    socket.emit('panic_alert', {
      title: '🚨 PANIC BUTTON PRESSED',
      message: `EMERGENCY! ${user.full_name} needs immediate help! Please respond!`,
      name: user.full_name,
      userId: user.id,
      type: 'panic'
    });
    if (onAlert) onAlert({ title: '🚨 PANIC SENT', message: 'Help is on the way!', type: 'panic' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.pickup_address.trim()) return alert('Please enter your pickup address');
    setLoading(true);
    setSuccessMsg('');
    setTriageScore(null);
    try {
      const res = await axios.post(`${API_BASE}/api/ambulance/request`, {
        patient_id: user.id,
        pickup_address: form.pickup_address,
        pickup_lat: 28.5659,
        pickup_lng: 77.2090,
        emergency_type: form.emergency_type,
        destination_hospital: form.destination_hospital || null,
        symptoms: form.symptoms
      });
      if (res.data.success) {
        setSuccessMsg(`✅ ${res.data.message}`);
        setTriageScore(res.data.triage_score);
        setForm({ pickup_address: '', emergency_type: 'other', destination_hospital: '', symptoms: [] });
        fetchMyRequests();
        if (socket) {
          socket.emit('emergency_alert', {
            title: '🚑 Ambulance Requested',
            message: `${user.full_name} needs an ambulance: ${form.emergency_type}`,
            name: user.full_name,
            type: 'emergency'
          });
        }
      } else {
        alert(res.data.message || 'Request failed');
      }
    } catch (err) {
      alert('Failed to dispatch ambulance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (requestId, newStatus) => {
    try {
      await axios.put(`${API_BASE}/api/ambulance/requests/${requestId}`, { status: newStatus, driver_id: user.id });
      fetchAllRequests();
    } catch (_) {}
  };

  return (
    <div style={{ padding: '24px', background: '#f0f4f8', minHeight: '100vh', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
      {/* Panic Button */}
      {user.role === 'patient' && (
        <button
          onClick={handlePanicButton}
          style={{
            width: '100%', padding: '18px', background: 'linear-gradient(135deg, #dc3545, #c82333)',
            color: 'white', border: 'none', borderRadius: '12px', fontSize: '1.2rem', fontWeight: 'bold',
            cursor: 'pointer', marginBottom: '20px', boxShadow: '0 4px 16px rgba(220,53,69,0.4)',
            animation: 'pulse 2s infinite', letterSpacing: '1px'
          }}
        >
          🚨 PANIC BUTTON — EMERGENCY HELP 🚨
        </button>
      )}

      <h2 style={{ color: '#1a1a2e', margin: '0 0 20px', fontSize: '1.4rem' }}>🚑 Ambulance Services</h2>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[
          { id: 'request', label: '📋 Book Ambulance', roles: ['patient'] },
          { id: 'history', label: '📜 My Requests', roles: ['patient'] },
          { id: 'manage', label: '🛠️ Manage Requests', roles: ['admin', 'ambulance_driver', 'traffic_controller'] },
        ].filter(t => t.roles.includes(user.role) || t.roles.includes('patient')).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '8px 18px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem',
              background: tab === t.id ? '#007bff' : 'white', color: tab === t.id ? 'white' : '#555',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)', fontWeight: tab === t.id ? '600' : '400', transition: 'all 0.2s'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Request Form */}
      {tab === 'request' && user.role === 'patient' && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', maxWidth: '600px' }}>
          <h3 style={{ margin: '0 0 20px', color: '#1a1a2e' }}>Request Emergency Ambulance</h3>

          {successMsg && (
            <div style={{ background: '#d4edda', border: '1px solid #c3e6cb', color: '#155724', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' }}>
              {successMsg}
              {triageScore !== null && (
                <div style={{ marginTop: '6px', fontWeight: '600' }}>
                  🧠 AI Triage Score: <span style={{ color: triageScore >= 8 ? '#dc3545' : triageScore >= 5 ? '#fd7e14' : '#28a745' }}>{triageScore}/15 ({triageScore >= 8 ? 'CRITICAL' : triageScore >= 5 ? 'MODERATE' : 'STABLE'})</span>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: '600', color: '#444', marginBottom: '6px', fontSize: '0.88rem' }}>📍 Pickup Address *</label>
              <input
                type="text"
                value={form.pickup_address}
                onChange={e => setForm({ ...form, pickup_address: e.target.value })}
                placeholder="Enter your full address or landmark"
                required
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: '600', color: '#444', marginBottom: '8px', fontSize: '0.88rem' }}>🚑 Emergency Type *</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {EMERGENCY_TYPES.map(et => (
                  <button
                    key={et.value}
                    type="button"
                    onClick={() => setForm({ ...form, emergency_type: et.value })}
                    style={{
                      padding: '10px', border: `2px solid ${form.emergency_type === et.value ? et.color : '#eee'}`,
                      borderRadius: '8px', cursor: 'pointer', background: form.emergency_type === et.value ? et.color + '22' : 'white',
                      color: '#333', fontSize: '0.82rem', fontWeight: form.emergency_type === et.value ? '600' : '400',
                      textAlign: 'left', transition: 'all 0.2s'
                    }}
                  >
                    {et.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: '600', color: '#444', marginBottom: '8px', fontSize: '0.88rem' }}>🩺 Symptoms (for AI Triage)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {SYMPTOMS.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSymptom(s)}
                    style={{
                      padding: '5px 12px', border: `1.5px solid ${form.symptoms.includes(s) ? '#dc3545' : '#ddd'}`,
                      borderRadius: '20px', cursor: 'pointer', background: form.symptoms.includes(s) ? '#fff3f3' : 'white',
                      color: form.symptoms.includes(s) ? '#dc3545' : '#555', fontSize: '0.8rem', transition: 'all 0.2s'
                    }}
                  >
                    {s.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: '600', color: '#444', marginBottom: '6px', fontSize: '0.88rem' }}>🏥 Preferred Hospital (Optional)</label>
              <select
                value={form.destination_hospital}
                onChange={e => setForm({ ...form, destination_hospital: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' }}
              >
                <option value="">Auto-assign nearest hospital</option>
                {hospitals.map(h => (
                  <option key={h._id} value={h._id}>{h.name} ({h.available_beds} beds)</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '14px', background: loading ? '#ccc' : 'linear-gradient(135deg, #dc3545, #c82333)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '0.5px' }}
            >
              {loading ? '⏳ Dispatching...' : '🚑 DISPATCH AMBULANCE NOW'}
            </button>
          </form>
        </div>
      )}

      {/* Patient request history */}
      {tab === 'history' && user.role === 'patient' && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <h3 style={{ margin: '0 0 16px', color: '#1a1a2e' }}>My Ambulance Requests</h3>
          {myRequests.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#aaa', padding: '40px' }}>No requests yet</div>
          ) : myRequests.map(req => (
            <div key={req._id} style={{ border: '1px solid #eee', borderRadius: '10px', padding: '16px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.95rem', color: '#1a1a2e' }}>{req.emergency_type?.toUpperCase()} Emergency</div>
                  <div style={{ fontSize: '0.82rem', color: '#666', marginTop: '4px' }}>📍 {req.pickup_address}</div>
                  {req.destination_hospital && <div style={{ fontSize: '0.82rem', color: '#666' }}>🏥 {req.destination_hospital.name}</div>}
                  <div style={{ fontSize: '0.78rem', color: '#aaa', marginTop: '4px' }}>ETA: {req.eta_minutes} mins • Triage: {req.triage_score}/15</div>
                </div>
                <span style={{ background: STATUS_COLORS[req.status] || '#888', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600', whiteSpace: 'nowrap' }}>
                  {STATUS_LABELS[req.status] || req.status}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#bbb', marginTop: '8px' }}>
                {new Date(req.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Admin/Driver view */}
      {tab === 'manage' && ['admin', 'ambulance_driver', 'traffic_controller'].includes(user.role) && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, color: '#1a1a2e' }}>All Ambulance Requests</h3>
            <button onClick={fetchAllRequests} style={{ background: '#f0f4f8', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem' }}>🔄 Refresh</button>
          </div>
          {allRequests.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#aaa', padding: '40px' }}>No requests</div>
          ) : allRequests.map(req => (
            <div key={req._id} style={{ border: '1px solid #eee', borderRadius: '10px', padding: '16px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontWeight: '700', fontSize: '0.95rem', color: '#1a1a2e' }}>{req.emergency_type?.toUpperCase()}</span>
                    <span style={{ background: '#dc3545', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700' }}>Triage: {req.triage_score}/15</span>
                  </div>
                  <div style={{ fontSize: '0.83rem', color: '#555' }}>👤 {req.patient_id?.full_name} • 📞 {req.patient_id?.phone}</div>
                  <div style={{ fontSize: '0.83rem', color: '#555' }}>📍 {req.pickup_address}</div>
                  {req.destination_hospital && <div style={{ fontSize: '0.83rem', color: '#555' }}>🏥 → {req.destination_hospital.name}</div>}
                  <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '4px' }}>{new Date(req.created_at).toLocaleString()}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                  <span style={{ background: STATUS_COLORS[req.status] || '#888', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600' }}>
                    {STATUS_LABELS[req.status] || req.status}
                  </span>
                  {req.status === 'pending' && user.role === 'ambulance_driver' && (
                    <button onClick={() => handleUpdateStatus(req._id, 'assigned')} style={{ background: '#17a2b8', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem' }}>Accept</button>
                  )}
                  {req.status === 'assigned' && (
                    <button onClick={() => handleUpdateStatus(req._id, 'en_route')} style={{ background: '#007bff', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem' }}>Start Trip</button>
                  )}
                  {req.status === 'en_route' && (
                    <button onClick={() => handleUpdateStatus(req._id, 'arrived')} style={{ background: '#28a745', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem' }}>Arrived</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AmbulancePage;
