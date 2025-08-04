import React, { useState, useEffect } from 'react';

function HistoryRequest({ recipient }) {
    const [bloodIssuance, setBloodIssuance] = useState(null);
    const [showDetails, setShowDetails] = useState(false);

    // Nếu là status 'received', load thông tin BloodIssuance
    useEffect(() => {
        if (recipient.receive_status === 'received') {
            loadBloodIssuance();
        }
    }, [recipient.recipient_id]);

    const loadBloodIssuance = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:3001/api/recipients/${recipient.recipient_id}/issuance-history`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setBloodIssuance(data);
            }
        } catch (error) {
            console.error('Error loading blood issuance:', error);
        }
    };

    const handleContact = () => {
        window.location.href = `mailto:${recipient.email}`;
    };

    // Hàm chuyển trạng thái sang tiếng Việt
    const getStatusText = (status) => {
        switch (status) {
            case 'received': return 'Đã nhận máu';
            case 'cancelled': return 'Đã hủy';
            default: return status;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'received': return '#4CAF50';
            case 'cancelled': return '#f44336';
            default: return '#999';
        }
    };

    return (
        <div style={{
            border: '1px solid #ddd',
            borderRadius: 8,
            padding: 16,
            marginBottom: 16,
            backgroundColor: recipient.receive_status === 'received' ? '#f8fff8' : '#fff8f8'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                    <div><b>ID:</b> {recipient.recipient_id}</div>
                    <div><b>Họ tên:</b> {recipient.full_name}</div>
                    <div><b>Nhóm máu bệnh nhân:</b> {recipient.blood_type}</div>
                    <div><b>Loại máu cần:</b> {recipient.component_name}</div>
                    <div><b>Ngày đăng ký:</b> {new Date(recipient.registration_date).toLocaleDateString('vi-VN')}</div>
                </div>
                <div style={{ 
                    padding: '4px 12px', 
                    borderRadius: 4, 
                    backgroundColor: getStatusColor(recipient.receive_status),
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '14px'
                }}>
                    {getStatusText(recipient.receive_status)}
                </div>
            </div>

            <div style={{ marginTop: 12 }}>
                <div><b>Email:</b> {recipient.email}</div>
                {recipient.medical_condition && (
                    <div><b>Tình trạng bệnh:</b> {recipient.medical_condition}</div>
                )}
            </div>

            {/* Hiển thị thông tin cấp phát nếu đã nhận máu */}
            {recipient.receive_status === 'received' && bloodIssuance && (
                <div style={{ 
                    marginTop: 12, 
                    padding: 12, 
                    backgroundColor: '#e8f5e8', 
                    borderRadius: 4,
                    border: '1px solid #4CAF50'
                }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#2e7d2e' }}>
                        📋 Thông tin cấp phát máu
                    </h4>
                    <div><b>Mã túi máu:</b> {bloodIssuance.blood_bag_id}</div>
                    <div><b>Nhóm máu túi:</b> {bloodIssuance.blood_type}</div>
                    <div><b>Thể tích:</b> {bloodIssuance.volume_ml}ml</div>
                    <div><b>Người hiến:</b> {bloodIssuance.donor_name}</div>
                    <div><b>Ngày thu thập:</b> {new Date(bloodIssuance.collection_date).toLocaleDateString('vi-VN')}</div>
                    <div><b>Ngày cấp phát:</b> {new Date(bloodIssuance.issued_date).toLocaleDateString('vi-VN')}</div>
                    <div><b>Nhân viên thực hiện:</b> {bloodIssuance.staff_name}</div>
                </div>
            )}

            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <button 
                    onClick={handleContact}
                    style={{
                        backgroundColor: '#2196F3',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: 4,
                        cursor: 'pointer'
                    }}
                >
                    Liên hệ
                </button>
                
                {recipient.receive_status === 'received' && (
                    <button 
                        onClick={() => setShowDetails(!showDetails)}
                        style={{
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: 4,
                            cursor: 'pointer'
                        }}
                    >
                        {showDetails ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                    </button>
                )}
            </div>

            {/* Chi tiết mở rộng */}
            {showDetails && recipient.receive_status === 'received' && (
                <div style={{ 
                    marginTop: 12, 
                    padding: 12, 
                    backgroundColor: '#f5f5f5', 
                    borderRadius: 4,
                    borderLeft: '4px solid #4CAF50'
                }}>
                    <h4 style={{ margin: '0 0 8px 0' }}>📊 Thống kê chi tiết</h4>
                    <div>
                        <b>Thời gian xử lý:</b> {
                            Math.ceil((new Date(bloodIssuance?.issued_date) - new Date(recipient.registration_date)) / (1000 * 60 * 60 * 24))
                        } ngày
                    </div>
                    <div><b>Trạng thái hoàn thành:</b> ✅ Thành công</div>
                    <div><b>Ghi chú:</b> Cấp phát máu hoàn tất theo yêu cầu</div>
                </div>
            )}
        </div>
    );
}

export default HistoryRequest;
