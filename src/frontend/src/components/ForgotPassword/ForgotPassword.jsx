import React, { useState } from 'react';
import axios from 'axios';
import './ForgotPassword.css';

const ForgotPassword = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: nhập email, 2: nhập OTP và password mới
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Vui lòng nhập email');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Email không hợp lệ');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await axios.post('http://localhost:3001/api/auth/forgot-password', {
        email
      });

      if (response.data.success) {
        setMessage(response.data.message);
        setStep(2); // Chuyển sang bước nhập OTP
      } else {
        setError(response.data.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      setError(
        error.response?.data?.message || 
        'Có lỗi xảy ra khi gửi OTP. Vui lòng thử lại.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!otp || !newPassword || !confirmPassword) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await axios.post('http://localhost:3001/api/auth/reset-password', {
        email,
        otp,
        newPassword
      });

      if (response.data.success) {
        setMessage(response.data.message);
        setTimeout(() => {
          onSuccess && onSuccess('Mật khẩu đã được đổi thành công!');
          onClose && onClose();
        }, 2000);
      } else {
        setError(response.data.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      setError(
        error.response?.data?.message || 
        'Có lỗi xảy ra khi đổi mật khẩu. Vui lòng thử lại.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBackToStep1 = () => {
    setStep(1);
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setMessage('');
  };

  return (
    <div className="forgot-password-overlay">
      <div className="forgot-password-modal">
        <div className="forgot-password-header">
          <h2>
            {step === 1 ? '🔐 Quên mật khẩu' : '🔑 Nhập mã OTP'}
          </h2>
          <button 
            className="close-btn"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <div className="forgot-password-content">
          {step === 1 ? (
            // Bước 1: Nhập email
            <form onSubmit={handleSendOTP}>
              <div className="step-info">
                <p>Nhập địa chỉ email của bạn để nhận mã OTP khôi phục mật khẩu.</p>
              </div>

              <div className="form-group">
                <label htmlFor="email">📧 Địa chỉ email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập email của bạn"
                  disabled={loading}
                  required
                />
              </div>

              {error && (
                <div className="error-message">
                  <span>⚠️ {error}</span>
                </div>
              )}

              {message && (
                <div className="success-message">
                  <span>✅ {message}</span>
                </div>
              )}

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="loading-spinner"></span>
                      Đang gửi...
                    </>
                  ) : (
                    'Gửi mã OTP'
                  )}
                </button>
              </div>
            </form>
          ) : (
            // Bước 2: Nhập OTP và mật khẩu mới
            <form onSubmit={handleResetPassword}>
              <div className="step-info">
                <p>
                  Mã OTP đã được gửi đến <strong>{email}</strong>. 
                  Vui lòng kiểm tra hộp thư của bạn.
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="otp">🔢 Mã OTP (6 chữ số)</label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Nhập mã OTP"
                  disabled={loading}
                  maxLength="6"
                  required
                />
                <small>Mã OTP có hiệu lực trong 5 phút</small>
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">🔒 Mật khẩu mới</label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới"
                  disabled={loading}
                  minLength="6"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">🔒 Xác nhận mật khẩu</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  disabled={loading}
                  minLength="6"
                  required
                />
              </div>

              {error && (
                <div className="error-message">
                  <span>⚠️ {error}</span>
                </div>
              )}

              {message && (
                <div className="success-message">
                  <span>✅ {message}</span>
                </div>
              )}

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={handleBackToStep1}
                  disabled={loading}
                >
                  ← Quay lại
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="loading-spinner"></span>
                      Đang đổi mật khẩu...
                    </>
                  ) : (
                    'Đổi mật khẩu'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
