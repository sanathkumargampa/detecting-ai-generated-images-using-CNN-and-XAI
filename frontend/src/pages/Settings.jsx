import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Settings() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [profile, setProfile] = useState({
        username: '',
        email: '',
        first_name: '',
        mobile: '',
        password: '',
        confirmPassword: ''
    });
    const [historyCount, setHistoryCount] = useState(0);
    const [clearingHistory, setClearingHistory] = useState(false);

    useEffect(() => {
        fetchProfile();
        fetchHistoryCount();
    }, []);

    const fetchProfile = async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
            const userId = localStorage.getItem('user_id');

            const response = await axios.get(`${apiUrl}/profile`, {
                withCredentials: true,
                headers: { 'X-User-ID': userId }
            });

            if (response.data.success) {
                setProfile({
                    ...response.data.profile,
                    password: '',
                    confirmPassword: ''
                });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to load profile' });
        } finally {
            setLoading(false);
        }
    };

    const fetchHistoryCount = async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
            const userId = localStorage.getItem('user_id');

            const response = await axios.get(`${apiUrl}/history`, {
                withCredentials: true,
                headers: { 'X-User-ID': userId }
            });

            if (response.data.success) {
                setHistoryCount(response.data.history.length);
            }
        } catch (err) {
            console.error('Failed to fetch history count');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (profile.password && profile.password !== profile.confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }

        if (profile.password && profile.password.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }

        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
            const userId = localStorage.getItem('user_id');

            const updateData = {
                username: profile.username,
                email: profile.email,
                first_name: profile.first_name,
                mobile: profile.mobile
            };

            if (profile.password) {
                updateData.password = profile.password;
            }

            const response = await axios.put(`${apiUrl}/profile`, updateData, {
                withCredentials: true,
                headers: { 'X-User-ID': userId, 'Content-Type': 'application/json' }
            });

            if (response.data.success) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                // Update localStorage if username changed
                if (response.data.profile.username !== localStorage.getItem('username')) {
                    localStorage.setItem('username', response.data.profile.username);
                }
                setProfile(prev => ({ ...prev, password: '', confirmPassword: '' }));
            } else {
                setMessage({ type: 'error', text: response.data.message });
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update profile' });
        } finally {
            setSaving(false);
        }
    };

    const handleClearHistory = async () => {
        if (!confirm(`Are you sure you want to delete all ${historyCount} history items? This cannot be undone.`)) {
            return;
        }

        setClearingHistory(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
            const userId = localStorage.getItem('user_id');

            const response = await axios.delete(`${apiUrl}/history/clear`, {
                withCredentials: true,
                headers: { 'X-User-ID': userId }
            });

            if (response.data.success) {
                setMessage({ type: 'success', text: response.data.message });
                setHistoryCount(0);
            } else {
                setMessage({ type: 'error', text: response.data.message });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to clear history' });
        } finally {
            setClearingHistory(false);
        }
    };

    const styles = {
        container: {
            minHeight: '100vh',
            background: 'linear-gradient(180deg, #0a0a0c 0%, #111114 50%, #0a0a0c 100%)',
            padding: '40px 20px',
            color: '#fff',
            fontFamily: "'Inter', sans-serif"
        },
        content: {
            maxWidth: '600px',
            margin: '0 auto'
        },
        header: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '32px'
        },
        backBtn: {
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '10px',
            color: '#fff',
            padding: '10px 16px',
            cursor: 'pointer',
            fontSize: '14px'
        },
        title: {
            fontSize: '32px',
            fontWeight: '700',
            margin: 0,
            background: 'linear-gradient(135deg, #fff 0%, #a5b4fc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em'
        },
        card: {
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(10px)',
            borderRadius: '24px',
            padding: '32px',
            marginBottom: '24px',
            border: '1px solid rgba(255,255,255,0.05)',
            boxShadow: '0 4px 20px -5px rgba(0,0,0,0.3)'
        },
        cardTitle: {
            fontSize: '18px',
            fontWeight: '600',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
        },
        inputGroup: {
            marginBottom: '20px'
        },
        label: {
            display: 'block',
            fontSize: '13px',
            color: '#888',
            marginBottom: '8px',
            fontWeight: '500'
        },
        input: {
            width: '100%',
            padding: '16px',
            background: 'rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            color: '#fff',
            fontSize: '15px',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s',
            fontFamily: 'inherit'
        },
        button: {
            width: '100%',
            padding: '16px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            border: 'none',
            borderRadius: '12px',
            color: '#fff',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            marginTop: '16px',
            transition: 'transform 0.2s, box-shadow 0.2s',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
        },
        dangerBtn: {
            width: '100%',
            padding: '14px',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            border: 'none',
            borderRadius: '12px',
            color: '#fff',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer'
        },
        message: {
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '20px',
            fontSize: '14px'
        },
        success: {
            background: 'rgba(34, 197, 94, 0.2)',
            border: '1px solid rgba(34, 197, 94, 0.5)',
            color: '#22c55e'
        },
        error: {
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            color: '#ef4444'
        },
        historyInfo: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '12px',
            marginBottom: '16px'
        }
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.content}>
                    <div style={{ textAlign: 'center', padding: '60px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            border: '3px solid rgba(255,255,255,0.1)',
                            borderTopColor: '#3b82f6',
                            borderRadius: '50%',
                            margin: '0 auto 16px',
                            animation: 'spin 1s linear infinite'
                        }} />
                        <p style={{ color: '#888' }}>Loading settings...</p>
                        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.content}>
                <div style={styles.header}>
                    <h1 style={styles.title}>Settings</h1>
                    <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Back to Dashboard
                    </button>
                </div>

                {message.text && (
                    <div style={{
                        ...styles.message,
                        ...(message.type === 'success' ? styles.success : styles.error)
                    }}>
                        {message.type === 'success' ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '8px' }}>
                                <path d="M20 6L9 17l-5-5" />
                            </svg>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '8px' }}>
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                        )} {message.text}
                    </div>
                )}

                {/* Profile Settings */}
                <div style={styles.card}>
                    <h2 style={styles.cardTitle}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6ba3ff" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                        Profile Settings
                    </h2>
                    <form onSubmit={handleSubmit}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Username</label>
                            <input
                                style={styles.input}
                                name="username"
                                value={profile.username}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Email</label>
                            <input
                                style={styles.input}
                                type="email"
                                name="email"
                                value={profile.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Full Name</label>
                            <input
                                style={styles.input}
                                name="first_name"
                                value={profile.first_name}
                                onChange={handleChange}
                            />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Mobile Number</label>
                            <input
                                style={styles.input}
                                name="mobile"
                                value={profile.mobile}
                                onChange={handleChange}
                                placeholder="+91 XXXXXXXXXX"
                            />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>New Password (leave blank to keep current)</label>
                            <input
                                style={styles.input}
                                type="password"
                                name="password"
                                value={profile.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                            />
                        </div>
                        {profile.password && (
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Confirm New Password</label>
                                <input
                                    style={styles.input}
                                    type="password"
                                    name="confirmPassword"
                                    value={profile.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                />
                            </div>
                        )}
                        <button
                            type="submit"
                            style={{ ...styles.button, opacity: saving ? 0.7 : 1 }}
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                        <polyline points="17 21 17 13 7 13 7 21" />
                                        <polyline points="7 3 7 8 15 8" />
                                    </svg>
                                    Save Changes
                                </span>
                            )}
                        </button>
                    </form>
                </div>

                {/* Data Management */}
                <div style={styles.card}>
                    <h2 style={styles.cardTitle}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6ba3ff" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Data Management
                    </h2>
                    <div style={styles.historyInfo}>
                        <div>
                            <div style={{ fontWeight: '600' }}>Analysis History</div>
                            <div style={{ fontSize: '13px', color: '#888' }}>
                                {historyCount} {historyCount === 1 ? 'item' : 'items'} stored
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/history')}
                            style={{ ...styles.backBtn, background: 'rgba(59, 130, 246, 0.3)' }}
                        >
                            View History
                        </button>
                    </div>
                    <button
                        style={{ ...styles.dangerBtn, opacity: clearingHistory || historyCount === 0 ? 0.5 : 1 }}
                        onClick={handleClearHistory}
                        disabled={clearingHistory || historyCount === 0}
                    >
                        {clearingHistory ? 'Clearing...' : (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                                Clear All History
                            </span>
                        )}
                    </button>
                    <p style={{ fontSize: '12px', color: '#666', marginTop: '12px', textAlign: 'center' }}>
                        This will permanently delete all your analysis history and uploaded images.
                    </p>
                </div>
            </div>
        </div>
    );
}
