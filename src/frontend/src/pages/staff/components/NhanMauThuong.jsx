import React from 'react';
import Request from './Request';

function NhanMauThuong({ recipients, loading, onRefresh }) {
    if (loading) return <div>Đang tải danh sách người nhận máu...</div>;
    if (!recipients || recipients.length === 0) return <div>Không có người nhận máu đang chờ xử lý.</div>;

    // Hàm cập nhật trạng thái và refresh danh sách
    const handleUpdateStatus = (id, newStatus) => {
        // Nếu status chuyển thành received hoặc cancelled, cần refresh để loại bỏ khỏi danh sách
        if (newStatus === 'received' || newStatus === 'cancelled') {
            onRefresh && onRefresh();
        }
    };

    return (
        <div>
            <h2>Danh sách người nhận máu thường ({recipients.length})</h2>
            <div style={{ marginBottom: 16, color: '#666' }}>
                Hiển thị các yêu cầu đang chờ xử lý (requested, agree)
            </div>
            {recipients.map(r => (
                <Request key={r.recipient_id} recipient={r} onUpdateStatus={handleUpdateStatus} />
            ))}
        </div>
    );
}

export default NhanMauThuong;