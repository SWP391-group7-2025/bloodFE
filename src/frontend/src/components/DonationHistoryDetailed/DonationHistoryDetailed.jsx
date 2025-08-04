import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './DonationHistoryDetailed.module.css';

// Cấu hình axios interceptor
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

const DonationHistoryDetailed = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchDonationHistory();
  }, []);

  const fetchDonationHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/donors/my/detailed-history');
      setDonations(response.data);
    } catch (err) {
      console.error('Error fetching donation history:', err);
      setError('Không thể tải lịch sử hiến máu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (donation) => {
    setSelectedDonation(donation);
    setShowModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa rõ';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Chưa rõ';
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (donation) => {
    return (
      <span 
        className={styles.statusBadge}
        style={{ 
          backgroundColor: donation.status_color,
          color: 'white'
        }}
      >
        {donation.status_icon} {donation.usage_status}
      </span>
    );
  };

  const getExpiryInfo = (donation) => {
    if (donation.is_expired) {
      return (
        <span className={styles.expiredInfo}>
          ⚠️ Đã hết hạn {Math.abs(donation.days_until_expiry)} ngày
        </span>
      );
    } else if (donation.days_until_expiry <= 7) {
      return (
        <span className={styles.expiringSoon}>
          ⏰ Còn {donation.days_until_expiry} ngày hết hạn
        </span>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Đang tải lịch sử hiến máu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>❌</div>
        <p className={styles.errorMessage}>{error}</p>
        <button className={styles.retryButton} onClick={fetchDonationHistory}>
          🔄 Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <span className={styles.titleIcon}>🩸</span>
          Lịch sử hiến máu chi tiết
        </h2>
        <p className={styles.subtitle}>
          Theo dõi hành trình máu bạn hiến và tác động của nó
        </p>
      </div>

      {donations.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🩸</div>
          <h3>Chưa có lịch sử hiến máu</h3>
          <p>Hãy đăng ký hiến máu để bắt đầu hành trình cứu người!</p>
        </div>
      ) : (
        <div className={styles.donationGrid}>
          {donations.map(donation => (
            <div key={donation.donation_id} className={styles.donationCard}>
              <div className={styles.cardHeader}>
                <div className={styles.donationDate}>
                  <span className={styles.dateIcon}>📅</span>
                  <span>{formatDate(donation.donation_date)}</span>
                </div>
                {getStatusBadge(donation)}
              </div>
              
              <div className={styles.cardBody}>
                <div className={styles.bloodInfo}>
                  <div className={styles.bloodType}>
                    <span className={styles.typeLabel}>Nhóm máu</span>
                    <span className={styles.typeValue}>{donation.blood_type}</span>
                  </div>
                  <div className={styles.component}>
                    <span className={styles.componentLabel}>Thành phần</span>
                    <span className={styles.componentValue}>{donation.component_name}</span>
                  </div>
                  <div className={styles.volume}>
                    <span className={styles.volumeLabel}>Thể tích</span>
                    <span className={styles.volumeValue}>{donation.volume_ml}ml</span>
                  </div>
                </div>
                
                <div className={styles.usageInfo}>
                  <p className={styles.usageDetail}>{donation.usage_detail}</p>
                  
                  {donation.recipient_name && (
                    <div className={styles.recipientInfo}>
                      <span className={styles.recipientIcon}>👤</span>
                      <span>Bệnh nhân: {donation.recipient_name}</span>
                      {donation.medical_info && donation.medical_info !== 'Không có thông tin bệnh lý' && (
                        <span className={styles.medicalInfo}>({donation.medical_info})</span>
                      )}
                    </div>
                  )}
                  
                  {donation.partner_organization_name && (
                    <div className={styles.partnerInfo}>
                      <span className={styles.partnerIcon}>🏥</span>
                      <span>Bệnh viện: {donation.partner_organization_name}</span>
                      {donation.partner_patient_name && (
                        <span> - BN: {donation.partner_patient_name}</span>
                      )}
                    </div>
                  )}
                  
                  {donation.issued_date && (
                    <div className={styles.issuedDate}>
                      <span className={styles.issuedIcon}>📋</span>
                      <span>Sử dụng: {formatDateTime(donation.issued_date)}</span>
                    </div>
                  )}
                  
                  {getExpiryInfo(donation)}
                </div>
              </div>
              
              <div className={styles.cardFooter}>
                <button 
                  className={styles.detailButton}
                  onClick={() => handleViewDetail(donation)}
                >
                  👁️ Xem chi tiết
                </button>
                <span className={styles.bagId}>Mã túi: #{donation.blood_bag_id}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal chi tiết */}
      {showModal && selectedDonation && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Chi tiết lần hiến máu</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Ngày hiến:</span>
                <span className={styles.detailValue}>{formatDate(selectedDonation.donation_date)}</span>
              </div>
              
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Mã túi máu:</span>
                <span className={styles.detailValue}>#{selectedDonation.blood_bag_id}</span>
              </div>
              
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Nhóm máu:</span>
                <span className={styles.detailValue}>{selectedDonation.blood_type}</span>
              </div>
              
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Thành phần:</span>
                <span className={styles.detailValue}>{selectedDonation.component_name}</span>
              </div>
              
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Thể tích:</span>
                <span className={styles.detailValue}>{selectedDonation.volume_ml}ml</span>
              </div>
              
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Ngày lấy máu:</span>
                <span className={styles.detailValue}>{formatDate(selectedDonation.collection_date)}</span>
              </div>
              
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Hạn sử dụng:</span>
                <span className={styles.detailValue}>{formatDate(selectedDonation.expiry_date)}</span>
              </div>
              
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Trạng thái:</span>
                <span className={styles.detailValue}>{selectedDonation.usage_status}</span>
              </div>
              
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Chi tiết sử dụng:</span>
                <span className={styles.detailValue}>{selectedDonation.usage_detail}</span>
              </div>
              
              {selectedDonation.recipient_name && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Bệnh nhân nhận:</span>
                  <span className={styles.detailValue}>{selectedDonation.recipient_name}</span>
                </div>
              )}
              
              {selectedDonation.medical_info && selectedDonation.medical_info !== 'Không có thông tin bệnh lý' && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Tình trạng bệnh:</span>
                  <span className={styles.detailValue}>{selectedDonation.medical_info}</span>
                </div>
              )}
              
              {selectedDonation.issued_date && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Thời gian sử dụng:</span>
                  <span className={styles.detailValue}>{formatDateTime(selectedDonation.issued_date)}</span>
                </div>
              )}
            </div>
            
            <div className={styles.modalFooter}>
              <button 
                className={styles.closeModalButton}
                onClick={() => setShowModal(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationHistoryDetailed;
