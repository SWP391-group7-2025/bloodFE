import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './NganHangMau.css';
import BloodProcessingModal from '../../../components/BloodProcessingModal/BloodProcessingModal';

function hasPermission(requiredType) {
  const allowed = JSON.parse(localStorage.getItem('allowedTaskTypes') || '[]');
  // Map blood_testing to NganHangMau permission
  if (requiredType === 'NganHangMau') {
    return allowed.includes('blood_testing');
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
        Bạn không có quyền truy cập trang ngân hàng máu.
        Trang này chỉ dành cho nhân viên được phân công công việc quản lý kho máu.
      </p>
      <p style={{
        color: '#888',
        fontSize: '14px',
        marginTop: '20px'
      }}>
        Vui lòng liên hệ quản trị viên để được cấp quyền truy cập.
      </p>
    </div>
  );
}

function NganHangMau() {
  const [bloodBags, setBloodBags] = useState([]);
  const [tempBloodBags, setTempBloodBags] = useState([]);
  const [selectedBag, setSelectedBag] = useState(null);
  const [selectedTempBag, setSelectedTempBag] = useState(null);
  const [activeTab, setActiveTab] = useState('ngan-hang'); // 'ngan-hang' hoặc 'kho-tam'
  const [loading, setLoading] = useState(false);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [processingTempBag, setProcessingTempBag] = useState(null);
  const [formData, setFormData] = useState({
    status: '',
    expiry_date: '',
    volume_type_id: '',
    volume_ml: '',
    community_tag: ''
  });

  // Check permission - if no permission, show message
  if (!hasPermission('NganHangMau')) {
    return <NoPermissionMessage />;
  }

  useEffect(() => {
    fetchBloodBags();
    fetchTempBloodBags();
  }, []);

  const fetchBloodBags = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/blood-bags/take/bloodbag');
      setBloodBags(res.data);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu túi máu:', error);
    }
  };

  const fetchTempBloodBags = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/temporary-blood', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setTempBloodBags(response.data.data);
      } else {
        console.error('Error fetching temp blood bags:', response.data.error);
      }
    } catch (error) {
      console.error('Error fetching temp blood bags:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEditPopup = (bag) => {
    // Check permission before allowing edit
    if (!hasPermission('NganHangMau')) {
      return;
    }

    setSelectedBag({
      ...bag,
      donor_id: Array.isArray(bag.donor_id) ? bag.donor_id[0] : bag.donor_id,
    });

    setFormData({
      status: bag.status || '',
      expiry_date: bag.expiry_date?.split('T')[0] || '',
      volume_type_id: bag.volume_type_id || '',
      volume_ml: bag.volume_ml || '',
      community_tag: ''
    });
  };

  const closePopup = () => {
    setSelectedBag(null);
    setSelectedTempBag(null);
    setFormData({
      status: '',
      expiry_date: '',
      volume_type_id: '',
      volume_ml: '',
      community_tag: ''
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdate = async () => {
    // Check permission before updating
    if (!hasPermission('NganHangMau')) {
      return;
    }

    try {
      const payload = {
        donor_id: selectedBag.donor_id,
        blood_group_id: selectedBag.blood_group_id,
        component_id: selectedBag.component_id,
        volume_type_id: parseInt(formData.volume_type_id),
        collection_date: selectedBag.collection_date.split('T')[0],
        expiry_date: formData.expiry_date,
        status: formData.status
      };

      await axios.put(`http://localhost:3001/api/blood-bags/${selectedBag.blood_bag_id}`, payload);
      await fetchBloodBags();
      closePopup();
    } catch (err) {
      console.error('❌ Lỗi cập nhật:', err.response?.data || err.message);
      alert('Cập nhật thất bại: ' + (err.response?.data?.error || err.message));
    }
  };

  // Xử lý kho máu tạm
  const openTempEditPopup = (bag) => {
    if (!hasPermission('NganHangMau')) {
      return;
    }

    setSelectedTempBag(bag);
    setFormData({
      status: bag.status || 'pending',
      community_tag: bag.community_tag || '',
      expiry_date: '',
      volume_type_id: '',
      volume_ml: ''
    });
  };

  const handleTempUpdate = async () => {
    if (!hasPermission('NganHangMau')) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const payload = {
        donor_id: selectedTempBag.donor_id,
        blood_group_id: selectedTempBag.blood_group_id,
        component_id: selectedTempBag.component_id,
        volume_type_id: selectedTempBag.volume_type_id,
        collection_date: selectedTempBag.collection_date.split('T')[0],
        community_tag: formData.community_tag,
        status: formData.status
      };

      const response = await axios.put(
        `http://localhost:3001/api/temporary-blood/${selectedTempBag.temp_bag_id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        alert('Cập nhật thành công!');
        await fetchTempBloodBags();
        closePopup();
      } else {
        alert('Cập nhật thất bại: ' + response.data.error);
      }
    } catch (error) {
      console.error('Error updating temp blood bag:', error);
      alert('Cập nhật thất bại: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const moveToBloodBag = async (tempBagId) => {
    if (!hasPermission('NganHangMau')) {
      return;
    }

    if (!confirm('Bạn có chắc chắn muốn chuyển túi máu này vào ngân hàng máu chính thức không?')) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await axios.post(
        `http://localhost:3001/api/temporary-blood/${tempBagId}/move-to-bloodbag`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        alert('Chuyển vào ngân hàng máu thành công!');
        await fetchTempBloodBags();
        await fetchBloodBags();
      } else {
        alert('Chuyển thất bại: ' + response.data.error);
      }
    } catch (error) {
      console.error('Error moving to blood bag:', error);
      alert('Chuyển thất bại: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const discardBlood = async (tempBagId) => {
    if (!hasPermission('NganHangMau')) {
      return;
    }

    if (!confirm('Bạn có chắc chắn muốn từ chối túi máu này không?')) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await axios.patch(
        `http://localhost:3001/api/temporary-blood/${tempBagId}/discard`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        alert('Từ chối túi máu thành công!');
        await fetchTempBloodBags();
      } else {
        alert('Từ chối thất bại: ' + response.data.error);
      }
    } catch (error) {
      console.error('Error discarding blood:', error);
      alert('Từ chối thất bại: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Functions cho processing modal
  const handleProcessBlood = (tempBag) => {
    setProcessingTempBag(tempBag);
    setShowProcessingModal(true);
  };

  const handleCloseProcessingModal = () => {
    setShowProcessingModal(false);
    setProcessingTempBag(null);
  };

  const handleProcessingSuccess = async (message) => {
    alert(message);
    await fetchTempBloodBags();
    await fetchBloodBags();
    setShowProcessingModal(false);
    setProcessingTempBag(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ffc107';
      case 'processed': return '#28a745';
      case 'discarded': return '#dc3545';
      case 'available': return '#28a745';
      case 'used': return '#6c757d';
      case 'expired': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Đang chờ';
      case 'processed': return 'Đã xử lý';
      case 'discarded': return 'Đã từ chối';
      case 'available': return 'Có sẵn';
      case 'used': return 'Đã sử dụng';
      case 'expired': return 'Hết hạn';
      default: return status;
    }
  };

  const translateBloodComponent = (componentName) => {
    if (!componentName) return '';

    const translations = {
      'Whole Blood': 'Máu toàn phần',
      'Red Blood Cells': 'Hồng cầu',
      'Plasma': 'Huyết tương',
      'Platelets': 'Tiểu cầu',
      'White Blood Cells': 'Bạch cầu',
      'Cryoprecipitate': 'Tủa lạnh',
      'Fresh Frozen Plasma': 'Huyết tương đông lạnh tươi',
      'Packed Red Blood Cells': 'Hồng cầu cô đặc'
    };

    return translations[componentName] || componentName;
  };

  return (
    <div className="container">
      <h1>Quản Lý Máu</h1>
      <p className="description">
        Quản lý kho máu tạm và ngân hàng máu chính thức
      </p>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'kho-tam' ? 'active' : ''}`}
          onClick={() => setActiveTab('kho-tam')}
        >
          📦 Kho Máu Tạm
        </button>
        <button
          className={`tab-button ${activeTab === 'ngan-hang' ? 'active' : ''}`}
          onClick={() => setActiveTab('ngan-hang')}
        >
          🏦 Ngân Hàng Máu
        </button>
      </div>

      {loading && (
        <div className="loading">
          <p>Đang tải...</p>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'kho-tam' ? (
        // Kho Máu Tạm Tab
        <div className="tab-content">
          <div className="tab-header">
            <h3>Kho Máu Tạm</h3>
            <p>Quản lý các túi máu chưa được phê duyệt</p>
          </div>

          {!loading && tempBloodBags.length === 0 ? (
            <p>Không có dữ liệu túi máu tạm.</p>
          ) : (
            <div className="table-container">
              <table className="blood-table">
                <thead>
                  <tr>
                    <th>Mã túi máu tạm</th>
                    <th>Người hiến</th>
                    <th>Nhóm máu</th>
                    <th>Thành phần</th>
                    <th>Thể tích (ml)</th>
                    <th>Tag cộng đồng</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {tempBloodBags.map((bag) => (
                    <tr key={bag.temp_bag_id}>
                      <td>{bag.temp_bag_id}</td>
                      <td>{bag.donor_name}</td>
                      <td>{`${bag.blood_type}${bag.rh_factor}`}</td>
                      <td>{translateBloodComponent(bag.component_name)}</td>
                      <td>{bag.volume_ml}</td>
                      <td>
                        <span className="community-tag">
                          {bag.community_tag || 'Không có'}
                        </span>
                      </td>
                      <td>
                        <span
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(bag.status) }}
                        >
                          {getStatusText(bag.status)}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-edit"
                            onClick={() => openTempEditPopup(bag)}
                          >
                            Sửa
                          </button>
                          {bag.status === 'pending' && (
                            <>
                              <button
                                className="btn-approve"
                                onClick={() => handleProcessBlood(bag)}
                              >
                                Xử lý
                              </button>
                              <button
                                className="btn-reject"
                                onClick={() => discardBlood(bag.temp_bag_id)}
                              >
                                Từ chối
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        // Ngân Hàng Máu Tab
        <div className="tab-content">
          <div className="tab-header">
            <h3>Ngân Hàng Máu</h3>
            <p>Quản lý các túi máu đã được phê duyệt và sẵn sàng sử dụng</p>
          </div>

          {bloodBags.length === 0 ? (
            <p>Không có dữ liệu túi máu.</p>
          ) : (
            <table className="blood-table">
              <thead>
                <tr>
                  <th>Mã túi máu</th>
                  <th>Người hiến</th>
                  <th>Nhóm máu</th>
                  <th>Thành phần</th>
                  <th>Thể tích (ml)</th>
                  <th>Hạn sử dụng</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {bloodBags.map((bag) => (
                  <tr key={bag.blood_bag_id}>
                    <td>{bag.blood_bag_id}</td>
                    <td>{bag.donor_name}</td>
                    <td>{`${bag.blood_type}${bag.rh_factor}`}</td>
                    <td>{translateBloodComponent(bag.component_name)}</td>
                    <td>{bag.volume_ml}</td>
                    <td>{new Date(bag.expiry_date).toLocaleDateString()}</td>
                    <td className={`status ${bag.status}`}>{getStatusText(bag.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Popup chỉnh sửa Ngân Hàng Máu */}
      {selectedBag && (
        <div className="modal">
          <div className="modal-content">
            <h2>Cập nhật túi máu #{selectedBag.blood_bag_id}</h2>

            <label>Trạng thái:</label>
            <select name="status" value={formData.status} onChange={handleChange}>
              <option value="available">available</option>
              <option value="used">used</option>
              <option value="expired">expired</option>
            </select>

            <label>Thể tích (ml):</label>
            <input
              name="volume_ml"
              type="number"
              value={formData.volume_ml}
              disabled
            />

            <label>Loại thể tích:</label>
            <select
              name="volume_type_id"
              value={formData.volume_type_id}
              onChange={handleChange}
            >
              <option value="">-- Chọn loại thể tích --</option>
              <option value="1">250ml</option>
              <option value="2">350ml</option>
              <option value="3">450ml</option>
            </select>

            <label>Hạn sử dụng:</label>
            <input
              name="expiry_date"
              type="date"
              value={formData.expiry_date}
              onChange={handleChange}
            />

            <div style={{ marginTop: '15px' }}>
              <button onClick={handleUpdate}>Lưu</button>
              <button onClick={closePopup} style={{ marginLeft: '10px' }}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup chỉnh sửa Kho Máu Tạm */}
      {selectedTempBag && (
        <div className="modal">
          <div className="modal-content">
            <h2>Cập nhật túi máu tạm #{selectedTempBag.temp_bag_id}</h2>

            <div className="form-group">
              <label>Người hiến:</label>
              <input type="text" value={selectedTempBag.donor_name} disabled />
            </div>

            <div className="form-group">
              <label>Nhóm máu:</label>
              <input
                type="text"
                value={`${selectedTempBag.blood_type}${selectedTempBag.rh_factor}`}
                disabled
              />
            </div>

            <div className="form-group">
              <label>Thành phần:</label>
              <input type="text" value={translateBloodComponent(selectedTempBag.component_name)} disabled />
            </div>

            <div className="form-group">
              <label>Thể tích (ml):</label>
              <input type="number" value={selectedTempBag.volume_ml} disabled />
            </div>

            <div className="form-group">
              <label>Ngày thu thập:</label>
              <input
                type="text"
                value={new Date(selectedTempBag.collection_date).toLocaleDateString('vi-VN')}
                disabled
              />
            </div>

            <div className="form-group">
              <label>Tag cộng đồng:</label>
              <input
                name="community_tag"
                type="text"
                value={formData.community_tag}
                onChange={handleChange}
                placeholder="Nhập tag cộng đồng (tùy chọn)"
                maxLength="100"
              />
            </div>

            <div className="form-group">
              <label>Trạng thái:</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="pending">Đang chờ</option>
                <option value="processed">Đã xử lý</option>
                <option value="discarded">Đã từ chối</option>
              </select>
            </div>

            <div className="modal-actions">
              <button
                onClick={handleTempUpdate}
                disabled={loading}
                className="btn-save"
              >
                {loading ? 'Đang lưu...' : 'Lưu'}
              </button>
              <button
                onClick={closePopup}
                className="btn-cancel"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Blood Processing Modal */}
      {showProcessingModal && processingTempBag && (
        <BloodProcessingModal
          tempBag={processingTempBag}
          onClose={handleCloseProcessingModal}
          onSuccess={handleProcessingSuccess}
        />
      )}
    </div>
  );
}

export default NganHangMau;
