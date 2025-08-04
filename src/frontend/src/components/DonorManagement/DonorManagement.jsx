import React, { useState, useEffect } from 'react';
import BloodAdditionDashboard from '../BloodAdditionDashboard/BloodAdditionDashboard';
import './DonorManagement.css';

const DonorManagement = () => {
  const [donors, setDonors] = useState([]);
  const [showBloodDashboard, setShowBloodDashboard] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchDonors();
  }, []);

  const fetchDonors = async () => {
    try {
      const response = await fetch('/api/donors');
      const data = await response.json();
      setDonors(data);
    } catch (error) {
      console.error('Error fetching donors:', error);
    }
  };

  const handleCompleteDonation = async (donorId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/donors/${donorId}/complete-donation`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Cập nhật trạng thái thành công!');
        // Refresh donor list
        fetchDonors();
        // Open blood addition dashboard
        setSelectedDonor(donorId);
        setShowBloodDashboard(true);
      } else {
        setMessage(data.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      setMessage('Lỗi khi cập nhật trạng thái');
    } finally {
      setLoading(false);
    }
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
    fetchDonors(); // Refresh donor list
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
    <div className="donor-management">
      <div className="management-header">
        <h2>Quản lý người hiến máu</h2>
        {message && (
          <div className={`message ${message.includes('lỗi') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}
      </div>

      <div className="donors-table-container">
        <table className="donors-table">
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
                        disabled={loading}
                      >
                        {loading ? 'Đang xử lý...' : 'Hoàn thành hiến máu'}
                      </button>
                    )}
                    
                    {donor.donation_status === 'donated' && (
                      <button
                        className="add-blood-btn"
                        onClick={() => handleOpenBloodDashboard(donor.donor_id)}
                      >
                        Thêm máu vào kho
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

export default DonorManagement;
