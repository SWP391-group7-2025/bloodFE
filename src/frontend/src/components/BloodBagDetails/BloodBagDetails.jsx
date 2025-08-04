import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './BloodBagDetails.module.css';

const BloodBagDetails = ({ bloodBagId, onClose, onConfirm, showConfirmButton = false }) => {
    const [bagDetails, setBagDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const token = localStorage.getItem('token');

    useEffect(() => {
        if (bloodBagId) {
            fetchBloodBagDetails();
        }
    }, [bloodBagId]);

    const fetchBloodBagDetails = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                `http://localhost:3001/api/recipients/blood-bags/${bloodBagId}/details`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setBagDetails(response.data);
        } catch (error) {
            console.error('Error fetching blood bag details:', error);
            setError('Không thể tải thông tin túi máu');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const getUrgencyColor = (urgencyStatus) => {
        switch (urgencyStatus) {
            case 'Sắp hết hạn':
                return '#f44336'; // Đỏ
            case 'Cần sử dụng sớm':
                return '#ff9800'; // Cam
            case 'Tình trạng tốt':
                return '#4caf50'; // Xanh lá
            default:
                return '#9e9e9e'; // Xám
        }
    };

    if (loading) {
        return (
            <div className={styles.modal}>
                <div className={styles.modalContent}>
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <p>Đang tải thông tin túi máu...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.modal}>
                <div className={styles.modalContent}>
                    <div className={styles.error}>
                        <p>{error}</p>
                        <button onClick={onClose} className={styles.closeButton}>
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!bagDetails) {
        return null;
    }

    return (
        <div className={styles.modal}>
            <div className={styles.modalContent}>
                <div className={styles.header}>
                    <h2>Chi tiết túi máu #{bagDetails.blood_bag_id}</h2>
                    <button onClick={onClose} className={styles.closeIcon}>
                        ×
                    </button>
                </div>

                <div className={styles.content}>
                    {/* Thông tin cơ bản về túi máu */}
                    <div className={styles.section}>
                        <h3>Thông tin túi máu</h3>
                        <div className={styles.infoGrid}>
                            <div className={styles.infoItem}>
                                <label>Nhóm máu:</label>
                                <span className={styles.bloodType}>{bagDetails.blood_type}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <label>Thành phần:</label>
                                <span>{bagDetails.component_name}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <label>Thể tích:</label>
                                <span>{bagDetails.volume_ml} ml</span>
                            </div>
                            <div className={styles.infoItem}>
                                <label>Trạng thái:</label>
                                <span className={styles.status}>{bagDetails.bag_status}</span>
                            </div>
                        </div>
                    </div>

                    {/* Thông tin ngày tháng */}
                    <div className={styles.section}>
                        <h3>Thông tin thời gian</h3>
                        <div className={styles.infoGrid}>
                            <div className={styles.infoItem}>
                                <label>Ngày thu thập:</label>
                                <span>{formatDate(bagDetails.collection_date)}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <label>Ngày hết hạn:</label>
                                <span>{formatDate(bagDetails.expiry_date)}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <label>Số ngày từ khi thu thập:</label>
                                <span>{bagDetails.days_since_collection} ngày</span>
                            </div>
                            <div className={styles.infoItem}>
                                <label>Số ngày còn lại:</label>
                                <span>{bagDetails.days_until_expiry} ngày</span>
                            </div>
                        </div>
                    </div>

                    {/* Tình trạng cấp bách */}
                    <div className={styles.section}>
                        <h3>Tình trạng sử dụng</h3>
                        <div className={styles.urgencyStatus}
                            style={{ color: getUrgencyColor(bagDetails.urgency_status) }}>
                            <span className={styles.urgencyIcon}>
                                {bagDetails.urgency_status === 'Sắp hết hạn' ? '🚨' :
                                    bagDetails.urgency_status === 'Cần sử dụng sớm' ? '⚠️' : '✅'}
                            </span>
                            {bagDetails.urgency_status}
                        </div>
                    </div>

                    {/* Thông tin người hiến máu */}
                    <div className={styles.section}>
                        <h3>Thông tin người hiến máu</h3>
                        <div className={styles.donorInfo}>
                            <div className={styles.infoItem}>
                                <label>Họ tên:</label>
                                <span>{bagDetails.donor_name}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <label>Email:</label>
                                <span>{bagDetails.donor_email}</span>
                            </div>
                            {bagDetails.donor_phone && (
                                <div className={styles.infoItem}>
                                    <label>Số điện thoại:</label>
                                    <span>{bagDetails.donor_phone}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className={styles.footer}>
                    <button onClick={onClose} className={styles.cancelButton}>
                        Đóng
                    </button>
                    {showConfirmButton && (
                        <button
                            onClick={() => onConfirm(bagDetails)}
                            className={styles.confirmButton}
                        >
                            Xác nhận cấp phát
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BloodBagDetails;
