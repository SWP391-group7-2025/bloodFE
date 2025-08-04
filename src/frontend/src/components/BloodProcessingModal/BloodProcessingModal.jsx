import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './BloodProcessingModal.css';
import Toast from '../Toast/Toast';
import ConfirmDialog from '../ConfirmDialog/ConfirmDialog';

const BloodProcessingModal = ({ tempBag, onClose, onSuccess }) => {
  const [components, setComponents] = useState([]);
  const [volumeTypes, setVolumeTypes] = useState([]);
  const [selectedComponents, setSelectedComponents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Toast states
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  // Confirm dialog states
  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: null
  });

  useEffect(() => {
    fetchComponentsAndVolumes();
    // Tự động thêm các component phổ biến nếu là Whole Blood
    if (tempBag && tempBag.component_id === 1) {
      // Whole Blood -> có thể tách thành Plasma, Platelets, Red Cells và giữ lại một phần Whole Blood
      setSelectedComponents([
        { id: Date.now(), component_id: '1', volume_type_id: '3' }, // Whole Blood 450ml
        { id: Date.now() + 1, component_id: '2', volume_type_id: '1' }, // Plasma 250ml
        { id: Date.now() + 2, component_id: '3', volume_type_id: '1' }, // Platelets 250ml
        { id: Date.now() + 3, component_id: '4', volume_type_id: '2' }  // Red Cells 350ml
      ]);
    } else {
      // Nếu không phải Whole Blood, vẫn thêm mặc định một dòng Whole Blood
      setSelectedComponents([
        { id: Date.now(), component_id: '1', volume_type_id: '3' } // Whole Blood 450ml
      ]);
    }
  }, [tempBag]);

  const fetchComponentsAndVolumes = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/donors/blood-components');
      const data = await response.json();

      if (data.success) {
        setComponents(data.data.components);
        setVolumeTypes(data.data.volumeTypes);
      } else {
        setError('Không thể tải danh sách thành phần máu');
        setToast({
          show: true,
          message: 'Không thể tải danh sách thành phần máu',
          type: 'error'
        });
      }
    } catch (err) {
      setError('Lỗi khi tải dữ liệu');
      setToast({
        show: true,
        message: 'Lỗi khi tải dữ liệu',
        type: 'error'
      });
    }
  };

  const addComponent = () => {
    setSelectedComponents([...selectedComponents, {
      id: Date.now(),
      component_id: '',
      volume_type_id: ''
    }]);
  };

  const removeComponent = (id) => {
    setConfirmDialog({
      show: true,
      title: 'Xác nhận xóa',
      message: 'Bạn có chắc chắn muốn xóa thành phần này không?',
      onConfirm: () => {
        setSelectedComponents(selectedComponents.filter(comp => comp.id !== id));
        setConfirmDialog({ show: false, title: '', message: '', onConfirm: null });
        setToast({
          show: true,
          message: 'Đã xóa thành phần thành công',
          type: 'success'
        });
      }
    });
  };

  const updateComponent = (id, field, value) => {
    setSelectedComponents(selectedComponents.map(comp =>
      comp.id === id ? { ...comp, [field]: value } : comp
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate
      if (selectedComponents.length === 0) {
        setError('Vui lòng chọn ít nhất một thành phần máu');
        setLoading(false);
        return;
      }

      const invalidComponents = selectedComponents.filter(comp =>
        !comp.component_id || !comp.volume_type_id
      );

      if (invalidComponents.length > 0) {
        setError('Vui lòng chọn đầy đủ thành phần và dung tích cho tất cả các dòng');
        setLoading(false);
        return;
      }

      // Prepare data for processing
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/temporary-blood/${tempBag.temp_bag_id}/process-to-components`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          components: selectedComponents.map(comp => ({
            component_id: parseInt(comp.component_id),
            volume_type_id: parseInt(comp.volume_type_id)
          }))
        })
      });

      const data = await response.json();

      if (data.success) {
        setToast({
          show: true,
          message: 'Xử lý và chuyển máu thành công!',
          type: 'success'
        });
        setTimeout(() => {
          onSuccess('Xử lý và chuyển máu thành công!');
          onClose();
        }, 1000);
      } else {
        setError(data.error || 'Có lỗi xảy ra khi xử lý');
        setToast({
          show: true,
          message: data.error || 'Có lỗi xảy ra khi xử lý',
          type: 'error'
        });
      }
    } catch (err) {
      setError('Lỗi khi xử lý túi máu');
      setToast({
        show: true,
        message: 'Lỗi khi xử lý túi máu',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const getComponentName = (componentId) => {
    const component = components.find(c => c.component_id === parseInt(componentId));
    return component ? component.component_name : '';
  };

  const getVolumeText = (volumeId) => {
    const volume = volumeTypes.find(v => v.volume_type_id === parseInt(volumeId));
    return volume ? `${volume.volume_ml}ml` : '';
  };

  if (!tempBag) return null;

  const modalContent = (
    <>

      <div className="processing-modal-overlay">

        <div className="modal-content">
          <div className="modal-header">
            <h3>Xử lý túi máu tạm #{tempBag.temp_bag_id}</h3>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="original-blood-info">
            <h4>Thông tin túi máu gốc:</h4>
            <p><strong>Người hiến:</strong> {tempBag.donor_name}</p>
            <p><strong>Nhóm máu:</strong> {tempBag.blood_type}{tempBag.rh_factor}</p>
            <p><strong>Thành phần gốc:</strong> {tempBag.component_name}</p>
            <p><strong>Dung tích gốc:</strong> {tempBag.volume_ml}ml</p>
            <p><strong>Ngày thu thập:</strong> {new Date(tempBag.collection_date).toLocaleDateString('vi-VN')}</p>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="components-section">
              <h4>Chọn các thành phần máu sau xử lý:</h4>

              {selectedComponents.map((comp) => (
                <div key={comp.id} className="component-row">
                  <div className="component-select">
                    <label>Thành phần máu:</label>
                    <select
                      value={comp.component_id}
                      onChange={(e) => updateComponent(comp.id, 'component_id', e.target.value)}
                      required
                    >
                      <option value="">Chọn thành phần...</option>
                      {components.map(component => (
                        <option key={component.component_id} value={component.component_id}>
                          {component.component_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="volume-select">
                    <label>Dung tích:</label>
                    <select
                      value={comp.volume_type_id}
                      onChange={(e) => updateComponent(comp.id, 'volume_type_id', e.target.value)}
                      required
                    >
                      <option value="">Chọn dung tích...</option>
                      {volumeTypes.map(volume => (
                        <option key={volume.volume_type_id} value={volume.volume_type_id}>
                          {volume.volume_ml}ml
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeComponent(comp.id)}
                  >
                    Xóa
                  </button>
                </div>
              ))}

              <button
                type="button"
                className="add-component-btn"
                onClick={addComponent}
              >
                + Thêm thành phần
              </button>
            </div>

            <div className="summary-section">
              <h4>Tóm tắt sau xử lý:</h4>
              <div className="summary-list">
                {selectedComponents.map(comp => (
                  <div key={comp.id} className="summary-item">
                    {getComponentName(comp.component_id)} - {getVolumeText(comp.volume_type_id)}
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={onClose}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="submit-btn"
                disabled={loading || selectedComponents.length === 0}
              >
                {loading ? 'Đang xử lý...' : 'Xử lý và chuyển'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Toast Notification */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ show: false, message: '', type: 'info' })}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        show={confirmDialog.show}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ show: false, title: '', message: '', onConfirm: null })}
      />
    </>
  );

  // Sử dụng Portal để render modal bên ngoài DOM tree hiện tại
  return createPortal(modalContent, document.body);
};

export default BloodProcessingModal;
