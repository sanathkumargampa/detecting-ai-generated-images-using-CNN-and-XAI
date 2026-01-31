import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
    const [isRegistering, setIsRegistering] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        mobile: '' // Not used in backend yet, but per requirements
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const toggleMode = () => {
        setIsRegistering(!isRegistering);
        setIsForgotPassword(false);
        setError('');
        setFormData({
            name: '', username: '', email: '', password: '', confirmPassword: '', mobile: ''
        });
    };

    const toggleForgotPassword = () => {
        setIsForgotPassword(!isForgotPassword);
        setIsRegistering(false);
        setError('');
        setFormData({
            name: '', username: '', email: '', password: '', confirmPassword: '', mobile: ''
        });
    };

    const validate = () => {
        if (isForgotPassword) {
            if (!formData.email) return "Email is required";
            if (!formData.password) return "New password is required";
            if (formData.password.length < 6) return "Password must be at least 6 characters";
            return null;
        }
        if (!formData.password) return "Password is required";
        if (isRegistering) {
            if (!formData.name) return "Name is required";
            if (!formData.username) return "Username is required";
            if (!formData.email) return "Email is required";
            if (formData.password !== formData.confirmPassword) return "Passwords do not match";
            if (formData.password.length < 6) return "Password must be at least 6 characters";
        } else {
            if (!formData.username) return "Username or Email is required";
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const err = validate();
        if (err) {
            setError(err);
            return;
        }

        setLoading(true);
        setError('');

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
        const endpoint = isForgotPassword ? '/reset-password' : (isRegistering ? '/register' : '/login');

        try {
            const response = await axios.post(`${apiUrl}${endpoint}`, formData, { withCredentials: true });
            if (response.data.success) {
                if (isForgotPassword) {
                    setIsForgotPassword(false);
                    alert("Password reset successful! Please log in with your new password.");
                } else if (isRegistering) {
                    setIsRegistering(false);
                    alert("Registration successful! Please log in.");
                } else {
                    localStorage.setItem('token', 'true'); // Simple session marker
                    localStorage.setItem('username', response.data.username);
                    localStorage.setItem('user_id', response.data.user_id);
                    localStorage.setItem('is_superuser', response.data.is_superuser);

                    if (response.data.is_superuser) {
                        navigate('/admin');
                    } else {
                        navigate('/dashboard');
                    }
                }
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || "An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Styles (reusing some from Dashboard/Landing for consistency)
    const styles = {
        container: {
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(180deg, #0a0a0c 0%, #111114 100%)',
            fontFamily: "'Inter', sans-serif",
            color: '#e0e0e8'
        },
        card: {
            width: '100%',
            maxWidth: '420px',
            padding: '40px',
            background: '#16161a',
            borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.05)',
            boxShadow: '0 32px 80px -24px rgba(0,0,0,0.8)'
        },
        title: {
            fontSize: '24px',
            fontWeight: '600',
            marginBottom: '8px',
            textAlign: 'center',
            color: '#fff'
        },
        subtitle: {
            fontSize: '14px',
            color: '#a0a0ab',
            marginBottom: '32px',
            textAlign: 'center'
        },
        inputGroup: {
            marginBottom: '20px'
        },
        input: {
            width: '100%',
            padding: '14px 16px',
            background: '#0d0d10',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            color: '#fff',
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.2s',
            boxSizing: 'border-box' // Fix padding issue
        },
        button: {
            width: '100%',
            padding: '14px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            border: 'none',
            borderRadius: '12px',
            color: '#fff',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            marginTop: '10px',
            opacity: loading ? 0.7 : 1
        },
        toggleText: {
            marginTop: '24px',
            textAlign: 'center',
            fontSize: '14px',
            color: '#888890'
        },
        link: {
            color: '#6ba3ff',
            cursor: 'pointer',
            marginLeft: '5px',
            fontWeight: '500'
        },
        error: {
            color: '#f87171',
            fontSize: '13px',
            marginBottom: '20px',
            textAlign: 'center',
            background: 'rgba(239, 68, 68, 0.1)',
            padding: '10px',
            borderRadius: '8px'
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.title}>
                    {isForgotPassword ? 'Reset Password' : (isRegistering ? 'Create Account' : 'Welcome Back')}
                </h1>
                <p style={styles.subtitle}>
                    {isForgotPassword ? 'Enter your email and new password' : (isRegistering ? 'Join VeriAI to analyze images' : 'Log in to continue to VeriAI')}
                </p>

                {error && <div style={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    {isForgotPassword ? (
                        <div style={styles.inputGroup}>
                            <input
                                type="email"
                                name="email"
                                placeholder="Email Address"
                                value={formData.email}
                                onChange={handleChange}
                                style={styles.input}
                                required
                            />
                        </div>
                    ) : (
                        <div style={styles.inputGroup}>
                            <input
                                type="text"
                                name="username"
                                placeholder={isRegistering ? "Username" : "Username or Email"}
                                value={formData.username}
                                onChange={handleChange}
                                style={styles.input}
                                required
                            />
                        </div>
                    )}

                    {isRegistering && (
                        <>
                            <div style={styles.inputGroup}>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Full Name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    style={styles.input}
                                    required
                                />
                            </div>
                            <div style={styles.inputGroup}>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Email Address"
                                    value={formData.email}
                                    onChange={handleChange}
                                    style={styles.input}
                                    required
                                />
                            </div>
                            <div style={styles.inputGroup}>
                                <input
                                    type="text"
                                    name="mobile"
                                    placeholder="Mobile Number"
                                    value={formData.mobile}
                                    onChange={handleChange}
                                    style={styles.input}
                                // Mobile is optional in backend for now but required in UI
                                />
                            </div>
                        </>
                    )}

                    <div style={styles.inputGroup}>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                placeholder={isForgotPassword ? 'New Password' : 'Password'}
                                value={formData.password}
                                onChange={handleChange}
                                style={{ ...styles.input, paddingRight: '45px' }}
                                required
                            />
                            <span
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '14px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    cursor: 'pointer',
                                    color: '#888',
                                    fontSize: '13px',
                                    userSelect: 'none'
                                }}
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </span>
                        </div>
                    </div>

                    {isRegistering && (
                        <div style={styles.inputGroup}>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    placeholder="Confirm Password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    style={{ ...styles.input, paddingRight: '45px' }}
                                    required
                                />
                                <span
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '14px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        cursor: 'pointer',
                                        color: '#888',
                                        fontSize: '13px',
                                        userSelect: 'none'
                                    }}
                                >
                                    {showConfirmPassword ? '🙈' : '👁️'}
                                </span>
                            </div>
                        </div>
                    )}

                    <button type="submit" style={styles.button} disabled={loading}>
                        {loading ? 'Please wait...' : (isForgotPassword ? 'Reset Password' : (isRegistering ? 'Register' : 'Login'))}
                    </button>
                </form>

                {!isRegistering && !isForgotPassword && (
                    <div style={{ textAlign: 'center', marginTop: '16px' }}>
                        <span style={styles.link} onClick={toggleForgotPassword}>Forgot Password?</span>
                    </div>
                )}

                {isForgotPassword ? (
                    <div style={styles.toggleText}>
                        Remember your password?
                        <span style={styles.link} onClick={toggleForgotPassword}>Back to Login</span>
                    </div>
                ) : (
                    <div style={styles.toggleText}>
                        {isRegistering ? 'Already have an account?' : "Don't have an account?"}
                        <span style={styles.link} onClick={toggleMode}>
                            {isRegistering ? 'Login' : 'Register'}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
