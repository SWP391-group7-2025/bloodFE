import React, { useEffect, useState } from 'react';
import './LichSuCongViec.css';

function getTaskTypeName(type) {
    switch (type) {
        case 'blood_testing': return 'Quản lý kho máu';
        case 'blood_collection': return 'Quản lý hiến máu';
        case 'donation_management': return 'Quản lý nhận máu';
        default: return type;
    }
}

function LichSuCongViec() {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        setLoading(true);
        fetch('http://localhost:3001/api/assignment/my', {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => {
                setAssignments(data);
                setLoading(false);
            })
            .catch(() => {
                setAssignments([]);
                setLoading(false);
            });
    }, []);

    const completedAssignments = assignments.filter(item => item.status === 'completed');

    return (
        <div className="lichsu-container">
            <div className="lichsu-header">
                <h2 className="lichsu-title">Lịch sử công việc của bạn</h2>
            </div>

            {loading ? (
                <div className="lichsu-loading">
                    <div className="lichsu-loading-spinner"></div>
                    <div className="lichsu-loading-text">Đang tải dữ liệu...</div>
                </div>
            ) : completedAssignments.length === 0 ? (
                <div className="lichsu-no-data">
                    <div className="lichsu-no-data-icon">📋</div>
                    <div className="lichsu-no-data-text">Không có công việc nào đã hoàn thành.</div>
                </div>
            ) : (
                <>
                    <div className="lichsu-table-container">
                        <table className="lichsu-table">
                            <thead>
                                <tr>
                                    <th>STT</th>
                                    <th>Loại nhiệm vụ</th>
                                    <th>Người giao</th>
                                    <th>Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {completedAssignments.map((item, idx) => (
                                    <tr key={item.assignment_id || idx}>
                                        <td>{idx + 1}</td>
                                        <td>
                                            <div className={`task-type ${item.task_type}`}>
                                                {getTaskTypeName(item.task_type)}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="assigned-by">
                                                {item.assigned_by_name || 'Chưa xác định'}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="status-badge">
                                                Đã hoàn thành
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="lichsu-stats">
                        <div className="lichsu-stats-item">
                            <span>Tổng số công việc đã hoàn thành:</span>
                            <span className="lichsu-stats-number">{completedAssignments.length}</span>
                        </div>
                        <div className="lichsu-stats-item">
                            <span>Cập nhật lần cuối:</span>
                            <span>{new Date().toLocaleString('vi-VN')}</span>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default LichSuCongViec;