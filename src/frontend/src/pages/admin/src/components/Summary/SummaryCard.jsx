import React, { useEffect, useState } from 'react';
import styles from './SummaryCard.module.css';

const SummaryCard = () => {
    const [donorCount, setDonorCount] = useState(null);
    const [userCount, setUserCount] = useState(null);
    const [requestCount, setRequestCount] = useState(null);
    const [bloodStock, setBloodStock] = useState(null);
    const [recipientCount, setRecipientCount] = useState(null);
    const [appointmentCount, setAppointmentCount] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        fetch('http://localhost:3001/api/statistics/donors', {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => {
                setDonorCount(data.total_donors);
            })
            .catch(() => setDonorCount(null));

        fetch('http://localhost:3001/api/statistics/users', {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => {
                setUserCount(data.total);
            })
            .catch(() => setUserCount(null));

        fetch('http://localhost:3001/api/statistics/requests', {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => {
                setRequestCount(data.total_requests); // Giả sử BE trả về { total: ... }
            })
            .catch(() => setRequestCount(null));

        fetch('http://localhost:3001/api/statistics/blood/total', {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => {
                setBloodStock(data.total_quantity); // SỬA lại đúng key trả về từ BE
            })
            .catch(() => setBloodStock(null));

        fetch('http://localhost:3001/api/statistics/recipients', {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => {
                setRecipientCount(data.total_recipients); // Giả sử BE trả về { total_recipients: ... }
            })
            .catch(() => setRecipientCount(null));

        fetch('http://localhost:3001/api/statistics/appointments', {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => {
                setAppointmentCount(data.total_appointments);
            })
            .catch(() => setAppointmentCount(null));
    }, []);

    const summaryData = [
        {
            title: 'Tổng số người dùng',
            value: userCount !== null ? userCount : '...',
            breakdown: 'Người dùng',
            icon: '👥',
            trend: '+5.2%',
            color: 'blue'
        },
        {
            title: 'Tổng số người hiến',
            value: donorCount !== null ? donorCount : '...',
            breakdown: 'Người hiến tích cực',
            icon: '🩸',
            trend: '+8.1%',
            color: 'red'
        },
        {
            title: 'Tổng số người nhận',
            value: recipientCount !== null ? recipientCount : '...',
            breakdown: 'Đã được hỗ trợ',
            icon: '💉',
            trend: '+3.7%',
            color: 'green'
        },
        {
            title: 'Tổng số lịch hiến máu',
            value: appointmentCount !== null ? appointmentCount : '...',
            breakdown: 'Lịch',
            icon: '📊',
            trend: '+12.3%',
            color: 'purple'
        },
        {
            title: 'Yêu cầu máu',
            value: requestCount !== null ? requestCount : '...',
            breakdown: 'Yêu cầu',
            icon: '🎯',
            trend: '-2.1%',
            color: 'orange'
        },
        {
            title: 'Tồn kho máu',
            value: bloodStock !== null ? bloodStock : '...',
            breakdown: 'Túi máu có sẵn',
            icon: '🏥',
            trend: '+6.8%',
            color: 'cyan'
        }
    ];

    return (
        <div className={styles.summaryGrid}>
            {summaryData.map((item, index) => (
                <div key={index} className={`${styles.summaryCard} ${styles[item.color]}`}>
                    <div className={styles.cardHeader}>
                        <div className={styles.cardIcon}>{item.icon}</div>
                        <div className={styles.cardTrend}>
                            <span className={item.trend.startsWith('+') ? styles.trendUp : styles.trendDown}>
                                {item.trend}
                            </span>
                        </div>
                    </div>
                    <div className={styles.cardContent}>
                        <h3 className={styles.cardTitle}>{item.title}</h3>
                        <div className={styles.cardValue}>{item.value}</div>
                        <p className={styles.cardBreakdown}>{item.breakdown}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SummaryCard;