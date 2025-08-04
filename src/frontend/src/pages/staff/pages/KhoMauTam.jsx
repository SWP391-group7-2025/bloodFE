import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './KhoMauTam.css';

function hasPermission(requiredType) {
  const allowed = JSON.parse(localStorage.getItem('allowedTaskTypes') || '[]');
  // Map blood_testing to KhoMauTam permission
  if (requiredType === 'KhoMauTam') {
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
        Bạn không có quyền truy cập trang kho máu tạm.
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

function KhoMauTam() {
  const [tempBloodBags, setTempBloodBags] = useState([]);
  const [selectedBag, setSelectedBag] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    status: '',
    community_tag: ''
  });

  // Check permission
  if (!hasPermission('KhoMauTam')) {
    return <NoPermissionMessage />;
  }

  useEffect(() => {
    fetchTempBloodBags();
  }, []);

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
        console.log('Temp blood bags data:', response.data.data);
        response.data.data.forEach((bag, index) => {
          console.log(`Bag ${index}:`, {
            temp_bag_id: bag.temp_bag_id,
            component_name: bag.component_name,
            donor_name: bag.donor_name
          });
        });
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
    if (!hasPermission('KhoMauTam')) {
      return;
    }

    setSelectedBag(bag);
    setFormData({
      status: bag.status || 'pending',
      community_tag: bag.community_tag || ''
    });
  };

  const closePopup = () => {
    setSelectedBag(null);
    setFormData({
      status: '',
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
    if (!hasPermission('KhoMauTam')) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const payload = {
        donor_id: selectedBag.donor_id,
        blood_group_id: selectedBag.blood_group_id,
        component_id: selectedBag.component_id,
        volume_type_id: selectedBag.volume_type_id,
        collection_date: selectedBag.collection_date.split('T')[0],
        community_tag: formData.community_tag,
        status: formData.status
      };

      const response = await axios.put(
        `http://localhost:3001/api/temporary-blood/${selectedBag.temp_bag_id}`,
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
    if (!hasPermission('KhoMauTam')) {
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
    if (!hasPermission('KhoMauTam')) {
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ff9800'; // Orange cho đang chờ
      case 'processed': return '#4caf50'; // Green cho đã xử lý
      case 'discarded': return '#f44336'; // Red cho đã từ chối
      default: return '#9e9e9e'; // Gray cho không xác định
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Đang chờ';
      case 'processed': return 'Đã xử lý';
      case 'discarded': return 'Đã từ chối';
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
      <h1>Kho Máu Tạm</h1>
      <p className="description">
        Quản lý các túi máu tạm trước khi chuyển vào ngân hàng máu chính thức
      </p>

      {loading && (
        <div className="loading">
          <p>Đang tải...</p>
        </div>
      )}

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
                <th>Ngày thu thập</th>
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
                  <td>{new Date(bag.collection_date).toLocaleDateString('vi-VN')}</td>
                  <td>
                    <span className="community-tag">
                      {bag.community_tag || 'Không có'}
                    </span>
                  </td>
                  <td>
                    <span
                      className="status-badge"
                      style={{
                        backgroundColor: getStatusColor(bag.status),
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        border: 'none',
                        display: 'inline-block',
                        minWidth: '80px',
                        textAlign: 'center'
                      }}
                    >
                      {getStatusText(bag.status)}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-edit"
                        onClick={() => openEditPopup(bag)}
                      >
                        Sửa
                      </button>
                      {bag.status === 'pending' && (
                        <>
                          <button
                            className="btn-approve"
                            onClick={() => moveToBloodBag(bag.temp_bag_id)}
                          >
                            Chuyển
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

      {/* Popup chỉnh sửa */}
      {selectedBag && (
        <div className="modal">
          <div className="modal-content">
            <h2>Cập nhật túi máu tạm #{selectedBag.temp_bag_id}</h2>

            <div className="form-group">
              <label>Người hiến:</label>
              <input type="text" value={selectedBag.donor_name} disabled />
            </div>

            <div className="form-group">
              <label>Nhóm máu:</label>
              <input
                type="text"
                value={`${selectedBag.blood_type}${selectedBag.rh_factor}`}
                disabled
              />
            </div>

            <div className="form-group">
              <label>Thành phần:</label>
              <input type="text" value={translateBloodComponent(selectedBag.component_name)} disabled />
            </div>

            <div className="form-group">
              <label>Thể tích (ml):</label>
              <input type="number" value={selectedBag.volume_ml} disabled />
            </div>

            <div className="form-group">
              <label>Ngày thu thập:</label>
              <input
                type="text"
                value={new Date(selectedBag.collection_date).toLocaleDateString('vi-VN')}
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
                onClick={handleUpdate}
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
    </div>
  );
}

export default KhoMauTam;
