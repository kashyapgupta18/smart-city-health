import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import axios from 'axios';
import API_BASE from '../config';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const VITAL_RANGES = {
  pulse: { min: 60, max: 100, label: 'Pulse (bpm)', unit: 'bpm', warn: [50, 110], critical: [40, 130] },
  spo2: { min: 95, max: 100, label: 'SpO2 (%)', unit: '%', warn: [93, 100], critical: [90, 100] },
  temperature: { min: 36.1, max: 37.2, label: 'Temperature (°C)', unit: '°C', warn: [35, 38], critical: [34, 39] },
  blood_pressure_sys: { min: 90, max: 120, label: 'BP Systolic (mmHg)', unit: 'mmHg', warn: [80, 140], critical: [70, 160] },
  blood_sugar: { min: 70, max: 140, label: 'Blood Sugar (mg/dL)', unit: 'mg/dL', warn: [60, 180], critical: [50, 250] },
};

function getVitalStatus(key, value) {
  const range = VITAL_RANGES[key];
  if (!range || !value) return { color: '#6c757d', label: 'N/A' };
  if (value >= range.min && value <= range.max) return { color: '#28a745', label: '✅ Normal' };
  if (value >= range.warn[0] && value <= range.warn[1]) return { color: '#ffc107', label: '⚠️ Warning' };
  return { color: '#dc3545', label: '🚨 Critical' };
}

function HealthMonitor({ user, socket }) {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({ pulse: '', spo2: '', temperature: '', blood_pressure_sys: '', blood_pressure_dia: '', blood_sugar: '', weight: '', symptoms: '', diagnosis: '', prescription: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [liveVitals, setLiveVitals] = useState(null);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchRecords();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!socket) return;
    socket.on('vitals_update', (data) => {
      if (data.patient_id === user.id || data.broadcast) setLiveVitals(data);
    });
    return () => socket.off('vitals_update');
  }, [socket, user.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchRecords = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/health/patient/${user.id}`);
      setRecords(res.data);
    } catch (_) {} finally {
      setLoading(false);
    }
  };

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess('');
    try {
      const vitals = {};
      ['pulse', 'spo2', 'temperature', 'blood_pressure_sys', 'blood_pressure_dia', 'blood_sugar', 'weight']
        .forEach(k => { if (form[k]) vitals[k] = parseFloat(form[k]); });

      const res = await axios.post(`${API_BASE}/api/health/vitals`, {
        patient_id: user.id,
        vitals,
        symptoms: form.symptoms ? form.symptoms.split(',').map(s => s.trim()) : [],
        diagnosis: form.diagnosis,
        prescription: form.prescription
      });

      if (res.data.success) {
        setSuccess('✅ Health record saved successfully!');
        setForm({ pulse: '', spo2: '', temperature: '', blood_pressure_sys: '', blood_pressure_dia: '', blood_sugar: '', weight: '', symptoms: '', diagnosis: '', prescription: '' });
        fetchRecords();

        // Broadcast vitals via socket
        if (socket && vitals.pulse) {
          socket.emit('vitals_update', { patient_id: user.id, patient_name: user.full_name, vitals, timestamp: new Date() });
        }
      }
    } catch (_) {
      alert('Failed to save health record');
    } finally {
      setSubmitting(false);
    }
  };

  // Chart data for pulse trend
  const last10 = records.slice(0, 10).reverse();
  const pulseChartData = {
    labels: last10.map(r => new Date(r.recorded_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Pulse (bpm)',
        data: last10.map(r => r.vitals?.pulse || null),
        borderColor: '#dc3545',
        backgroundColor: 'rgba(220,53,69,0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 5
      },
      {
        label: 'SpO2 (%)',
        data: last10.map(r => r.vitals?.spo2 || null),
        borderColor: '#007bff',
        backgroundColor: 'rgba(0,123,255,0.05)',
        tension: 0.4,
        fill: false,
        pointRadius: 5
      }
    ]
  };

  const latestRecord = records[0];

  return (
    <div style={{ padding: '24px', background: '#f0f4f8', minHeight: '100vh', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
      <h2 style={{ margin: '0 0 20px', color: '#1a1a2e', fontSize: '1.4rem' }}>❤️ Health Monitor</h2>

      {loading && (
        <div style={{ textAlign: 'center', color: '#888', padding: '20px' }}>⏳ Loading health records...</div>
      )}

      {/* Live vitals banner */}
      {liveVitals && (
        <div style={{ background: 'linear-gradient(135deg, #dc3545, #c82333)', color: 'white', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '2rem', animation: 'pulse 1s infinite' }}>💓</span>
          <div>
            <div style={{ fontWeight: '700', fontSize: '1rem' }}>Live Vitals: {liveVitals.patient_name}</div>
            <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
              {liveVitals.vitals?.pulse && `Pulse: ${liveVitals.vitals.pulse} bpm  `}
              {liveVitals.vitals?.spo2 && `SpO2: ${liveVitals.vitals.spo2}%  `}
              {liveVitals.vitals?.temperature && `Temp: ${liveVitals.vitals.temperature}°C`}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Latest vitals status */}
        {latestRecord && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <h3 style={{ margin: '0 0 14px', color: '#1a1a2e', fontSize: '1rem' }}>Latest Vitals Status</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {Object.keys(VITAL_RANGES).map(key => {
                const v = latestRecord.vitals?.[key];
                const status = getVitalStatus(key, v);
                return (
                  <div key={key} style={{ background: '#f8f9fa', borderRadius: '8px', padding: '10px', borderLeft: `3px solid ${status.color}` }}>
                    <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '3px' }}>{VITAL_RANGES[key].label}</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: status.color }}>{v ? `${v} ${VITAL_RANGES[key].unit}` : '--'}</div>
                    <div style={{ fontSize: '0.72rem', color: status.color, marginTop: '2px' }}>{status.label}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: '12px', fontSize: '0.78rem', color: '#aaa' }}>Recorded: {new Date(latestRecord.recorded_at).toLocaleString()}</div>
          </div>
        )}

        {/* Trend Chart */}
        {last10.length > 1 && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <h3 style={{ margin: '0 0 14px', color: '#1a1a2e', fontSize: '1rem' }}>📈 Pulse & SpO2 Trend</h3>
            <div style={{ height: '200px' }}>
              <Line data={pulseChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: false } } }} />
            </div>
          </div>
        )}
      </div>

      {/* Record vitals form */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 16px', color: '#1a1a2e', fontSize: '1rem' }}>📝 Record New Vitals</h3>

        {success && (
          <div style={{ background: '#d4edda', border: '1px solid #c3e6cb', color: '#155724', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '0.88rem' }}>{success}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '14px' }}>
            {[
              { name: 'pulse', label: '💓 Pulse (bpm)', placeholder: '70' },
              { name: 'spo2', label: '🌡️ SpO2 (%)', placeholder: '98' },
              { name: 'temperature', label: '🌡️ Temperature (°C)', placeholder: '36.6' },
              { name: 'blood_pressure_sys', label: '🩸 BP Systolic', placeholder: '120' },
              { name: 'blood_pressure_dia', label: '🩸 BP Diastolic', placeholder: '80' },
              { name: 'blood_sugar', label: '🍬 Blood Sugar (mg/dL)', placeholder: '100' },
              { name: 'weight', label: '⚖️ Weight (kg)', placeholder: '70' },
            ].map(field => (
              <div key={field.name}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#555', fontWeight: '600', marginBottom: '4px' }}>{field.label}</label>
                <input
                  type="number"
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  step="0.1"
                  style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #ddd', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>
            ))}
          </div>

          {(user.role === 'doctor' || user.role === 'admin') && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              {[
                { name: 'symptoms', label: '🤒 Symptoms (comma separated)', placeholder: 'fever, headache, cough' },
                { name: 'diagnosis', label: '🩺 Diagnosis', placeholder: 'Viral infection' },
                { name: 'prescription', label: '💊 Prescription', placeholder: 'Paracetamol 500mg' },
              ].map(f => (
                <div key={f.name}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#555', fontWeight: '600', marginBottom: '4px' }}>{f.label}</label>
                  <input
                    type="text"
                    name={f.name}
                    value={form[f.name]}
                    onChange={handleChange}
                    placeholder={f.placeholder}
                    style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #ddd', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{ background: submitting ? '#ccc' : 'linear-gradient(135deg, #007bff, #0056b3)', color: 'white', border: 'none', padding: '10px 28px', borderRadius: '8px', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '0.95rem' }}
          >
            {submitting ? '⏳ Saving...' : '💾 Save Record'}
          </button>
        </form>
      </div>

      {/* History */}
      {records.length > 0 && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <h3 style={{ margin: '0 0 14px', color: '#1a1a2e', fontSize: '1rem' }}>📜 Health Record History</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  {['Date', 'Pulse', 'SpO2', 'Temp', 'BP', 'Blood Sugar', 'Symptoms', 'Diagnosis'].map(h => (
                    <th key={h} style={{ padding: '10px 10px', textAlign: 'left', color: '#555', fontWeight: '600', borderBottom: '2px solid #eee', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={r._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '9px 10px', color: '#888', whiteSpace: 'nowrap' }}>{new Date(r.recorded_at).toLocaleDateString()}</td>
                    <td style={{ padding: '9px 10px' }}>{r.vitals?.pulse ? <span style={{ color: getVitalStatus('pulse', r.vitals.pulse).color, fontWeight: '600' }}>{r.vitals.pulse}</span> : '--'}</td>
                    <td style={{ padding: '9px 10px' }}>{r.vitals?.spo2 ? <span style={{ color: getVitalStatus('spo2', r.vitals.spo2).color, fontWeight: '600' }}>{r.vitals.spo2}%</span> : '--'}</td>
                    <td style={{ padding: '9px 10px' }}>{r.vitals?.temperature ? `${r.vitals.temperature}°C` : '--'}</td>
                    <td style={{ padding: '9px 10px' }}>{r.vitals?.blood_pressure_sys ? `${r.vitals.blood_pressure_sys}/${r.vitals.blood_pressure_dia || '?'}` : '--'}</td>
                    <td style={{ padding: '9px 10px' }}>{r.vitals?.blood_sugar ? `${r.vitals.blood_sugar} mg/dL` : '--'}</td>
                    <td style={{ padding: '9px 10px', color: '#666' }}>{r.symptoms?.join(', ') || '--'}</td>
                    <td style={{ padding: '9px 10px', color: '#666' }}>{r.diagnosis || '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default HealthMonitor;
