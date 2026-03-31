import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import API_BASE from '../config';

const ROOMS = [
  { id: 'general', label: '🌐 General', desc: 'Open discussion' },
  { id: 'emergency', label: '🆘 Emergency', desc: 'Emergency alerts only' },
  { id: 'hospital_staff', label: '👨‍⚕️ Staff', desc: 'Hospital staff' },
  { id: 'traffic_control', label: '🚦 Traffic', desc: 'Traffic coordination' },
];

const roleColors = {
  patient: '#28a745',
  doctor: '#007bff',
  ambulance_driver: '#fd7e14',
  traffic_controller: '#6f42c1',
  admin: '#dc3545'
};

function ChatPage({ user, socket, onlineUsers }) {
  const [activeRoom, setActiveRoom] = useState('general');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [users, setUsers] = useState([]);
  const [dmTarget, setDmTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/auth/users`);
      setUsers(res.data.filter(u => u._id !== user.id));
    } catch (_) {}
  };

  const fetchMessages = async (room) => {
    setLoading(true);
    try {
      const endpoint = room.includes('-')
        ? `${API_BASE}/api/chat/dm/${room.split('-')[0]}/${room.split('-')[1]}`
        : `${API_BASE}/api/chat/messages/${room}`;
      const res = await axios.get(endpoint);
      setMessages(res.data);
    } catch (_) {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!socket) return;
    socket.emit('join_room', activeRoom);
    fetchMessages(activeRoom);

    const handleMessage = (msg) => {
      if (msg.room === activeRoom) {
        setMessages(prev => [...prev, msg]);
      }
    };
    socket.on('chat_message', handleMessage);
    return () => socket.off('chat_message', handleMessage);
  }, [activeRoom, socket]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;

    socket.emit('chat_message', {
      sender_id: user.id,
      sender_name: user.full_name,
      sender_role: user.role,
      room: activeRoom,
      content: input.trim(),
      message_type: 'text'
    });
    setInput('');
  };

  const handleDM = (targetUser) => {
    const room = [user.id, targetUser._id].sort().join('-');
    setDmTarget(targetUser);
    setActiveRoom(room);
  };

  const handleSendAlert = () => {
    if (!socket) return;
    socket.emit('emergency_alert', {
      title: '🚨 Emergency Alert',
      message: `EMERGENCY from ${user.full_name}!`,
      name: user.full_name,
      type: 'emergency'
    });
    socket.emit('chat_message', {
      sender_id: user.id,
      sender_name: user.full_name,
      sender_role: user.role,
      room: 'emergency',
      content: `🚨 EMERGENCY ALERT from ${user.full_name}! Please respond immediately!`,
      message_type: 'alert'
    });
    alert('Emergency alert sent to all users!');
  };

  const isOnline = (userId) => onlineUsers?.some(u => u.userId === userId);
  const activeLabel = dmTarget ? `💬 DM: ${dmTarget.full_name}` : ROOMS.find(r => r.id === activeRoom)?.label || activeRoom;

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)', fontFamily: 'Segoe UI, Arial, sans-serif', background: '#f0f4f8' }}>
      {/* Sidebar */}
      <div style={{ width: '260px', background: '#1a1a2e', color: 'white', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {/* Rooms */}
        <div style={{ padding: '16px 12px 8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: '600' }}>Channels</div>
          {ROOMS.map(room => (
            <button
              key={room.id}
              onClick={() => { setActiveRoom(room.id); setDmTarget(null); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px',
                background: activeRoom === room.id ? 'rgba(0,212,255,0.15)' : 'transparent',
                border: 'none', color: activeRoom === room.id ? '#00d4ff' : '#bbb',
                borderRadius: '6px', cursor: 'pointer', fontSize: '0.88rem', textAlign: 'left', marginBottom: '2px'
              }}
            >
              <span>{room.label}</span>
            </button>
          ))}
        </div>

        {/* Direct Messages */}
        <div style={{ padding: '12px', flex: 1, overflowY: 'auto' }}>
          <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: '600' }}>Direct Messages</div>
          {users.map(u => {
            const online = isOnline(u._id);
            const dm = [user.id, u._id].sort().join('-');
            return (
              <button
                key={u._id}
                onClick={() => handleDM(u)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px',
                  background: activeRoom === dm ? 'rgba(0,212,255,0.15)' : 'transparent',
                  border: 'none', color: '#bbb', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem',
                  textAlign: 'left', marginBottom: '2px'
                }}
              >
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: online ? '#28a745' : '#666', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#ddd' }}>{u.full_name}</div>
                  <div style={{ fontSize: '0.72rem', color: roleColors[u.role] || '#888' }}>{u.role?.replace('_', ' ')}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Online count */}
        <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '0.78rem', color: '#888' }}>
          🟢 {onlineUsers?.length || 0} online
        </div>
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ background: 'white', padding: '12px 20px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div>
            <div style={{ fontWeight: '700', color: '#1a1a2e', fontSize: '1rem' }}>{activeLabel}</div>
            <div style={{ fontSize: '0.78rem', color: '#888' }}>{ROOMS.find(r => r.id === activeRoom)?.desc || (dmTarget ? `Private message with ${dmTarget.full_name}` : '')}</div>
          </div>
          {(user.role === 'doctor' || user.role === 'admin' || user.role === 'ambulance_driver') && (
            <button
              onClick={handleSendAlert}
              style={{ background: '#dc3545', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}
            >
              🚨 Send Alert
            </button>
          )}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#888', marginTop: '40px' }}>Loading messages...</div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#aaa', marginTop: '60px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>💬</div>
              <div>No messages yet. Start the conversation!</div>
            </div>
          ) : messages.map((msg, i) => {
            const isOwn = msg.sender_id?.toString() === user.id?.toString();
            const roleColor = roleColors[msg.sender_role] || '#888';
            return (
              <div key={msg._id || i} style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', gap: '8px', alignItems: 'flex-end' }}>
                {!isOwn && (
                  <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: roleColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.85rem', fontWeight: 'bold', flexShrink: 0 }}>
                    {(msg.sender_name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div style={{ maxWidth: '65%' }}>
                  {!isOwn && <div style={{ fontSize: '0.75rem', color: roleColor, fontWeight: '600', marginBottom: '3px' }}>{msg.sender_name} <span style={{ color: '#aaa', fontWeight: 'normal' }}>({msg.sender_role?.replace('_', ' ')})</span></div>}
                  <div style={{
                    background: msg.message_type === 'alert' ? '#dc3545' : isOwn ? '#007bff' : 'white',
                    color: isOwn || msg.message_type === 'alert' ? 'white' : '#333',
                    padding: '10px 14px',
                    borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                    fontSize: '0.9rem',
                    lineHeight: '1.4'
                  }}>
                    {msg.content}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#aaa', marginTop: '3px', textAlign: isOwn ? 'right' : 'left' }}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} style={{ padding: '12px 20px', background: 'white', borderTop: '1px solid #eee', display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={`Message ${activeLabel}...`}
            style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #ddd', borderRadius: '24px', fontSize: '0.92rem', outline: 'none', background: '#f8f9fa' }}
          />
          <button
            type="submit"
            disabled={!input.trim()}
            style={{ background: input.trim() ? '#007bff' : '#ccc', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '24px', cursor: input.trim() ? 'pointer' : 'not-allowed', fontWeight: '600', fontSize: '0.9rem', transition: 'background 0.2s' }}
          >
            Send ➤
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatPage;
