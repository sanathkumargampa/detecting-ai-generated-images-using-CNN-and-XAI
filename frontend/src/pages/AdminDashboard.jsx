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
                <h1 style={styles.title}>🛡️ Admin Dashboard</h1>
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
                    👥 Users Database
                </button>
                <button
                    style={{ ...styles.tab, ...(activeTab === 'logs' ? styles.tabActive : styles.tabInactive) }}
                    onClick={() => setActiveTab('logs')}
                >
                    📊 All Analysis Logs
                </button>
            </div>

            {loading && <p>Loading data...</p>}
            {error && <p style={{ color: '#f87171' }}>{error}</p>}

            {!loading && !error && activeTab === 'users' && (
                <div style={styles.tableWrapper}>
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
                            {users.map((user, i) => (
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
                                        <button
                                            style={styles.editBtn}
                                            onClick={(e) => { e.stopPropagation(); openEditModal(user); }}
                                        >
                                            ✏️ Edit
                                        </button>
                                        <button
                                            style={{ ...styles.editBtn, marginLeft: '8px' }}
                                            onClick={(e) => { e.stopPropagation(); setSelectedUser(user); }}
                                        >
                                            👁️ View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {!loading && !error && activeTab === 'logs' && (
                <div style={styles.tableWrapper}>
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
                            {logs.map((log, i) => (
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
                            <h2 style={styles.modalTitle}>✏️ Edit User: {editUser.username}</h2>
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

                                <button type="submit" style={styles.saveBtn} disabled={saving}>
                                    {saving ? 'Saving...' : '💾 Save Changes'}
                                </button>

                                {editUser.id !== parseInt(localStorage.getItem('user_id')) && (
                                    <button
                                        type="button"
                                        style={styles.deleteBtn}
                                        onClick={handleDeleteUser}
                                        disabled={saving}
                                    >
                                        🗑️ Delete User
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
                            <h2 style={styles.modalTitle}>👤 User Details: {selectedUser.username}</h2>
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
                            <h2 style={styles.modalTitle}>📊 Analysis Details</h2>
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
                                        <div style={{ fontSize: '24px', fontWeight: '700', color: selectedLog.is_real ? '#34d399' : '#fb923c' }}>
                                            {selectedLog.is_real ? '✓ Authentic' : '⚠ AI-Generated'}
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
                                    <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>🔍 XAI Visualization</div>
                                    <img
                                        src={`data:image/png;base64,${selectedLog.explanation_image}`}
                                        alt="XAI"
                                        style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '12px', background: '#0d0d10' }}
                                    />
                                </div>
                            )}

                            {selectedLog.explanation_text && (
                                <div style={{ marginTop: '20px', padding: '16px', background: '#0d0d10', borderRadius: '12px' }}>
                                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#6ba3ff' }}>💡 AI Explanation</div>
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
