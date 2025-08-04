import React, { useState, useEffect } from 'react';

function Request({ recipient, onUpdateStatus }) {
    const [updating, setUpdating] = useState(false);
    const [localStatus, setLocalStatus] = useState(recipient.receive_status);
    const [bloodRequests, setBloodRequests] = useState([]);
    const [showBloodBags, setShowBloodBags] = useState(false);
    const [availableBloodBags, setAvailableBloodBags] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [hasAvailableBlood, setHasAvailableBlood] = useState(false);
    const [checkingAvailability, setCheckingAvailability] = useState(true);

    const handleUpdateStatus = async (status) => {
        setUpdating(true);
        setLocalStatus(status);
        try {
            const res = await fetch(`http://localhost:3001/api/recipients/${recipient.recipient_id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ receive_status: status })
            });
            if (res.ok) {
                onUpdateStatus && onUpdateStatus(recipient.recipient_id, status);
            } else {
                alert('Cập nhật trạng thái thất bại');
            }
        } catch {
            alert('Có lỗi xảy ra');
        }
        setUpdating(false);
    };

    const handleAgree = async () => {
        setUpdating(true);
        try {
            const token = localStorage.getItem('token');
            // Gọi API đồng ý yêu cầu (tạo BloodRequest)
            const res = await fetch(`http://localhost:3001/api/recipients/${recipient.recipient_id}/agree`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                setLocalStatus('agree');
                onUpdateStatus && onUpdateStatus(recipient.recipient_id, 'agree');
                alert('Đã đồng ý yêu cầu và tạo BloodRequest thành công!');
            } else {
                const errorData = await res.json();
                alert('Đồng ý thất bại: ' + (errorData.error || 'Có lỗi xảy ra'));
            }
        } catch (error) {
            console.error('Error in handleAgree:', error);
            alert('Có lỗi xảy ra: ' + error.message);
        }
        setUpdating(false);
    };

    // Xử lý chọn túi máu trực tiếp
    const handleSelectBloodBag = async (selectedBag) => {
        if (!selectedBag) return;

        const confirmMessage = `Bạn có chắc chắn muốn chọn túi máu #${selectedBag.blood_bag_id} (${selectedBag.blood_type}) cho bệnh nhân ${recipient.full_name}?`;
        if (!window.confirm(confirmMessage)) {
            return;
        }

        setUpdating(true);
        try {
            const token = localStorage.getItem('token');

            // Bước 1: Đồng ý yêu cầu (tạo BloodRequest)
            const agreeRes = await fetch(`http://localhost:3001/api/recipients/${recipient.recipient_id}/agree`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!agreeRes.ok) {
                const errorData = await agreeRes.json();
                throw new Error(errorData.error || 'Không thể đồng ý yêu cầu');
            }

            const agreeData = await agreeRes.json();

            // Bước 2: Hoàn thành cấp phát máu với túi máu đã chọn
            const completeRes = await fetch(`http://localhost:3001/api/recipients/blood-issuance/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    request_id: agreeData.request_id,
                    blood_bag_id: selectedBag.blood_bag_id
                })
            });

            if (!completeRes.ok) {
                const errorData = await completeRes.json();
                throw new Error(errorData.error || 'Không thể hoàn thành cấp phát máu');
            }

            // Cập nhật UI sau khi thành công
            setLocalStatus('received');
            alert(`Đã chọn túi máu #${selectedBag.blood_bag_id} và hoàn thành cấp phát thành công!`);
            onUpdateStatus && onUpdateStatus(recipient.recipient_id, 'received');

        } catch (error) {
            console.error('Error selecting blood bag:', error);
            alert('Có lỗi xảy ra: ' + error.message);
        } finally {
            setUpdating(false);
        }
    };

    const loadBloodRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:3001/api/recipients/${recipient.recipient_id}/blood-requests`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setBloodRequests(data);
            }
        } catch (error) {
            console.error('Error loading blood requests:', error);
        }
    };

    const loadAvailableBloodBags = async (bloodGroupId, componentId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:3001/api/recipients/blood-bags/available?blood_group_id=${bloodGroupId}&component_id=${componentId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAvailableBloodBags(data);
                setShowBloodBags(true);
            }
        } catch (error) {
            console.error('Error loading blood bags:', error);
        }
    };

    const handleCompleteIssuance = async (bloodBagId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:3001/api/recipients/blood-issuance/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    request_id: selectedRequest.request_id,
                    blood_bag_id: bloodBagId
                })
            });
            if (res.ok) {
                setLocalStatus('received');
                setShowBloodBags(false);
                setBloodRequests([]);
                alert('Hoàn thành cấp phát máu thành công!');
                onUpdateStatus && onUpdateStatus(recipient.recipient_id, 'received');
            } else {
                alert('Hoàn thành thất bại');
            }
        } catch (error) {
            console.error('Error completing issuance:', error);
            alert('Có lỗi xảy ra');
        }
    };

    // Kiểm tra tính khả dụng của máu
    const checkBloodAvailability = async () => {
        try {
            setCheckingAvailability(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:3001/api/recipients/blood-bags/check-availability?blood_group_id=${recipient.blood_group_id}&component_id=${recipient.component_id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setHasAvailableBlood(data.available);
                // Lưu trữ thông tin túi máu khả dụng để hiển thị
                setAvailableBloodBags(data.blood_bags || []);

                // Hiển thị thông tin về tính tương thích
                if (data.available) {
                    // Thông tin chi tiết về túi máu khả dụng sẽ được hiển thị khi cần
                    setHasAvailableBlood(true);
                } else {
                    setHasAvailableBlood(false);
                }
            } else {
                setHasAvailableBlood(false);
            }
        } catch (error) {
            console.error('Error checking blood availability:', error);
            setHasAvailableBlood(false);
        } finally {
            setCheckingAvailability(false);
        }
    };

    // Load blood requests when status becomes 'received'
    useEffect(() => {
        if (localStatus === 'received') {
            loadBloodRequests();
        }
    }, [localStatus]);

    // Kiểm tra tính khả dụng khi component mount và khi là status 'requested'
    useEffect(() => {
        if (localStatus === 'requested') {
            checkBloodAvailability();
        }
    }, [recipient.blood_group_id, recipient.component_id, localStatus]);

    const handleContact = () => {
        window.location.href = `mailto:${recipient.email}`;
    };

    // Hàm chuyển trạng thái sang tiếng Việt
    const getStatusText = (status) => {
        switch (status) {
            case 'received': return 'Đã nhận';
            case 'cancelled': return 'Đã từ chối';
            case 'requested': return 'Đang chờ xử lý';
            default: return status;
        }
    };

    const isDisabled = updating || localStatus === 'received' || localStatus === 'cancelled';
    const fadedStyle = isDisabled ? { opacity: 0.5, pointerEvents: 'none' } : {};

    return (
        <>
            <div style={{
                border: '1px solid #ccc',
                borderRadius: 8,
                padding: 16,
                marginBottom: 16
            }}>
                <div><b>ID:</b> {recipient.recipient_id}</div>
                <div><b>Họ tên:</b> {recipient.full_name}</div>
                <div><b>Nhóm máu bệnh nhân:</b> {recipient.blood_type}</div>
                <div><b>Loại máu cần:</b> {recipient.component_name}</div>
                <div><b>Ngày đăng ký:</b> {new Date(recipient.registration_date).toLocaleDateString('vi-VN')}</div>
                <div><b>Trạng thái:</b> {getStatusText(localStatus)}</div>
                <div><b>Email:</b> {recipient.email}</div>

                {/* Hiển thị thông tin tình trạng kho máu */}
                {localStatus === 'requested' && (
                    <div style={{
                        marginTop: 8,
                        padding: 8,
                        borderRadius: 4,
                        backgroundColor: checkingAvailability ? '#f0f0f0' : (hasAvailableBlood ? '#e8f5e8' : '#ffe8e8'),
                        border: `1px solid ${checkingAvailability ? '#ccc' : (hasAvailableBlood ? '#4CAF50' : '#f44336')}`
                    }}>
                        <b>Tình trạng kho máu:</b> {
                            checkingAvailability ? 'Đang kiểm tra...' : (
                                hasAvailableBlood ? (
                                    <>
                                        ✅ Có {availableBloodBags.length} túi máu phù hợp
                                        {recipient.component_name.includes('Huyết tương') &&
                                            <div style={{ marginTop: 4, fontSize: '0.9em', color: '#666' }}>
                                                (Lưu ý: Với huyết tương, yếu tố Rh không ảnh hưởng đến tính tương thích)
                                            </div>
                                        }

                                        {/* Hiển thị danh sách túi máu phù hợp */}
                                        {availableBloodBags.length > 0 && (
                                            <div style={{ marginTop: 12 }}>
                                                <b>Danh sách túi máu có sẵn:</b>
                                                <div style={{
                                                    marginTop: 8,
                                                    maxHeight: '200px',
                                                    overflowY: 'auto',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px',
                                                    backgroundColor: '#fff'
                                                }}>
                                                    {availableBloodBags.map((bag, index) => (
                                                        <div key={bag.blood_bag_id} style={{
                                                            padding: '8px 12px',
                                                            borderBottom: index < availableBloodBags.length - 1 ? '1px solid #eee' : 'none',
                                                            fontSize: '0.9em',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center'
                                                        }}>
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ fontWeight: 'bold', color: '#2196F3' }}>
                                                                    Túi máu #{bag.blood_bag_id} - {bag.blood_type}
                                                                </div>
                                                                <div style={{ color: '#666', marginTop: '2px' }}>
                                                                    🩸 Thể tích: {bag.volume_ml}ml |
                                                                    👤 Người hiến: {bag.donor_name} |
                                                                    📅 Thu thập: {new Date(bag.collection_date).toLocaleDateString('vi-VN')} |
                                                                    ⏰ Hết hạn: {new Date(bag.expiry_date).toLocaleDateString('vi-VN')}
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => handleSelectBloodBag(bag)}
                                                                disabled={updating}
                                                                style={{
                                                                    backgroundColor: updating ? '#cccccc' : '#4CAF50',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    padding: '6px 12px',
                                                                    borderRadius: 4,
                                                                    cursor: updating ? 'not-allowed' : 'pointer',
                                                                    fontSize: '0.9em',
                                                                    marginLeft: '12px',
                                                                    minWidth: '60px'
                                                                }}
                                                            >
                                                                {updating ? '...' : 'Chọn'}
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        ❌ Không có túi máu phù hợp
                                        {recipient.component_name.includes('Huyết tương') &&
                                            <div style={{ marginTop: 4, fontSize: '0.9em', color: '#666' }}>
                                                (Lưu ý: Với huyết tương, yếu tố Rh không ảnh hưởng đến tính tương thích)
                                            </div>
                                        }
                                    </>
                                )
                            )
                        }
                    </div>
                )}

                {localStatus === 'requested' && (
                    <>
                        {/* Chỉ hiển thị nút đồng ý khi không có túi máu phù hợp */}
                        {(!hasAvailableBlood && !checkingAvailability) && (
                            <div style={{ marginTop: 8, padding: 8, backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: 4 }}>
                                <div style={{ fontSize: '0.9em', color: '#856404', marginBottom: 8 }}>
                                    ⚠️ Không có túi máu phù hợp trong kho. Bạn có thể đồng ý yêu cầu để tạo BloodRequest và chờ có túi máu phù hợp.
                                </div>
                                <button
                                    onClick={handleAgree}
                                    disabled={updating}
                                    style={{
                                        marginRight: 8,
                                        backgroundColor: '#ffc107',
                                        color: 'white',
                                        border: 'none',
                                        padding: '8px 16px',
                                        borderRadius: 4,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Đồng ý (Tạo yêu cầu)
                                </button>
                            </div>
                        )}

                        {/* Hiển thị hướng dẫn khi có túi máu */}
                        {hasAvailableBlood && (
                            <div style={{ marginTop: 8, padding: 8, backgroundColor: '#d4edda', border: '1px solid #c3e6cb', borderRadius: 4 }}>
                                <div style={{ fontSize: '0.9em', color: '#155724' }}>
                                    ✅ Có túi máu phù hợp! Vui lòng chọn một túi máu cụ thể để hoàn thành cấp phát.
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => handleUpdateStatus('cancelled')}
                            disabled={updating}
                            style={{
                                marginRight: 8,
                                marginTop: 8,
                                backgroundColor: '#f44336',
                                color: 'white',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: 4
                            }}
                        >
                            Từ chối
                        </button>
                    </>
                )}

                {localStatus === 'received' && bloodRequests.length > 0 && (
                    <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                        <h4>Yêu cầu máu đã tạo:</h4>
                        {bloodRequests.map(request => (
                            <div key={request.request_id} style={{ marginBottom: 8 }}>
                                <div><b>Mã yêu cầu:</b> {request.request_id}</div>
                                <div><b>Loại máu:</b> {request.blood_type} - {request.component_name}</div>
                                <div><b>Số lượng:</b> {request.quantity}</div>
                                <div><b>Ngày yêu cầu:</b> {new Date(request.request_date).toLocaleDateString('vi-VN')}</div>
                                <button
                                    onClick={() => {
                                        setSelectedRequest(request);
                                        loadAvailableBloodBags(request.blood_group_id, request.component_id);
                                    }}
                                    style={{ marginTop: 8, backgroundColor: '#2196F3', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 4 }}
                                >
                                    Chọn túi máu
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <button onClick={handleContact} style={{ marginTop: 8 }}>
                    Liên hệ
                </button>
            </div>

            {/* Modal chọn túi máu */}
            {showBloodBags && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
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
                            onClick={() => setShowBloodBags(false)}
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

                        <h3>Chọn túi máu phù hợp</h3>
                        {availableBloodBags.length === 0 ? (
                            <p>Không có túi máu phù hợp trong kho.</p>
                        ) : (
                            <div>
                                {availableBloodBags.map(bag => (
                                    <div key={bag.blood_bag_id} style={{
                                        border: '1px solid #ddd',
                                        borderRadius: 4,
                                        padding: 12,
                                        marginBottom: 12
                                    }}>
                                        <div><b>Mã túi:</b> {bag.blood_bag_id}</div>
                                        <div><b>Nhóm máu:</b> {bag.blood_type}</div>
                                        <div><b>Thể tích:</b> {bag.volume_ml}ml</div>
                                        <div><b>Người hiến:</b> {bag.donor_name}</div>
                                        <div><b>Ngày thu thập:</b> {new Date(bag.collection_date).toLocaleDateString('vi-VN')}</div>
                                        <div><b>Hạn sử dụng:</b> {new Date(bag.expiry_date).toLocaleDateString('vi-VN')}</div>
                                        <button
                                            onClick={() => handleCompleteIssuance(bag.blood_bag_id)}
                                            style={{
                                                marginTop: 8,
                                                backgroundColor: '#4CAF50',
                                                color: 'white',
                                                border: 'none',
                                                padding: '8px 16px',
                                                borderRadius: 4,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Chọn túi này
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

export default Request;