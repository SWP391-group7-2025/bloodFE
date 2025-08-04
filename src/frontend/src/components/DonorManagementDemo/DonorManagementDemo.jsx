import React, { useState } from 'react';
import BloodAdditionDashboard from '../BloodAdditionDashboard/BloodAdditionDashboard';
import './DonorManagementDemo.css';

const DonorManagementDemo = () => {
  const [showBloodDashboard, setShowBloodDashboard] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [message, setMessage] = useState('');

  // Dữ liệu demo
  const [donors, setDonors] = useState([
    {
      donor_id: 1,
      full_name: 'Nguyễn Văn A',
      email: 'nguyenvana@email.com',
      blood_type: 'A',
      rh_factor: '+',
      donation_status: 'scheduled',
      last_donation_date: '2024-01-15'
    },
    {
      donor_id: 2,
      full_name: 'Trần Thị B',
      email: 'tranthib@email.com',
      blood_type: 'O',
      rh_factor: '+',
      donation_status: 'donated',
      last_donation_date: '2024-07-01'
    },
    {
      donor_id: 3,
      full_name: 'Lê Văn C',
      email: 'levanc@email.com',
      blood_type: 'B',
      rh_factor: '-',
      donation_status: 'donated',
      last_donation_date: '2024-06-20'
    }
  ]);

  const handleCompleteDonation = (donorId) => {
    // Cập nhật trạng thái donor thành "donated"
    setDonors(prevDonors => 
      prevDonors.map(donor => 
        donor.donor_id === donorId 
          ? { ...donor, donation_status: 'donated', last_donation_date: new Date().toISOString().split('T')[0] }
          : donor
      )
    );
    
    setMessage('Cập nhật trạng thái thành công! Bây giờ có thể thêm máu vào kho.');
    
    // Tự động mở dashboard
    setTimeout(() => {
      setSelectedDonor(donorId);
      setShowBloodDashboard(true);
    }, 1000);
  };

  const handleOpenBloodDashboard = (donorId) => {
    setSelectedDonor(donorId);
    setShowBloodDashboard(true);
  };

  const handleCloseBloodDashboard = () => {
    setShowBloodDashboard(false);
    setSelectedDonor(null);
  };

  const handleBloodAdditionSuccess = (successMessage) => {
    setMessage(successMessage);
    setTimeout(() => setMessage(''), 5000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return '#ffc107';
      case 'donated': return '#28a745';
      case 'cancelled': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'scheduled': return 'Đã lên lịch';
      case 'donated': return 'Đã hiến';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  return (
    <div className="donor-management-demo">
      <div className="demo-header">
        <h2>🩸 Demo: Quản lý người hiến máu</h2>
        <div className="demo-instructions">
          <h3>Hướng dẫn sử dụng:</h3>
          <ul>
            <li>✅ <strong>Nút "Hoàn thành hiến máu"</strong>: Hiển thị khi trạng thái là "Đã lên lịch"</li>
            <li>✅ <strong>Nút "Thêm máu vào kho"</strong>: Hiển thị khi trạng thái là "Đã hiến"</li>
            <li>✅ Click vào các nút để thấy dashboard thêm máu</li>
          </ul>
        </div>
        {message && (
          <div className={`demo-message ${message.includes('lỗi') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}
      </div>

      <div className="demo-table-container">
        <table className="demo-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Họ tên</th>
              <th>Email</th>
              <th>Nhóm máu</th>
              <th>Trạng thái</th>
              <th>Lần hiến cuối</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {donors.map(donor => (
              <tr key={donor.donor_id}>
                <td>{donor.donor_id}</td>
                <td>{donor.full_name}</td>
                <td>{donor.email}</td>
                <td>{donor.blood_type}{donor.rh_factor}</td>
                <td>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(donor.donation_status) }}
                  >
                    {getStatusText(donor.donation_status)}
                  </span>
                </td>
                <td>
                  {donor.last_donation_date 
                    ? new Date(donor.last_donation_date).toLocaleDateString('vi-VN')
                    : 'Chưa hiến lần nào'
                  }
                </td>
                <td>
                  <div className="action-buttons">
                    {donor.donation_status === 'scheduled' && (
                      <button
                        className="complete-btn"
                        onClick={() => handleCompleteDonation(donor.donor_id)}
                      >
                        🎯 Hoàn thành hiến máu
                      </button>
                    )}
                    
                    {donor.donation_status === 'donated' && (
                      <button
                        className="add-blood-btn"
                        onClick={() => handleOpenBloodDashboard(donor.donor_id)}
                      >
                        🩸 Thêm máu vào kho
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showBloodDashboard && selectedDonor && (
        <BloodAdditionDashboard
          donorId={selectedDonor}
          onClose={handleCloseBloodDashboard}
          onSuccess={handleBloodAdditionSuccess}
        />
      )}
    </div>
  );
};

export default DonorManagementDemo;
