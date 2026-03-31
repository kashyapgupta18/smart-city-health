import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../config';

const STATUS_COLORS = { confirmed: '#28a745', cancelled: '#dc3545', completed: '#6c757d' };
const STATUS_LABELS = { confirmed: '✅ Confirmed', cancelled: '✗ Cancelled', completed: '✓ Completed' };

function BookingHistory({ user }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [allBookings, setAllBookings] = useState([]);

  useEffect(() => {
    fetchBookings();
    if (['admin', 'doctor'].includes(user.role)) fetchAllBookings();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchBookings = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/bookings/user/${user.id}`);
      setBookings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllBookings = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/bookings`);
      setAllBookings(res.data);
    } catch (_) {}
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Cancel this booking? The bed will be released.')) return;
    setCancelling(bookingId);
    try {
      const res = await axios.put(`${API_BASE}/api/bookings/${bookingId}/cancel`);
      if (res.data.success) {
        fetchBookings();
        alert('✅ Booking cancelled successfully');
      } else {
        alert(res.data.message || 'Cancel failed');
      }
    } catch (_) {
      alert('Failed to cancel booking');
    } finally {
      setCancelling(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ color: '#666', fontSize: '1.1rem' }}>⏳ Loading bookings...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', background: '#f0f4f8', minHeight: '100vh', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#1a1a2e', fontSize: '1.4rem' }}>📋 Booking History</h2>
        <button onClick={fetchBookings} style={{ background: 'white', border: '1px solid #ddd', padding: '7px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', color: '#555' }}>🔄 Refresh</button>
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { label: 'Total Bookings', value: bookings.length, color: '#007bff' },
          { label: 'Active', value: bookings.filter(b => b.status === 'confirmed').length, color: '#28a745' },
          { label: 'Cancelled', value: bookings.filter(b => b.status === 'cancelled').length, color: '#dc3545' },
          { label: 'Completed', value: bookings.filter(b => b.status === 'completed').length, color: '#6c757d' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: '10px', padding: '14px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: `4px solid ${s.color}`, flex: '1', minWidth: '140px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* My bookings */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 16px', color: '#1a1a2e', fontSize: '1rem' }}>My Bookings</h3>
        {bookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#aaa' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📋</div>
            <div>No bookings yet. Book a hospital bed from the Map page!</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {bookings.map(b => (
              <div key={b._id} style={{ border: '1px solid #eee', borderRadius: '10px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ fontWeight: '700', fontSize: '1rem', color: '#1a1a2e' }}>{b.hospital_id?.name || 'Hospital'}</span>
                    <span style={{ background: b.bed_type === 'icu' ? '#fff3cd' : '#e8f5e9', color: b.bed_type === 'icu' ? '#856404' : '#2e7d32', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' }}>
                      {b.bed_type} Bed
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#666' }}>
                    {b.hospital_id?.type && <span>🏥 {b.hospital_id.type} • </span>}
                    {b.hospital_id?.address && <span>📍 {b.hospital_id.address}</span>}
                  </div>
                  {b.hospital_id?.contact && <div style={{ fontSize: '0.82rem', color: '#666', marginTop: '3px' }}>📞 {b.hospital_id.contact}</div>}
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <code style={{ background: '#f8f9fa', padding: '3px 8px', borderRadius: '4px', fontSize: '0.82rem', color: '#495057', fontWeight: '600' }}>
                      🎫 {b.booking_token}
                    </code>
                    <span style={{ fontSize: '0.78rem', color: '#aaa' }}>{new Date(b.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <span style={{ background: STATUS_COLORS[b.status] || '#888', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600', whiteSpace: 'nowrap' }}>
                    {STATUS_LABELS[b.status] || b.status}
                  </span>
                  {b.status === 'confirmed' && (
                    <button
                      onClick={() => handleCancel(b._id)}
                      disabled={cancelling === b._id}
                      style={{ background: '#fff3f3', border: '1px solid #ffcccc', color: '#dc3545', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600' }}
                    >
                      {cancelling === b._id ? 'Cancelling...' : '✗ Cancel'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All bookings (admin/doctor) */}
      {['admin', 'doctor'].includes(user.role) && allBookings.length > 0 && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <h3 style={{ margin: '0 0 16px', color: '#1a1a2e', fontSize: '1rem' }}>All Patient Bookings (Admin View)</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  {['Patient', 'ABHA ID', 'Hospital', 'Bed Type', 'Token', 'Status', 'Date'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#555', fontWeight: '600', borderBottom: '2px solid #eee' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allBookings.map((b, i) => (
                  <tr key={b._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '10px 12px' }}>{b.patient_id?.full_name}</td>
                    <td style={{ padding: '10px 12px', color: '#888', fontSize: '0.8rem' }}>{b.patient_id?.abha_id}</td>
                    <td style={{ padding: '10px 12px', fontWeight: '500' }}>{b.hospital_id?.name}</td>
                    <td style={{ padding: '10px 12px' }}><span style={{ textTransform: 'uppercase', fontSize: '0.78rem', fontWeight: '600' }}>{b.bed_type}</span></td>
                    <td style={{ padding: '10px 12px' }}><code style={{ background: '#f8f9fa', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem' }}>{b.booking_token}</code></td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ background: STATUS_COLORS[b.status] || '#888', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>{b.status}</span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#aaa', fontSize: '0.78rem' }}>{new Date(b.created_at).toLocaleDateString()}</td>
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

export default BookingHistory;
