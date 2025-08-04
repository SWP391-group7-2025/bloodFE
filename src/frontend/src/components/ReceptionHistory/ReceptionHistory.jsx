import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './ReceptionHistory.module.css';

function ReceptionHistory() {
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCards, setExpandedCards] = useState({});
  const [deletingIds, setDeletingIds] = useState(new Set());

  // Lấy token từ localStorage
  const token = localStorage.getItem('token');

  // Helper function để lấy thông tin trạng thái
  const getStatusInfo = (status) => {
    switch (status) {
      case 'requested':
        return {
          text: 'Đã yêu cầu',
          color: '#2196f3',
          bgColor: '#e3f2fd'
        };
      case 'agree':
        return {
          text: 'Đã đồng ý',
          color: '#ff9800',
          bgColor: '#fff3e0'
        };
      case 'received':
        return {
          text: 'Đã nhận máu',
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

  // Toggle hiển thị chi tiết
  const toggleExpanded = (cardId) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  // Xóa yêu cầu nhận máu
  const handleDeleteRequest = async (recipientId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa yêu cầu nhận máu này? Hành động này không thể hoàn tác.')) {
      return;
    }

    setDeletingIds(prev => new Set(prev).add(recipientId));

    try {
      const response = await axios.delete(`http://localhost:3001/api/recipients/my/${recipientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Delete response:', response.data);

      // Cập nhật danh sách bằng cách loại bỏ item đã xóa
      setHistoryData(prevData =>
        prevData.filter(item => item.recipient_id !== recipientId)
      );

      alert('Xóa yêu cầu nhận máu thành công!');
    } catch (err) {
      console.error('Error deleting request:', err);

      let errorMessage = 'Không thể xóa yêu cầu nhận máu. Vui lòng thử lại sau.';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 403) {
        errorMessage = 'Bạn không có quyền xóa yêu cầu này.';
      } else if (err.response?.status === 400) {
        errorMessage = 'Chỉ có thể xóa yêu cầu có trạng thái "Đã yêu cầu". Yêu cầu đã được đồng ý hoặc đã nhận máu không thể xóa.';
      }

      alert(errorMessage);
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(recipientId);
        return newSet;
      });
    }
  };

  useEffect(() => {
    const fetchReceiveHistory = async () => {
      if (!token) {
        setError('Vui lòng đăng nhập để xem lịch sử nhận máu');
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching receive history...');
        const response = await axios.get('http://localhost:3001/api/recipients/my/history', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Receive history data:', response.data);

        // Log the blood bag info for debugging
        if (response.data && response.data.length > 0) {
          response.data.forEach(item => {
            if (item.blood_requests) {
              item.blood_requests.forEach(req => {
                if (req.blood_bag) {
                  console.log('Blood bag info:', {
                    id: req.blood_bag.blood_bag_id,
                    type: req.blood_bag.blood_type,
                    component: req.blood_bag.component_name,
                    volume: req.blood_bag.volume_ml
                  });
                }
              });
            }
          });
        }

        setHistoryData(response.data);
      } catch (err) {
        console.error('Error fetching receive history:', err);
        if (err.response?.status === 404) {
          setError('Bạn chưa có lịch sử nhận máu');
        } else if (err.response?.status === 401) {
          setError('Vui lòng đăng nhập lại');
        } else {
          setError('Không thể tải lịch sử nhận máu. Vui lòng thử lại sau.');
        }
        setHistoryData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReceiveHistory();
  }, [token]);

  if (loading) return <div className={styles.loading}>Đang tải lịch sử nhận máu...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.receptionHistoryContainer}>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Lịch sử nhận máu</h2>
      </div>

      {!historyData || historyData.length === 0 ? (
        <div className={styles.noData}>Bạn chưa có lịch sử nhận máu.</div>
      ) : (
        <div className={styles.historyList}>
          {historyData.map((item, index) => {
            const statusInfo = getStatusInfo(item.receive_status || 'requested');
            const cardId = `${item.recipient_id}_${index}`;
            const isExpanded = expandedCards[cardId];

            return (
              <div key={cardId} className={styles.historyCard}>
                <div className={styles.cardLogo}>
                  <div className={styles.bloodDrop}>🩸</div>
                </div>
                <div className={styles.cardContent}>
                  <div className={styles.cardRow}>
                    <span className={styles.cardLabel}>Ngày đăng ký:</span>
                    <span className={styles.cardValue}>
                      {item.registration_date ? new Date(item.registration_date).toLocaleDateString('vi-VN') : '---'}
                    </span>
                  </div>
                  <div className={styles.cardRow}>
                    <span className={styles.cardLabel}>Nhóm máu cần:</span>
                    <span className={`${styles.cardValue} ${styles.bloodTypeValue}`}>
                      {item.blood_type}
                    </span>
                  </div>
                  <div className={styles.cardRow}>
                    <span className={styles.cardLabel}>Thành phần máu:</span>
                    <span className={styles.cardValue}>
                      {item.component_name}
                    </span>
                  </div>
                  <div className={styles.cardRow}>
                    <span className={styles.cardLabel}>Tình trạng bệnh:</span>
                    <span className={styles.cardValue}>
                      {item.medical_condition}
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

                  {/* Nút xóa cho trạng thái requested */}
                  {item.receive_status === 'requested' && (
                    <div className={styles.actionButtonContainer}>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDeleteRequest(item.recipient_id)}
                        disabled={deletingIds.has(item.recipient_id)}
                        data-deleting={deletingIds.has(item.recipient_id)}
                      >
                        {deletingIds.has(item.recipient_id) ? (
                          <>🗑️ Đang xóa...</>
                        ) : (
                          <>🗑️ Xóa yêu cầu</>
                        )}
                      </button>
                      <div className={styles.deleteHelpText}>
                        Chỉ có thể xóa yêu cầu có trạng thái "Đã yêu cầu". Yêu cầu đã được đồng ý hoặc đã nhận máu không thể xóa.
                      </div>
                    </div>
                  )}

                  {/* Nút chi tiết */}
                  {item.blood_requests && item.blood_requests.length > 0 && (
                    <div className={styles.detailsButtonContainer}>
                      <button
                        className={styles.detailsButton}
                        onClick={() => toggleExpanded(cardId)}
                      >
                        {isExpanded ? '🔼 Ẩn chi tiết' : '🔽 Xem chi tiết yêu cầu'}
                      </button>
                    </div>
                  )}

                  {/* Hiển thị chi tiết yêu cầu máu */}
                  {isExpanded && item.blood_requests && item.blood_requests.length > 0 && (
                    <div className={styles.requestsSection}>
                      <h4 className={styles.requestsTitle}>Chi tiết yêu cầu máu:</h4>
                      {item.blood_requests.map((request, requestIndex) => (
                        <div key={request.request_id || requestIndex} className={styles.requestCard}>
                          <div className={styles.requestHeader}>
                            <span className={styles.requestId}>Yêu cầu #{request.request_id}</span>
                            {/* <span
                              className={styles.requestStatus}
                              style={{ color: request.status_color }}
                            >
                              {request.request_status_text}
                            </span> */}
                          </div>

                          <div className={styles.requestDetails}>
                            <div className={styles.requestRow}>
                              <span>Ngày yêu cầu:</span>
                              <span>{request.request_date}</span>
                            </div>
                            <div className={styles.requestRow}>
                              <span>Số lượng yêu cầu:</span>
                              <span>{request.requested_quantity} đơn vị</span>
                            </div>

                            {/* Thông tin blood bag và donor nếu đã nhận máu */}
                            {request.blood_bag && (
                              <div className={styles.bloodInfo}>
                                <div className={styles.bloodTitle}>Thông tin máu đã nhận:</div>
                                <div className={styles.requestRow}>
                                  <span>Mã túi máu:</span>
                                  <span>#{request.blood_bag.blood_bag_id || 'N/A'}</span>
                                </div>
                                {request.blood_bag.blood_type && (
                                  <div className={styles.requestRow}>
                                    <span>Nhóm máu:</span>
                                    <span>{request.blood_bag.blood_type}</span>
                                  </div>
                                )}
                                {request.blood_bag.component_name && (
                                  <div className={styles.requestRow}>
                                    <span>Thành phần máu:</span>
                                    <span>{request.blood_bag.component_name}</span>
                                  </div>
                                )}
                                <div className={styles.requestRow}>
                                  <span>Thể tích:</span>
                                  <span>{request.blood_bag.volume_ml || 'N/A'} {request.blood_bag.volume_ml ? 'ml' : ''}</span>
                                </div>
                                <div className={styles.requestRow}>
                                  <span>Ngày thu thập:</span>
                                  <span>{request.blood_bag.collection_date || 'N/A'}</span>
                                </div>
                                <div className={styles.requestRow}>
                                  <span>Ngày nhận:</span>
                                  <span>{request.blood_bag.issued_date || 'N/A'}</span>
                                </div>
                                <div className={styles.requestRow}>
                                  <span>Cấp phát bởi:</span>
                                  <span>{request.blood_bag.issued_by_name || 'N/A'}</span>
                                </div>

                                {request.donor_info && (
                                  <div className={styles.donorInfo}>
                                    <div className={styles.donorTitle}>Thông tin người hiến máu:</div>
                                    <div className={styles.requestRow}>
                                      <span>Tên người hiến:</span>
                                      <span className={styles.donorName}>{request.donor_info.donor_name}</span>
                                    </div>
                                    <div className={styles.requestRow}>
                                      <span>Ngày hiến máu gần nhất:</span>
                                      <span>{request.donor_info.donor_last_donation}</span>
                                    </div>
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

export default ReceptionHistory;
