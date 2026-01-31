import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

export default function History() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
            const userId = localStorage.getItem('user_id');

            if (!userId) {
                navigate('/');
                return;
            }

            const response = await axios.get(`${apiUrl}/history`, {
                withCredentials: true,
                headers: { 'X-User-ID': userId }
            });

            if (response.data.success) {
                setHistory(response.data.history);
            } else {
                setError('Failed to fetch history');
            }
        } catch (err) {
            setError('Error loading history. Please log in again.');
            if (err.response?.status === 401) {
                navigate('/');
            }
        } finally {
            setLoading(false);
        }
    };

    const openDetail = (item) => {
        setSelectedItem(item);
    };

    const closeDetail = () => {
        setSelectedItem(null);
    };

    const styles = {
        container: {
            minHeight: '100vh',
            minHeight: '100vh',
            background: 'linear-gradient(180deg, #0a0a0c 0%, #111114 50%, #0a0a0c 100%)',
            fontFamily: "'Inter', sans-serif",
            color: '#e0e0e8',
            padding: '40px'
        },
        header: {
            maxWidth: '1000px',
            margin: '0 auto 40px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        },
        title: {
            fontSize: '32px',
            fontWeight: '700',
            letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #fff 0%, #a5b4fc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0
        },
        backLink: {
            color: '#6ba3ff',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        },
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '24px',
            maxWidth: '1000px',
            margin: '0 auto'
        },
        card: {
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.05)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer',
            boxShadow: '0 4px 20px -5px rgba(0,0,0,0.3)'
        },
        cardHover: {
            transform: 'translateY(-6px)',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)'
        },
        imageContainer: {
            height: '200px',
            width: '100%',
            overflow: 'hidden',
            background: '#0d0d10',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        },
        image: {
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.5s ease'
        },
        content: {
            padding: '20px'
        },
        badge: {
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '600',
            marginBottom: '10px'
        },
        meta: {
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: '#888890',
            marginTop: '12px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            paddingTop: '12px'
        },
        // Modal styles
        modalOverlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
        },
        modal: {
            background: '#121216',
            borderRadius: '24px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 24px 80px -12px rgba(0,0,0,0.8)'
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
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        },
        modalBody: {
            padding: '24px'
        },
        modalImage: {
            width: '100%',
            maxHeight: '400px',
            objectFit: 'contain',
            borderRadius: '12px',
            background: '#0d0d10',
            marginBottom: '24px'
        },
        resultSection: {
            background: '#0d0d10',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '20px'
        },
        resultLabel: {
            fontSize: '14px',
            color: '#888',
            marginBottom: '8px'
        },
        resultValue: {
            fontSize: '28px',
            fontWeight: '700'
        },
        probBar: {
            height: '8px',
            background: '#1e1e24',
            borderRadius: '4px',
            overflow: 'hidden',
            marginTop: '16px'
        },
        probFill: {
            height: '100%',
            borderRadius: '4px',
            transition: 'width 0.3s'
        },
        statsGrid: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginTop: '20px'
        },
        statBox: {
            background: '#0d0d10',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center'
        },
        statLabel: {
            fontSize: '12px',
            color: '#888',
            marginBottom: '4px'
        },
        statValue: {
            fontSize: '20px',
            fontWeight: '600'
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>Your Analysis History</h1>
                <Link to="/dashboard" style={styles.backLink}>
                    ← Back to Dashboard
                </Link>
            </div>

            {loading && <p style={{ textAlign: 'center', color: '#888' }}>Loading history...</p>}
            {error && <p style={{ textAlign: 'center', color: '#f87171' }}>{error}</p>}

            {!loading && history.length === 0 && (
                <div style={{ textAlign: 'center', marginTop: '100px', color: '#888' }}>
                    <p>No analysis history found.</p>
                    <Link to="/dashboard" style={{ color: '#6ba3ff', textDecoration: 'none' }}>Start your first analysis</Link>
                </div>
            )}

            <div style={styles.grid}>
                {history.map((item, index) => {
                    const statusColor = item.is_real ? '#34d399' : '#fb923c';
                    const bgStart = item.is_real ? 'rgba(52, 211, 153, 0.1)' : 'rgba(251, 146, 60, 0.1)';

                    return (
                        <div
                            key={index}
                            style={styles.card}
                            onClick={() => openDetail(item)}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = '';
                                e.currentTarget.style.boxShadow = '';
                            }}
                        >
                            <div style={styles.imageContainer}>
                                <img
                                    src={`http://localhost:8000/static/${item.image_path}`}
                                    alt="Analysis"
                                    style={styles.image}
                                    onError={(e) => { e.target.src = 'https://via.placeholder.com/300?text=Image+Not+Found' }}
                                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                />
                            </div>
                            <div style={styles.content}>
                                <div style={{
                                    ...styles.badge,
                                    background: bgStart,
                                    color: statusColor,
                                    border: `1px solid ${statusColor}33`
                                }}>
                                    {item.is_real ? 'REAL' : 'FAKE'}
                                </div>

                                <div style={{ marginBottom: '5px' }}>
                                    <span style={{ color: '#aaa', fontSize: '13px' }}>Confidence: </span>
                                    <span style={{ color: '#fff', fontWeight: 'bold' }}>{item.confidence.toFixed(1)}%</span>
                                </div>
                                <div style={styles.meta}>
                                    <span>{item.timestamp}</span>
                                    <span style={{ color: '#6ba3ff' }}>Click for details →</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Detail Modal */}
            {selectedItem && (
                <div style={styles.modalOverlay} onClick={closeDetail}>
                    <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h2 style={styles.modalTitle}>Analysis Details</h2>
                            <button style={styles.closeBtn} onClick={closeDetail}>×</button>
                        </div>
                        <div style={styles.modalBody}>
                            <img
                                src={`http://localhost:8000/static/${selectedItem.image_path}`}
                                alt="Analysis"
                                style={styles.modalImage}
                                onError={(e) => { e.target.src = 'https://via.placeholder.com/600?text=Image+Not+Found' }}
                            />

                            <div style={styles.resultSection}>
                                <div style={styles.resultLabel}>Verdict</div>
                                <div style={{
                                    ...styles.resultValue,
                                    color: selectedItem.is_real ? '#34d399' : '#fb923c'
                                }}>
                                    {selectedItem.is_real ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                            Authentic Image
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                                <line x1="12" y1="9" x2="12" y2="13" />
                                                <line x1="12" y1="17" x2="12.01" y2="17" />
                                            </svg>
                                            AI-Generated Image
                                        </div>
                                    )}
                                </div>

                                <div style={styles.probBar}>
                                    <div style={{
                                        ...styles.probFill,
                                        width: `${selectedItem.confidence}%`,
                                        background: selectedItem.is_real
                                            ? 'linear-gradient(90deg, #34d399, #10b981)'
                                            : 'linear-gradient(90deg, #fb923c, #f97316)'
                                    }} />
                                </div>
                                <div style={{ textAlign: 'right', marginTop: '8px', fontSize: '14px', color: '#888' }}>
                                    {selectedItem.confidence.toFixed(1)}% confidence
                                </div>
                            </div>

                            <div style={styles.statsGrid}>
                                <div style={styles.statBox}>
                                    <div style={styles.statLabel}>Real Probability</div>
                                    <div style={{ ...styles.statValue, color: '#34d399' }}>
                                        {selectedItem.real_prob?.toFixed(1) || '0.0'}%
                                    </div>
                                </div>
                                <div style={styles.statBox}>
                                    <div style={styles.statLabel}>Fake Probability</div>
                                    <div style={{ ...styles.statValue, color: '#fb923c' }}>
                                        {selectedItem.fake_prob?.toFixed(1) || '0.0'}%
                                    </div>
                                </div>
                            </div>

                            {/* XAI Visualization Section */}
                            {selectedItem.explanation_image && (
                                <div style={{ marginTop: '24px' }}>
                                    <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6ba3ff" strokeWidth="2">
                                            <circle cx="11" cy="11" r="8" />
                                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                        </svg>
                                        XAI Visualization (LIME Analysis)
                                    </div>
                                    <div style={{
                                        background: '#0d0d10',
                                        borderRadius: '12px',
                                        padding: '16px',
                                        border: '1px solid rgba(255,255,255,0.05)'
                                    }}>
                                        <img
                                            src={`data:image/png;base64,${selectedItem.explanation_image}`}
                                            alt="XAI Explanation"
                                            style={{
                                                width: '100%',
                                                borderRadius: '8px',
                                                maxHeight: '400px',
                                                objectFit: 'contain'
                                            }}
                                        />
                                        <p style={{ fontSize: '12px', color: '#888', marginTop: '8px', textAlign: 'center' }}>
                                            Green areas support the prediction, red areas oppose it
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Explanation Text Section */}
                            {selectedItem.explanation_text && (
                                <div style={{
                                    marginTop: '20px',
                                    padding: '20px',
                                    background: '#0d0d10',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#6ba3ff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                        AI Explanation
                                    </div>
                                    <p style={{ fontSize: '14px', color: '#e0e0e8', lineHeight: '1.6', margin: 0 }}>
                                        {selectedItem.explanation_text}
                                    </p>
                                </div>
                            )}

                            <div style={{ marginTop: '20px', padding: '16px', background: '#0d0d10', borderRadius: '12px' }}>
                                <div style={styles.statLabel}>Analyzed On</div>
                                <div style={{ fontSize: '16px', color: '#fff' }}>{selectedItem.timestamp}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
