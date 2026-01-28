import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState(null);
    const [isButtonHovered, setIsButtonHovered] = useState(false);
    const [isButtonPressed, setIsButtonPressed] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
            const response = await axios.post(`${apiUrl}/login`, {
                username,
                password,
            });
            if (response.data.success) {
                navigate('/dashboard');
            } else {
                setError('Invalid credentials');
            }
        } catch (err) {
            if (err.response && err.response.status === 401) {
                setError('Invalid username or password');
            } else if (err.code === 'ERR_NETWORK') {
                setError('Cannot connect to server. Please ensure backend is running.');
            } else {
                setError('Login failed. Please try again.');
                console.error('Login error:', err);
            }
        } finally {
            setLoading(false);
        }
    };

    // Button dynamic styles
    const getButtonStyle = () => {
        const baseStyle = {
            width: '100%',
            padding: '18px 20px',
            background: '#4f8fff',
            border: 'none',
            borderRadius: '12px',
            color: '#ffffff',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            boxShadow: '0 4px 24px -4px rgba(79, 143, 255, 0.4)',
            transform: 'translateY(0) scale(1)'
        };

        if (loading) {
            return {
                ...baseStyle,
                background: '#3b6fd9',
                cursor: 'not-allowed',
                opacity: 0.7,
                boxShadow: 'none'
            };
        }

        if (isButtonPressed) {
            return {
                ...baseStyle,
                transform: 'translateY(1px) scale(0.98)',
                boxShadow: '0 2px 12px -2px rgba(79, 143, 255, 0.3)'
            };
        }

        if (isButtonHovered) {
            return {
                ...baseStyle,
                background: '#5a9aff',
                transform: 'translateY(-2px) scale(1.01)',
                boxShadow: '0 8px 32px -4px rgba(79, 143, 255, 0.5)'
            };
        }

        return baseStyle;
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                background: 'linear-gradient(145deg, #08080a 0%, #0f0f12 50%, #08080a 100%)'
            }}
        >
            {/* Login Card */}
            <div
                style={{
                    width: '100%',
                    maxWidth: '460px',
                    background: 'linear-gradient(165deg, #1a1a20 0%, #141418 100%)',
                    borderRadius: '24px',
                    padding: '48px 44px',
                    boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.03), 0 24px 80px -16px rgba(0, 0, 0, 0.8), 0 0 60px -20px rgba(79, 143, 255, 0.06)'
                }}
            >
                {/* Product Branding */}
                <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                    <p
                        style={{
                            color: '#d0d0d8',
                            fontSize: '36px',
                            fontWeight: '600',
                            letterSpacing: '-0.01em',
                            margin: 0,
                            lineHeight: '1.4'
                        }}
                    >
                        Veri<span style={{ color: '#6ba3ff' }}>AI</span>
                    </p>
                    <p
                        style={{
                            color: 'rgba(148, 148, 160, 0.4)',
                            fontSize: '13px',
                            fontWeight: '400',
                            letterSpacing: '0.08em',
                            margin: '10px 0 0 0',
                            textTransform: 'uppercase'
                        }}
                    >
                        AI Image Authentication
                    </p>
                </div>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <p
                        style={{
                            color: 'rgba(140, 140, 152, 0.45)',
                            fontSize: '10px',
                            fontWeight: '500',
                            letterSpacing: '0.3em',
                            textTransform: 'uppercase',
                            marginBottom: '12px'
                        }}
                    >
                        Welcome Back
                    </p>
                    <h1
                        style={{
                            color: '#eaeaef',
                            fontSize: '22px',
                            fontWeight: '600',
                            letterSpacing: '-0.02em',
                            margin: 0,
                            lineHeight: '1.3'
                        }}
                    >
                        Log into your account
                    </h1>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Email/Username Field */}
                    <div style={{ marginBottom: '24px' }}>
                        <label
                            style={{
                                display: 'block',
                                color: 'rgba(160, 160, 172, 0.65)',
                                fontSize: '13px',
                                fontWeight: '400',
                                marginBottom: '10px',
                                letterSpacing: '0.02em'
                            }}
                        >
                            Email or Username
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            onFocus={() => setFocusedField('username')}
                            onBlur={() => setFocusedField(null)}
                            placeholder="Enter your email or username"
                            required
                            style={{
                                width: '100%',
                                padding: '16px 18px',
                                background: focusedField === 'username' ? '#222228' : '#1c1c22',
                                border: 'none',
                                borderRadius: '12px',
                                color: '#f0f0f4',
                                fontSize: '15px',
                                outline: 'none',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: focusedField === 'username'
                                    ? '0 0 0 2px rgba(79, 143, 255, 0.35), 0 0 24px -4px rgba(79, 143, 255, 0.15)'
                                    : 'inset 0 1px 2px rgba(0, 0, 0, 0.1), 0 1px 0 rgba(255, 255, 255, 0.02)',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    {/* Password Field */}
                    <div style={{ marginBottom: '32px' }}>
                        <label
                            style={{
                                display: 'block',
                                color: 'rgba(160, 160, 172, 0.65)',
                                fontSize: '13px',
                                fontWeight: '400',
                                marginBottom: '10px',
                                letterSpacing: '0.02em'
                            }}
                        >
                            Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField(null)}
                                placeholder="Enter your password"
                                required
                                style={{
                                    width: '100%',
                                    padding: '16px 52px 16px 18px',
                                    background: focusedField === 'password' ? '#222228' : '#1c1c22',
                                    border: 'none',
                                    borderRadius: '12px',
                                    color: '#f0f0f4',
                                    fontSize: '15px',
                                    outline: 'none',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: focusedField === 'password'
                                        ? '0 0 0 2px rgba(79, 143, 255, 0.35), 0 0 24px -4px rgba(79, 143, 255, 0.15)'
                                        : 'inset 0 1px 2px rgba(0, 0, 0, 0.1), 0 1px 0 rgba(255, 255, 255, 0.02)',
                                    boxSizing: 'border-box'
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '16px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    padding: '4px',
                                    cursor: 'pointer',
                                    color: '#5a5a68',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'color 0.2s ease',
                                    opacity: 0.7
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = '#8888a0'; e.currentTarget.style.opacity = '1'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = '#5a5a68'; e.currentTarget.style.opacity = '0.7'; }}
                            >
                                {showPassword ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                    </svg>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div
                            style={{
                                padding: '14px 18px',
                                background: 'rgba(239, 68, 68, 0.06)',
                                borderRadius: '10px',
                                color: 'rgba(248, 113, 113, 0.85)',
                                fontSize: '13px',
                                textAlign: 'center',
                                marginBottom: '24px'
                            }}
                        >
                            {error}
                        </div>
                    )}

                    {/* Login Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        style={getButtonStyle()}
                        onMouseEnter={() => !loading && setIsButtonHovered(true)}
                        onMouseLeave={() => { setIsButtonHovered(false); setIsButtonPressed(false); }}
                        onMouseDown={() => !loading && setIsButtonPressed(true)}
                        onMouseUp={() => setIsButtonPressed(false)}
                    >
                        {loading ? (
                            <>
                                <svg
                                    style={{ animation: 'spin 1s linear infinite' }}
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                >
                                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span>Signing in...</span>
                            </>
                        ) : (
                            <span>Sign In</span>
                        )}
                    </button>
                </form>
            </div>

            {/* CSS Animation for spinner */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                input::placeholder {
                    color: rgba(100, 100, 112, 0.6) !important;
                }
            `}</style>
        </div>
    );
};

export default Login;
