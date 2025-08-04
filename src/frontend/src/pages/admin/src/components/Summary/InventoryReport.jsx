import React, { useEffect, useState } from 'react';
import './InventoryReport.css';

export default function InventoryReport() {
    const [bloodData, setBloodData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Mapping thành phần máu từ tiếng Anh sang tiếng Việt
    const componentTranslation = {
        'Whole Blood': 'Máu toàn phần',
        'Red Cells': 'Hồng cầu',
        'Plasma': 'Huyết tương',
        'Platelets': 'Tiểu cầu',
        'White Blood Cells': 'Bạch cầu',
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        setLoading(true);
        fetch('http://localhost:3001/api/statistics/blood', {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => {
                setBloodData(data);
                setLoading(false);
            })
            .catch(() => {
                setBloodData([]);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <div className="inventory-report__loading">Đang tải dữ liệu...</div>;
    }

    if (!bloodData || bloodData.length === 0) {
        return <div className="inventory-report__no-data">Không có dữ liệu tồn kho</div>;
    }

    return (
        <div className="inventory-report">
            <h1 className="inventory-report__title">Báo cáo tồn kho máu</h1>
            <div className="inventory-report__container">
                {bloodData.map((item, idx) => (
                    <div key={idx} className="inventory-report__card">
                        <div className="inventory-report__blood-group">
                            {item.blood_group}
                        </div>
                        <div className="inventory-report__detail">
                            <span className="inventory-report__label">Thành phần:</span>
                            <span className="inventory-report__value">
                                {componentTranslation[item.component_name] || item.component_name}
                            </span>
                        </div>
                        <div className="inventory-report__detail">
                            <span className="inventory-report__label">Số lượng:</span>
                            <span className="inventory-report__quantity">
                                {item.total_quantity} túi
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
