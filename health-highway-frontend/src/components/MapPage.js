import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';
import API_BASE from '../config';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix default icon
const DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const ambulanceIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2965/2965879.png',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20]
});

const hospitalIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3209/3209265.png',
  iconSize: [35, 35],
  iconAnchor: [17, 17],
  popupAnchor: [0, -17]
});

function MapPage({ user, socket, onBooking }) {
  const [hospitals, setHospitals] = useState([]);
  const [ambulancePos, setAmbulancePos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingStatus, setBookingStatus] = useState({});
  const center = [28.5659, 77.2090];

  const fetchHospitals = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/hospitals`);
      setHospitals(res.data);
    } catch (err) {
      console.error('Hospitals fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('ambulance_location', (data) => setAmbulancePos([data.lat, data.lng]));
    socket.on('bed_update', () => fetchHospitals());
    return () => {
      socket.off('ambulance_location');
      socket.off('bed_update');
    };
  }, [socket]);

  const handleBooking = async (hospitalId, hospitalName, bedType = 'general') => {
    if (!user) return;
    const confirm = window.confirm(`Book a ${bedType.toUpperCase()} bed at ${hospitalName}?\nABHA ID: ${user.abha_id}`);
    if (!confirm) return;

    setBookingStatus(prev => ({ ...prev, [hospitalId]: 'loading' }));
    try {
      const res = await axios.post(`${API_BASE}/api/bookings`, {
        hospital_id: hospitalId,
        user_id: user.id,
        bed_type: bedType
      });
      if (res.data.success) {
        setBookingStatus(prev => ({ ...prev, [hospitalId]: 'success' }));
        alert(`✅ ${res.data.message}`);
        fetchHospitals();
        if (socket) socket.emit('bed_update', { hospitalId });
        if (onBooking) onBooking();
      } else {
        setBookingStatus(prev => ({ ...prev, [hospitalId]: 'error' }));
        alert(`❌ ${res.data.message}`);
      }
    } catch (err) {
      alert('Booking failed. Please try again.');
      setBookingStatus(prev => ({ ...prev, [hospitalId]: 'error' }));
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '90vh', fontSize: '1.2rem', color: '#666' }}>🗺️ Loading map...</div>;
  }

  return (
    <div style={{ height: 'calc(100vh - 60px)', position: 'relative' }}>
      {ambulancePos && (
        <div style={{ position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, background: '#dc3545', color: 'white', padding: '6px 16px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', animation: 'pulse 1.5s infinite' }}>
          🚑 Ambulance Live Tracking Active
        </div>
      )}
      <MapContainer center={center} zoom={12} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
        <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* User location */}
        <Marker position={center}>
          <Popup>
            <div style={{ textAlign: 'center' }}>
              <strong>📍 Delhi City Center</strong><br />
              <small>Reference Point</small>
            </div>
          </Popup>
        </Marker>

        {/* Live ambulance */}
        {ambulancePos && (
          <>
            <Marker position={ambulancePos} icon={ambulanceIcon}>
              <Popup>
                <div style={{ textAlign: 'center' }}>
                  <strong>🚑 Emergency Ambulance</strong><br />
                  <span style={{ color: '#28a745', fontSize: '0.85rem' }}>● Live Tracking</span><br />
                  <small>Lat: {ambulancePos[0].toFixed(4)}, Lng: {ambulancePos[1].toFixed(4)}</small>
                </div>
              </Popup>
            </Marker>
            <Circle center={ambulancePos} radius={500} pathOptions={{ color: '#dc3545', fillColor: '#dc3545', fillOpacity: 0.1 }} />
          </>
        )}

        {/* Hospital markers */}
        {hospitals.map((hospital) => {
          const coords = hospital.location?.coordinates;
          if (!coords || coords.length < 2) return null;
          const pos = [coords[1], coords[0]];
          const bedColor = hospital.available_beds > 10 ? '#28a745' : hospital.available_beds > 0 ? '#ffc107' : '#dc3545';

          return (
            <Marker key={hospital._id} position={pos} icon={hospitalIcon}>
              <Popup minWidth={200}>
                <div style={{ textAlign: 'center', padding: '4px' }}>
                  <h4 style={{ margin: '0 0 4px', color: '#1a1a2e', fontSize: '0.95rem' }}>{hospital.name}</h4>
                  <span style={{ background: hospital.type === 'Government' ? '#e3f2fd' : '#fff3e0', color: hospital.type === 'Government' ? '#1565c0' : '#e65100', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>{hospital.type}</span>
                  
                  <div style={{ margin: '10px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <div style={{ background: '#f8f9fa', borderRadius: '6px', padding: '6px' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: bedColor }}>{hospital.available_beds}</div>
                      <div style={{ fontSize: '0.7rem', color: '#666' }}>General Beds</div>
                    </div>
                    <div style={{ background: '#f8f9fa', borderRadius: '6px', padding: '6px' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: (hospital.available_icu || 0) > 0 ? '#007bff' : '#dc3545' }}>{hospital.available_icu || 0}</div>
                      <div style={{ fontSize: '0.7rem', color: '#666' }}>ICU Beds</div>
                    </div>
                  </div>

                  {hospital.contact && <div style={{ fontSize: '0.78rem', color: '#666', marginBottom: '8px' }}>📞 {hospital.contact}</div>}

                  {user.role === 'patient' && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => handleBooking(hospital._id, hospital.name, 'general')}
                        disabled={hospital.available_beds <= 0 || bookingStatus[hospital._id] === 'loading'}
                        style={{ flex: 1, background: hospital.available_beds > 0 ? '#28a745' : '#ccc', color: 'white', border: 'none', padding: '7px', borderRadius: '5px', cursor: hospital.available_beds > 0 ? 'pointer' : 'not-allowed', fontSize: '0.78rem', fontWeight: '600' }}
                      >
                        Book General
                      </button>
                      <button
                        onClick={() => handleBooking(hospital._id, hospital.name, 'icu')}
                        disabled={(hospital.available_icu || 0) <= 0 || bookingStatus[hospital._id] === 'loading'}
                        style={{ flex: 1, background: (hospital.available_icu || 0) > 0 ? '#007bff' : '#ccc', color: 'white', border: 'none', padding: '7px', borderRadius: '5px', cursor: (hospital.available_icu || 0) > 0 ? 'pointer' : 'not-allowed', fontSize: '0.78rem', fontWeight: '600' }}
                      >
                        Book ICU
                      </button>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

export default MapPage;
