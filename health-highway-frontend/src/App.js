import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';
import io from 'socket.io-client';
import { Bar } from 'react-chartjs-2'; 
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import './App.css';

// --- IMPORTS MUST BE TOP ---
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Fix Icons
const ambulanceIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2965/2965879.png',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
});

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const socket = io.connect("https://health-backend-okl4.onrender.com");

function App() {
  const [user, setUser] = useState(null); 
  const [abhaInput, setAbhaInput] = useState('91-8888-7777-1234'); 
  const [passInput, setPassInput] = useState('password123');

  const [hospitals, setHospitals] = useState([]);
  const [ambulancePos, setAmbulancePos] = useState(null);
  const [showDashboard, setShowDashboard] = useState(false);
  
  // Use Delhi Center
  const center = [28.5659, 77.2090]; 

  const handleLogin = async () => {
      try {
          const res = await axios.post('https://health-backend-okl4.onrender.com/api/login', {
              abha_id: abhaInput,
              password: passInput
          });
          if (res.data.success) {
              setUser(res.data.user);
          } else {
              alert(res.data.message);
          }
      } catch (err) { alert("Login Server Error"); }
  };

  const fetchHospitals = async () => {
    try {
      const res = await axios.get('https://health-backend-okl4.onrender.com/api/hospitals?lat=28.56&lng=77.21');
      setHospitals(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (user) {
        fetchHospitals();
        socket.on("ambulance_location", (data) => setAmbulancePos([data.lat, data.lng]));
        return () => socket.off("ambulance_location");
    }
  }, [user]);

  const handleBooking = async (hospitalId) => {
    if (!user) return alert("Please Login first!");
    const confirm = window.confirm(`Confirm booking for ABHA ID: ${user.abha_id}?`);
    if (!confirm) return;

    try {
      const res = await axios.post('https://health-backend-okl4.onrender.com/api/book', { 
          hospital_id: hospitalId, 
          user_id: user.id,
          email: "patient@example.com" 
      });
      alert(res.data.message);
      if (res.data.success) fetchHospitals();
    } catch (err) { alert("Booking failed."); }
  };

  // --- LOGIN SCREEN ---
  if (!user) {
      return (
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f0f2f5', fontFamily: 'Arial'}}>
              <div style={{padding: '40px', background: 'white', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', textAlign: 'center'}}>
                  <h2 style={{color: '#007bff'}}>🏥 Smart City Health Highway</h2>
                  <p>Login with ABHA (Ayushman Bharat Health Account)</p>
                  <input 
                    type="text" value={abhaInput} onChange={e => setAbhaInput(e.target.value)} 
                    placeholder="ABHA ID" style={{padding: '10px', margin: '10px', width: '250px', border:'1px solid #ccc', borderRadius:'4px'}} 
                  /><br/>
                  <input 
                    type="password" value={passInput} onChange={e => setPassInput(e.target.value)} 
                    placeholder="Password" style={{padding: '10px', margin: '10px', width: '250px', border:'1px solid #ccc', borderRadius:'4px'}} 
                  /><br/>
                  <button onClick={handleLogin} style={{padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize:'16px'}}>
                      Login via ABDM
                  </button>
                  <p style={{fontSize: '0.8em', color: 'gray', marginTop:'20px'}}>Use default credentials to test</p>
              </div>
          </div>
      );
  }

  // --- MAIN DASHBOARD ---
  return (
    <div className="map-container">
      <div className="header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', background:'#007bff', color:'white'}}>
        <div>
            <h2 style={{margin:0}}>🚑 Health Highway</h2>
            <small>Logged in as: {user.full_name}</small>
        </div>
        <div>
            <button onClick={() => setShowDashboard(!showDashboard)} style={{padding: '8px', marginRight:'10px', cursor:'pointer'}}>
            {showDashboard ? "Show Map" : "Show Analytics"}
            </button>
            <button onClick={() => setUser(null)} style={{padding: '8px', background: '#dc3545', color: 'white', border: 'none', cursor:'pointer'}}>
                Logout
            </button>
        </div>
      </div>

      {showDashboard ? (
        <div style={{padding: '50px', background: 'white', height: '100%'}}>
          <h3>🏥 Real-Time Occupancy Analytics (Delhi Region)</h3>
          <div style={{height: '400px'}}>
            <Bar 
                data={{
                    labels: hospitals.map(h => h.name),
                    datasets: [{ label: 'Available Beds', data: hospitals.map(h => h.available_beds), backgroundColor: '#007bff' }]
                }} 
                options={{ responsive: true, maintainAspectRatio: false }} 
            />
          </div>
        </div>
      ) : (
        <MapContainer center={center} zoom={11} scrollWheelZoom={true} style={{height:'90vh'}}>
          <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={center}><Popup>📍 You are Here</Popup></Marker>
          
          {ambulancePos && (
            <Marker position={ambulancePos} icon={ambulanceIcon}>
              <Popup>🚑 Emergency Ambulance<br/>Live Tracking...</Popup>
            </Marker>
          )}

          {hospitals.map((hospital) => (
            <Marker key={hospital.id} position={[hospital.location.coordinates[1], hospital.location.coordinates[0]]}>
              <Popup>
                <div style={{textAlign: 'center', minWidth: '150px'}}>
                  <h3>{hospital.name}</h3>
                  <p>{hospital.type}</p>
                  <h4 style={{color: hospital.available_beds > 0 ? 'green' : 'red'}}>{hospital.available_beds} Beds Free</h4>
                  <button onClick={() => handleBooking(hospital.id)} style={{backgroundColor: '#28a745', color: 'white', border: 'none', padding: '8px', width: '100%', cursor:'pointer'}}>
                      Book with ABHA
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
    </div>
  );
}

export default App;
