import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaVenusMars, 
  FaCalendar, 
  FaHome, 
  FaPlus, 
  FaSearch,
  FaTint,
  FaHeartbeat,
  FaHospital,
  FaUserInjured
} from 'react-icons/fa';
import styles from './PartnerEmergencyRequest.module.css';

const PartnerEmergencyRequest = () => {
  const [formData, setFormData] = useState({
    full_name: '',           // Họ tên bệnh nhân cần máu
    email: '',               // Email liên hệ
    phone: '',               // SĐT liên hệ
    gender: '',              // Giới tính bệnh nhân
    birth_day: '',           // Ngày sinh (1-31)
    birth_month: '',         // Tháng sinh (1-12)
    birth_year: '',          // Năm sinh
    address: '',             // Địa chỉ bệnh nhân
    blood_group_id: '',      // ID nhóm máu cần (A+, B-, O+, AB-, ...)
    component_id: '',        // ID loại máu cần (toàn phần, hồng cầu, tiểu cầu, plasma)
    request_date: ''         // Ngày cần máu khẩn cấp (deadline)
  });

  const [bloodGroups, setBloodGroups] = useState([]);
  const [components, setComponents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const token = localStorage.getItem('token');

  // Format blood type display - Backend đã trả về tiếng Việt rồi, chỉ cần fallback
  const formatBloodType = (bloodType, rhFactor) => {
    // Nếu backend đã trả về "Chưa biết nhóm máu" thì dùng luôn
    if (bloodType === 'Chưa biết nhóm máu') {
      return bloodType;
    }
    // Fallback cho trường hợp backend chưa cập nhật
    if (bloodType === 'U' && rhFactor === '?') {
      return 'Chưa biết nhóm máu';
    }
    return `${bloodType}${rhFactor}`;
  };

  // Fetch initial data
  useEffect(() => {
    console.log('Component mounted, fetching initial data...');
    fetchBloodGroups();
    fetchComponents();
    
    // Check if editing mode from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    if (editId) {
      fetchRequestForEdit(editId);
    }
  }, []);

  // Debug: Log state changes
  useEffect(() => {
    console.log('Blood groups state updated:', bloodGroups);
  }, [bloodGroups]);

  useEffect(() => {
    console.log('Components state updated:', components);
  }, [components]);

  const fetchBloodGroups = async () => {
    try {
      console.log('Fetching blood groups...');
      const response = await fetch('http://localhost:3001/api/partner/blood-groups', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('Blood groups response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Blood groups data:', data);
        setBloodGroups(data);
      } else {
        console.error('Failed to fetch blood groups:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching blood groups:', error);
    }
  };

  const fetchComponents = async () => {
    try {
      console.log('Fetching components...');
      const response = await fetch('http://localhost:3001/api/partner/components', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('Components response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Components data:', data);
        setComponents(data);
      } else {
        console.error('Failed to fetch components:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching components:', error);
    }
  };

  const fetchMyRequests = async () => {
    // This function is no longer needed in this component
    // Requests will be shown in PartnerHistory component
  };

  const fetchRequestForEdit = async (requestId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/partner/my-requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const request = data.find(r => r.partner_req_id == requestId);
        if (request && request.status === 'pending') {
          // Parse date_of_birth thành các field riêng biệt
          const birthDate = new Date(request.date_of_birth);
          
          setFormData({
            full_name: request.full_name,
            email: request.email,
            phone: request.phone,
            gender: request.gender || '',
            birth_day: birthDate.getDate().toString(),
            birth_month: (birthDate.getMonth() + 1).toString(),
            birth_year: birthDate.getFullYear().toString(),
            address: request.address,
            blood_group_id: request.blood_group_id,
            component_id: request.component_id,
            request_date: request.request_date ? request.request_date.split('T')[0] : ''
          });
          setEditingId(requestId);
        }
      }
    } catch (error) {
      console.error('Error fetching request for edit:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Validate birth date
  const validateBirthDate = () => {
    if (!formData.birth_day || !formData.birth_month || !formData.birth_year) {
      return { isValid: false, error: 'Vui lòng chọn đầy đủ ngày, tháng, năm sinh' };
    }

    const day = parseInt(formData.birth_day);
    const month = parseInt(formData.birth_month);
    const year = parseInt(formData.birth_year);

    // Check if date is valid
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return { isValid: false, error: 'Ngày sinh không hợp lệ' };
    }

    // Check if date is not in the future
    if (date > new Date()) {
      return { isValid: false, error: 'Ngày sinh không thể trong tương lai' };
    }

    // Check reasonable age limits (0-120 years old)
    const age = new Date().getFullYear() - year;
    if (age < 0 || age > 120) {
      return { isValid: false, error: 'Tuổi không hợp lệ (0-120 tuổi)' };
    }

    return { isValid: true, error: null };
  };

  // Validate Vietnamese name
  const validateVietnameseName = (name) => {
    if (!name || name.trim().length < 2) {
      return { isValid: false, error: 'Tên phải có ít nhất 2 ký tự' };
    }
    
    // Cho phép chữ cái tiếng Việt, khoảng trắng và dấu
    const vietnameseNameRegex = /^[a-zA-ZàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ\s]+$/;
    
    if (!vietnameseNameRegex.test(name)) {
      return { isValid: false, error: 'Tên chỉ được chứa chữ cái tiếng Việt và khoảng trắng' };
    }
    
    // Kiểm tra không có số hoặc ký tự đặc biệt
    if (/[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(name)) {
      return { isValid: false, error: 'Tên không được chứa số hoặc ký tự đặc biệt' };
    }
    
    return { isValid: true };
  };

  // Validate Vietnamese address
  const validateVietnameseAddress = (address) => {
    if (!address || address.trim().length < 10) {
      return { isValid: false, error: 'Địa chỉ phải có ít nhất 10 ký tự' };
    }
    
    // Cho phép chữ cái tiếng Việt, số, khoảng trắng và một số ký tự đặc biệt thông dụng
    const vietnameseAddressRegex = /^[a-zA-Z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ\s,./\-]+$/;
    
    if (!vietnameseAddressRegex.test(address)) {
      return { isValid: false, error: 'Địa chỉ chứa ký tự không hợp lệ' };
    }
    
    return { isValid: true };
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      gender: '',
      birth_day: '',
      birth_month: '',
      birth_year: '',
      address: '',
      blood_group_id: '',
      component_id: '',
      request_date: ''
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate Vietnamese name
      const nameValidation = validateVietnameseName(formData.full_name);
      if (!nameValidation.isValid) {
        toast.error(nameValidation.error);
        setIsLoading(false);
        return;
      }

      // Validate Vietnamese address
      const addressValidation = validateVietnameseAddress(formData.address);
      if (!addressValidation.isValid) {
        toast.error(addressValidation.error);
        setIsLoading(false);
        return;
      }

      // Validate birth date
      const birthDateValidation = validateBirthDate();
      if (!birthDateValidation.isValid) {
        toast.error(birthDateValidation.error);
        setIsLoading(false);
        return;
      }

      // Tạo date_of_birth từ các field riêng biệt
      const date_of_birth = `${formData.birth_year}-${formData.birth_month.padStart(2, '0')}-${formData.birth_day.padStart(2, '0')}`;
      
      const submitData = {
        ...formData,
        date_of_birth
      };
      
      // Xóa các field không cần thiết
      delete submitData.birth_day;
      delete submitData.birth_month;
      delete submitData.birth_year;
      
      console.log('Submitting form data:', submitData);
      console.log('Full name being sent:', submitData.full_name);
      console.log('Full name type:', typeof submitData.full_name);
      
      const url = editingId 
        ? `http://localhost:3001/api/partner/request/${editingId}`
        : 'http://localhost:3001/api/partner/emergency-request';
      
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(submitData, null, 2)
      });

      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        toast.success(editingId ? 'Cập nhật yêu cầu thành công!' : 'Tạo yêu cầu khẩn cấp thành công!');
        resetForm();
        // Redirect to history page after successful submission
        setTimeout(() => {
          window.location.href = '/partner/history';
        }, 1500);
      } else {
        console.error('Error response:', response.status, data);
        toast.error(data.error || data.details || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Network error:', error);
      toast.error('Lỗi kết nối: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (request) => {
    // This function is handled in PartnerHistory component
  };

  const handleDelete = async (id) => {
    // This function is handled in PartnerHistory component
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <FaHospital />
        </div>
        <h1>Đăng Ký Nhận Máu Khẩn Cấp</h1>
        <p>Tạo yêu cầu nhận máu khẩn cấp cho bệnh nhân cần được cứu chữa</p>
      </div>

      {/* Form */}
      <div className={styles.formSection}>
        <div className={styles.formHeader}>
          <FaUserInjured className={styles.formIcon} />
          <h2>{editingId ? 'Chỉnh Sửa Yêu Cầu' : 'Tạo Yêu Cầu Mới'}</h2>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGrid}>
            <div className={styles.inputGroup}>
              <label className={styles.fieldLabel}>
                <FaUser className={styles.fieldIcon} />
                Họ và tên bệnh nhân
              </label>
              <input
                type="text"
                name="full_name"
                placeholder="Nhập họ tên đầy đủ của bệnh nhân"
                value={formData.full_name}
                onChange={handleInputChange}
                className={styles.inputField}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.fieldLabel}>
                <FaEnvelope className={styles.fieldIcon} />
                Email liên hệ
              </label>
              <input
                type="email"
                name="email"
                placeholder="Email để liên hệ khẩn cấp"
                value={formData.email}
                onChange={handleInputChange}
                className={styles.inputField}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.fieldLabel}>
                <FaPhone className={styles.fieldIcon} />
                Số điện thoại liên hệ
              </label>
              <input
                type="tel"
                name="phone"
                placeholder="SĐT để liên hệ khẩn cấp"
                value={formData.phone}
                onChange={handleInputChange}
                className={styles.inputField}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.fieldLabel}>
                <FaVenusMars className={styles.fieldIcon} />
                Giới tính bệnh nhân
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className={styles.selectField}
                required
              >
                <option value="">-- Chọn giới tính của bệnh nhân --</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.fieldLabel}>
                <FaCalendar className={styles.fieldIcon} />
                Ngày sinh bệnh nhân
                <span className={styles.helperText}>(Chọn ngày, tháng, năm sinh)</span>
              </label>
              <div className={styles.dateInputGroup}>
                <select
                  name="birth_day"
                  value={formData.birth_day}
                  onChange={handleInputChange}
                  required
                  className={styles.dateSelect}
                  title="Chọn ngày sinh"
                >
                  <option value="">-- Ngày --</option>
                  {Array.from({length: 31}, (_, i) => i + 1).map(day => (
                    <option key={day} value={day}>
                      {day < 10 ? `0${day}` : day}
                    </option>
                  ))}
                </select>
                
                <select
                  name="birth_month"
                  value={formData.birth_month}
                  onChange={handleInputChange}
                  required
                  className={styles.dateSelect}
                  title="Chọn tháng sinh"
                >
                  <option value="">-- Tháng --</option>
                  {[
                    { value: 1, label: 'T1' },
                    { value: 2, label: 'T2' },
                    { value: 3, label: 'T3' },
                    { value: 4, label: 'T4' },
                    { value: 5, label: 'T5' },
                    { value: 6, label: 'T6' },
                    { value: 7, label: 'T7' },
                    { value: 8, label: 'T8' },
                    { value: 9, label: 'T9' },
                    { value: 10, label: 'T10' },
                    { value: 11, label: 'T11' },
                    { value: 12, label: 'T12' }
                  ].map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
                
                <select
                  name="birth_year"
                  value={formData.birth_year}
                  onChange={handleInputChange}
                  required
                  className={styles.dateSelect}
                  title="Chọn năm sinh"
                >
                  <option value="">-- Năm --</option>
                  {/* Show recent years first for common ages */}
                  <optgroup label="🎯 Tuổi thường gặp (18-60 tuổi)">
                    {Array.from({length: 43}, (_, i) => {
                      const year = new Date().getFullYear() - 18 - i; // 18 to 60 years old
                      return (
                        <option key={year} value={year}>
                          {year} ({new Date().getFullYear() - year} tuổi)
                        </option>
                      );
                    })}
                  </optgroup>
                  <optgroup label="👶 Trẻ em và thanh thiếu niên">
                    {Array.from({length: 18}, (_, i) => {
                      const year = new Date().getFullYear() - i; // 0 to 17 years old
                      return (
                        <option key={year} value={year}>
                          {year} ({new Date().getFullYear() - year} tuổi)
                        </option>
                      );
                    })}
                  </optgroup>
                  <optgroup label="👴 Người cao tuổi">
                    {Array.from({length: 39}, (_, i) => {
                      const year = new Date().getFullYear() - 61 - i; // 61+ years old
                      return (
                        <option key={year} value={year}>
                          {year} ({new Date().getFullYear() - year} tuổi)
                        </option>
                      );
                    })}
                  </optgroup>
                </select>
              </div>
              {(formData.birth_day && formData.birth_month && formData.birth_year) && (
                <div className={styles.datePreview}>
                  <small>
                    📅 Ngày sinh: {formData.birth_day}/{formData.birth_month}/{formData.birth_year}
                    {(() => {
                      const birthDate = new Date(formData.birth_year, formData.birth_month - 1, formData.birth_day);
                      const today = new Date();
                      const age = today.getFullYear() - birthDate.getFullYear();
                      const monthDiff = today.getMonth() - birthDate.getMonth();
                      const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
                      return ` (${actualAge} tuổi)`;
                    })()}
                  </small>
                </div>
              )}
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.fieldLabel}>
                <FaCalendar className={styles.fieldIcon} />
                Ngày cần máu khẩn cấp
                <span className={styles.helperText}>(Chọn ngày cần nhận máu)</span>
              </label>
              <input
                type="date"
                name="request_date"
                value={formData.request_date}
                onChange={handleInputChange}
                className={styles.inputField}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.fieldLabel}>
                <FaTint className={styles.fieldIcon} />
                Nhóm máu cần tìm
              </label>
              <select
                name="blood_group_id"
                value={formData.blood_group_id}
                onChange={handleInputChange}
                className={styles.selectField}
                required
              >
                <option value="">-- Chọn nhóm máu bệnh nhân --</option>
                {bloodGroups.map(group => (
                  <option key={group.blood_group_id} value={group.blood_group_id}>
                    {formatBloodType(group.blood_type, group.rh_factor)}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.fieldLabel}>
                <FaHeartbeat className={styles.fieldIcon} />
                Loại máu cần
              </label>
              <select
                name="component_id"
                value={formData.component_id}
                onChange={handleInputChange}
                className={styles.selectField}
                required
              >
                <option value="">-- Chọn thành phần máu cần --</option>
                {components.map(component => (
                  <option key={component.component_id} value={component.component_id}>
                    {component.component_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.fieldLabel}>
              <FaHome className={styles.fieldIcon} />
              Địa chỉ bệnh nhân
            </label>
            <textarea
              name="address"
              placeholder="Địa chỉ chi tiết của bệnh nhân (để giao máu)"
              value={formData.address}
              onChange={handleInputChange}
              rows="3"
              className={styles.textareaField}
              required
            ></textarea>
          </div>

          <div className={styles.buttonGroup}>
            <button type="submit" disabled={isLoading} className={styles.submitBtn}>
              <FaPlus className={styles.btnIcon} />
              {editingId ? 'Cập Nhật Yêu Cầu' : 'Tạo Yêu Cầu Khẩn Cấp'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className={styles.cancelBtn}>
                Hủy Chỉnh Sửa
              </button>
            )}
            <button 
              type="button" 
              onClick={() => window.location.href = '/partner/history'}
              className={styles.historyBtn}
            >
              <FaSearch className={styles.btnIcon} />
              Xem Lịch Sử
            </button>
          </div>
        </form>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default PartnerEmergencyRequest;
