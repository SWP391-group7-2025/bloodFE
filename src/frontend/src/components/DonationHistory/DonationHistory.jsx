import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './DonationHistory.module.css';

function DonationHistory() {
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedDetails, setExpandedDetails] = useState({}); // State để điều khiển hiển thị chi tiết
  const [deletingIds, setDeletingIds] = useState(new Set());

  // Lấy token từ localStorage
  const token = localStorage.getItem('token');

  // Function để toggle hiển thị chi tiết
  const toggleDetails = (itemId) => {
    setExpandedDetails(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // Xóa lịch hẹn hiến máu
  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy lịch hẹn hiến máu này? Hành động này không thể hoàn tác.')) {
      return;
    }

    setDeletingIds(prev => new Set(prev).add(appointmentId));

    try {
      const response = await axios.delete(`http://localhost:3001/api/appointments/my/${appointmentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Cancel response:', response.data);

      // Tải lại dữ liệu để cập nhật danh sách
      window.location.reload();

      alert('Hủy lịch hẹn hiến máu thành công!');
    } catch (err) {
      console.error('Error canceling appointment:', err);

      let errorMessage = 'Không thể hủy lịch hẹn. Vui lòng thử lại sau.';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 403) {
        errorMessage = 'Bạn không có quyền hủy lịch hẹn này.';
      } else if (err.response?.status === 400) {
        errorMessage = 'Chỉ có thể hủy những lịch hẹn có trạng thái "Đã lên lịch".';
      }

      alert(errorMessage);
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(appointmentId);
        return newSet;
      });
    }
  };

  // Helper function để lấy thông tin trạng thái (tương thích với API cũ)
  const getStatusInfo = (status) => {
    switch (status) {
      case 'scheduled':
        return {
          text: 'Đã đặt lịch',
          color: '#2196f3',
          bgColor: '#e3f2fd'
        };
      case 'completed':
      case 'donated':
        return {
          text: 'Đã hiến máu',
          color: '#4caf50',
          bgColor: '#e8f5e8'
        };
      case 'cancelled':
        return {
          text: 'Đã hủy',
          color: '#f44336',
          bgColor: '#ffebee'
        };
      default:
        return {
          text: 'Không xác định',
          color: '#9e9e9e',
          bgColor: '#f5f5f5'
        };
    }
  };

  // Helper function để lấy thông tin nhóm máu
  const getBloodTypeInfo = (bloodGroupId) => {
    const bloodTypes = {
      1: 'A+', 2: 'A-', 3: 'B+', 4: 'B-',
      5: 'AB+', 6: 'AB-', 7: 'O+', 8: 'O-', 9: 'Chưa biết nhóm máu'
    };
    return bloodTypes[bloodGroupId] || 'Chưa xác định';
  };

  useEffect(() => {
    const fetchDonationHistory = async () => {
      if (!token) {
        setError('Vui lòng đăng nhập để xem lịch sử hiến máu');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        // Lấy lịch sử hiến máu
        const historyRes = await axios.get('/api/donors/my/history', {
          headers: { Authorization: `Bearer ${token}` }
        });

        let data = Array.isArray(historyRes.data) ? historyRes.data : historyRes.data?.data || [];

        // Lấy thông tin appointments để tìm thời gian tương ứng
        if (data.length > 0) {
          try {
            // Tìm ngày sớm nhất và muộn nhất từ donation history
            const dates = data.map(item => new Date(item.donation_date));
            const earliestDate = new Date(Math.min(...dates));
            const latestDate = new Date(Math.max(...dates));

            // Mở rộng khoảng thời gian để đảm bảo bao phủ tất cả appointments
            earliestDate.setDate(earliestDate.getDate() - 30); // Lùi 30 ngày
            latestDate.setDate(latestDate.getDate() + 30); // Tiến 30 ngày

            const fromStr = earliestDate.toISOString().slice(0, 10);
            const toStr = latestDate.toISOString().slice(0, 10);

            // Lấy appointments trong khoảng thời gian này
            const allAppointmentsRes = await axios.get(`/api/appointments?from=${fromStr}&to=${toStr}`, {
              headers: { Authorization: `Bearer ${token}` }
            });

            const appointments = Array.isArray(allAppointmentsRes.data) ? allAppointmentsRes.data : allAppointmentsRes.data?.data || [];

            // Enriched data với thông tin thời gian từ appointments
            const enrichedData = data.map(item => {
              // Tìm appointment tương ứng dựa trên ngày và donor_id
              const matchingAppointment = appointments.find(apt => {
                const donationDate = new Date(item.donation_date).toDateString();
                const appointmentDate = new Date(apt.appointment_date).toDateString();
                return donationDate === appointmentDate && apt.donor_id === item.donor_id;
              });

              if (matchingAppointment) {
                return {
                  ...item,
                  appointment_time: matchingAppointment.appointment_time,
                  appointment_time_end: matchingAppointment.appointment_time_end
                };
              }

              return item;
            });

            data = enrichedData;
          } catch (appointmentErr) {
            console.log('Could not fetch appointments for time info:', appointmentErr);
          }
        }

        setHistoryData(data);
      } catch (err) {
        console.error('Error fetching donor data:', err);
        if (err.response?.status === 404) {
          setError('Bạn chưa có lịch sử hiến máu');
        } else if (err.response?.status === 401) {
          setError('Vui lòng đăng nhập lại');
        } else {
          setError('Không thể tải lịch sử hiến máu. Vui lòng thử lại sau.');
        }
        setHistoryData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDonationHistory();
  }, [token]);

  if (loading) return <div className={styles.loading}>Đang tải lịch sử hiến máu...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.donationHistoryContainer}>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Lịch sử hiến máu</h2>
      </div>

      {!historyData || historyData.length === 0 ? (
        <div className={styles.noData}>Bạn chưa có lịch sử hiến máu.</div>
      ) : (
        <div className={styles.historyList}>
          {historyData.map((item, index) => {
            const statusInfo = getStatusInfo(item.donation_status || 'scheduled');
            // Chỉ hiển thị ngày thực tế hiến máu khi đã hoàn thành hiến máu
            const ngayHien = (item.donation_status === 'donated' || item.donation_status === 'completed')
              ? (item.collection_date || item.last_donation_date || '')
              : '';
            const ngayHen = item.appointment_date || '';
            const itemId = item.donation_record_id || `${item.donor_id}_${index}`;
            const isExpanded = expandedDetails[itemId] || false;
            const hasBloodComponents = (item.donation_status === 'donated' || item.donation_status === 'completed') &&
              item.blood_components && item.blood_components.length > 0;

            return (
              <div key={itemId} className={styles.historyCard}>
                <div className={styles.cardLogo}>
                  <div className={styles.bloodDrop}>🩸</div>
                </div>
                <div className={styles.cardContent}>
                  <div className={styles.cardRow}>
                    <span className={styles.cardLabel}>Ngày đăng ký lịch hẹn:</span>
                    <span className={styles.cardValue}>
                      {ngayHen ? new Date(ngayHen).toLocaleDateString('vi-VN') : '---'}
                    </span>
                  </div>
                  <div className={styles.cardRow}>
                    <span className={styles.cardLabel}>Ngày thực tế hiến máu:</span>
                    <span className={styles.cardValue}>
                      {ngayHien ? new Date(ngayHien).toLocaleDateString('vi-VN') :
                        (item.donation_status === 'scheduled' ? 'Đang chờ hiến máu' : '---')}
                    </span>
                  </div>
                  {item.appointment_time && (
                    <div className={styles.cardRow}>
                      <span className={styles.cardLabel}>Thời gian:</span>
                      <span className={styles.cardValue}>
                        {item.appointment_time?.slice(0, 5)}
                        {item.appointment_time_end && ` - ${item.appointment_time_end.slice(0, 5)}`}
                      </span>
                    </div>
                  )}
                  <div className={styles.cardRow}>
                    <span className={styles.cardLabel}>Nhóm máu:</span>
                    <span className={`${styles.cardValue} ${styles.bloodTypeValue}`}>
                      {getBloodTypeInfo(item.blood_group_id)}
                    </span>
                  </div>
                  <div className={styles.cardRow}>
                    <span className={styles.cardLabel}>Trạng thái:</span>
                    <span
                      className={styles.statusBadge}
                      style={{
                        color: statusInfo.color,
                        backgroundColor: statusInfo.bgColor
                      }}
                    >
                      {statusInfo.text}
                    </span>
                  </div>

                  {/* Nút hủy cho trạng thái scheduled */}
                  {item.donation_status === 'scheduled' && (
                    <div className={styles.actionButtonContainer}>
                      <button
                        className={styles.cancelButton}
                        onClick={() => handleCancelAppointment(item.appointment_id)}
                        disabled={deletingIds.has(item.appointment_id)}
                        data-deleting={deletingIds.has(item.appointment_id)}
                      >
                        {deletingIds.has(item.appointment_id) ? (
                          <>⚡ Đang hủy...</>
                        ) : (
                          <>❌ Hủy lịch hẹn</>
                        )}
                      </button>
                      <div className={styles.cancelHelpText}>
                        Chỉ có thể hủy những lịch hẹn có trạng thái "Đã đặt lịch"
                      </div>
                    </div>
                  )}

                  {/* Nút chi tiết nếu có thành phần máu */}
                  {hasBloodComponents && (
                    <div className={styles.detailsButtonContainer}>
                      <button
                        className={styles.detailsButton}
                        onClick={() => toggleDetails(itemId)}
                      >
                        {isExpanded ? '🔽 Ẩn chi tiết' : '🔼 Xem chi tiết thành phần máu'}
                      </button>
                    </div>
                  )}

                  {/* Hiển thị chi tiết thành phần máu nếu được mở rộng */}
                  {hasBloodComponents && isExpanded && (
                    <div className={styles.bloodComponentsSection}>
                      <h4 className={styles.componentsTitle}>Chi tiết thành phần máu:</h4>
                      {item.blood_components.map((component, componentIndex) => (
                        <div key={component.blood_bag_id || componentIndex} className={styles.componentCard}>
                          <div className={styles.componentHeader}>
                            <span className={styles.componentName}>{component.component_name}</span>
                            <span
                              className={styles.componentStatus}
                              style={{
                                color: component.bag_status === 'used' ? '#f44336' :
                                  component.bag_status === 'available' ? '#4caf50' : '#ff9800'
                              }}
                            >
                              {component.bag_status === 'used' ? 'Đã sử dụng' :
                                component.bag_status === 'available' ? 'Còn hiệu lực' :
                                  component.bag_status === 'expired' ? 'Hết hạn' : component.bag_status}
                            </span>
                          </div>

                          <div className={styles.componentDetails}>
                            <div className={styles.componentRow}>
                              <span>Thể tích:</span>
                              <span>{component.volume_ml} ml</span>
                            </div>
                            <div className={styles.componentRow}>
                              <span>Ngày hết hạn:</span>
                              <span>{component.expiry_date}</span>
                            </div>
                            <div className={styles.componentRow}>
                              <span>Thời gian còn lại:</span>
                              <span className={component.days_remaining <= 7 ? styles.expiringSoon : ''}>
                                {component.days_remaining > 0 ? `${component.days_remaining} ngày` : 'Đã hết hạn'}
                              </span>
                            </div>

                            {/* Thông tin người nhận nếu đã được sử dụng */}
                            {component.recipient_name && (
                              <div className={styles.usageInfo}>
                                <div className={styles.usageTitle}>Thông tin sử dụng:</div>
                                <div className={styles.componentRow}>
                                  <span>Người nhận:</span>
                                  <span className={styles.recipientName}>{component.recipient_name}</span>
                                </div>
                                {component.recipient_medical_condition && (
                                  <div className={styles.componentRow}>
                                    <span>Tình trạng bệnh:</span>
                                    <span>{component.recipient_medical_condition}</span>
                                  </div>
                                )}
                                {component.issued_date && (
                                  <div className={styles.componentRow}>
                                    <span>Ngày sử dụng:</span>
                                    <span>{component.issued_date}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default DonationHistory;
