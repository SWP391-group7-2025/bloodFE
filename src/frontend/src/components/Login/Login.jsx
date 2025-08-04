import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaLock } from 'react-icons/fa';
import { jwtDecode } from 'jwt-decode';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import ForgotPassword from '../ForgotPassword/ForgotPassword';
import styles from './Login.module.css';

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        // Lưu token vào localStorage
        localStorage.setItem('token', data.token);

        // Decode token để lấy thông tin người dùng
        const decoded = jwtDecode(data.token);


        // Gửi thông tin user lên App
        onLoginSuccess({
          username,
          role: decoded.role,
          userId: decoded.userId,
          full_name: decoded.full_name,  // đây phải đúng trường tên đầy đủ
        });

        showSuccessToast('Đăng nhập thành công!');

        // Kiểm tra xem có URL redirect được lưu không
        const redirectUrl = localStorage.getItem('redirectAfterLogin');
        if (redirectUrl) {
          localStorage.removeItem('redirectAfterLogin');
          setTimeout(() => navigate(redirectUrl), 1000);
        } else {
          setTimeout(() => navigate('/'), 1000);
        }
      } else {
        showErrorToast(data.message || 'Đăng nhập thất bại!');
      }
    } catch (error) {
      console.error('Lỗi khi gửi yêu cầu:', error);
      showErrorToast('Không thể kết nối đến server!');
    }
  };

  return (
    <div className={styles['login-container']}>
      <form className={styles['login-form']} onSubmit={handleSubmit}>
        <h2>Đăng nhập</h2>

        <div className={styles['form-group']}>
          <label>Tên đăng nhập:</label>
          <div className={styles['input-wrapper']}>
            <FaUser className={styles['input-icon']} />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Nhập tên đăng nhập"
            />
          </div>
        </div>

        <div className={styles['form-group']}>
          <label>Mật khẩu:</label>
          <div className={styles['input-wrapper']}>
            <FaLock className={styles['input-icon']} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Nhập mật khẩu"
            />
          </div>
        </div>

        <button className={styles['btn-login']} type="submit">Đăng nhập</button>

        <div className={styles['forgot-password-link']}>
          <button
            type="button"
            className={styles['link-button']}
            onClick={() => setShowForgotPassword(true)}
          >
            Quên mật khẩu?
          </button>
        </div>
      </form>

      {showForgotPassword && (
        <ForgotPassword
          onClose={() => setShowForgotPassword(false)}
          onSuccess={(message) => {
            showSuccessToast(message);
            setShowForgotPassword(false);
          }}
        />
      )}
    </div>
  );
}

export default Login;
