import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
    const [logs, setLogs] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('users');
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedLog, setSelectedLog] = useState(null);
    const [editUser, setEditUser] = useState(null);
    const [editForm, setEditForm] = useState({ username: '', email: '', first_name: '', password: '', is_superuser: false });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    // New state for search/filter
    const [userSearch, setUserSearch] = useState('');
    const [logFilter, setLogFilter] = useState('all');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
            const userId = localStorage.getItem('user_id');

            const response = await axios.get(`${apiUrl}/admin/logs`, {
                withCredentials: true,
                headers: { 'X-User-ID': userId }
            });

            if (response.data.success) {
                setLogs(response.data.logs || []);
                setUsers(response.data.users || []);
            } else {
                setError('Failed to fetch data. Are you an admin?');
            }
        } catch (err) {
            setError('Unauthorized access or error loading data.');
            if (err.response?.status === 403) {
                navigate('/dashboard');
            } else if (err.response?.status === 401) {
                navigate('/');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
        try {
            await axios.post(`${apiUrl}/logout`, {}, { withCredentials: true });
        } catch (e) {/* ignore */ }
        localStorage.clear();
        navigate('/');
    };

    const getUserLogs = (username) => {
        return logs.filter(log => log.username === username);
    };

    const openEditModal = (user) => {
        setEditUser(user);
        setEditForm({
            username: user.username,
            email: user.email || '',
            first_name: user.first_name || '',
            password: '',
            is_superuser: user.is_superuser
        });
        setMessage('');
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
            const userId = localStorage.getItem('user_id');

            const updateData = {
                username: editForm.username,
                email: editForm.email,
                first_name: editForm.first_name,
                is_superuser: editForm.is_superuser
            };

            // Only include password if it was changed
            if (editForm.password) {
                updateData.password = editForm.password;
            }

            const response = await axios.put(
                `${apiUrl}/admin/user/${editUser.id}`,
                updateData,
                {
                    withCredentials: true,
                    headers: { 'X-User-ID': userId, 'Content-Type': 'application/json' }
                }
            );

            if (response.data.success) {
                setMessage('✓ User updated successfully!');
                // Refresh data
                await fetchData();
                setTimeout(() => setEditUser(null), 1000);
            } else {
                setMessage('✗ ' + (response.data.message || 'Failed to update'));
            }
        } catch (err) {
            setMessage('✗ ' + (err.response?.data?.message || 'Error updating user'));
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!confirm(`Are you sure you want to delete user "${editUser.username}"? This will also delete all their analysis history.`)) {
            return;
        }

        setSaving(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
            const userId = localStorage.getItem('user_id');

            const response = await axios.delete(
                `${apiUrl}/admin/user/${editUser.id}`,
                {
                    withCredentials: true,
                    headers: { 'X-User-ID': userId }
                }
            );

            if (response.data.success) {
                setMessage('✓ User deleted!');
                await fetchData();
                setTimeout(() => setEditUser(null), 1000);
            } else {
                setMessage('✗ ' + (response.data.message || 'Failed to delete'));
            }
        } catch (err) {
            setMessage('✗ ' + (err.response?.data?.message || 'Error deleting user'));
        } finally {
            setSaving(false);
        }
    };

    const styles = {
        container: {
            minHeight: '100vh',
            background: '#0a0a0c',
            fontFamily: "'Inter', sans-serif",
            color: '#e0e0e8',
            padding: '40px'
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '30px'
        },
        title: {
            fontSize: '28px',
            color: '#fff',
            fontWeight: '600'
        },
        logoutBtn: {
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer'
        },
        tabs: {
            display: 'flex',
            gap: '8px',
            marginBottom: '24px'
        },
        tab: {
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            border: 'none',
            transition: 'all 0.2s'
        },
        tabActive: {
            background: 'linear-gradient(135deg, #6ba3ff, #3b82f6)',
            color: '#fff'
        },
        tabInactive: {
            background: '#16161a',
            color: '#888',
            border: '1px solid rgba(255,255,255,0.05)'
        },
        statsGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
        },
        statCard: {
            background: '#16161a',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid rgba(255,255,255,0.05)'
        },
        statValue: {
            fontSize: '32px',
            fontWeight: '700',
            color: '#fff'
        },
        statLabel: {
            fontSize: '13px',
            color: '#888',
            marginTop: '4px'
        },
        tableWrapper: {
            background: '#16161a',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.05)',
            overflow: 'hidden'
        },
        table: {
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px'
        },
        th: {
            textAlign: 'left',
            padding: '16px 20px',
            background: 'rgba(255,255,255,0.02)',
            color: '#a0a0ab',
            fontWeight: '500',
            borderBottom: '1px solid rgba(255,255,255,0.05)'
        },
        td: {
            padding: '14px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.02)',
            color: '#e0e0e8'
        },
        tr: {
            cursor: 'pointer',
            transition: 'background 0.2s'
        },
        badge: {
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '600',
            textTransform: 'uppercase'
        },
        adminBadge: {
            background: 'rgba(168, 85, 247, 0.1)',
            color: '#a855f7'
        },
        thumb: {
            width: '40px',
            height: '40px',
            borderRadius: '6px',
            objectFit: 'cover'
        },
        modalOverlay: {
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
        },
        modal: {
            background: '#16161a',
            borderRadius: '24px',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            border: '1px solid rgba(255,255,255,0.1)'
        },
        modalHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '24px',
            borderBottom: '1px solid rgba(255,255,255,0.05)'
        },
        modalTitle: {
            fontSize: '20px',
            fontWeight: '600',
            margin: 0
        },
        closeBtn: {
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: '#fff',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '18px'
        },
        modalBody: {
            padding: '24px'
        },
        editBtn: {
            background: 'rgba(107, 163, 255, 0.1)',
            color: '#6ba3ff',
            border: '1px solid rgba(107, 163, 255, 0.2)',
            padding: '6px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            marginLeft: '8px'
        },
        input: {
            width: '100%',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.1)',
            background: '#0d0d10',
            color: '#fff',
            fontSize: '14px',
            marginBottom: '16px'
        },
        label: {
            display: 'block',
            fontSize: '13px',
            color: '#888',
            marginBottom: '6px'
        },
        saveBtn: {
            background: 'linear-gradient(135deg, #6ba3ff, #3b82f6)',
            color: '#fff',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            width: '100%'
        },
        deleteBtn: {
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            width: '100%',
            marginTop: '12px'
        },
        checkbox: {
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '20px'
        }
    };

    const totalAnalyses = logs.length;
    const realCount = logs.filter(l => l.is_real).length;
    const fakeCount = logs.filter(l => !l.is_real).length;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={{ ...styles.title, display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '32px', height: '32px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        borderRadius: '8px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    Admin Dashboard
                </h1>
                <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
            </div>

            {/* Stats Overview */}
            <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                    <div style={{ ...styles.statValue, color: '#6ba3ff' }}>{users.length}</div>
                    <div style={styles.statLabel}>Total Users</div>
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statValue}>{totalAnalyses}</div>
                    <div style={styles.statLabel}>Total Analyses</div>
                </div>
                <div style={styles.statCard}>
                    <div style={{ ...styles.statValue, color: '#34d399' }}>{realCount}</div>
                    <div style={styles.statLabel}>Real Images</div>
                </div>
                <div style={styles.statCard}>
                    <div style={{ ...styles.statValue, color: '#fb923c' }}>{fakeCount}</div>
                    <div style={styles.statLabel}>Fake Images</div>
                </div>
            </div>

            {/* Tabs */}
            <div style={styles.tabs}>
                <button
                    style={{ ...styles.tab, ...(activeTab === 'users' ? styles.tabActive : styles.tabInactive) }}
                    onClick={() => setActiveTab('users')}
                >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        Users Database
                    </span>
                </button>
                <button
                    style={{ ...styles.tab, ...(activeTab === 'logs' ? styles.tabActive : styles.tabInactive) }}
                    onClick={() => setActiveTab('logs')}
                >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="20" x2="18" y2="10" />
                            <line x1="12" y1="20" x2="12" y2="4" />
                            <line x1="6" y1="20" x2="6" y2="14" />
                        </svg>
                        All Analysis Logs
                    </span>
                </button>
            </div>

            {loading && <p>Loading data...</p>}
            {error && <p style={{ color: '#f87171' }}>{error}</p>}

            {!loading && !error && activeTab === 'users' && (
                <div style={styles.tableWrapper}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
                        <div style={{ position: 'relative', maxWidth: '300px' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                style={{ ...styles.input, paddingLeft: '36px', marginBottom: 0 }}
                                placeholder="Search users by name or email..."
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>User</th>
                                <th style={styles.th}>Email</th>
                                <th style={styles.th}>Role</th>
                                <th style={styles.th}>Joined</th>
                                <th style={styles.th}>Analyses</th>
                                <th style={styles.th}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.filter(user =>
                                user.username.toLowerCase().includes(userSearch.toLowerCase()) ||
                                (user.email && user.email.toLowerCase().includes(userSearch.toLowerCase()))
                            ).map((user, i) => (
                                <tr
                                    key={i}
                                    style={styles.tr}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = ''}
                                >
                                    <td style={styles.td}>
                                        <div style={{ fontWeight: '500' }}>{user.username}</div>
                                        {user.first_name && <div style={{ fontSize: '12px', color: '#888' }}>{user.first_name}</div>}
                                    </td>
                                    <td style={styles.td}>{user.email}</td>
                                    <td style={styles.td}>
                                        {user.is_superuser ? (
                                            <span style={{ ...styles.badge, ...styles.adminBadge }}>Admin</span>
                                        ) : (
                                            <span style={{ ...styles.badge, background: 'rgba(107, 163, 255, 0.1)', color: '#6ba3ff' }}>User</span>
                                        )}
                                    </td>
                                    <td style={styles.td}>{user.date_joined}</td>
                                    <td style={styles.td}>
                                        <span style={{ color: '#34d399' }}>{user.real_count}</span>
                                        {' / '}
                                        <span style={{ color: '#fb923c' }}>{user.fake_count}</span>
                                        {' '}
                                        <span style={{ color: '#888' }}>({user.total_analyses})</span>
                                    </td>
                                    <td style={styles.td}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <button
                                                style={{ ...styles.editBtn, display: 'flex', alignItems: 'center', gap: '4px' }}
                                                onClick={(e) => { e.stopPropagation(); openEditModal(user); }}
                                            >
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                </svg>
                                                Edit
                                            </button>
                                            <button
                                                style={{ ...styles.editBtn, display: 'flex', alignItems: 'center', gap: '4px' }}
                                                onClick={(e) => { e.stopPropagation(); setSelectedUser(user); }}
                                            >
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                    <circle cx="12" cy="12" r="3" />
                                                </svg>
                                                View
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {!loading && !error && activeTab === 'logs' && (
                <div style={styles.tableWrapper}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)', display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: '#888', fontWeight: '500' }}>Filter:</span>
                        {['all', 'real', 'fake'].map(f => (
                            <button
                                key={f}
                                onClick={() => setLogFilter(f)}
                                style={{
                                    border: 'none',
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    background: logFilter === f ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                                    color: logFilter === f ? '#6ba3ff' : '#888',
                                    border: logFilter === f ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
                                    textTransform: 'capitalize',
                                    fontWeight: logFilter === f ? '600' : '500',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Image</th>
                                <th style={styles.th}>User</th>
                                <th style={styles.th}>Email</th>
                                <th style={styles.th}>Result</th>
                                <th style={styles.th}>Confidence</th>
                                <th style={styles.th}>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.filter(log => {
                                if (logFilter === 'real') return log.is_real;
                                if (logFilter === 'fake') return !log.is_real;
                                return true;
                            }).map((log, i) => (
                                <tr
                                    key={i}
                                    style={styles.tr}
                                    onClick={() => setSelectedLog(log)}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = ''}
                                >
                                    <td style={styles.td}>
                                        <img
                                            src={`http://localhost:8000/static/${log.image_path}`}
                                            alt=""
                                            style={styles.thumb}
                                            onError={(e) => { e.target.src = 'https://via.placeholder.com/40?text=?' }}
                                        />
                                    </td>
                                    <td style={styles.td}>{log.username}</td>
                                    <td style={styles.td}>{log.email}</td>
                                    <td style={styles.td}>
                                        <span style={{
                                            ...styles.badge,
                                            background: log.is_real ? 'rgba(52, 211, 153, 0.1)' : 'rgba(251, 146, 60, 0.1)',
                                            color: log.is_real ? '#34d399' : '#fb923c'
                                        }}>
                                            {log.is_real ? 'Real' : 'Fake'}
                                        </span>
                                    </td>
                                    <td style={styles.td}>{log.confidence?.toFixed(1)}%</td>
                                    <td style={styles.td}>{log.timestamp}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Edit User Modal */}
            {editUser && (
                <div style={styles.modalOverlay} onClick={() => setEditUser(null)}>
                    <div style={{ ...styles.modal, maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h2 style={{ ...styles.modalTitle, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                                Edit User: {editUser.username}
                            </h2>
                            <button style={styles.closeBtn} onClick={() => setEditUser(null)}>×</button>
                        </div>
                        <div style={styles.modalBody}>
                            <form onSubmit={handleEditSubmit}>
                                <label style={styles.label}>Username</label>
                                <input
                                    style={styles.input}
                                    value={editForm.username}
                                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                                    required
                                />

                                <label style={styles.label}>Email</label>
                                <input
                                    style={styles.input}
                                    type="email"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                />

                                <label style={styles.label}>Name</label>
                                <input
                                    style={styles.input}
                                    value={editForm.first_name}
                                    onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                                />

                                <label style={styles.label}>New Password (leave blank to keep current)</label>
                                <input
                                    style={styles.input}
                                    type="password"
                                    value={editForm.password}
                                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                                    placeholder="••••••••"
                                />

                                <div style={styles.checkbox}>
                                    <input
                                        type="checkbox"
                                        id="is_superuser"
                                        checked={editForm.is_superuser}
                                        onChange={(e) => setEditForm({ ...editForm, is_superuser: e.target.checked })}
                                        disabled={editUser.id === parseInt(localStorage.getItem('user_id'))}
                                    />
                                    <label htmlFor="is_superuser" style={{ color: '#a855f7' }}>
                                        Admin privileges
                                    </label>
                                    {editUser.id === parseInt(localStorage.getItem('user_id')) && (
                                        <span style={{ fontSize: '11px', color: '#888' }}>(cannot change own status)</span>
                                    )}
                                </div>

                                {message && (
                                    <p style={{
                                        color: message.startsWith('✓') ? '#34d399' : '#f87171',
                                        marginBottom: '16px',
                                        fontSize: '14px'
                                    }}>
                                        {message}
                                    </p>
                                )}

                                <button type="submit" style={{ ...styles.saveBtn, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} disabled={saving}>
                                    {saving ? 'Saving...' : (
                                        <>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                                <polyline points="17 21 17 13 7 13 7 21" />
                                                <polyline points="7 3 7 8 15 8" />
                                            </svg>
                                            Save Changes
                                        </>
                                    )}
                                </button>

                                {editUser.id !== parseInt(localStorage.getItem('user_id')) && (
                                    <button
                                        type="button"
                                        style={{ ...styles.deleteBtn, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                        onClick={handleDeleteUser}
                                        disabled={saving}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                        Delete User
                                    </button>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* User Detail Modal */}
            {selectedUser && (
                <div style={styles.modalOverlay} onClick={() => setSelectedUser(null)}>
                    <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h2 style={{ ...styles.modalTitle, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                                User Details: {selectedUser.username}
                            </h2>
                            <button style={styles.closeBtn} onClick={() => setSelectedUser(null)}>×</button>
                        </div>
                        <div style={styles.modalBody}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                                <div style={{ background: '#0d0d10', padding: '16px', borderRadius: '12px' }}>
                                    <div style={{ fontSize: '12px', color: '#888' }}>Full Name</div>
                                    <div style={{ fontSize: '16px', color: '#fff' }}>{selectedUser.first_name || 'Not provided'}</div>
                                </div>
                                <div style={{ background: '#0d0d10', padding: '16px', borderRadius: '12px' }}>
                                    <div style={{ fontSize: '12px', color: '#888' }}>Email</div>
                                    <div style={{ fontSize: '16px', color: '#fff' }}>{selectedUser.email}</div>
                                </div>
                                <div style={{ background: '#0d0d10', padding: '16px', borderRadius: '12px' }}>
                                    <div style={{ fontSize: '12px', color: '#888' }}>Joined</div>
                                    <div style={{ fontSize: '16px', color: '#fff' }}>{selectedUser.date_joined}</div>
                                </div>
                                <div style={{ background: '#0d0d10', padding: '16px', borderRadius: '12px' }}>
                                    <div style={{ fontSize: '12px', color: '#888' }}>Avg Confidence</div>
                                    <div style={{ fontSize: '16px', color: '#fff' }}>{selectedUser.avg_confidence}%</div>
                                </div>
                            </div>

                            <h3 style={{ marginBottom: '16px', color: '#fff' }}>Analysis History ({selectedUser.total_analyses} total)</h3>
                            {getUserLogs(selectedUser.username).length > 0 ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
                                    {getUserLogs(selectedUser.username).map((log, i) => (
                                        <div key={i} style={{
                                            background: '#0d0d10',
                                            borderRadius: '12px',
                                            overflow: 'hidden',
                                            cursor: 'pointer'
                                        }} onClick={() => { setSelectedUser(null); setSelectedLog(log); }}>
                                            <img
                                                src={`http://localhost:8000/static/${log.image_path}`}
                                                alt=""
                                                style={{ width: '100%', height: '100px', objectFit: 'cover' }}
                                                onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=?' }}
                                            />
                                            <div style={{ padding: '8px' }}>
                                                <span style={{
                                                    ...styles.badge,
                                                    background: log.is_real ? 'rgba(52, 211, 153, 0.1)' : 'rgba(251, 146, 60, 0.1)',
                                                    color: log.is_real ? '#34d399' : '#fb923c'
                                                }}>
                                                    {log.is_real ? 'Real' : 'Fake'} {log.confidence?.toFixed(0)}%
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ color: '#888' }}>No analyses yet</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Log Detail Modal */}
            {selectedLog && (
                <div style={styles.modalOverlay} onClick={() => setSelectedLog(null)}>
                    <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h2 style={{ ...styles.modalTitle, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="20" x2="18" y2="10" />
                                    <line x1="12" y1="20" x2="12" y2="4" />
                                    <line x1="6" y1="20" x2="6" y2="14" />
                                </svg>
                                Analysis Details
                            </h2>
                            <button style={styles.closeBtn} onClick={() => setSelectedLog(null)}>×</button>
                        </div>
                        <div style={styles.modalBody}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                <div>
                                    <img
                                        src={`http://localhost:8000/static/${selectedLog.image_path}`}
                                        alt="Analysis"
                                        style={{ width: '100%', borderRadius: '12px', maxHeight: '300px', objectFit: 'contain', background: '#0d0d10' }}
                                        onError={(e) => { e.target.src = 'https://via.placeholder.com/300?text=Image+Not+Found' }}
                                    />
                                </div>
                                <div>
                                    <div style={{ marginBottom: '16px' }}>
                                        <div style={{ fontSize: '12px', color: '#888' }}>User</div>
                                        <div style={{ fontSize: '18px', color: '#fff' }}>{selectedLog.username}</div>
                                    </div>
                                    <div style={{ marginBottom: '16px' }}>
                                        <div style={{ fontSize: '12px', color: '#888' }}>Result</div>
                                        <div style={{ fontSize: '24px', fontWeight: '700', color: selectedLog.is_real ? '#34d399' : '#fb923c', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            {selectedLog.is_real ? (
                                                <>
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                    Authentic
                                                </>
                                            ) : (
                                                <>
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                                        <line x1="12" y1="9" x2="12" y2="13" />
                                                        <line x1="12" y1="17" x2="12.01" y2="17" />
                                                    </svg>
                                                    AI-Generated
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div style={{ background: '#0d0d10', padding: '12px', borderRadius: '8px' }}>
                                            <div style={{ fontSize: '12px', color: '#888' }}>Real Prob</div>
                                            <div style={{ fontSize: '20px', color: '#34d399' }}>{selectedLog.real_prob?.toFixed(1)}%</div>
                                        </div>
                                        <div style={{ background: '#0d0d10', padding: '12px', borderRadius: '8px' }}>
                                            <div style={{ fontSize: '12px', color: '#888' }}>Fake Prob</div>
                                            <div style={{ fontSize: '20px', color: '#fb923c' }}>{selectedLog.fake_prob?.toFixed(1)}%</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {selectedLog.explanation_image && (
                                <div style={{ marginTop: '24px' }}>
                                    <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6ba3ff" strokeWidth="2">
                                            <circle cx="11" cy="11" r="8" />
                                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                        </svg>
                                        XAI Visualization
                                    </div>
                                    <img
                                        src={`data:image/png;base64,${selectedLog.explanation_image}`}
                                        alt="XAI"
                                        style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '12px', background: '#0d0d10' }}
                                    />
                                </div>
                            )}

                            {selectedLog.explanation_text && (
                                <div style={{ marginTop: '20px', padding: '16px', background: '#0d0d10', borderRadius: '12px' }}>
                                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#6ba3ff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                        AI Explanation
                                    </div>
                                    <p style={{ color: '#e0e0e8', lineHeight: '1.6', margin: 0 }}>{selectedLog.explanation_text}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
