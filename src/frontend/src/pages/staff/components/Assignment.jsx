import React, { useState } from 'react';
import { showSuccessToast, showErrorToast } from '../../../utils/toast';

function Assignment({ assignment, onStatusUpdate, getTaskTypeName }) {
    const [updating, setUpdating] = useState(false);

    const handleUpdateStatus = async () => {
        setUpdating(true);
        const token = localStorage.getItem('token');



        try {
            const res = await fetch(`http://localhost:3001/api/assignment/${assignment.assignment_id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: 'completed' })
            });

            if (res.ok) {
                onStatusUpdate(assignment.assignment_id);
                showSuccessToast('Cập nhật trạng thái thành công!');
            } else {
                const errorData = await res.json();
                console.error('Error response:', errorData);
                showErrorToast(`Cập nhật trạng thái thất bại: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Request error:', error);
            showErrorToast('Có lỗi xảy ra khi cập nhật trạng thái');
        }
        setUpdating(false);
    };

    return (
        <div className={`assignment-card ${assignment.status === 'completed' ? 'completed' : ''}`}>
            <div className="assignment-header">
                <div className="assignment-type">{getTaskTypeName(assignment.task_type)}</div>
                <div className={`assignment-status ${assignment.status === 'completed' ? 'completed' : 'pending'}`}>
                    {assignment.status === 'completed' ? 'Đã hoàn thành' : 'Chưa hoàn thành'}
                </div>
            </div>

            <div className="assignment-info">
                <div className="assignment-info-item">
                    <strong>👤 Người giao:</strong> {assignment.assigned_by_name || 'Chưa xác định'}
                </div>
                <div className="assignment-info-item">
                    <strong>📅 Ngày giao:</strong> {
                        assignment.assigned_date_parsed
                            ? new Date(assignment.assigned_date_parsed).toLocaleDateString('vi-VN')
                            : assignment.assigned_date || 'Chưa xác định'
                    }
                </div>
                {assignment.description && (
                    <div className="assignment-info-item">
                        <strong>📝 Mô tả:</strong> {assignment.description}
                    </div>
                )}
            </div>

            {assignment.status !== 'completed' && (
                <div className="assignment-actions">
                    <button
                        onClick={handleUpdateStatus}
                        disabled={updating}
                        className="btn-complete"
                    >
                        {updating ? '⏳ Đang cập nhật...' : '✅ Đánh dấu đã hoàn thành'}
                    </button>
                </div>
            )}
        </div>
    );
}

export default Assignment;