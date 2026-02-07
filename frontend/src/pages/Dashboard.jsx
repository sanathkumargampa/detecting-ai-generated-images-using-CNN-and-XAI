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
    const [showCamera, setShowCamera] = useState(false);
    const [cameraStream, setCameraStream] = useState(null);
    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
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

    // Camera functionality
    const openCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            setCameraStream(stream);
            setShowCamera(true);
            setError('');
        } catch (err) {
            setError('Unable to access camera. Please check permissions.');
        }
    };

    const closeCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
        setShowCamera(false);
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);

            canvas.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
                    closeCamera();
                    handleFileSelect(file);
                }
            }, 'image/jpeg', 0.9);
        }
    };

    // Set video stream when camera opens
    useEffect(() => {
        if (showCamera && cameraStream && videoRef.current) {
            videoRef.current.srcObject = cameraStream;
        }
    }, [showCamera, cameraStream]);

    // Keyboard shortcuts for camera (Space to capture, Escape to close)
    useEffect(() => {
        const handleCameraKeydown = (event) => {
            if (!showCamera) return;

            if (event.code === 'Space') {
                event.preventDefault();
                capturePhoto();
            } else if (event.code === 'Escape') {
                event.preventDefault();
                closeCamera();
            }
        };

        if (showCamera) {
            window.addEventListener('keydown', handleCameraKeydown);
        }

        return () => {
            window.removeEventListener('keydown', handleCameraKeydown);
        };
    }, [showCamera, cameraStream]);

    // Cleanup camera on unmount
    useEffect(() => {
        return () => {
            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [cameraStream]);

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
            padding: '24px 40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(10, 10, 12, 0.8)',
            backdropFilter: 'blur(12px)',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            borderBottom: '1px solid rgba(255,255,255,0.03)'
        },
        logo: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#fff', // Whiter text
            fontSize: '32px', // Bigger text
            fontWeight: '800', // Bolder
            letterSpacing: '-0.02em',
            cursor: 'pointer'
        },
        mainContent: {
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '120px 40px 40px', // Added top padding for fixed nav
            minHeight: '100vh',
            display: 'grid',
            gridTemplateColumns: 'minmax(400px, 1fr) 1.5fr',
            gap: '60px',
            alignItems: 'start' // Align to top for sticky behavior
        },
        leftPanel: {
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            paddingRight: '20px',
            position: 'sticky',
            top: '120px',
            height: 'fit-content'
        },
        rightPanel: {
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            padding: '20px',
            minHeight: 'calc(100vh - 160px)', // Ensure full height for centering
            justifyContent: 'center' // Default center for upload, content pushes it for results
        },

        // Workflow Steps Styles
        stepItem: {
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
        },
        stepNumber: {
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(107, 163, 255, 0.2) 0%, rgba(107, 163, 255, 0.05) 100%)',
            color: '#6ba3ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '700',
            fontSize: '14px'
        },
        stepTitle: {
            color: '#e0e0e8',
            fontSize: '15px',
            fontWeight: '600',
            margin: '0 0 4px 0'
        },
        stepDesc: {
            color: '#888890',
            fontSize: '12px',
            margin: 0
        },

        // Upload Zone (Pre-Analysis)
        uploadCard: {
            width: '100%',
            maxWidth: '750px', // Increased width
            margin: 'auto' // Vertically center in rightPanel
        },
        uploadZone: {
            background: 'linear-gradient(145deg, #18181d 0%, #1c1c22 100%)',
            borderRadius: '32px', // Slightly rounder
            padding: '100px 48px', // Increased height/padding
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 24px 80px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)',
            border: isDragging ? '2px dashed #6ba3ff' : '2px dashed rgba(255, 255, 255, 0.1)',
            background: isDragging ? 'rgba(107, 163, 255, 0.05)' : 'linear-gradient(145deg, #18181d 0%, #1c1c22 100%)'
        },
        uploadIcon: {
            width: '64px', // Larger icon
            height: '64px',
            margin: '0 auto 32px',
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
            margin: 'auto', // Vertically center
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
            textTransform: 'uppercase',
            marginBottom: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
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
            fontWeight: '700',
            margin: 0,
            letterSpacing: '-0.03em',
            background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block',
            textShadow: '0 10px 30px rgba(0,0,0,0.2)'
        },
        xaiContainer: {
            background: 'linear-gradient(180deg, rgba(255,255,255,0.01) 0%, rgba(255,255,255,0.02) 100%)',
            borderRadius: '24px',
            padding: '32px',
            border: '1px solid rgba(255,255,255,0.05)',
            boxShadow: '0 8px 32px -8px rgba(0,0,0,0.5)'
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
        navLink: {
            background: 'transparent',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            color: '#a0a0ab',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none'
        },
        navLinkActive: {
            color: '#fff',
            background: 'rgba(255,255,255,0.05)'
        },
        logoutBtn: {
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '8px',
            padding: '8px 16px',
            color: '#f87171',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginLeft: '12px'
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
            padding: '32px',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.01) 0%, rgba(255,255,255,0.03) 100%)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)'
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
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '16px',
            color: '#6ba3ff',
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
                <div style={styles.logo} onClick={() => window.location.reload()}>
                    VeriAI
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                        onClick={() => navigate('/history')}
                        style={styles.navLink}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#ffffff';
                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#a0a0ab';
                            e.currentTarget.style.background = 'transparent';
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        History
                    </button>

                    <button
                        onClick={() => navigate('/settings')}
                        style={styles.navLink}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#ffffff';
                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#a0a0ab';
                            e.currentTarget.style.background = 'transparent';
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Profile
                    </button>

                    <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)', margin: '0 12px' }}></div>

                    <button
                        onClick={handleLogout}
                        style={styles.logoutBtn}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Logout
                    </button>
                </div>
            </nav>

            <div style={styles.mainContent}>
                {/* LEFT PANEL: Static Info & Instructions */}
                <div style={styles.leftPanel}>
                    <div>
                        <h1 style={{
                            background: 'linear-gradient(135deg, #fff 0%, #a5b4fc 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontSize: '56px',
                            fontWeight: '800',
                            marginBottom: '24px',
                            letterSpacing: '-0.02em',
                            lineHeight: '1.1'
                        }}>
                            Detect AI-Generated Images
                        </h1>
                        <p style={{ color: '#94a3b8', fontSize: '18px', lineHeight: '1.6', marginBottom: '48px', maxWidth: '90%' }}>
                            Ensure authenticity with our advanced dual-layer analysis. We combine <strong>CNN Deep Learning</strong> with <strong>XAI Interpretation</strong> to reveal the truth behind every pixel.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div style={styles.stepItem}>
                                <div style={styles.stepNumber}>1</div>
                                <div>
                                    <h4 style={styles.stepTitle}>Upload Image</h4>
                                    <p style={styles.stepDesc}>Drag & drop any image format</p>
                                </div>
                            </div>
                            <div style={styles.stepItem}>
                                <div style={styles.stepNumber}>2</div>
                                <div>
                                    <h4 style={styles.stepTitle}>AI & XAI Analysis</h4>
                                    <p style={styles.stepDesc}>CNN + Visual Explanations</p>
                                </div>
                            </div>
                            <div style={styles.stepItem}>
                                <div style={styles.stepNumber}>3</div>
                                <div>
                                    <h4 style={styles.stepTitle}>Instant Results</h4>
                                    <p style={styles.stepDesc}>Get verdict with visual proof</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL */}
                <div style={styles.rightPanel}>

                    {/* Upload Zone */}
                    {!preview && (
                        <div style={styles.uploadCard}>
                            {/* Header Removed */}
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

                            {/* Camera Capture Option */}
                            <div style={{ marginTop: '24px', textAlign: 'center' }}>
                                <p style={{ color: '#6b6b78', fontSize: '13px', marginBottom: '16px' }}>or</p>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openCamera();
                                    }}
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(107, 163, 255, 0.15) 0%, rgba(107, 163, 255, 0.05) 100%)',
                                        border: '1px solid rgba(107, 163, 255, 0.3)',
                                        borderRadius: '16px',
                                        padding: '16px 32px',
                                        color: '#6ba3ff',
                                        fontSize: '15px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(107, 163, 255, 0.25) 0%, rgba(107, 163, 255, 0.1) 100%)';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(107, 163, 255, 0.15) 0%, rgba(107, 163, 255, 0.05) 100%)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
                                        <circle cx="12" cy="13" r="4" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    Capture with Camera
                                </button>
                            </div>
                        </div>
                    )}
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

                                    {/* Advanced Analysis Section */}
                                    <div style={{ ...styles.advancedContainer, marginTop: '32px' }}>
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

                                        <p style={{ marginTop: '20px', fontSize: '12px', color: '#70707a', lineHeight: '1.6' }}>
                                            {result.isReal ? (
                                                // Explanations for Real images - based on fake_prob level
                                                (result.fake_prob || 0) > 30 ? (
                                                    <span>The artificial probability suggests noticeable digital manipulation, heavy post-processing, or significant compression artifacts. The image may have undergone extensive editing while remaining authentic.</span>
                                                ) : (result.fake_prob || 0) > 15 ? (
                                                    <span>The artificial probability indicates moderate digital processing artifacts, color corrections, or filter applications commonly found in professionally edited photographs.</span>
                                                ) : (result.fake_prob || 0) > 5 ? (
                                                    <span>The artificial probability reflects minor compression signatures or subtle post-processing typical of standard photo workflows.</span>
                                                ) : (
                                                    <span>Minimal artificial signatures detected, indicating an unaltered or minimally processed authentic photograph.</span>
                                                )
                                            ) : (
                                                // Explanations for AI-Generated images - based on real_prob level
                                                (result.real_prob || 0) > 30 ? (
                                                    <span>The authentic probability suggests the AI model produced highly realistic textures and lighting. Advanced generation techniques may have been employed.</span>
                                                ) : (result.real_prob || 0) > 15 ? (
                                                    <span>The authentic probability indicates the AI model successfully replicated certain natural image characteristics such as realistic lighting or texture patterns.</span>
                                                ) : (result.real_prob || 0) > 5 ? (
                                                    <span>The authentic probability reflects some natural-looking elements, though synthetic patterns remain the dominant characteristic.</span>
                                                ) : (
                                                    <span>Very few authentic characteristics detected, indicating a clearly synthetic generation with visible artificial patterns.</span>
                                                )
                                            )}
                                        </p>
                                    </div>

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
                </div> {/* Close Right Panel */}
            </div>

            {/* Camera Modal */}
            {showCamera && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.9)',
                    zIndex: 2000,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}>
                    {/* Close Button */}
                    <button
                        onClick={closeCamera}
                        style={{
                            position: 'absolute',
                            top: '24px',
                            right: '24px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '48px',
                            height: '48px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#fff',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.6)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>

                    {/* Camera Title */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '24px'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, rgba(107, 163, 255, 0.2) 0%, rgba(107, 163, 255, 0.05) 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6ba3ff" strokeWidth="2">
                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
                                <circle cx="12" cy="13" r="4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <h2 style={{
                            color: '#fff',
                            fontSize: '22px',
                            fontWeight: '600',
                            margin: 0
                        }}>
                            Camera Capture
                        </h2>
                    </div>

                    {/* Video Preview */}
                    <div style={{
                        position: 'relative',
                        borderRadius: '24px',
                        overflow: 'hidden',
                        border: '3px solid rgba(107, 163, 255, 0.5)',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
                    }}>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            style={{
                                maxWidth: '100%',
                                maxHeight: '60vh',
                                borderRadius: '20px',
                                display: 'block'
                            }}
                        />
                    </div>

                    {/* Hidden Canvas for Capture */}
                    <canvas ref={canvasRef} style={{ display: 'none' }} />

                    {/* Capture Button */}
                    <button
                        onClick={capturePhoto}
                        style={{
                            marginTop: '32px',
                            background: 'linear-gradient(135deg, #6ba3ff 0%, #4a90ff 100%)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '72px',
                            height: '72px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#fff',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 8px 32px rgba(107, 163, 255, 0.4)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.1)';
                            e.currentTarget.style.boxShadow = '0 12px 40px rgba(107, 163, 255, 0.6)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 8px 32px rgba(107, 163, 255, 0.4)';
                        }}
                    >
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                        </svg>
                    </button>

                    <p style={{ color: '#90909a', marginTop: '16px', fontSize: '14px' }}>
                        Click the button to capture
                    </p>
                </div>
            )}

            {/* CSS Animations */}
            <style>{`
                @keyframes pulse {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(107, 163, 255, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(107, 163, 255, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(107, 163, 255, 0); }
                }
            `}</style>
        </div>
    );
}
