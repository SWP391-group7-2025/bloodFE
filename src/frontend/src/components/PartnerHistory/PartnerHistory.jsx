import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaHistory, FaEdit, FaTrash, FaSearch, FaEye, FaCalendar, FaFilter, FaClock } from 'react-icons/fa';
import styles from './PartnerHistory.module.css';

const PartnerHistory = () => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

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

    // Fix lỗi hiển thị ++ thay vì +
    let cleanBloodType = bloodType;
    let cleanRhFactor = rhFactor;

    // Nếu bloodType đã chứa Rh factor, tách ra
    if (bloodType && (bloodType.includes('+') || bloodType.includes('-'))) {
      const match = bloodType.match(/^(A|B|AB|O)([+-]).*$/);
      if (match) {
        cleanBloodType = match[1];
        cleanRhFactor = match[2]; // Chỉ lấy ký tự đầu tiên (+ hoặc -)
      } else {
        // Fallback: return bloodType as is if regex doesn't match
        return bloodType;
      }
    } else {
      // Đảm bảo rhFactor chỉ có 1 ký tự
      if (cleanRhFactor && cleanRhFactor.length > 1) {
        cleanRhFactor = cleanRhFactor.charAt(0);
      }
    }

    return `${cleanBloodType}${cleanRhFactor}`;
  };

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const fetchMyRequests = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/partner/my-requests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();

        // Fix encoding cho tất cả các request
        const fixedData = data.map(request => ({
          ...request,
          full_name: fixVietnameseEncoding(request.full_name),
          address: fixVietnameseEncoding(request.address)
        }));

        setRequests(fixedData);
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        toast.error('Không thể tải danh sách yêu cầu: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Lỗi kết nối: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (request) => {
    if (request.status !== 'pending') {
      toast.warning('Chỉ có thể chỉnh sửa yêu cầu đang chờ xử lý');
      return;
    }
    // Redirect to emergency request page with edit mode
    window.location.href = `/partner/emergency-request?edit=${request.partner_req_id}`;
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa yêu cầu này không?')) return;

    try {
      const response = await fetch(`http://localhost:3001/api/partner/request/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Xóa yêu cầu thành công!');
        fetchMyRequests();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Không thể xóa yêu cầu');
      }
    } catch (error) {
      toast.error('Lỗi kết nối');
    }
  };

  const handleViewDetails = async (request) => {
    try {
      const response = await fetch(`http://localhost:3001/api/partner/request/${request.partner_req_id}/detailed`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const detailedData = await response.json();
        console.log('🧪 DEBUG - Detailed data received:', detailedData);
        console.log('🧪 DEBUG - Donor info:', detailedData.donor_info);
        setSelectedRequest(detailedData);
        setShowDetailModal(true);
      } else {
        toast.error('Không thể tải thông tin chi tiết');
      }
    } catch (error) {
      console.error('Error loading details:', error);
      toast.error('Lỗi kết nối khi tải chi tiết');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ffc107';
      case 'approved': return '#28a745';
      case 'rejected': return '#dc3545';
      case 'fulfilled': return '#17a2b8';
      case 'done': return '#17a2b8';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Đang chờ';
      case 'approved': return 'Đã duyệt';
      case 'rejected': return 'Từ chối';
      case 'fulfilled': return 'Hoàn thành';
      case 'done': return 'Hoàn thành';
      case 'cancel': return 'Đã hủy';
      default: return status;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'approved': return '✅';
      case 'rejected': return '❌';
      case 'fulfilled': return '🎉';
      case 'done': return '🎉';
      case 'cancel': return '🚫';
      default: return '❓';
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = !searchFilter ||
      request.full_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      request.email.toLowerCase().includes(searchFilter.toLowerCase()) ||
      request.phone.includes(searchFilter);

    const matchesStatus = !statusFilter || request.status === statusFilter;

    const matchesDate = !dateFilter ||
      new Date(request.request_date).toISOString().split('T')[0] === dateFilter;

    return matchesSearch && matchesStatus && matchesDate;
  });

  const getRequestStats = () => {
    const total = requests.length;
    const pending = requests.filter(r => r.status === 'pending').length;
    const approved = requests.filter(r => r.status === 'approved').length;
    const fulfilled = requests.filter(r => r.status === 'fulfilled' || r.status === 'done').length;
    const rejected = requests.filter(r => r.status === 'rejected').length;

    return { total, pending, approved, fulfilled, rejected };
  };

  const stats = getRequestStats();

  // Function để fix lỗi encoding UTF-8 cho tiếng Việt
  const fixVietnameseEncoding = (text) => {
    if (!text) return '';

    // Nếu text đã hiển thị đúng (có ký tự tiếng Việt), return luôn
    if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/.test(text)) {
      return text;
    }

    // Nếu có dấu ? trong text, có thể bị lỗi encoding
    if (text.includes('?')) {
      return text
        .replace(/Nguy.n/gi, 'Nguyễn')
        .replace(/H.ng/gi, 'Hồng')
        .replace(/Tr.n/gi, 'Trần')
        .replace(/Th.nh/gi, 'Thành')
        .replace(/L./gi, 'Lê')
        .replace(/Ph.m/gi, 'Phạm')
        .replace(/Ho.ng/gi, 'Hoàng')
        .replace(/Hu.nh/gi, 'Huỳnh')
        .replace(/V./gi, 'Vũ')
        .replace(/\?.ng/gi, 'ường')
        .replace(/\?.i/gi, 'ời')
        .replace(/\?.u/gi, 'ều')
        .replace(/\?/g, ''); // Xóa dấu ? còn lại
    }

    return text;
  };

  const handleViewDetail = (request) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedRequest(null);
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Đang tải lịch sử yêu cầu...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <FaHistory className={styles.headerIcon} />
            <div>
              <h1>Lịch Sử Yêu Cầu</h1>
              <p>Theo dõi tất cả các yêu cầu nhận máu khẩn cấp của bạn</p>
            </div>
          </div>
          <button
            className={styles.newRequestBtn}
            onClick={() => window.location.href = '/partner/emergency-request'}
          >
            <FaCalendar /> Tạo yêu cầu mới
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className={styles.statsSection}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#3498db' }}>
            <FaHistory />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statNumber}>{stats.total}</span>
            <span className={styles.statLabel}>Tổng yêu cầu</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#f39c12' }}>
            <FaClock />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statNumber}>{stats.pending}</span>
            <span className={styles.statLabel}>Đang chờ</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#27ae60' }}>
            ✅
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statNumber}>{stats.approved}</span>
            <span className={styles.statLabel}>Đã duyệt</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#17a2b8' }}>
            🎉
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statNumber}>{stats.fulfilled}</span>
            <span className={styles.statLabel}>Hoàn thành</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filtersSection}>
        <div className={styles.searchBox}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, email, SĐT..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <FaFilter className={styles.filterIcon} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.statusFilter}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="pending">Đang chờ</option>
            <option value="approved">Đã duyệt</option>
            <option value="rejected">Từ chối</option>
            <option value="fulfilled">Hoàn thành</option>
            <option value="done">Hoàn thành</option>
            <option value="cancel">Đã hủy</option>
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className={styles.dateFilter}
          />
        </div>

        <div className={styles.viewToggle}>
          <button
            className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.active : ''}`}
            onClick={() => setViewMode('grid')}
          >
            ⊞ Grid
          </button>
          <button
            className={`${styles.viewBtn} ${viewMode === 'list' ? styles.active : ''}`}
            onClick={() => setViewMode('list')}
          >
            ☰ List
          </button>
        </div>
      </div>

      {/* Requests List */}
      <div className={styles.requestsSection}>
        {filteredRequests.length === 0 ? (
          <div className={styles.emptyState}>
            <FaHistory className={styles.emptyIcon} />
            <h3>Chưa có yêu cầu nào</h3>
            <p>Bạn chưa tạo yêu cầu nhận máu khẩn cấp nào. Hãy tạo yêu cầu đầu tiên!</p>
            <button
              className={styles.createFirstBtn}
              onClick={() => window.location.href = '/partner/emergency-request'}
            >
              Tạo yêu cầu đầu tiên
            </button>
          </div>
        ) : (
          <div className={`${styles.requestsList} ${styles[viewMode]}`}>
            {filteredRequests.map(request => (
              <div key={request.partner_req_id} className={styles.requestCard}>
                <div className={styles.requestHeader}>
                  <div className={styles.requestTitle}>
                    <h3>{request.full_name}</h3>
                    <span className={styles.requestId}>#{request.partner_req_id}</span>
                  </div>
                  <div className={styles.requestStatus}>
                    <span
                      className={styles.statusBadge}
                      style={{ backgroundColor: getStatusColor(request.status) }}
                    >
                      {getStatusIcon(request.status)} {getStatusText(request.status)}
                    </span>
                  </div>
                </div>

                <div className={styles.requestInfo}>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Email:</span>
                      <span className={styles.infoValue}>{request.email}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>SĐT:</span>
                      <span className={styles.infoValue}>{request.phone}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Nhóm máu:</span>
                      <span className={styles.infoValue}>
                        {formatBloodType(request.blood_type, request.rh_factor)}
                      </span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Thành phần:</span>
                      <span className={styles.infoValue}>{request.component_name}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Ngày yêu cầu:</span>
                      <span className={styles.infoValue}>
                        {new Date(request.request_date).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Địa chỉ:</span>
                      <span className={styles.infoValue}>{request.address}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.requestActions}>
                  {request.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleEdit(request)}
                        className={styles.editBtn}
                        title="Chỉnh sửa yêu cầu"
                      >
                        <FaEdit /> Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(request.partner_req_id)}
                        className={styles.deleteBtn}
                        title="Xóa yêu cầu"
                      >
                        <FaTrash /> Xóa
                      </button>
                    </>
                  )}
                  <button
                    className={styles.viewBtn}
                    title="Xem chi tiết"
                    onClick={() => handleViewDetails(request)}
                  >
                    <FaEye /> Xem
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className={styles.modalOverlay} onClick={() => setShowDetailModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Chi tiết yêu cầu #{selectedRequest.partner_req_id}</h2>
              <button
                className={styles.closeBtn}
                onClick={() => setShowDetailModal(false)}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Patient Information */}
              <div className={styles.detailSection}>
                <h3>👤 Thông tin bệnh nhân</h3>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Họ tên:</span>
                    <span className={styles.detailValue}>{selectedRequest.full_name}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Email:</span>
                    <span className={styles.detailValue}>{selectedRequest.email}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Số điện thoại:</span>
                    <span className={styles.detailValue}>{selectedRequest.phone}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Giới tính:</span>
                    <span className={styles.detailValue}>
                      {selectedRequest.gender === 'male' ? 'Nam' :
                        selectedRequest.gender === 'female' ? 'Nữ' : 'Khác'}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Ngày sinh:</span>
                    <span className={styles.detailValue}>
                      {new Date(selectedRequest.date_of_birth).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Địa chỉ:</span>
                    <span className={styles.detailValue}>{selectedRequest.address}</span>
                  </div>
                </div>
              </div>

              {/* Blood Request Information */}
              <div className={styles.detailSection}>
                <h3>🩸 Thông tin yêu cầu máu</h3>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Nhóm máu cần:</span>
                    <span className={styles.detailValue}>
                      {formatBloodType(selectedRequest.blood_type, selectedRequest.rh_factor)}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Thành phần máu:</span>
                    <span className={styles.detailValue}>{selectedRequest.component_name}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Ngày cần máu:</span>
                    <span className={styles.detailValue}>
                      {new Date(selectedRequest.request_date).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Trạng thái:</span>
                    <span className={`${styles.detailValue} ${styles.statusValue}`}>
                      <span
                        className={styles.statusBadge}
                        style={{ backgroundColor: getStatusColor(selectedRequest.status) }}
                      >
                        {getStatusIcon(selectedRequest.status)} {getStatusText(selectedRequest.status)}
                      </span>
                    </span>
                  </div>
                  {selectedRequest.requested_quantity && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Số lượng yêu cầu:</span>
                      <span className={styles.detailValue}>{selectedRequest.requested_quantity} đơn vị</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Donor Information */}
              {selectedRequest.donor_info && selectedRequest.donor_info.length > 0 && (
                <div className={styles.detailSection}>
                  <h3>💝 Thông tin người hiến máu</h3>
                  {selectedRequest.donor_info.map((donor, index) => (
                    <div key={index} className={styles.donorCard}>
                      <div className={styles.donorHeader}>
                        <h4>🩸 Túi máu #{donor.blood_bag_id}</h4>
                        <span className={styles.donorDate}>
                          Ngày cấp phát: {new Date(donor.issued_date).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <div className={styles.donorInfo}>
                        <div className={styles.donorGrid}>
                          <div className={styles.donorItem}>
                            <span className={styles.donorLabel}>Người hiến:</span>
                            <span className={styles.donorValue}>{donor.donor_name}</span>
                          </div>
                          <div className={styles.donorItem}>
                            <span className={styles.donorLabel}>Email:</span>
                            <span className={styles.donorValue}>{donor.donor_email}</span>
                          </div>
                          <div className={styles.donorItem}>
                            <span className={styles.donorLabel}>SĐT:</span>
                            <span className={styles.donorValue}>{donor.donor_phone}</span>
                          </div>
                          <div className={styles.donorItem}>
                            <span className={styles.donorLabel}>Nhóm máu:</span>
                            <span className={styles.donorValue}>
                              {formatBloodType(donor.donor_blood_type, donor.donor_rh_factor)}
                            </span>
                          </div>
                          <div className={styles.donorItem}>
                            <span className={styles.donorLabel}>Ngày hiến máu:</span>
                            <span className={styles.donorValue}>
                              {new Date(donor.collection_date).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                          <div className={styles.donorItem}>
                            <span className={styles.donorLabel}>Thể tích:</span>
                            <span className={styles.donorValue}>{donor.volume_ml}ml</span>
                          </div>
                          <div className={styles.donorItem}>
                            <span className={styles.donorLabel}>Hạn sử dụng:</span>
                            <span className={styles.donorValue}>
                              {new Date(donor.expiry_date).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                          <div className={styles.donorItem}>
                            <span className={styles.donorLabel}>Cấp phát bởi:</span>
                            <span className={styles.donorValue}>{donor.issued_by_name}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* No donor info message */}
              {(!selectedRequest.donor_info || selectedRequest.donor_info.length === 0) &&
                selectedRequest.status !== 'pending' && (
                  <div className={styles.detailSection}>
                    <div className={styles.noDonorInfo}>
                      <h3>💝 Thông tin người hiến máu</h3>
                      <p>Chưa có thông tin người hiến máu cho yêu cầu này.</p>
                      {selectedRequest.status === 'rejected' && (
                        <p className={styles.rejectedNote}>Yêu cầu đã bị từ chối.</p>
                      )}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default PartnerHistory;
