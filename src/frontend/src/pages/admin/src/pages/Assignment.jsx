import React, { useState, useEffect } from 'react';
import PhanCong from '../components/Assigments/PhanCong';
import CongViec from '../components/Assigments/CongViec';
import styles from '../styles/Assignment.module.css';

const Assignment = () => {
    const [tab, setTab] = useState('phancong');
    const [isLoading, setIsLoading] = useState(false);
    const [employees, setEmployees] = useState([]);

    useEffect(() => {
        const fetchStaffs = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch("http://localhost:3001/api/assignment/staff", {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (!res.ok) throw new Error("Lỗi khi lấy danh sách nhân viên");
                const data = await res.json();

                // Lấy thông tin assignments hiện tại cho mỗi nhân viên
                const assignmentsPromises = data.map(async (staff) => {
                    try {
                        const assignmentRes = await fetch(
                            `http://localhost:3001/api/assignment/staff/${staff.user_id}/pending-tasks`,
                            {
                                headers: { "Authorization": `Bearer ${token}` }
                            }
                        );
                        if (assignmentRes.ok) {
                            const assignmentData = await assignmentRes.json();
                            // Nếu có assignment pending, lấy task type làm role
                            if (assignmentData && assignmentData.length > 0) {
                                const latestAssignment = assignmentData[0];
                                return {
                                    ...staff,
                                    role: (() => {
                                        switch (latestAssignment.task_type) {
                                            case 'blood_testing': return 'Quản lý kho máu';
                                            case 'blood_collection': return 'Nhân viên quản lý hiến máu';
                                            case 'donation_management': return 'Nhân viên quản lý nhận máu';
                                            default: return latestAssignment.task_type;
                                        }
                                    })(),
                                    assignmentId: latestAssignment.assignment_id
                                };
                            }
                        }
                        return staff;
                    } catch (err) {
                        console.error("Error fetching staff assignments:", err);
                        return staff;
                    }
                });

                const staffWithAssignments = await Promise.all(assignmentsPromises);

                const mapped = staffWithAssignments.map(staff => ({
                    id: staff.user_id,
                    name: staff.full_name,
                    email: staff.email,
                    phone: staff.phone,
                    role: staff.role,
                    assignmentId: staff.assignmentId,
                    department: staff.role // Thêm department từ role để filter hoạt động
                }));

                setEmployees(mapped);
            } catch (err) {
                setEmployees([]);
            }
        };
        fetchStaffs();
    }, []);

    const handleTabChange = (newTab) => {
        if (newTab === tab) return;
        setTab(newTab);
    };

    return (
        <div className={styles.container}>
            <div className={styles.wrapper}>
                <div className={styles.header}>
                    <div className={styles.headerContent}>
                        <div className={styles.headerIcon}>📋</div>
                        <div className={styles.headerInfo}>
                            <h1 className={styles.title}>Quản Lý Phân Công</h1>
                            <p className={styles.subtitle}>
                                Phân công công việc và quản lý nhiệm vụ nhân viên một cách hiệu quả
                            </p>
                        </div>
                    </div>
                </div>

                <div className={styles.tabsWrapper}>
                    <button
                        onClick={() => handleTabChange('phancong')}
                        className={`${styles.tabButton} ${tab === 'phancong' ? styles.active : ''}`}
                        disabled={isLoading}
                    >
                        <span>📋</span>
                        <span>Phân công nhân viên</span>
                    </button>
                    <button
                        onClick={() => handleTabChange('congviec')}
                        className={`${styles.tabButton} ${tab === 'congviec' ? styles.active : ''}`}
                        disabled={isLoading}
                    >
                        <span>⚡</span>
                        <span>Quản lý công việc</span>
                    </button>
                </div>

                <div className={styles.content}>
                    <div className={styles.contentInner}>
                        {tab === 'phancong' ? <PhanCong employees={employees} setEmployees={setEmployees} /> : <CongViec />}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Assignment;