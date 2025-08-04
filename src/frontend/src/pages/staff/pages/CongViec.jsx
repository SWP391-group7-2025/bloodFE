// src/frontend/src/pages/staff/CongViec.jsx
import React, { useEffect, useState } from 'react';
import LichSuCongViec from '../components/LichSuCongViec';
import Assignment from '../components/Assignment';
import './CongViec.css';

function CongViec() {
    const today = new Date();
    const dateStr = today.toLocaleDateString('vi-VN');

    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        setLoading(true);

        // Lấy user ID từ token để gọi API pending tasks
        const getUserIdFromToken = () => {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                return payload.userId || payload.user_id;
            } catch (error) {
                console.error('Error parsing token:', error);
                return null;
            }
        };

        const userId = getUserIdFromToken();

        if (userId) {
            // Gọi API để lấy các công việc chưa hoàn thành
            fetch(`http://localhost:3001/api/assignment/staff/${userId}/pending-tasks`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            })
                .then(res => res.json())
                .then(data => {
                    // Xử lý dữ liệu để parse ngày về định dạng chuẩn
                    const processedData = data.map(item => ({
                        ...item,
                        assigned_date_parsed: parseCustomDate(item.assigned_date)
                    }));
                    setAssignments(processedData);
                    setLoading(false);
                    const allowedTaskTypes = Array.from(new Set(data.map(a => a.task_type)));
                    if (allowedTaskTypes.length > 0 && allowedTaskTypes[0]) {
                        localStorage.setItem('allowedTaskTypes', JSON.stringify(allowedTaskTypes));
                    }
                })
                .catch(() => {
                    setAssignments([]);
                    setLoading(false);
                });
        } else {
            setAssignments([]);
            setLoading(false);
        }
    }, []);

    // Hàm để parse định dạng ngày từ "13:20:07 16/7/2025" thành định dạng chuẩn
    function parseCustomDate(str) {
        if (!str) return null;
        const match = str.match(/(\d{2}):(\d{2}):(\d{2}) (\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (!match) return null;
        const [_, hh, mm, ss, d, m, y] = match;
        // Pad day and month với 0 nếu cần
        const day = d.padStart(2, '0');
        const month = m.padStart(2, '0');
        return `${y}-${month}-${day}T${hh}:${mm}:${ss}`;
    }

    function getTaskTypeName(type) {
        switch (type) {
            case 'blood_testing': return 'Quản lý kho máu';
            case 'blood_collection': return 'Quản lý hiến máu';
            case 'donation_management': return 'Quản lý nhận máu';
            default: return type;
        }
    }

    // Hàm cập nhật trạng thái assignment trong state
    const handleStatusUpdate = (assignmentId) => {
        // Xóa assignment khỏi danh sách vì nó đã hoàn thành
        setAssignments(prev =>
            prev.filter(a => a.assignment_id !== assignmentId)
        );
    };

    return (
        <div className="congviec-container">
            {/* Modal hiển thị lịch sử công việc */}
            {showHistory && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <button
                            onClick={() => setShowHistory(false)}
                            className="modal-close"
                            title="Đóng"
                        >×</button>
                        <LichSuCongViec />
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="congviec-header">
                <div className="congviec-title">
                    Công Việc Hôm Nay
                </div>
                <div className="congviec-date">
                    {dateStr}
                </div>
            </div>

            {/* Actions */}
            <div className="congviec-actions">
                <button onClick={() => setShowHistory(true)} className="btn-primary">
                    📜 Xem lịch sử công việc
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <div className="loading-text">Đang tải công việc...</div>
                </div>
            ) : assignments.length === 0 ? (
                <div className="no-tasks-container">
                    <div className="no-tasks-icon">✅</div>
                    <div className="no-tasks-text">Không có công việc chưa hoàn thành nào.</div>
                </div>
            ) : (
                <div className="assignments-grid">
                    {assignments.map((item) => (
                        <Assignment
                            key={item.assignment_id}
                            assignment={item}
                            getTaskTypeName={getTaskTypeName}
                            onStatusUpdate={handleStatusUpdate}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default CongViec;