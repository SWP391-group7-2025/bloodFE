import React, { useState } from "react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from "../../styles/Assignment.module.css";

const sampleTasks = [
    { id: 1, role: "Nhân viên quản lý kho máu", task: "Khám sức khỏe, quản lý kho máu" },
    { id: 2, role: "Nhân viên lấy máu", task: "Lấy máu" },
    { id: 3, role: "Nhân viên tiếp tế máu", task: "Hỗ trợ cho người nhận máu" },
];

const CongViec = ({ jobs, setJobs }) => {
    const [tasks, setTasks] = useState(sampleTasks);

    // Thêm hàm xử lý xóa
    const handleDelete = (id) => {
        // Sử dụng confirm với toastify (tạm thời dùng window.confirm, toast sau khi xóa)
        if (window.confirm("Bạn có chắc muốn xóa công việc này?")) {
            setTasks(prev => {
                const newTasks = prev.filter((item) => item.id !== id);
                toast.success("Đã xóa công việc!");
                return newTasks;
            });
            setJobs(prev => prev.filter((item) => item.id !== id));
        }
    };

    return (
        <div className={styles.taskContainer}>
            <ToastContainer position="top-right" autoClose={2500} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
            <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>
                    <div className={styles.titleIcon}>⚡</div>
                    Quản Lý Công Việc
                </div>
            </div>

            <div className={styles.quickStats}>
                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <div className={styles.statLabel}>Tổng công việc</div>
                    </div>
                    <div className={styles.statValue}>{tasks.length}</div>
                </div>
            </div>

            {tasks.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>📋</div>
                    <div className={styles.emptyTitle}>Chưa có công việc nào</div>
                    <div className={styles.emptyDescription}>Hãy thêm công việc đầu tiên để bắt đầu quản lý</div>
                </div>
            ) : (
                <div className={styles.taskGrid}>
                    {tasks.map((item) => (
                        <div key={item.id} className={styles.taskCard}>
                            <div className={styles.taskHeader}>
                                <div className={styles.taskRole}>
                                    <div className={styles.taskRoleTitle}>
                                        <span className={styles.taskRoleIcon}>👤</span>
                                        {item.role}
                                    </div>
                                    <div className={styles.taskRoleId}>ID: {item.id}</div>
                                </div>
                            </div>

                            <div className={styles.taskDescription}>
                                <div className={styles.taskDescriptionTitle}>
                                    📝 Mô tả công việc
                                </div>
                                <div className={styles.taskDescriptionText}>
                                    {item.task}
                                </div>
                            </div>

                            <div className={styles.taskMeta}>
                                <div className={styles.taskMetaItem}>
                                    <span className={styles.taskMetaIcon}>📅</span>
                                    Được tạo hôm nay
                                </div>
                                <div className={styles.taskMetaItem}>
                                    <span className={styles.taskMetaIcon}>⏰</span>
                                    Đang hoạt động
                                </div>
                            </div>

                            <div className={styles.taskActions}>
                                <button
                                    className={`${styles.actionButton} ${styles.editButton}`}
                                    onClick={() => {/* Add edit functionality */ }}
                                >
                                    ✏️ Sửa
                                </button>
                                <button
                                    className={`${styles.actionButton} ${styles.deleteButton}`}
                                    onClick={() => handleDelete(item.id)}
                                >
                                    🗑️ Xóa
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CongViec;