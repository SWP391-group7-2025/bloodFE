import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './ProfilePage.module.css';

axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    axios.get('/api/auth/me')
      .then(res => {
        setProfile(res.data);
        setForm({
          full_name: res.data.full_name || '',
          email: res.data.email || '',
          phone: res.data.phone || '',
          gender: res.data.gender || '',
          date_of_birth: res.data.date_of_birth ? res.data.date_of_birth.slice(0, 10) : '',
          address: res.data.address || '',
          distance_km: res.data.distance_km || '',
        });
        setLoading(false);
      })
      .catch(err => {
        setError('Không thể tải thông tin cá nhân.');
        setLoading(false);
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Khi nhấn Lưu, chỉ hiện modal xác nhận
  const handleSave = (e) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  // Khi xác nhận chắc chắn mới thực hiện lưu
  const handleConfirmSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await axios.put('/api/auth/me/update', form);
      setSuccess('Cập nhật thành công!');
      setEditMode(false);
      setProfile((prev) => ({ ...prev, ...form }));
      setShowConfirmModal(false);
    } catch (err) {
      setError('Cập nhật thất bại.');
      setShowConfirmModal(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className={styles.loading}>Đang tải thông tin cá nhân...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!profile) return null;

  return (
    <section className={styles.profileContainer}>
      <h2 className={styles.title}>Thông tin cá nhân</h2>
      {success && <div className={styles.success}>{success}</div>}
      {editMode ? (
        <form className={styles.infoGroup} onSubmit={handleSave}>
          <label>
            <strong>Họ tên:</strong>
            <input name="full_name" value={form.full_name} onChange={handleChange} required />
          </label>
          <label>
            <strong>Email:</strong>
            <input name="email" value={form.email} onChange={handleChange} type="email" required />
          </label>
          <label>
            <strong>Số điện thoại:</strong>
            <input name="phone" value={form.phone} onChange={handleChange} required />
          </label>
          <label>
            <strong>Giới tính:</strong>
            <select name="gender" value={form.gender} onChange={handleChange} required>
              <option value="">--Chọn--</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </select>
          </label>
          <label>
            <strong>Ngày sinh:</strong>
            <input name="date_of_birth" value={form.date_of_birth} onChange={handleChange} type="date" required />
          </label>
          <label>
            <strong>Địa chỉ:</strong>
            <input name="address" value={form.address} onChange={handleChange} required />
          </label>
          <label>
            <strong>Khoảng cách (km):</strong>
            <input 
              name="distance_km" 
              value={form.distance_km} 
              onChange={handleChange} 
              type="number" 
              step="0.1" 
              min="0" 
              placeholder="Khoảng cách đến trung tâm hiến máu"
            />
          </label>
          <div style={{display:'flex', gap:12}}>
            <button type="submit" className={styles.saveBtn} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</button>
            <button type="button" className={styles.cancelBtn} onClick={() => { setEditMode(false); setForm(profile); }}>Huỷ</button>
          </div>
        </form>
      ) : (
        <div className={styles.infoGroup}>
          <div className={styles.infoGrid}>
            <div><strong>Họ tên:</strong> {profile.full_name}</div>
            <div><strong>Email:</strong> {profile.email}</div>
            <div><strong>Số điện thoại:</strong> {profile.phone}</div>
            <div><strong>Giới tính:</strong> {profile.gender === 'male' ? 'Nam' : profile.gender === 'female' ? 'Nữ' : 'Khác'}</div>
            <div><strong>Ngày sinh:</strong> {profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString('vi-VN') : ''}</div>
            <div><strong>Địa chỉ:</strong> {profile.address}</div>
            <div><strong>Khoảng cách:</strong> {profile.distance_km ? `${profile.distance_km} km` : 'Chưa cập nhật'}</div>
          </div>
          <button className={styles.editBtn} onClick={() => setEditMode(true)}>✏️ Sửa thông tin</button>
        </div>
      )}

      {/* Modal xác nhận lưu thay đổi */}
      {showConfirmModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <div className={styles.modalTitle}>Bạn có chắc muốn lưu thay đổi thông tin?</div>
            <div className={styles.modalActions}>
              <button className={styles.modalConfirmBtn} onClick={handleConfirmSave} disabled={saving}>
                {saving ? 'Đang lưu...' : 'Chắc chắn'}
              </button>
              <button className={styles.modalCancelBtn} onClick={() => setShowConfirmModal(false)} disabled={saving}>
                Huỷ
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
