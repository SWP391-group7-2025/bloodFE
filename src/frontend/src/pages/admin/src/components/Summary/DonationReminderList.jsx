import React, { useEffect, useState } from 'react';
import './DonationReminderList.css';

const DonationReminderList = () => {
    const [reminders, setReminders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        setLoading(true);
        fetch('http://localhost:3001/api/statistics/donation-reminders', {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => {
                setReminders(data);
                setLoading(false);
            })
            .catch(() => {
                setReminders([]);
                setLoading(false);
            });
    }, []);

    // Helper function to check if reminder is urgent (within 3 days)
    const isUrgentReminder = (reminderDate) => {
        if (!reminderDate) return false;
        const today = new Date();
        const reminder = new Date(reminderDate);
        const diffTime = reminder - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 3 && diffDays >= 0;
    };

    // Calculate statistics
    const urgentCount = reminders.filter(r => isUrgentReminder(r.reminder_date)).length;
    const totalCount = reminders.length;

    return (
        <div className="donation-reminder-list">
            <h1 className="donation-reminder-list__title">
                Danh sách nhắc nhở hiến máu
            </h1>

            <div className="donation-reminder-list__header">
                <div className="donation-reminder-list__count">
                    Có <span className="donation-reminder-list__count-number">{reminders.length}</span> nhắc nhở
                </div>
                {urgentCount > 0 && (
                    <div className="donation-reminder-list__urgency-badge">
                        {urgentCount} khẩn cấp
                    </div>
                )}
            </div>

            <div className="donation-reminder-list__content">
                {loading ? (
                    <div className="donation-reminder-list__loading">
                        Đang tải dữ liệu...
                    </div>
                ) : reminders.length === 0 ? (
                    <div className="donation-reminder-list__no-data">
                        Không có nhắc nhở nào.
                    </div>
                ) : (
                    <table className="donation-reminder-list__table">
                        <thead className="donation-reminder-list__table-header">
                            <tr>
                                <th>Tên người hiến</th>
                                <th>Số điện thoại</th>
                                <th>Email</th>
                                <th>Ngày hiến tiếp theo</th>
                                <th>Ngày nhắc nhở</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reminders.map((item, idx) => (
                                <tr
                                    key={idx}
                                    className={`donation-reminder-list__table-row ${isUrgentReminder(item.reminder_date) ? 'donation-reminder-list__table-row--urgent' : ''
                                        }`}
                                >
                                    <td className="donation-reminder-list__table-cell donation-reminder-list__table-cell--name">
                                        {item.name}
                                        {isUrgentReminder(item.reminder_date) && (
                                            <div className="donation-reminder-list__urgency-badge">
                                                Khẩn cấp
                                            </div>
                                        )}
                                    </td>
                                    <td className="donation-reminder-list__table-cell donation-reminder-list__table-cell--phone">
                                        {item.phone}
                                    </td>
                                    <td className="donation-reminder-list__table-cell donation-reminder-list__table-cell--email">
                                        {item.email}
                                    </td>
                                    <td className="donation-reminder-list__table-cell donation-reminder-list__table-cell--date">
                                        {item.next_donation_date ? (
                                            <span className="donation-reminder-list__table-cell--next-donation">
                                                {new Date(item.next_donation_date).toLocaleDateString('vi-VN')}
                                            </span>
                                        ) : (
                                            <span style={{ color: '#6c757d', fontStyle: 'italic' }}>
                                                Chưa xác định
                                            </span>
                                        )}
                                    </td>
                                    <td className="donation-reminder-list__table-cell donation-reminder-list__table-cell--date">
                                        {item.reminder_date ? (
                                            <span className="donation-reminder-list__table-cell--reminder-date">
                                                {new Date(item.reminder_date).toLocaleDateString('vi-VN')}
                                            </span>
                                        ) : (
                                            <span style={{ color: '#6c757d', fontStyle: 'italic' }}>
                                                Chưa xác định
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default DonationReminderList;