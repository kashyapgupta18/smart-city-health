import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../config';

function RegisterPage({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', abha_id: '', email: '', password: '', role: 'patient', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.abha_id || !form.email || !form.password) {
      return setError('All fields are required');
    }
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/api/auth/register`, form);
      if (res.data.success) {
        localStorage.setItem('hh_user', JSON.stringify(res.data.user));
        localStorage.setItem('hh_token', res.data.token);
        onLogin(res.data.user);
        navigate('/dashboard');
      } else {
        setError(res.data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Cannot connect to server. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Segoe UI, Arial, sans-serif', padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '2.5rem' }}>🏥</div>
          <h2 style={{ color: '#1a1a2e', margin: '6px 0', fontSize: '1.4rem' }}>Register</h2>
          <p style={{ color: '#666', margin: 0, fontSize: '0.88rem' }}>Create your Smart City Health Account</p>
        </div>

        {error && (
          <div style={{ background: '#fff3f3', border: '1px solid #ffcccc', color: '#dc3545', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.88rem' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleRegister}>
          {[
            { name: 'full_name', label: 'Full Name', type: 'text', placeholder: 'e.g. Rahul Sharma' },
            { name: 'abha_id', label: 'ABHA ID', type: 'text', placeholder: 'e.g. 91-1234-5678-9012' },
            { name: 'email', label: 'Email', type: 'email', placeholder: 'your@email.com' },
            { name: 'phone', label: 'Phone', type: 'tel', placeholder: '10-digit mobile number' },
            { name: 'password', label: 'Password', type: 'password', placeholder: 'Min 6 characters' },
          ].map(field => (
            <div key={field.name} style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', color: '#444', fontSize: '0.85rem', fontWeight: '600', marginBottom: '5px' }}>{field.label}</label>
              <input
                type={field.type}
                name={field.name}
                value={form[field.name]}
                onChange={handleChange}
                placeholder={field.placeholder}
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>
          ))}

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: '#444', fontSize: '0.85rem', fontWeight: '600', marginBottom: '5px' }}>Role</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #ddd', borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' }}
            >
              <option value="patient">🤒 Patient</option>
              <option value="doctor">👨‍⚕️ Doctor / Hospital Staff</option>
              <option value="ambulance_driver">🚑 Ambulance Driver</option>
              <option value="traffic_controller">🚦 Traffic Controller</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '12px', background: loading ? '#ccc' : 'linear-gradient(135deg, #28a745, #1e7e34)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? '⏳ Registering...' : '✅ Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.88rem', color: '#666' }}>
          Already registered?{' '}
          <Link to="/login" style={{ color: '#007bff', fontWeight: '600', textDecoration: 'none' }}>Login here</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
