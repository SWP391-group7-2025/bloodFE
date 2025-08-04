import React, { useEffect, useState } from 'react';
import './DonationReport.css';

const DonationReport = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);

    useEffect(() => {
        const token = localStorage.getItem('token');
        setLoading(true);
        fetch(`http://localhost:3001/api/statistics/donation-records?year=${year}&month=${month}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => {
                setRecords(data);
                setLoading(false);
            })
            .catch(() => {
                setRecords([]);
                setLoading(false);
            });
    }, [year, month]);

    const viComponentName = (en) => {
        switch (en) {
            case 'Whole Blood': return 'Máu toàn phần';
            case 'Plasma': return 'Huyết tương';
            case 'Platelets': return 'Tiểu cầu';
            case 'Red Cells': return 'Hồng cầu';
            default: return en;
        }
    };

    return (
        <div className="donation-report">
            <h1 className="donation-report__title">
                Danh sách người đã hiến máu trong tháng {month}/{year}
            </h1>

            <div className="donation-report__filters">
                <div className="donation-report__filter-group">
                    <label className="donation-report__filter-label">Năm:</label>
                    <input
                        type="number"
                        value={year}
                        min="2000"
                        max="2100"
                        onChange={e => setYear(Number(e.target.value))}
                        className="donation-report__filter-input"
                    />
                </div>
                <div className="donation-report__filter-group">
                    <label className="donation-report__filter-label">Tháng:</label>
                    <input
                        type="number"
                        value={month}
                        min="1"
                        max="12"
                        onChange={e => setMonth(Number(e.target.value))}
                        className="donation-report__filter-input"
                    />
                </div>
            </div>

            <div className="donation-report__content">
                {loading ? (
                    <div className="donation-report__loading">Đang tải dữ liệu...</div>
                ) : records.length === 0 ? (
                    <div className="donation-report__no-data">
                        Không có dữ liệu hiến máu trong tháng này.
                    </div>
                ) : (
                    <table className="donation-report__table">
                        <thead className="donation-report__table-header">
                            <tr>
                                <th>Tên người hiến</th>
                                <th>Nhóm máu</th>
                                <th>Thành phần máu</th>
                                <th>Ngày thu nhập</th>
                                <th>Ngày hết hạn</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map((item, idx) => (
                                <tr key={idx} className="donation-report__table-row">
                                    <td className="donation-report__table-cell donation-report__table-cell--name">
                                        {item.donor_name}
                                    </td>
                                    <td className="donation-report__table-cell">
                                        <span className="donation-report__table-cell--blood-group">
                                            {item.blood_group}
                                        </span>
                                    </td>
                                    <td className="donation-report__table-cell donation-report__table-cell--component">
                                        {viComponentName(item.component_name)}
                                    </td>
                                    <td className="donation-report__table-cell donation-report__table-cell--date">
                                        {new Date(item.collection_date).toLocaleDateString('vi-VN')}
                                    </td>
                                    <td className="donation-report__table-cell donation-report__table-cell--expiry">
                                        {new Date(item.expiry_date).toLocaleDateString('vi-VN')}
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

export default DonationReport;