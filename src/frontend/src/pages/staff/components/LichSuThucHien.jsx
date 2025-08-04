import React from 'react';
import HistoryRequest from './HistoryRequest';

function LichSuThucHien({ recipients, loading }) {
    if (loading) return <div>Đang tải lịch sử thực hiện...</div>;
    if (!recipients || recipients.length === 0) return <div>Không có lịch sử thực hiện nào.</div>;

    return (
        <div>
            <h2>Lịch sử thực hiện ({recipients.length})</h2>
            <div style={{ marginBottom: 16, color: '#666' }}>
                Hiển thị các yêu cầu nhận máu đã hoàn thành hoặc đã hủy
            </div>
            {recipients.map(r => (
                <HistoryRequest key={r.recipient_id} recipient={r} />
            ))}
        </div>
    );
}

export default LichSuThucHien;
