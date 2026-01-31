import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Dashboard() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [analysisStage, setAnalysisStage] = useState(''); // 'processing', 'generating', 'complete'
    const [showResult, setShowResult] = useState(false);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const handleFileSelect = (file) => {
        if (file && file.type.startsWith('image/')) {
            setSelectedFile(file);
            setPreview(URL.createObjectURL(file));
            setResult(null);
            setError('');
            setShowResult(false);
            // Auto-start analysis
            setTimeout(() => {
                analyzeImage(file);
            }, 300);
        }
    };

    const analyzeImage = async (file) => {
        setLoading(true);
        setError('');
        setAnalysisStage('processing');

        const formData = new FormData();
        formData.append('image', file);

        try {
            // Simulate stage transitions with slightly longer times for better feel
            setTimeout(() => setAnalysisStage('generating'), 2000);

            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
            const userId = localStorage.getItem('user_id');
            const response = await axios.post(`${apiUrl}/predict`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-User-ID': userId || ''
                },
                withCredentials: true
            });

            setAnalysisStage('complete');
            setResult(response.data);

            // Smooth transition to results
            setTimeout(() => {
                setShowResult(true);
                setLoading(false);
            }, 800);
        } catch (err) {
            setError('Analysis failed. Please try again.');
            setLoading(false);
            setAnalysisStage('');
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        handleFileSelect(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleBrowse = () => {
        fileInputRef.current?.click();
    };

    const handleInputChange = (e) => {
        const file = e.target.files[0];
        handleFileSelect(file);
    };

    const handleReset = () => {
        setSelectedFile(null);
        setPreview(null);
        setResult(null);
        setError('');
        setLoading(false);
        setAnalysisStage('');
        setShowResult(false);
    };

    const handleLogout = () => {
        // Clear any stored tokens if you have them (e.g. localStorage.removeItem('token'))
        localStorage.removeItem('token'); // Example
        navigate('/');
    };

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                handleReset();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // Styles
    const styles = {
        container: {
            minHeight: '100vh',
            background: 'linear-gradient(180deg, #0a0a0c 0%, #111114 50%, #0a0a0c 100%)',
            padding: '0',
            fontFamily: "'Inter', sans-serif", // Ensure modern font if possible, falls back to default
        },
        nav: {
            padding: '24px 40px', // Increased height
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.03)',
            background: 'rgba(10, 10, 12, 0.8)',
            backdropFilter: 'blur(12px)',
            position: 'sticky',
            top: 0,
            zIndex: 100
        },
        logo: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#e0e0e8',
            fontSize: '18px',
            fontWeight: '600',
            letterSpacing: '-0.01em'
        },
        mainContent: {
            maxWidth: '1000px', // Wider layout for dashboard
            margin: '0 auto',
            padding: '80px 24px'
        },

        // Upload Zone (Pre-Analysis)
        uploadCard: {
            maxWidth: '640px',
            margin: '0 auto'
        },
        uploadZone: {
            background: 'linear-gradient(145deg, #18181d 0%, #1c1c22 100%)',
            borderRadius: '24px',
            padding: '100px 48px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 24px 80px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)',
            border: isDragging ? '2px solid rgba(99, 179, 237, 0.5)' : '2px solid transparent'
        },
        uploadIcon: {
            width: '48px',
            height: '48px',
            margin: '0 auto 24px',
            color: '#6ba3ff',
            opacity: 0.9,
            filter: 'drop-shadow(0 4px 12px rgba(107, 163, 255, 0.3))'
        },
        uploadText: {
            color: '#a0a0a8',
            fontSize: '16px',
            fontWeight: '500',
            margin: 0
        },
        browseLink: {
            color: '#6ba3ff',
            cursor: 'pointer',
            textDecoration: 'none',
            fontWeight: '500'
        },

        // Analysis View (During Analysis)
        analysisContainer: {
            background: 'linear-gradient(145deg, #16161a 0%, #1a1a1f 100%)',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 32px 80px -24px rgba(0,0,0,0.7)',
            maxWidth: '800px',
            margin: '0 auto',
            border: '1px solid rgba(255,255,255,0.03)'
        },
        imagePreviewWrapper: {
            position: 'relative',
            padding: '40px',
            background: '#0d0d10',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px'
        },
        imagePreview: {
            maxWidth: '100%',
            maxHeight: '500px',
            objectFit: 'contain',
            borderRadius: '16px',
            boxShadow: '0 20px 60px -20px rgba(0,0,0,0.5)'
        },

        // Analysis Overlay
        analysisOverlay: {
            position: 'absolute',
            bottom: '32px',
            background: 'rgba(18, 18, 22, 0.85)',
            backdropFilter: 'blur(16px)',
            borderRadius: '16px',
            padding: '16px 32px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 8px 32px -8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.05)'
        },
        pulseIndicator: {
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: '#6ba3ff',
            boxShadow: '0 0 12px rgba(107, 163, 255, 0.6)',
            animation: 'pulse 2s ease-in-out infinite'
        },
        analysisText: {
            color: '#f0f0f4',
            fontSize: '14px',
            fontWeight: '500',
            margin: 0,
            letterSpacing: '0.01em'
        },
        analysisSubtext: {
            color: '#888890',
            fontSize: '11px',
            margin: '2px 0 0 0',
            fontWeight: '400'
        },

        // Results View
        resultContainer: {
            padding: '40px 48px', // More internal spacing
            opacity: showResult ? 1 : 0,
            transform: showResult ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
        },
        resultHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '40px',
            borderBottom: '1px solid rgba(255,255,255,0.03)',
            paddingBottom: '32px'
        },
        verdictGroup: {
            textAlign: 'left'
        },
        resultBadge: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 20px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: '600',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            marginBottom: '16px'
        },
        realBadge: {
            background: 'rgba(52, 211, 153, 0.1)',
            color: '#34d399',
            border: '1px solid rgba(52, 211, 153, 0.15)'
        },
        fakeBadge: {
            background: 'rgba(251, 146, 60, 0.1)',
            color: '#fb923c',
            border: '1px solid rgba(251, 146, 60, 0.15)'
        },
        predictionTitle: {
            color: '#ffffff',
            fontSize: '28px',
            fontWeight: '600',
            margin: 0,
            letterSpacing: '-0.02em',
            lineHeight: 1.2
        },
        confidenceGroup: {
            textAlign: 'right'
        },
        confidenceLabel: {
            color: '#6b6b78',
            fontSize: '11px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '8px',
            fontWeight: '500'
        },
        confidenceValue: {
            color: '#e0e0e8',
            fontSize: '36px',
            fontWeight: '600',
            margin: 0,
            letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #fff 0%, #a0a0aa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block'
        },
        xaiContainer: {
            background: '#121216',
            borderRadius: '20px',
            padding: '32px',
            border: '1px solid rgba(255,255,255,0.03)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)'
        },
        xaiHeader: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px'
        },
        xaiIcon: {
            width: '24px',
            height: '24px',
            color: '#6ba3ff',
            opacity: 0.8
        },
        xaiTitleText: {
            color: '#c0c0c8',
            fontSize: '16px',
            fontWeight: '500',
            margin: 0
        },
        xaiImage: {
            width: '100%',
            borderRadius: '12px',
            display: 'block',
            boxShadow: '0 8px 24px -8px rgba(0,0,0,0.4)'
        },
        xaiExplanation: {
            marginTop: '24px',
            paddingTop: '24px',
            borderTop: '1px solid rgba(255,255,255,0.04)',
            color: '#90909a',
            fontSize: '14px',
            lineHeight: '1.6',
            textAlign: 'center'
        },
        resetLink: {
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            padding: '10px 20px',
            color: '#a0a0ab',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        },
        errorMessage: {
            textAlign: 'center',
            marginTop: '24px',
            padding: '16px 24px',
            background: 'rgba(239, 68, 68, 0.08)',
            borderRadius: '12px',
            color: 'rgba(248, 113, 113, 0.9)',
            fontSize: '14px'
        },
        // Advanced Analysis Styles
        advancedContainer: {
            marginBottom: '32px',
            padding: '24px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
        },
        advancedTitle: {
            color: '#e0e0e8',
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
        },
        probRow: {
            marginBottom: '16px'
        },
        probLabel: {
            display: 'flex',
            justifyContent: 'space-between',
            color: '#a0a0ab',
            fontSize: '13px',
            marginBottom: '8px',
            fontWeight: '500'
        },
        progressBarTrack: {
            width: '100%',
            height: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '4px',
            overflow: 'hidden'
        },

        // Large Reset Button
        resetButtonLarge: {
            marginTop: '32px',
            width: '100%',
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            color: '#e0e0e8',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
        }
    };

    return (
        <div style={styles.container}>
            {/* Minimal Sticky Nav */}
            <nav style={styles.nav}>
                <div style={styles.logo}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                    }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <span>VeriAI</span>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={() => navigate('/history')}
                        style={styles.resetLink}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
                            e.currentTarget.style.color = '#ffffff';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                            e.currentTarget.style.color = '#a0a0ab';
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        History
                    </button>

                    <button
                        onClick={handleLogout}
                        style={styles.resetLink}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
                            e.currentTarget.style.color = '#ffffff';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                            e.currentTarget.style.color = '#a0a0ab';
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Logout
                    </button>
                </div>
            </nav>

            <div style={styles.mainContent}>

                {/* Upload Zone */}
                {!preview && (
                    <div style={styles.uploadCard}>
                        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                            <h1 style={{ color: '#ffffff', fontSize: '32px', fontWeight: 'bold', marginBottom: '12px', letterSpacing: '-0.02em' }}>Detect AI-Generated Images</h1>
                            <p style={{ color: '#888890', fontSize: '16px' }}>Upload an image to check authenticity using our advanced CNN + XAI model</p>
                        </div>
                        <div
                            style={styles.uploadZone}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onClick={handleBrowse}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 32px 90px -24px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 24px 80px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)';
                            }}
                        >
                            <div style={styles.uploadIcon}>
                                <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <p style={styles.uploadText}>
                                Drop image here or <span style={styles.browseLink}>browse</span>
                            </p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleInputChange}
                                style={{ display: 'none' }}
                            />
                        </div>

                        {/* Workflow Section */}
                        <div style={{
                            marginTop: '60px',
                            background: 'linear-gradient(145deg, #16161a 0%, #1a1a1f 100%)',
                            borderRadius: '20px',
                            padding: '40px 48px',
                            border: '1px solid rgba(255,255,255,0.05)',
                            boxShadow: '0 16px 48px -12px rgba(0,0,0,0.5)',
                            maxWidth: '900px',
                            width: 'calc(100vw - 80px)',
                            marginLeft: 'auto',
                            marginRight: 'auto',
                            position: 'relative',
                            left: '50%',
                            transform: 'translateX(-50%)'
                        }}>
                            <h3 style={{
                                color: '#ffffff',
                                fontSize: '18px',
                                fontWeight: '600',
                                marginBottom: '28px',
                                textAlign: 'center',
                                letterSpacing: '-0.01em'
                            }}>
                                How It Works
                            </h3>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4, 1fr)',
                                gap: '16px'
                            }}>
                                {/* Step 1 */}
                                <div style={{
                                    background: '#121216',
                                    borderRadius: '14px',
                                    padding: '20px',
                                    border: '1px solid rgba(255,255,255,0.04)',
                                    textAlign: 'center',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        background: 'linear-gradient(135deg, rgba(107, 163, 255, 0.15) 0%, rgba(107, 163, 255, 0.05) 100%)',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 14px',
                                        color: '#6ba3ff'
                                    }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <div style={{
                                        color: '#6ba3ff',
                                        fontSize: '11px',
                                        fontWeight: '600',
                                        letterSpacing: '0.08em',
                                        marginBottom: '6px',
                                        textTransform: 'uppercase'
                                    }}>Step 1</div>
                                    <div style={{
                                        color: '#e0e0e8',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        marginBottom: '6px'
                                    }}>Upload Image</div>
                                    <div style={{
                                        color: '#70707a',
                                        fontSize: '12px',
                                        lineHeight: '1.5'
                                    }}>Drag & drop or browse to select an image for analysis</div>
                                </div>

                                {/* Step 2 */}
                                <div style={{
                                    background: '#121216',
                                    borderRadius: '14px',
                                    padding: '20px',
                                    border: '1px solid rgba(255,255,255,0.04)',
                                    textAlign: 'center',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        background: 'linear-gradient(135deg, rgba(107, 163, 255, 0.15) 0%, rgba(107, 163, 255, 0.05) 100%)',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 14px',
                                        color: '#6ba3ff'
                                    }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <div style={{
                                        color: '#6ba3ff',
                                        fontSize: '11px',
                                        fontWeight: '600',
                                        letterSpacing: '0.08em',
                                        marginBottom: '6px',
                                        textTransform: 'uppercase'
                                    }}>Step 2</div>
                                    <div style={{
                                        color: '#e0e0e8',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        marginBottom: '6px'
                                    }}>CNN Analysis</div>
                                    <div style={{
                                        color: '#70707a',
                                        fontSize: '12px',
                                        lineHeight: '1.5'
                                    }}>Deep learning model extracts features & patterns</div>
                                </div>

                                {/* Step 3 */}
                                <div style={{
                                    background: '#121216',
                                    borderRadius: '14px',
                                    padding: '20px',
                                    border: '1px solid rgba(255,255,255,0.04)',
                                    textAlign: 'center',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        background: 'linear-gradient(135deg, rgba(107, 163, 255, 0.15) 0%, rgba(107, 163, 255, 0.05) 100%)',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 14px',
                                        color: '#6ba3ff'
                                    }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <div style={{
                                        color: '#6ba3ff',
                                        fontSize: '11px',
                                        fontWeight: '600',
                                        letterSpacing: '0.08em',
                                        marginBottom: '6px',
                                        textTransform: 'uppercase'
                                    }}>Step 3</div>
                                    <div style={{
                                        color: '#e0e0e8',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        marginBottom: '6px'
                                    }}>XAI Interpretation</div>
                                    <div style={{
                                        color: '#70707a',
                                        fontSize: '12px',
                                        lineHeight: '1.5'
                                    }}>LIME highlights key regions influencing the decision</div>
                                </div>

                                {/* Step 4 */}
                                <div style={{
                                    background: '#121216',
                                    borderRadius: '14px',
                                    padding: '20px',
                                    border: '1px solid rgba(255,255,255,0.04)',
                                    textAlign: 'center',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        background: 'linear-gradient(135deg, rgba(107, 163, 255, 0.15) 0%, rgba(107, 163, 255, 0.05) 100%)',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 14px',
                                        color: '#6ba3ff'
                                    }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <div style={{
                                        color: '#6ba3ff',
                                        fontSize: '11px',
                                        fontWeight: '600',
                                        letterSpacing: '0.08em',
                                        marginBottom: '6px',
                                        textTransform: 'uppercase'
                                    }}>Step 4</div>
                                    <div style={{
                                        color: '#e0e0e8',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        marginBottom: '6px'
                                    }}>View Results</div>
                                    <div style={{
                                        color: '#70707a',
                                        fontSize: '12px',
                                        lineHeight: '1.5'
                                    }}>Get prediction with confidence score & visual explanation</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Analysis & Results */}
                {preview && (
                    <div style={styles.analysisContainer}>
                        {/* Image Preview Area */}
                        <div style={styles.imagePreviewWrapper}>
                            <img
                                src={preview}
                                alt="Analysis Target"
                                style={styles.imagePreview}
                            />

                            {/* Remove Image Button */}
                            <button
                                onClick={handleReset}
                                style={{
                                    position: 'absolute',
                                    top: '20px',
                                    right: '20px',
                                    background: 'rgba(0, 0, 0, 0.6)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: '#fff',
                                    transition: 'background 0.2s',
                                    zIndex: 10
                                }}
                                onMouseEnter={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.8)'}
                                onMouseLeave={(e) => e.target.style.background = 'rgba(0, 0, 0, 0.6)'}
                                title="Remove image"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ pointerEvents: 'none' }}>
                                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>

                            {/* Animated Analysis Overlay */}
                            {loading && (
                                <div style={styles.analysisOverlay}>
                                    <div style={styles.pulseIndicator} />
                                    <div>
                                        <p style={styles.analysisText}>
                                            {analysisStage === 'processing' && 'Analyzing image structure...'}
                                            {analysisStage === 'generating' && 'Running XAI interpretation...'}
                                            {analysisStage === 'complete' && 'Finalizing results...'}
                                        </p>
                                        <p style={styles.analysisSubtext}>
                                            Using CNN Model & LIME
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Results Panel */}
                        {result && (
                            <div style={styles.resultContainer}>
                                {/* Header with Verdict and Confidence */}
                                <div style={styles.resultHeader}>
                                    <div style={styles.verdictGroup}>
                                        <div style={{
                                            ...styles.resultBadge,
                                            ...(result.isReal ? styles.realBadge : styles.fakeBadge)
                                        }}>
                                            {result.isReal ? (
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            ) : (
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                            {result.isReal ? 'Authentic' : 'AI-Generated'}
                                        </div>
                                        <h2 style={styles.predictionTitle}>
                                            {result.isReal ? 'Likely Real Image' : 'Likely AI-Generated'}
                                        </h2>
                                    </div>

                                    <div style={styles.confidenceGroup}>
                                        <p style={styles.confidenceLabel}>Confidence Score</p>
                                        <p style={styles.confidenceValue}>{result.confidence?.toFixed(1)}%</p>
                                    </div>
                                </div>

                                {/* Advanced Analysis Section */}
                                <div style={styles.advancedContainer}>
                                    <div style={styles.advancedTitle}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6ba3ff" strokeWidth="2">
                                            <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        Advanced Analysis
                                    </div>

                                    {/* Artificial Probability */}
                                    <div style={styles.probRow}>
                                        <div style={styles.probLabel}>
                                            <span>Artificial / CMD Probability</span>
                                            <span style={{ color: '#fb923c' }}>{(result.fake_prob || 0).toFixed(1)}%</span>
                                        </div>
                                        <div style={styles.progressBarTrack}>
                                            <div style={{
                                                width: `${result.fake_prob || 0}%`,
                                                height: '100%',
                                                background: '#fb923c',
                                                borderRadius: '4px',
                                                transition: 'width 1s ease-out'
                                            }} />
                                        </div>
                                    </div>

                                    {/* Real Probability */}
                                    <div style={{ ...styles.probRow, marginBottom: 0 }}>
                                        <div style={styles.probLabel}>
                                            <span>Authentic / Real Probability</span>
                                            <span style={{ color: '#34d399' }}>{(result.real_prob || 0).toFixed(1)}%</span>
                                        </div>
                                        <div style={styles.progressBarTrack}>
                                            <div style={{
                                                width: `${result.real_prob || 0}%`,
                                                height: '100%',
                                                background: '#34d399',
                                                borderRadius: '4px',
                                                transition: 'width 1s ease-out'
                                            }} />
                                        </div>
                                    </div>

                                    <p style={{ marginTop: '20px', fontSize: '12px', color: '#70707a', lineHeight: '1.5' }}>
                                        * Probabilities indicate the model's confidence distribution. The dominant class determines the final verdict. Analysis considers frequency patterns, noise distribution, and compression artifacts.
                                    </p>
                                </div>

                                {/* XAI Output */}
                                {result.image && (
                                    <div style={styles.xaiContainer}>
                                        <div style={styles.xaiHeader}>
                                            <div style={styles.xaiIcon}>
                                                <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                            <h3 style={styles.xaiTitleText}>Visual Explanation (XAI)</h3>
                                        </div>

                                        <img
                                            src={`data:image/png;base64,${result.image}`}
                                            alt="XAI LIME Visualization"
                                            style={styles.xaiImage}
                                        />

                                        <p style={styles.xaiExplanation}>
                                            {result.explanation || (result.isReal
                                                ? "The model identified consistent high-frequency texture details and natural lighting physics, which are strong indicators of a camera-captured image."
                                                : "The model detected tell-tale signs of synthesis, such as unnatural smoothness, lack of fine grain, or structural inconsistencies common in generative models."
                                            )}
                                        </p>
                                    </div>
                                )}

                                {/* Start New Analysis Button */}
                                <button
                                    onClick={handleReset}
                                    style={styles.resetButtonLarge}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    Start New Analysis
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div style={styles.errorMessage}>
                        {error}
                    </div>
                )}
            </div>

            {/* CSS Animations */}
            <style>{`
                @keyframes pulse {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(107, 163, 255, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(107, 163, 255, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(107, 163, 255, 0); }
                }
            `}</style>
        </div >
    );
}
