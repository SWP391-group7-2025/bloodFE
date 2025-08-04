import React, { useState, useEffect } from 'react';
import './BloodAdditionDashboard.css';

const BloodAdditionDashboard = ({ donorId, onClose, onSuccess }) => {
  const [components, setComponents] = useState([]);
  const [volumeTypes, setVolumeTypes] = useState([]);
  const [selectedComponents, setSelectedComponents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchComponentsAndVolumes();
    // Auto-add default Whole Blood component
    setSelectedComponents([{
      id: Date.now(),
      component_id: '1', // Whole Blood
      volume_type_id: ''
    }]);
  }, []);

  const fetchComponentsAndVolumes = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/donors/blood-components');
      const data = await response.json();
      
      if (data.success) {
        setComponents(data.data.components);
        setVolumeTypes(data.data.volumeTypes);
      } else {
        setError('Không thể tải danh sách thành phần máu');
      }
    } catch (err) {
      setError('Lỗi khi tải dữ liệu');
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
    setSelectedComponents(selectedComponents.filter(comp => comp.id !== id));
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

      // Prepare data
      const componentsData = selectedComponents.map(comp => ({
        component_id: parseInt(comp.component_id),
        volume_type_id: parseInt(comp.volume_type_id)
      }));

      // Send request to temporary storage
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/donations/record-temporary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          donor_id: donorId,
          components: componentsData
        })
      });

      const data = await response.json();

      if (data.success) {
        // Tự động cập nhật trạng thái donor thành "donated" sau khi thêm máu thành công
        try {
          const completeResponse = await fetch(`http://localhost:3001/api/donors/${donorId}/complete-donation`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (completeResponse.ok) {
            onSuccess(data.message + ' và đã cập nhật trạng thái thành "Đã hiến máu".');
          } else {
            onSuccess(data.message + ' nhưng không thể cập nhật trạng thái hiến máu.');
          }
        } catch (completeErr) {
          console.error('Error updating donation status:', completeErr);
          onSuccess(data.message + ' nhưng không thể cập nhật trạng thái hiến máu. Vui lòng cập nhật thủ công.');
        }
        
        onClose();
      } else {
        setError(data.error || 'Có lỗi xảy ra');
      }
    } catch (err) {
      setError('Lỗi khi hoàn thành hiến máu');
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

  return (
    <div className="blood-addition-overlay">
      <div className="blood-addition-dashboard">
        <div className="dashboard-header">
          <h3>Hoàn thành hiến máu</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="dashboard-content">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="components-section">
              <h4>Chọn thành phần máu và dung tích</h4>
              
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
                </div>
              ))}
            </div>

            <div className="summary-section">
              <h4>Tóm tắt:</h4>
              <div className="summary-list">
                {selectedComponents.map(comp => (
                  <div key={comp.id} className="summary-item">
                    {getComponentName(comp.component_id)} - {getVolumeText(comp.volume_type_id)}
                  </div>
                ))}
              </div>
            </div>

            <div className="dashboard-actions">
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
                {loading ? 'Đang xử lý...' : 'Hoàn thành & Thêm vào kho máu'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BloodAdditionDashboard;
