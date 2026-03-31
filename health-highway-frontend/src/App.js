import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import io from 'socket.io-client';
import 'leaflet/dist/leaflet.css';
import './App.css';
import API_BASE from './config';

import Navbar from './components/Navbar';
import AlertBanner from './components/AlertBanner';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import Dashboard from './components/Dashboard';
import MapPage from './components/MapPage';
import ChatPage from './components/ChatPage';
import AmbulancePage from './components/AmbulancePage';
import BookingHistory from './components/BookingHistory';
import HealthMonitor from './components/HealthMonitor';

const socket = io(API_BASE, { autoConnect: false });

function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hh_user')); } catch (_) { return null; }
  });
  const [alerts, setAlerts] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('hh_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('hh_user');
    localStorage.removeItem('hh_token');
    socket.disconnect();
  };

  const addAlert = (alert) => {
    setAlerts(prev => [alert, ...prev].slice(0, 5));
  };

  const dismissAlert = (idx) => {
    setAlerts(prev => prev.filter((_, i) => i !== idx));
  };

  useEffect(() => {
    if (!user) return;

    socket.connect();
    socket.emit('user_join', { userId: user.id, name: user.full_name, role: user.role });
    socket.emit('join_room', 'general');
    socket.emit('join_room', 'emergency');

    socket.on('online_users', setOnlineUsers);
    socket.on('panic_alert', (data) => addAlert({ ...data, type: 'panic' }));
    socket.on('emergency_alert', (data) => addAlert({ ...data, type: 'emergency' }));
    socket.on('traffic_override', (data) => addAlert({ title: '🚦 Traffic Override', message: data.message, type: 'info' }));

    return () => {
      socket.off('online_users');
      socket.off('panic_alert');
      socket.off('emergency_alert');
      socket.off('traffic_override');
      socket.disconnect();
    };
  }, [user]);

  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/register" element={<RegisterPage onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <div className="app-root">
        <Navbar user={user} onLogout={handleLogout} alertCount={alerts.length} />
        <AlertBanner alerts={alerts} onDismiss={dismissAlert} />
        <Routes>
          <Route path="/dashboard" element={<Dashboard user={user} socket={socket} />} />
          <Route path="/map" element={<MapPage user={user} socket={socket} />} />
          <Route path="/chat" element={<ChatPage user={user} socket={socket} onlineUsers={onlineUsers} />} />
          <Route path="/ambulance" element={<AmbulancePage user={user} socket={socket} onAlert={addAlert} />} />
          <Route path="/bookings" element={<BookingHistory user={user} />} />
          <Route path="/health" element={<HealthMonitor user={user} socket={socket} />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
