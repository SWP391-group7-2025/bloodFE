import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import { FaUser, FaEnvelope, FaPhone, FaLock, FaHome, FaCalendar, FaVenusMars, FaUserTag, FaMapMarkerAlt } from 'react-icons/fa';
import styles from './Register.module.css';

const Register = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    phone: '',
    password: '',
    gender: '',
    date_of_birth: '',
    address: '',
    role: 'member', // Default to member
    distance_km: ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'username':
        if (!value) error = 'Tên đăng nhập không được để trống';
        else if (value.length < 4) error = 'Ít nhất 4 ký tự';
        break;
      case 'full_name':
        if (!value) error = 'Họ tên không được để trống';
        break;
      case 'email':
        if (!value) error = 'Email không được để trống';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Email không hợp lệ';
        break;
      case 'phone':
        if (!value) error = 'Số điện thoại không được để trống';
        else if (!/^(84|0[3|5|7|8|9])+([0-9]{8})$/.test(value)) error = 'Số điện thoại không hợp lệ';
        break;
      case 'password':
        if (!value) error = 'Mật khẩu không được để trống';
        else if (value.length < 6) error = 'Ít nhất 6 ký tự';
        break;
      case 'gender':
        if (!value) error = 'Vui lòng chọn giới tính';
        break;
      case 'role':
        if (!value) error = 'Vui lòng chọn vai trò';
        break;
      case 'distance_km':
        if (formData.role === 'partner' && !value) error = 'Khoảng cách là bắt buộc đối với đối tác';
        else if (value && (isNaN(value) || value < 0)) error = 'Khoảng cách phải là số dương';
        break;
      default:
        break;
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({ ...prev, [name]: validateField(name, formData[name]) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const newErrors = {};
    Object.keys(formData).forEach(key => {
      // Skip validation for optional fields
      if (key === 'distance_km') return; // distance_km is optional for all users
      if (key === 'gender' && formData.role === 'partner') return; // Gender optional for partners
      if (key === 'date_of_birth' && formData.role === 'partner') return; // DOB optional for partners

      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        // Prepare data for submission
        const submitData = { ...formData };

        // Convert distance_km to number if provided
        if (submitData.distance_km) {
          submitData.distance_km = parseFloat(submitData.distance_km);
        } else {
          delete submitData.distance_km; // Remove empty distance_km
        }

        // Remove empty optional fields for partners
        if (formData.role === 'partner') {
          if (!submitData.gender) delete submitData.gender;
          if (!submitData.date_of_birth) delete submitData.date_of_birth;
        }

        const response = await axios.post('http://localhost:3001/api/auth/register', submitData);
        if (response.status === 201) {
          showSuccessToast('🎉 Đăng ký thành công! Email chào mừng sẽ được gửi đến hộp thư của bạn.', {
            autoClose: 5000
          });
          // Chờ 2 giây để người dùng đọc thông báo trước khi chuyển trang
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        } else {
          showErrorToast('Đăng ký thất bại!');
        }
      } catch (err) {
        showErrorToast(err.response?.data?.message || 'Đã xảy ra lỗi!');
      } finally {
        setIsLoading(false);
      }
    } else {
      showErrorToast('Vui lòng kiểm tra lại thông tin!');
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className={styles.registerContainer}>
        <form onSubmit={handleSubmit} className={styles.registerForm}>
          <h2 className={styles.title}>Đăng Ký Tài Khoản</h2>

          {/* Role Selection */}
          <div className={styles.formGroup}>
            <div className={styles.inputWithIcon}>
              <FaUserTag className={styles.icon} />
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${styles.input} ${touched.role && errors.role ? styles.error : ''}`}
              >
                <option value="member">Thành viên (Người hiến/nhận máu)</option>
                <option value="partner">Đối tác (Bệnh viện/Phòng khám)</option>
              </select>
            </div>
            {touched.role && errors.role && <span className={styles.errorMessage}>{errors.role}</span>}
          </div>

          <InputField icon={<FaUser />} name="username" value={formData.username} onChange={handleChange} onBlur={handleBlur} error={errors.username} placeholder="Tên đăng nhập" touched={touched.username} />
          <InputField icon={<FaUser />} name="full_name" value={formData.full_name} onChange={handleChange} onBlur={handleBlur} error={errors.full_name} placeholder="Họ và tên" touched={touched.full_name} />
          <InputField icon={<FaEnvelope />} name="email" type="email" value={formData.email} onChange={handleChange} onBlur={handleBlur} error={errors.email} placeholder="Email" touched={touched.email} />
          <InputField icon={<FaPhone />} name="phone" value={formData.phone} onChange={handleChange} onBlur={handleBlur} error={errors.phone} placeholder="Số điện thoại" touched={touched.phone} />
          <InputField icon={<FaLock />} name="password" type="password" value={formData.password} onChange={handleChange} onBlur={handleBlur} error={errors.password} placeholder="Mật khẩu" touched={touched.password} />

          {/* Gender Select - Optional for partners */}
          <div className={styles.formGroup}>
            <div className={styles.inputWithIcon}>
              <FaVenusMars className={styles.icon} />
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${styles.input} ${touched.gender && errors.gender ? styles.error : ''}`}
              >
                <option value="">-- Chọn giới tính {formData.role === 'partner' ? '(Tùy chọn)' : ''} --</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>
            {touched.gender && errors.gender && <span className={styles.errorMessage}>{errors.gender}</span>}
          </div>

          <InputField
            icon={<FaCalendar />}
            name="date_of_birth"
            type="date"
            value={formData.date_of_birth}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={formData.role === 'partner' ? 'Ngày sinh (Tùy chọn)' : 'Ngày sinh'}
            error={errors.date_of_birth}
            touched={touched.date_of_birth}
          />

          <InputField icon={<FaHome />} name="address" value={formData.address} onChange={handleChange} onBlur={handleBlur} error={errors.address} placeholder="Địa chỉ" touched={touched.address} />

          {/* Distance field - For all users */}
          <InputField
            icon={<FaMapMarkerAlt />}
            name="distance_km"
            type="number"
            step="0.1"
            value={formData.distance_km}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.distance_km}
            placeholder="Khoảng cách đến trung tâm máu (km) - Tùy chọn"
            touched={touched.distance_km}
          />

          <div className={styles.buttonGroup}>
            <button type="submit" className={styles.registerButton} disabled={isLoading}>
              {isLoading ? 'Đang xử lý...' : 'Đăng Ký'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

const InputField = ({ icon, name, value, onChange, onBlur, placeholder, type = 'text', error, touched, step }) => (
  <div className={styles.formGroup}>
    <div className={styles.inputWithIcon}>
      {icon}
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        step={step}
        className={`${styles.input} ${touched && error ? styles.error : ''}`}
      />
    </div>
    {touched && error && <span className={styles.errorMessage}>{error}</span>}
  </div>
);

export default Register;
