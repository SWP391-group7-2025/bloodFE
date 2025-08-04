import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BloodBagDetails from '../BloodBagDetails/BloodBagDetails';
import styles from './AvailableBloodBags.module.css';

const AvailableBloodBags = ({
    bloodGroupId,
    componentId,
    onSelectBag,
    onClose,
    showSelection = true
}) => {
    const [bloodBags, setBloodBags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedBagId, setSelectedBagId] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [detailsBagId, setDetailsBagId] = useState(null);

    const token = localStorage.getItem('token');

    useEffect(() => {
        if (bloodGroupId && componentId) {
            fetchAvailableBloodBags();
        }
    }, [bloodGroupId, componentId]);

    const fetchAvailableBloodBags = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                `http://localhost:3001/api/recipients/blood-bags/available`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params: {
                        blood_group_id: bloodGroupId,
                        component_id: componentId
                    }
                }
            );
            setBloodBags(response.data);
        } catch (error) {
            console.error('Error fetching available blood bags:', error);
            setError('Không thể tải danh sách túi máu phù hợp');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const getUrgencyColor = (daysUntilExpiry) => {
        if (daysUntilExpiry <= 3) return '#f44336'; // Đỏ
        if (daysUntilExpiry <= 7) return '#ff9800'; // Cam
        return '#4caf50'; // Xanh lá
    };

    const getUrgencyText = (daysUntilExpiry) => {
        if (daysUntilExpiry <= 3) return 'Sắp hết hạn';
        if (daysUntilExpiry <= 7) return 'Cần sử dụng sớm';
        return 'Tình trạng tốt';
    };

    const handleViewDetails = (bagId) => {
        setDetailsBagId(bagId);
        setShowDetails(true);
    };

    const handleSelectBag = (bag) => {
        setSelectedBagId(bag.blood_bag_id);
        if (onSelectBag) {
            onSelectBag(bag);
        }
    };

    const handleConfirmSelection = () => {
        if (selectedBagId && onSelectBag) {
            const selectedBag = bloodBags.find(bag => bag.blood_bag_id === selectedBagId);
            onSelectBag(selectedBag);
        }
        if (onClose) {
            onClose();
        }
    };

    if (loading) {
        return (
            <div className={styles.modal}>
                <div className={styles.modalContent}>
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <p>Đang tìm kiếm túi máu phù hợp...</p>
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

    return (
        <>
            <div className={styles.modal}>
                <div className={styles.modalContent}>
                    <div className={styles.header}>
                        <h2>Túi máu phù hợp ({bloodBags.length} túi)</h2>
                        <button onClick={onClose} className={styles.closeIcon}>
                            ×
                        </button>
                    </div>

                    <div className={styles.content}>
                        {bloodBags.length === 0 ? (
                            <div className={styles.noBags}>
                                <div className={styles.noBagsIcon}>🩸</div>
                                <p>Không có túi máu phù hợp với yêu cầu hiện tại</p>
                                <small>Vui lòng thử lại sau hoặc liên hệ với nhân viên</small>
                            </div>
                        ) : (
                            <div className={styles.bagsList}>
                                {bloodBags.map((bag) => (
                                    <div
                                        key={bag.blood_bag_id}
                                        className={`${styles.bagCard} ${selectedBagId === bag.blood_bag_id ? styles.selected : ''
                                            }`}
                                        onClick={() => showSelection && handleSelectBag(bag)}
                                    >
                                        <div className={styles.bagHeader}>
                                            <div className={styles.bagId}>
                                                Túi máu #{bag.blood_bag_id}
                                            </div>
                                            <div
                                                className={styles.urgencyBadge}
                                                style={{
                                                    background: getUrgencyColor(bag.days_until_expiry),
                                                    color: 'white'
                                                }}
                                            >
                                                {getUrgencyText(bag.days_until_expiry)}
                                            </div>
                                        </div>

                                        <div className={styles.bagInfo}>
                                            <div className={styles.primaryInfo}>
                                                <div className={styles.bloodType}>
                                                    {bag.blood_type}
                                                </div>
                                                <div className={styles.component}>
                                                    {bag.component_name}
                                                </div>
                                                <div className={styles.volume}>
                                                    {bag.volume_ml} ml
                                                </div>
                                            </div>

                                            <div className={styles.secondaryInfo}>
                                                <div className={styles.infoRow}>
                                                    <span className={styles.label}>Người hiến:</span>
                                                    <span className={styles.value}>{bag.donor_name}</span>
                                                </div>
                                                <div className={styles.infoRow}>
                                                    <span className={styles.label}>Thu thập:</span>
                                                    <span className={styles.value}>
                                                        {formatDate(bag.collection_date)}
                                                    </span>
                                                </div>
                                                <div className={styles.infoRow}>
                                                    <span className={styles.label}>Hết hạn:</span>
                                                    <span className={styles.value}>
                                                        {formatDate(bag.expiry_date)}
                                                    </span>
                                                </div>
                                                <div className={styles.infoRow}>
                                                    <span className={styles.label}>Còn lại:</span>
                                                    <span className={styles.value}>
                                                        {bag.days_until_expiry} ngày
                                                    </span>
                                                </div>
                                            </div>

                                            <div className={styles.bagActions}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleViewDetails(bag.blood_bag_id);
                                                    }}
                                                    className={styles.detailsButton}
                                                >
                                                    Chi tiết
                                                </button>
                                                {showSelection && selectedBagId === bag.blood_bag_id && (
                                                    <div className={styles.selectedIndicator}>
                                                        ✓ Đã chọn
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {showSelection && bloodBags.length > 0 && (
                        <div className={styles.footer}>
                            <button onClick={onClose} className={styles.cancelButton}>
                                Hủy
                            </button>
                            <button
                                onClick={handleConfirmSelection}
                                disabled={!selectedBagId}
                                className={styles.confirmButton}
                            >
                                Xác nhận chọn túi máu
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {showDetails && (
                <BloodBagDetails
                    bloodBagId={detailsBagId}
                    onClose={() => setShowDetails(false)}
                    showConfirmButton={false}
                />
            )}
        </>
    );
};

export default AvailableBloodBags;
