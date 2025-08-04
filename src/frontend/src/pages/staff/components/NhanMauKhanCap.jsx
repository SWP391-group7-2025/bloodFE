import React, { useState, useEffect } from 'react';
import CreateEmergencyRequestModal from './CreateEmergencyRequestModal';
import { showSuccessToast, showErrorToast, showWarningToast, showInfoToast } from '../../../utils/toast';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './NhanMauKhanCap.css';

function NhanMauKhanCap() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Blood availability states
    const [availabilityStatus, setAvailabilityStatus] = useState({});
    const [availableBloodBags, setAvailableBloodBags] = useState({});
    const [showBloodBags, setShowBloodBags] = useState({});
    const [checkingAvailability, setCheckingAvailability] = useState({});

    // Fetch danh sách yêu cầu từ API
    useEffect(() => {
        const fetchPartnerRequests = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('Không tìm thấy token xác thực');
                }

                const response = await fetch('http://localhost:3001/api/partner/all-requests', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        throw new Error('Phiên đăng nhập đã hết hạn');
                    } else if (response.status === 403) {
                        throw new Error('Bạn không có quyền truy cập');
                    }
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                const requestList = Array.isArray(data) ? data : [];
                setRequests(requestList);

                // Check blood availability for each request
                requestList.forEach(request => {
                    if (request.blood_group_id && request.component_id && request.status === 'pending') {
                        checkBloodAvailability(request.partner_req_id, request.blood_group_id, request.component_id);
                    }
                });
            } catch (error) {
                console.error('Error fetching partner requests:', error);
                setError(error.message);
                setRequests([]);
            } finally {
                setLoading(false);
            }
        };

        fetchPartnerRequests();
    }, []);

    // Check blood availability for a specific request
    const checkBloodAvailability = async (requestId, bloodGroupId, componentId) => {
        try {
            setCheckingAvailability(prev => ({ ...prev, [requestId]: true }));
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:3001/api/partner/blood-bags/check-availability?blood_group_id=${bloodGroupId}&component_id=${componentId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAvailabilityStatus(prev => ({ ...prev, [requestId]: data.available }));

                // Fetch detailed blood bags if available
                if (data.available) {
                    await fetchAvailableBloodBags(requestId, bloodGroupId, componentId);
                }
            } else {
                setAvailabilityStatus(prev => ({ ...prev, [requestId]: false }));
            }
        } catch (error) {
            console.error('Error checking blood availability:', error);
            setAvailabilityStatus(prev => ({ ...prev, [requestId]: false }));
        } finally {
            setCheckingAvailability(prev => ({ ...prev, [requestId]: false }));
        }
    };

    // Fetch available blood bags for a request
    const fetchAvailableBloodBags = async (requestId, bloodGroupId, componentId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:3001/api/partner/blood-bags/available?blood_group_id=${bloodGroupId}&component_id=${componentId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAvailableBloodBags(prev => ({ ...prev, [requestId]: data }));
            }
        } catch (error) {
            console.error('Error fetching available blood bags:', error);
        }
    };

    // Issue blood for partner request
    const issueBloodForRequest = async (requestId, bloodBagId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3001/api/partner/request/${requestId}/issue-blood`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ blood_bag_id: bloodBagId })
            });

            if (response.ok) {
                const result = await response.json();

                // Update the request in state with issued bag info
                setRequests(prev => prev.map(req =>
                    req.partner_req_id === requestId
                        ? { ...req, status: 'done', issued_bag_info: result.issued_bag_info }
                        : req
                ));

                // Hide modal
                hideBloodBagsModal(requestId);

                showSuccessToast('Đã cấp phát túi máu thành công!');
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Không thể cấp phát túi máu');
            }
        } catch (error) {
            console.error('Error issuing blood:', error);
            showErrorToast('Lỗi khi cấp phát túi máu: ' + error.message);
        }
    };

    // Show blood bags modal
    const showBloodBagsModal = (requestId) => {
        setShowBloodBags(prev => ({ ...prev, [requestId]: true }));
    };

    // Hide blood bags modal
    const hideBloodBagsModal = (requestId) => {
        setShowBloodBags(prev => ({ ...prev, [requestId]: false }));
    };

    // Cập nhật trạng thái yêu cầu
    const updateRequestStatus = async (requestId, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3001/api/partner/request/${requestId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                // Cập nhật state local
                setRequests(prev => prev.map(req =>
                    req.partner_req_id === requestId
                        ? { ...req, status: newStatus }
                        : req
                ));
                showSuccessToast(`Đã cập nhật trạng thái thành "${newStatus}"`);
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Không thể cập nhật trạng thái');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            showErrorToast('Lỗi khi cập nhật trạng thái: ' + error.message);
        }
    };

    // Xử lý tạo yêu cầu mới
    const handleCreateNewRequest = () => {
        setShowCreateModal(true);
    };

    // Xử lý khi tạo yêu cầu thành công
    const handleRequestCreated = () => {
        // Reload danh sách yêu cầu
        setLoading(true);
        const fetchPartnerRequests = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('Không tìm thấy token xác thực');
                }

                const response = await fetch('http://localhost:3001/api/partner/all-requests', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        throw new Error('Phiên đăng nhập đã hết hạn');
                    } else if (response.status === 403) {
                        throw new Error('Bạn không có quyền truy cập');
                    }
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                const requestList = Array.isArray(data) ? data : [];
                setRequests(requestList);

                // Check blood availability for each request
                requestList.forEach(request => {
                    if (request.blood_group_id && request.component_id && request.status === 'pending') {
                        checkBloodAvailability(request.partner_req_id, request.blood_group_id, request.component_id);
                    }
                });
            } catch (error) {
                console.error('Error fetching partner requests:', error);
                setError(error.message);
                setRequests([]);
            } finally {
                setLoading(false);
            }
        };

        fetchPartnerRequests();
    };

    // Format ngày tháng
    const formatDate = (dateString) => {
        if (!dateString) return 'Chưa xác định';
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Render trạng thái với màu sắc
    const getStatusBadge = (status) => {
        const statusLabels = {
            'pending': 'Chờ xử lý',
            'done': 'Hoàn thành',
            'cancel': 'Đã hủy'
        };

        const label = statusLabels[status] || statusLabels['pending'];
        const className = `status-badge status-${status || 'pending'}`;

        return (
            <span className={className}>
                {label}
            </span>
        );
    };

    // Render loading state
    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-text">
                    Đang tải danh sách yêu cầu máu khẩn cấp...
                </div>
            </div>
        );
    }

    // Render error state
    if (error) {
        return (
            <div className="error-container">
                <div className="error-text">
                    Lỗi: {error}
                </div>
            </div>
        );
    }

    return (
        <div className="nhan-mau-khan-cap">
            <div className="page-header">
                <h2 className="page-title">
                    Danh sách yêu cầu máu khẩn cấp
                </h2>
                <button
                    className="create-request-btn"
                    onClick={handleCreateNewRequest}
                >
                    <span>+</span>
                    Tạo yêu cầu khẩn cấp
                </button>
            </div>

            {requests.length === 0 ? (
                <div className="no-requests">
                    Không có yêu cầu khẩn cấp nào.
                </div>
            ) : (
                <div className="requests-list">
                    {requests.map(request => (
                        <div key={request.partner_req_id} className="request-card">
                            {/* Header */}
                            <div className="request-header">
                                <div className="request-id">
                                    Yêu cầu #{request.partner_req_id}
                                </div>
                                <div>
                                    {getStatusBadge(request.status)}
                                </div>
                            </div>

                            {/* Body */}
                            <div className="request-body">
                                {/* Thông tin bệnh nhân */}
                                <div className="info-section patient-info">
                                    <h4 className="info-title">
                                        Thông tin bệnh nhân
                                    </h4>
                                    <div className="info-content">
                                        <p><strong>Họ tên:</strong> {request.full_name}</p>
                                        <p><strong>Email:</strong> {request.email}</p>
                                        <p><strong>Điện thoại:</strong> {request.phone}</p>
                                        <p><strong>Giới tính:</strong> {
                                            request.gender === 'male' ? 'Nam' :
                                                request.gender === 'female' ? 'Nữ' :
                                                    request.gender
                                        }</p>
                                        <p><strong>Ngày sinh:</strong> {formatDate(request.date_of_birth)}</p>
                                        <p><strong>Địa chỉ:</strong> {request.address}</p>
                                    </div>
                                </div>

                                {/* Thông tin yêu cầu */}
                                <div className="info-section request-info">
                                    <h4 className="info-title">
                                        Thông tin yêu cầu
                                    </h4>
                                    <div className="info-content">
                                        <p><strong>Nhóm máu:</strong> {request.blood_type || 'Chưa xác định'}</p>
                                        <p><strong>Thành phần máu:</strong> {request.component_name || 'Chưa xác định'}</p>
                                        <p><strong>Ngày yêu cầu:</strong> {formatDate(request.request_date)}</p>
                                        <p><strong>Partner:</strong> {request.partner_name || 'Chưa xác định'}</p>
                                        <p><strong>Email partner:</strong> {request.partner_email || 'Chưa xác định'}</p>

                                        {/* Blood availability status */}
                                        {request.status === 'pending' && request.blood_group_id && request.component_id && (
                                            <div className="blood-availability-status" style={{
                                                marginTop: 12,
                                                padding: 8,
                                                borderRadius: 4,
                                                backgroundColor: checkingAvailability[request.partner_req_id] ? '#f0f0f0' :
                                                    (availabilityStatus[request.partner_req_id] ? '#e8f5e8' : '#ffe8e8'),
                                                border: `1px solid ${checkingAvailability[request.partner_req_id] ? '#ccc' :
                                                    (availabilityStatus[request.partner_req_id] ? '#4CAF50' : '#f44336')}`
                                            }}>
                                                <p><strong>Tình trạng kho máu:</strong> {
                                                    checkingAvailability[request.partner_req_id] ? 'Đang kiểm tra...' : (
                                                        availabilityStatus[request.partner_req_id] ? (
                                                            <>
                                                                ✅ Có {availableBloodBags[request.partner_req_id]?.length || 0} túi máu phù hợp
                                                                {request.component_name?.includes('Huyết tương') && (
                                                                    <div style={{ marginTop: 4, fontSize: '0.9em', color: '#666' }}>
                                                                        💡 Huyết tương có quy tắc tương hợp ngược lại với hồng cầu
                                                                    </div>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <>❌ Không có túi máu phù hợp trong kho</>
                                                        )
                                                    )
                                                }</p>

                                                {availabilityStatus[request.partner_req_id] && (
                                                    <button
                                                        onClick={() => showBloodBagsModal(request.partner_req_id)}
                                                        style={{
                                                            marginTop: 8,
                                                            backgroundColor: '#2196F3',
                                                            color: 'white',
                                                            border: 'none',
                                                            padding: '6px 12px',
                                                            borderRadius: 4,
                                                            cursor: 'pointer',
                                                            fontSize: '0.9em'
                                                        }}
                                                    >
                                                        Chọn túi máu để cấp phát ({availableBloodBags[request.partner_req_id]?.length || 0})
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {/* Thông tin túi máu đã cấp phát cho requests hoàn thành */}
                                        {request.status === 'done' && (request.blood_bag_id || request.donor_name) && (
                                            <div className="issued-blood-info" style={{
                                                marginTop: 12,
                                                padding: 16,
                                                borderRadius: 8,
                                                backgroundColor: '#f0f9ff',
                                                border: '2px solid #0ea5e9',
                                                boxShadow: '0 2px 8px rgba(14, 165, 233, 0.1)'
                                            }}>
                                                <h5 style={{
                                                    margin: '0 0 12px 0',
                                                    color: '#0369a1',
                                                    fontSize: '1.1em',
                                                    fontWeight: 'bold',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                }}>
                                                    🩸 Thông tin cấp phát máu
                                                </h5>
                                                <div style={{
                                                    fontSize: '0.9em',
                                                    lineHeight: '1.6',
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                                    gap: '8px'
                                                }}>
                                                    <p style={{ margin: '4px 0' }}>
                                                        <strong style={{ color: '#0369a1' }}>Mã túi máu:</strong>
                                                        <span style={{
                                                            background: '#dbeafe',
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            marginLeft: '6px',
                                                            fontFamily: 'monospace',
                                                            fontWeight: 'bold'
                                                        }}>
                                                            #{request.blood_bag_id}
                                                        </span>
                                                    </p>
                                                    <p style={{ margin: '4px 0' }}>
                                                        <strong style={{ color: '#0369a1' }}>Nhóm máu túi:</strong> {request.blood_type}
                                                    </p>
                                                    <p style={{ margin: '4px 0' }}>
                                                        <strong style={{ color: '#0369a1' }}>Thể tích:</strong> {request.volume_ml}ml
                                                    </p>
                                                    <p style={{ margin: '4px 0' }}>
                                                        <strong style={{ color: '#0369a1' }}>Người hiến:</strong> {request.donor_name}
                                                    </p>
                                                    <p style={{ margin: '4px 0' }}>
                                                        <strong style={{ color: '#0369a1' }}>Email người hiến:</strong> {request.donor_email}
                                                    </p>
                                                    <p style={{ margin: '4px 0' }}>
                                                        <strong style={{ color: '#0369a1' }}>SĐT người hiến:</strong> {request.donor_phone}
                                                    </p>
                                                    <p style={{ margin: '4px 0' }}>
                                                        <strong style={{ color: '#0369a1' }}>Ngày thu thập:</strong> {
                                                            request.collection_date ?
                                                                new Date(request.collection_date).toLocaleDateString('vi-VN') :
                                                                'Chưa xác định'
                                                        }
                                                    </p>
                                                    <p style={{ margin: '4px 0' }}>
                                                        <strong style={{ color: '#0369a1' }}>Hạn sử dụng:</strong> {
                                                            request.expiry_date ?
                                                                new Date(request.expiry_date).toLocaleDateString('vi-VN') :
                                                                'Chưa xác định'
                                                        }
                                                    </p>
                                                </div>
                                                <div style={{
                                                    marginTop: '12px',
                                                    padding: '8px 12px',
                                                    backgroundColor: '#dcfce7',
                                                    borderRadius: '6px',
                                                    fontSize: '0.85em',
                                                    color: '#166534',
                                                    fontWeight: '500'
                                                }}>
                                                    ✅ Túi máu đã được cấp phát thành công cho bệnh nhân
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Ghi chú nếu có */}
                            {request.notes && (
                                <div className="notes-section">
                                    <strong>Ghi chú:</strong> {request.notes}
                                </div>
                            )}

                            {/* Action buttons cho staff */}
                            <div className="actions-section">
                                {request.status === 'pending' && (
                                    <>
                                        {availabilityStatus[request.partner_req_id] && (
                                            <button
                                                onClick={() => showBloodBagsModal(request.partner_req_id)}
                                                className="action-button btn-issue-blood"
                                                style={{
                                                    backgroundColor: '#4CAF50',
                                                    color: 'white',
                                                    marginRight: '8px'
                                                }}
                                            >
                                                Cấp phát túi máu
                                            </button>
                                        )}
                                        <button
                                            onClick={() => updateRequestStatus(request.partner_req_id, 'cancel')}
                                            className="action-button btn-reject"
                                        >
                                            Hủy bỏ
                                        </button>
                                    </>
                                )}
                                {request.status === 'done' && (
                                    <div style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                                        ✅ Đã hoàn thành cấp phát
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal tạo yêu cầu mới */}
            <CreateEmergencyRequestModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onRequestCreated={handleRequestCreated}
            />

            {/* Blood bags detail modals */}
            {Object.keys(showBloodBags).map(requestId => {
                if (!showBloodBags[requestId]) return null;

                const request = requests.find(r => r.partner_req_id.toString() === requestId);
                const bloodBags = availableBloodBags[requestId] || [];

                return (
                    <div key={requestId} style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}>
                        <div style={{
                            background: '#fff',
                            padding: 24,
                            borderRadius: 8,
                            maxWidth: '80vw',
                            maxHeight: '80vh',
                            overflow: 'auto',
                            position: 'relative'
                        }}>
                            <button
                                onClick={() => hideBloodBagsModal(requestId)}
                                style={{
                                    position: 'absolute',
                                    top: 12,
                                    right: 12,
                                    background: '#f44336',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: 32,
                                    height: 32,
                                    fontSize: 18,
                                    cursor: 'pointer'
                                }}
                            >×</button>

                            <h3>Chọn túi máu để cấp phát - Yêu cầu #{requestId}</h3>
                            <p><strong>Bệnh nhân:</strong> {request?.full_name}</p>
                            <p><strong>Nhóm máu cần:</strong> {request?.blood_type}</p>
                            <p><strong>Thành phần cần:</strong> {request?.component_name}</p>

                            <div style={{ marginTop: 16 }}>
                                {bloodBags.length === 0 ? (
                                    <p>Không có túi máu phù hợp trong kho.</p>
                                ) : (
                                    <div>
                                        <h4>Chọn túi máu để cấp phát ({bloodBags.length}):</h4>
                                        {bloodBags.map((bag, index) => (
                                            <div key={bag.blood_bag_id} style={{
                                                border: '1px solid #ddd',
                                                borderRadius: 4,
                                                padding: 12,
                                                marginBottom: 12,
                                                backgroundColor: '#f9f9f9',
                                                position: 'relative'
                                            }}>
                                                <div style={{ fontWeight: 'bold', color: '#2196F3', marginBottom: 4 }}>
                                                    Túi máu #{bag.blood_bag_id} - {bag.blood_type}
                                                </div>
                                                <div style={{ fontSize: '0.9em', color: '#666' }}>
                                                    🩸 <strong>Thể tích:</strong> {bag.volume_ml}ml |
                                                    👤 <strong>Người hiến:</strong> {bag.donor_name} |
                                                    📅 <strong>Thu thập:</strong> {new Date(bag.collection_date).toLocaleDateString('vi-VN')} |
                                                    ⏰ <strong>Hết hạn:</strong> {new Date(bag.expiry_date).toLocaleDateString('vi-VN')}
                                                </div>
                                                <div style={{
                                                    marginTop: 8,
                                                    padding: 6,
                                                    backgroundColor: '#e8f5e8',
                                                    borderRadius: 4,
                                                    fontSize: '0.85em',
                                                    color: '#155724'
                                                }}>
                                                    ✅ Tương hợp với nhóm máu {request?.blood_type}
                                                </div>

                                                {/* Issue blood button */}
                                                <button
                                                    onClick={() => issueBloodForRequest(requestId, bag.blood_bag_id)}
                                                    style={{
                                                        position: 'absolute',
                                                        top: 12,
                                                        right: 12,
                                                        backgroundColor: '#4CAF50',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '8px 16px',
                                                        borderRadius: 4,
                                                        cursor: 'pointer',
                                                        fontSize: '0.9em',
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    Cấp phát túi này
                                                </button>
                                            </div>
                                        ))}

                                        <div style={{
                                            marginTop: 16,
                                            padding: 12,
                                            backgroundColor: '#e3f2fd',
                                            border: '1px solid #2196F3',
                                            borderRadius: 4
                                        }}>
                                            <strong>💡 Hướng dẫn:</strong> Nhấp vào nút "Cấp phát túi này" để chọn túi máu cho yêu cầu khẩn cấp này. Hệ thống sẽ tự động cập nhật trạng thái và ghi nhận thông tin cấp phát.
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Toast Container */}
            <ToastContainer />
        </div>
    );
}

export default NhanMauKhanCap;