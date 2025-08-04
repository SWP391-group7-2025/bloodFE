import React, { useState, useCallback, useMemo, memo, useTransition, useDeferredValue, useEffect } from "react";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { showSuccessToast, showErrorToast } from '../../../../../utils/toast';
import styles from "../../styles/Assignment.module.css";

// Enhanced Employee Card Component
const EmployeeCard = memo(({ employee, onAssign, onUnassign, pendingTasks }) => {
    const initials = employee.name.split(' ').map(n => n[0]).join('').toUpperCase();
    const hasPendingTasks = pendingTasks && pendingTasks.length > 0;

    return (
        <div className={`${styles.employeeCard} ${employee.role || hasPendingTasks ? styles.assigned : ''}`}>
            <div className={styles.employeeHeader}>
                <div className={styles.employeeAvatar}>
                    {initials}
                </div>
                <div className={styles.employeeInfo}>
                    <h3>{employee.name}</h3>
                    <p>ID: {employee.id}</p>
                </div>
            </div>

            {employee.role && (
                <div className={styles.employeeRole}>
                    {employee.role}
                </div>
            )}

            {hasPendingTasks && (
                <div className={styles.pendingTasksList}>
                    {pendingTasks.map((task, index) => (
                        <div key={index} className={styles.pendingTask}>
                            <div className={styles.pendingTaskHeader}>
                                <span className={styles.pendingBadge}>🔄 Đang chờ</span>
                                <span className={styles.taskDate}>{task.assigned_date}</span>
                            </div>

                        </div>
                    ))}
                </div>
            )}

            <div className={styles.employeeActions}>
                {employee.role ? (
                    <button
                        className={styles.unassignBtn}
                        onClick={() => onUnassign(employee.id)}
                    >
                        Hủy phân công
                    </button>
                ) : (
                    <button
                        className={styles.assignBtn}
                        onClick={() => onAssign(employee.id)}
                        disabled={hasPendingTasks}
                        title={hasPendingTasks ? "Nhân viên đang có công việc chờ xử lý" : ""}
                    >
                        {hasPendingTasks ? "Đang có việc chờ" : "Phân công"}
                    </button>
                )}
            </div>
        </div>
    );
});

// Job Selection Modal Component
const JobSelectionModal = memo(({ isOpen, jobs, onSelectJob, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className={styles.modal}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Chọn Công Việc</h2>
                    <button
                        className={styles.closeButton}
                        onClick={onClose}
                    >
                        ✕
                    </button>
                </div>

                <div className={styles.jobGrid}>
                    {jobs.map((job, index) => (
                        <div
                            key={index}
                            className={styles.jobCard}
                            onClick={() => onSelectJob(job)}
                        >
                            <div className={styles.jobHeader}>
                                <div className={styles.jobTitle}>{job}</div>
                                <div className={styles.jobPriority}>Có sẵn</div>
                            </div>
                            <div className={styles.jobDescription}>
                                Nhấn để phân công công việc này
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
});

// Statistics Card Component
const StatCard = memo(({ icon, label, value, change }) => (
    <div className={styles.statCard} style={{ '--stat-color': getStatColor(label) }}>
        <div className={styles.statIcon}>{icon}</div>
        <div className={styles.statValue}>{value}</div>
        <div className={styles.statLabel}>{label}</div>
        {change && (
            <div className={`${styles.statChange} ${change > 0 ? styles.positive : styles.negative}`}>
                {change > 0 ? '+' : ''}{change}%
            </div>
        )}
    </div>
));

const getStatColor = (label) => {
    switch (label) {
        case 'Tổng nhân viên': return '#2563eb';
        case 'Đã phân công': return '#22c55e';
        case 'Chưa phân công': return '#f59e0b';
        case 'Công việc': return '#8b5cf6';
        default: return '#2563eb';
    }
};

// Sample data


const availableJobs = [
    'Nhân viên lấy máu',
    'Nhân viên cấp phát máu',
    'Nhân viên quản lý kho máu',
];

const PhanCong = ({ employees, setEmployees }) => {
    const [showModal, setShowModal] = useState(false);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [isPending, startTransition] = useTransition();
    const deferredSearchTerm = useDeferredValue(searchTerm);
    const [pendingTasksMap, setPendingTasksMap] = useState({});

    // Filtered employees
    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => {
            const matchesSearch = emp.name.toLowerCase().includes(deferredSearchTerm.toLowerCase());
            const matchesDepartment = !filterDepartment || emp.department === filterDepartment;
            const matchesStatus = !filterStatus ||
                (filterStatus === 'assigned' && emp.role) ||
                (filterStatus === 'unassigned' && !emp.role);

            return matchesSearch && matchesDepartment && matchesStatus;
        });
    }, [employees, deferredSearchTerm, filterDepartment, filterStatus]);

    // Statistics
    const stats = useMemo(() => {
        const total = employees.length;
        const assigned = employees.filter(emp => emp.role).length;
        const unassigned = total - assigned;
        const jobs = availableJobs.length;

        return [
            { icon: '👥', label: 'Tổng nhân viên', value: total, change: 0 },
            { icon: '✅', label: 'Đã phân công', value: assigned, change: 12 },
            { icon: '⏳', label: 'Chưa phân công', value: unassigned, change: -8 },
            { icon: '💼', label: 'Công việc', value: jobs, change: 5 }
        ];
    }, [employees]);

    // Event handlers
    const handleSearch = useCallback((e) => {
        startTransition(() => {
            setSearchTerm(e.target.value);
        });
    }, []);

    const handleAssign = useCallback((employeeId) => {
        setSelectedEmployeeId(employeeId);
        setShowModal(true);
    }, []);

    const handleUnassign = useCallback(async (employeeId) => {
        const token = localStorage.getItem("token");
        try {
            const res = await fetch("http://localhost:3001/api/assignment/unassign", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ assigned_to: employeeId })
            });
            if (!res.ok) throw new Error("Không thể hủy phân công trên server");

            setEmployees(prev =>
                prev.map(emp =>
                    emp.id === employeeId ? { ...emp, role: '', assignmentId: null } : emp
                )
            );
        } catch (err) {
            showErrorToast(`Lỗi khi hủy phân công: ${err.message}`);
        }
    }, [setEmployees]);

    const getTaskType = (job) => {
        switch (job) {
            case 'Nhân viên quản lý kho máu':
                return 'blood_testing';
            case 'Nhân viên lấy máu':
                return 'blood_collection';
            case 'Nhân viên cấp phát máu':
                return 'donation_management';
            default:
                return '';
        }
    };

    const handleSelectJob = useCallback(async (job) => {
        const token = localStorage.getItem("token");
        try {
            const reference_id = 1;
            const task_type = getTaskType(job);
            const res = await fetch("http://localhost:3001/api/assignment/create-assignment", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    task_type,
                    reference_id,
                    assigned_to: selectedEmployeeId,
                    notes: ""
                })
            });
            if (!res.ok) throw new Error("Không thể tạo phân công mới");

            const data = await res.json();
            const newAssignmentId = data.assignment?.assignment_id;

            // Cập nhật UI trước
            setEmployees(prev =>
                prev.map(emp =>
                    emp.id === selectedEmployeeId
                        ? { ...emp, role: job, assignmentId: newAssignmentId }
                        : emp
                )
            );

            // Đóng modal
            setShowModal(false);
            setSelectedEmployeeId(null);
        } catch (err) {
            showErrorToast(`Lỗi khi phân công: ${err.message}`);
        }
    }, [selectedEmployeeId, setEmployees]);

    const handleCloseModal = useCallback(() => {
        setShowModal(false);
        setSelectedEmployeeId(null);
    }, []);

    // Load pending tasks for a staff member
    const loadPendingTasks = useCallback(async (employeeId) => {
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`http://localhost:3001/api/assignment/staff/${employeeId}/pending-tasks`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (!res.ok) throw new Error("Không thể tải thông tin công việc");
            const tasks = await res.json();
            setPendingTasksMap(prev => ({
                ...prev,
                [employeeId]: tasks
            }));
        } catch (err) {
            console.error("Error loading pending tasks:", err);
        }
    }, []);

    // Load pending tasks for all employees when component mounts
    useEffect(() => {
        employees.forEach(emp => {
            loadPendingTasks(emp.id);
        });
    }, [employees, loadPendingTasks]);

    return (
        <div className={styles.fadeInUp}>
            <ToastContainer position="top-right" autoClose={2500} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
            {/* Header Section */}
            <div className={styles.contentHeader}>
                <div>
                    <h2 className={styles.contentTitle}>
                        <span>👥</span>
                        Phân Công Nhân Viên
                    </h2>
                    <p className={styles.contentSubtitle}>
                        Quản lý và phân công công việc cho nhân viên
                    </p>
                </div>
                <div className={styles.contentActions}>
                    <button className={styles.secondaryAction}>
                        📊 Báo cáo
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className={styles.statsGrid}>
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </div>

            {/* Filters and Search */}
            <div className={styles.actionBar}>
                <input
                    type="text"
                    placeholder="Tìm kiếm nhân viên..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className={styles.searchInput}
                />

                <select
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value)}
                    className={styles.filterSelect}
                >
                    <option value="">Tất cả phòng ban</option>
                    <option value="Quản lý kho máu">Quản lý kho máu</option>
                    <option value="Lấy máu">Lấy máu</option>
                    <option value="Tiếp tế">Tiếp tế</option>
                </select>

                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className={styles.filterSelect}
                >
                    <option value="">Tất cả trạng thái</option>
                    <option value="assigned">Đã phân công</option>
                    <option value="unassigned">Chưa phân công</option>
                </select>
            </div>

            {/* Employee Grid */}
            <div className={styles.employeeGrid}>
                {filteredEmployees.length > 0 ? (
                    filteredEmployees.map(employee => (
                        <EmployeeCard
                            key={employee.id}
                            employee={employee}
                            onAssign={handleAssign}
                            onUnassign={handleUnassign}
                            pendingTasks={pendingTasksMap[employee.id] || []}
                        />
                    ))
                ) : (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>👨‍💼</div>
                        <div className={styles.emptyText}>
                            Không tìm thấy nhân viên nào
                        </div>
                    </div>
                )}
            </div>

            {/* Job Selection Modal */}
            <JobSelectionModal
                isOpen={showModal}
                jobs={availableJobs}
                onSelectJob={handleSelectJob}
                onClose={handleCloseModal}
            />
        </div>
    );
};

export default PhanCong;