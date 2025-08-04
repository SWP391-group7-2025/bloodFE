import React, { useEffect, useState } from 'react';
import axios from 'axios';
import BloodAdditionDashboard from '../../../components/BloodAdditionDashboard/BloodAdditionDashboard';
import OnSiteDonation from '../../../components/OnSiteDonation/OnSiteDonation';
import './QuanLyHienMau.css';

function hasPermission(requiredType) {
  const allowed = JSON.parse(localStorage.getItem('allowedTaskTypes') || '[]');
  console.log('allowedTaskTypes from localStorage:', allowed);
  console.log('Checking permission for:', requiredType);
  
  // Map blood_collection to QuanLyHienMau permission
  if (requiredType === 'QuanLyHienMau') {
    const hasPermission = allowed.includes('blood_collection');
    console.log('Has QuanLyHienMau permission:', hasPermission);
    return hasPermission;
  }
  return allowed.includes(requiredType);
}

// Component hiển thị thông báo không có quyền
function NoPermissionMessage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '60vh',
      textAlign: 'center',
      padding: '20px'
    }}>
      <div style={{
        fontSize: '64px',
        marginBottom: '20px'
      }}>🚫</div>
      <h2 style={{
        color: '#dc3545',
        marginBottom: '10px'
      }}>Không có quyền truy cập</h2>
      <p style={{
        color: '#666',
        fontSize: '16px',
        maxWidth: '500px',
        lineHeight: '1.6'
      }}>
        Bạn không có quyền truy cập trang quản lý hiến máu. 
        Trang này chỉ dành cho nhân viên được phân công công việc quản lý hiến máu và thu thập máu.
      </p>
      <p style={{
        color: '#888',
        fontSize: '14px',
        marginTop: '10px'
      }}>
        Vui lòng liên hệ admin để được cấp quyền truy cập.
      </p>
    </div>
  );
}

function QuanLyHienMau() {
  const [donationDates, setDonationDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [donors, setDonors] = useState([]);

  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    blood_group_id: ''
  });
  const [editFormErrors, setEditFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State cho Blood Addition Dashboard
  const [showBloodDashboard, setShowBloodDashboard] = useState(false);
  const [selectedDonorForBlood, setSelectedDonorForBlood] = useState(null);
  const [bloodMessage, setBloodMessage] = useState('');

  // State cho tabs
  const [activeTab, setActiveTab] = useState('appointments'); // 'appointments' hoặc 'on-site'

  const bloodGroups = [
    { id: 1, label: 'A+' }, { id: 2, label: 'A-' },
    { id: 3, label: 'B+' }, { id: 4, label: 'B-' },
    { id: 5, label: 'AB+' }, { id: 6, label: 'AB-' },
    { id: 7, label: 'O+' }, { id: 8, label: 'O-' }
  ];

  // Check permission - if no permission, show message
  if (!hasPermission('QuanLyHienMau')) {
    return <NoPermissionMessage />;
  }

  useEffect(() => {
    console.log('QuanLyHienMau component mounted');
    console.log('Permission granted, fetching data...');
    fetchDonationDates();
  }, []);

  const fetchDonationDates = async () => {
    console.log('Fetching donation dates...');
    try {
      const res = await axios.get('http://localhost:3001/api/appointments/donation-dates');
      const data = res.data;
      console.log('API Response:', data);
      setDonationDates(Array.isArray(data) ? data.sort((a, b) => new Date(a.donation_date) - new Date(b.donation_date)) : []);
    } catch (err) {
      console.error('Lỗi lấy danh sách ngày hiến máu:', err);
      console.error('Error details:', err.response?.data, err.response?.status);
    }
  };

  const handleViewDonors = async (date) => {
    // Check permission before viewing donors
    if (!hasPermission('QuanLyHienMau')) {
      return;
    }

    try {
      const res = await axios.get(`http://localhost:3001/api/appointments/donors-by-date/${date}`);
      setSelectedDate(date);
      setDonors(res.data);
    } catch (err) {
      console.error('Lỗi lấy người hiến máu:', err);
      setDonors([]);
    }
  };

  const handleBack = () => {
    setSelectedDate(null);
    setDonors([]);
  };

  const openEditModal = (donor) => {
    setSelectedDonor(donor);
    setEditForm({
      full_name: donor.full_name || '',
      email: donor.email || '',
      phone: donor.phone || '',
      address: donor.address || '',
      blood_group_id: donor.blood_group_id || ''
    });
    setEditFormErrors({});
    setShowEditModal(true);
  };

  const validateEditForm = () => {
    const errors = {};
    
    if (!editForm.full_name?.trim()) errors.full_name = 'Họ tên là bắt buộc';
    if (!editForm.email?.trim()) errors.email = 'Email là bắt buộc';
    if (!editForm.phone?.trim()) errors.phone = 'Số điện thoại là bắt buộc';
    if (!editForm.address?.trim()) errors.address = 'Địa chỉ là bắt buộc';
    if (!editForm.blood_group_id) errors.blood_group_id = 'Nhóm máu là bắt buộc';

    setEditFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const submitEditDonor = async () => {
    if (!validateEditForm()) {
      return;
    }
    
    if (!hasPermission('QuanLyHienMau')) {
      return;
    }

    setIsSubmitting(true);

    try {
      await axios.put(`http://localhost:3001/api/donors/${selectedDonor.donor_id}`, editForm);
      // Refresh donor list
      if (selectedDate) {
        handleViewDonors(selectedDate);
      }
      setShowEditModal(false);
    } catch (err) {
      console.error('Lỗi cập nhật thông tin:', err);
      alert('Lỗi cập nhật thông tin: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Functions cho Blood Addition Dashboard
  const handleCloseBloodDashboard = () => {
    setShowBloodDashboard(false);
    setSelectedDonorForBlood(null);
  };

  const handleBloodAdditionSuccess = (successMessage) => {
    setBloodMessage(successMessage);
    // Refresh donor list
    if (selectedDate) {
      handleViewDonors(selectedDate);
    }
    setTimeout(() => setBloodMessage(''), 5000);
  };

  const handleCompleteDonation = async (donorId) => {
    // Không cần cập nhật trạng thái ngay - sẽ được xử lý trong BloodAdditionDashboard
    // Tự động mở dashboard để thêm máu
    setSelectedDonorForBlood(donorId);
    setShowBloodDashboard(true);
    setBloodMessage('Vui lòng chọn thành phần máu và dung tích để hoàn thành hiến máu.');
  };

  return (
    <div className="container">
      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'appointments' ? 'active' : ''}`}
          onClick={() => setActiveTab('appointments')}
        >
          📅 Quản lý lịch hẹn hiến máu
        </button>
        <button 
          className={`tab-button ${activeTab === 'on-site' ? 'active' : ''}`}
          onClick={() => setActiveTab('on-site')}
        >
          🩸 Hiến máu tại chỗ
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'appointments' && (
        <div className="tab-content">
          {!selectedDate ? (
            <>
              <h2>Danh sách các ngày có lịch hiến máu</h2>
              <table className="appointment-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Ngày hiến máu</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {donationDates
                    .filter(item => {
                      // Lấy ngày hiện tại (bỏ phần giờ phút giây)
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const itemDate = new Date(item.donation_date);
                      itemDate.setHours(0, 0, 0, 0);
                      return itemDate > today;
                    })
                    .map((item, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{item.donation_date?.slice(0, 10)}</td>
                        <td>
                          <button className="btn-view" onClick={() => handleViewDonors(item.donation_date)}>Xem</button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </>
          ) : (
            <>
              <h2>Người hiến máu ngày {new Date(selectedDate).toLocaleDateString('vi-VN')}</h2>
              <button className="btn-back" onClick={handleBack}>Quay lại</button>
              
              <div className="donor-table-wrapper">
                <table className="donor-table">
                  <thead>
                    <tr>
                      <th>Tên</th>
                      <th>Email</th> 
                      <th>Điện thoại</th>
                      <th>Địa chỉ</th>
                      <th>Nhóm máu</th>
                      <th>Ngày hiến gần nhất</th>
                      <th>Trạng thái hiến máu</th>
                      <th>Giờ hẹn</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donors.map((donor, index) => (
                      <tr key={index}>
                        <td>{donor.full_name}</td>
                        <td>{donor.email}</td>
                        <td>{donor.phone}</td>
                        <td>{donor.address}</td>
                        <td>{donor.blood_group}</td>
                        <td>{donor.last_donation_date}</td>
                        <td>{donor.donation_status === 'donated' ? 'Đã hiến' : 'Chưa hiến'}</td>
                        <td>{donor.appointment_time} - {donor.appointment_time_end}</td>
                        <td>
                          <div className="action-buttons">
                            {/* Nút hoàn thành hiến máu cho donor có trạng thái 'scheduled' */}
                            {donor.donation_status === 'scheduled' && (
                              <button 
                                className="btn-complete-donation"
                                onClick={() => handleCompleteDonation(donor.donor_id)}
                              >
                                🎯 Hoàn thành hiến máu
                              </button>
                            )}
                            
                            {/* Chỉ hiển thị "Đã hoàn thành" cho những người đã hiến máu */}
                            {donor.donation_status === 'donated' && (
                              <span className="completed-status" style={{color: '#4caf50', fontWeight: 'bold'}}>
                                ✅ Đã hoàn thành
                              </span>
                            )}
                            
                            {/* Nút sửa thông tin (luôn hiển thị) */}
                            <button onClick={() => openEditModal(donor)}>Sửa thông tin</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* On-site Donation Tab */}
      {activeTab === 'on-site' && (
        <div className="tab-content">
          <OnSiteDonation />
        </div>
      )}

      {/* Modal cập nhật thông tin người hiến máu */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Cập nhật thông tin người hiến máu</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label>Họ tên: <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))}
                  style={{ borderColor: editFormErrors.full_name ? 'red' : '#ddd' }}
                />
                {editFormErrors.full_name && <span style={{ color: 'red', fontSize: '12px' }}>{editFormErrors.full_name}</span>}
              </div>

              <div>
                <label>Email: <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                  style={{ borderColor: editFormErrors.email ? 'red' : '#ddd' }}
                />
                {editFormErrors.email && <span style={{ color: 'red', fontSize: '12px' }}>{editFormErrors.email}</span>}
              </div>

              <div>
                <label>Số điện thoại: <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                  style={{ borderColor: editFormErrors.phone ? 'red' : '#ddd' }}
                />
                {editFormErrors.phone && <span style={{ color: 'red', fontSize: '12px' }}>{editFormErrors.phone}</span>}
              </div>

              <div>
                <label>Địa chỉ: <span style={{ color: 'red' }}>*</span></label>
                <textarea
                  value={editForm.address}
                  onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))}
                  style={{ borderColor: editFormErrors.address ? 'red' : '#ddd' }}
                  rows={3}
                />
                {editFormErrors.address && <span style={{ color: 'red', fontSize: '12px' }}>{editFormErrors.address}</span>}
              </div>

              <div>
                <label>Nhóm máu: <span style={{ color: 'red' }}>*</span></label>
                <select
                  value={editForm.blood_group_id}
                  onChange={e => setEditForm(f => ({ ...f, blood_group_id: e.target.value }))}
                  style={{ borderColor: editFormErrors.blood_group_id ? 'red' : '#ddd' }}
                >
                  <option value="">Chọn nhóm máu</option>
                  {bloodGroups.map(group => (
                    <option key={group.id} value={group.id}>{group.label}</option>
                  ))}
                </select>
                {editFormErrors.blood_group_id && <span style={{ color: 'red', fontSize: '12px' }}>{editFormErrors.blood_group_id}</span>}
              </div>
            </div>
            
            <div style={{ marginTop: 16 }}>
              <button
                onClick={submitEditDonor}
                style={{ background: isSubmitting ? '#ccc' : '#f44336', color: 'white' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật'}
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                style={{ marginLeft: 8, background: '#ccc' }}
                disabled={isSubmitting}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Blood Addition Dashboard */}
      {showBloodDashboard && (
        <BloodAdditionDashboard
          donorId={selectedDonorForBlood}
          onClose={handleCloseBloodDashboard}
          onSuccess={handleBloodAdditionSuccess}
        />
      )}

      {/* Message after blood addition */}
      {bloodMessage && (
        <div className="blood-message" style={{ marginTop: 16, color: 'green' }}>
          {bloodMessage}
        </div>
      )}
    </div>
  );
}

export default QuanLyHienMau;
