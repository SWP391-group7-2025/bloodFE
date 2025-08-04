// src/frontend/src/pages/staff/QuanLyNhanMau.jsx
import React, { useState, useEffect } from 'react';
import NhanMauThuong from '../components/NhanMauThuong';
import NhanMauKhanCap from '../components/NhanMauKhanCap';
import LichSuThucHien from '../components/LichSuThucHien';
import './QuanLyNhanMau.css';

function hasPermission(requiredType) {
    const allowed = JSON.parse(localStorage.getItem('allowedTaskTypes') || '[]');
    if (requiredType === 'QuanLyNhanMau') {
        return allowed.includes('donation_management');
    }
    return allowed.includes(requiredType);
}

// Component hiển thị thông báo không có quyền
function NoPermissionMessage() {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '60vh',
            textAlign: 'center',
            padding: '20px'
        }}>
            <div style={{
                fontSize: '64px',
                marginBottom: '20px'
            }}>🚫</div>
            <h2 style={{
                color: '#dc3545',
                marginBottom: '10px'
            }}>Không có quyền truy cập</h2>
            <p style={{
                color: '#666',
                fontSize: '16px',
                maxWidth: '500px',
                lineHeight: '1.6'
            }}>
                Bạn không có quyền truy cập trang quản lý nhận máu. 
                Trang này chỉ dành cho nhân viên được phân công công việc quản lý nhận máu và phân phối máu.
            </p>
            <p style={{
                color: '#888',
                fontSize: '14px',
                marginTop: '20px'
            }}>
                Vui lòng liên hệ quản trị viên để được cấp quyền truy cập.
            </p>
        </div>
    );
}

function QuanLyNhanMau() {
    const [tab, setTab] = useState('thuong');
    const [recipients, setRecipients] = useState([]);
    const [historyRecipients, setHistoryRecipients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Check permission - if no permission, show message
    if (!hasPermission('QuanLyNhanMau')) {
        return <NoPermissionMessage />;
    }

    useEffect(() => {
        // Chỉ lấy recipients có status 'requested' và 'agree' cho tab thường
        fetch('http://localhost:3001/api/recipients/')
            .then(res => res.json())
            .then(data => {
                const activeRecipients = data.filter(r => 
                    r.receive_status === 'requested' || r.receive_status === 'agree'
                );
                setRecipients(activeRecipients);
                setLoading(false);
            })
            .catch(() => {
                setRecipients([]);
                setLoading(false);
            });
    }, []);

    // Function để load lịch sử
    const loadHistory = async () => {
        setHistoryLoading(true);
        try {
            const res = await fetch('http://localhost:3001/api/recipients/');
            const data = await res.json();
            const historyData = data.filter(r => 
                r.receive_status === 'received' || r.receive_status === 'cancelled'
            );
            setHistoryRecipients(historyData);
        } catch (error) {
            console.error('Error loading history:', error);
            setHistoryRecipients([]);
        } finally {
            setHistoryLoading(false);
        }
    };

    // Load history khi chuyển sang tab lịch sử
    useEffect(() => {
        if (tab === 'lichsu') {
            loadHistory();
        }
    }, [tab]);

    // Function để refresh danh sách recipients
    const refreshRecipients = () => {
        setLoading(true);
        fetch('http://localhost:3001/api/recipients/')
            .then(res => res.json())
            .then(data => {
                const activeRecipients = data.filter(r => 
                    r.receive_status === 'requested' || r.receive_status === 'agree'
                );
                setRecipients(activeRecipients);
                setLoading(false);
            })
            .catch(() => {
                setRecipients([]);
                setLoading(false);
            });
    };

    return (
        <div className="quan-ly-nhan-mau">
            <div className="tab-container">
                <button
                    onClick={() => setTab('thuong')}
                    className={`tab-button ${tab === 'thuong' ? 'active' : 'inactive'}`}
                >
                    Nhận máu thường
                </button>
                <button
                    onClick={() => setTab('khancap')}
                    className={`tab-button ${tab === 'khancap' ? 'active' : 'inactive'}`}
                >
                    Nhận máu khẩn cấp
                </button>
                <button
                    onClick={() => setTab('lichsu')}
                    className={`tab-button ${tab === 'lichsu' ? 'active' : 'inactive'}`}
                >
                    Lịch sử thực hiện
                </button>
            </div>
            <div className="tab-content">
                {tab === 'thuong' && (
                    <NhanMauThuong recipients={recipients} loading={loading} onRefresh={refreshRecipients} />
                )}
                {tab === 'khancap' && (
                    <NhanMauKhanCap />
                )}
                {tab === 'lichsu' && (
                    <LichSuThucHien recipients={historyRecipients} loading={historyLoading} />
                )}
            </div>
        </div>
    );
}

export default QuanLyNhanMau;