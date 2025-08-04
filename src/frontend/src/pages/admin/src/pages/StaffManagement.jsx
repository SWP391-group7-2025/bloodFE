import React, { useState, useEffect } from 'react';
import styles from '../styles/StaffManagement.module.css';
import { showSuccessToast, showErrorToast, showWarningToast, showInfoToast } from '../../../../utils/toast';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const StaffManagement = () => {
    const [staffs, setStaffs] = useState([]);
    const [partners, setPartners] = useState([]);
    const [activeTab, setActiveTab] = useState('staff');
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        id: null,
        username: '',
        name: '',
        email: '',
        phone: '',
        password: '',
        organization_name: '',
        organization_address: '',
        gender: '',
        date_of_birth: '',
        address: ''
    });
    const [isEdit, setIsEdit] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    // Lấy danh sách staff từ backend
    useEffect(() => {
        const fetchStaffs = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch("http://localhost:3001/api/assignment/staff", {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                if (!res.ok) throw new Error("Lỗi khi lấy danh sách staff");
                const data = await res.json();
                // Map lại dữ liệu cho đúng với FE
                const mapped = data.map(staff => ({
                    id: staff.user_id,
                    name: staff.full_name,
                    email: staff.email,
                    phone: staff.phone,
                    role: 'staff'
                }));
                setStaffs(mapped);
            } catch (err) {
                setStaffs([]);
                showErrorToast("Không thể lấy danh sách nhân viên!");
            }
        };

        const fetchPartners = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch("http://localhost:3001/api/partner/partners", {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                if (!res.ok) throw new Error("Lỗi khi lấy danh sách partners");
                const data = await res.json();
                // Map lại dữ liệu cho đúng với FE
                const mapped = data.partners.map(partner => ({
                    id: partner.user_id,
                    name: partner.full_name,
                    email: partner.email,
                    phone: partner.phone,
                    role: 'partner',
                    gender: partner.gender,
                    date_of_birth: partner.date_of_birth,
                    address: partner.address
                }));
                setPartners(mapped);
            } catch (err) {
                setPartners([]);
                console.error("Không thể lấy danh sách đối tác:", err);
            }
        };

        fetchStaffs();
        fetchPartners();
    }, []);

    const currentData = activeTab === 'staff' ? staffs : partners;
    const filteredData = currentData.filter(
        item =>
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.email.toLowerCase().includes(search.toLowerCase()) ||
            item.phone.includes(search)
    );

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleCreate = (userType = null) => {
        const targetTab = userType || activeTab;
        const baseForm = {
            id: null,
            username: '',
            name: '',
            email: '',
            phone: '',
            password: '',
            gender: '',
            date_of_birth: '',
            address: ''
        };

        if (targetTab === 'partner') {
            setForm(baseForm);
            setActiveTab('partner');
        } else {
            setForm(baseForm);
            setActiveTab('staff');
        }

        setIsEdit(false);
        setShowForm(true);
    };

    const handleEdit = (item) => {
        const editForm = {
            ...item,
            password: '',
            address: item.address || ''
        };

        setForm(editForm);
        setIsEdit(true);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        const itemType = activeTab === 'staff' ? 'nhân viên' : 'đối tác';
        setDeleteTarget({ id, itemType });
        setShowConfirmDialog(true);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;

        try {
            const token = localStorage.getItem("token");
            const endpoint = activeTab === 'staff'
                ? `http://localhost:3001/api/auth/staff/${deleteTarget.id}`
                : `http://localhost:3001/api/partner/partner/${deleteTarget.id}`;

            const response = await fetch(endpoint, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Không thể xóa ${deleteTarget.itemType}`);
            }

            if (activeTab === 'staff') {
                setStaffs(staffs.filter(s => s.id !== deleteTarget.id));
            } else {
                setPartners(partners.filter(p => p.id !== deleteTarget.id));
            }

            showSuccessToast(`Xóa ${deleteTarget.itemType} thành công!`);
        } catch (err) {
            console.error(`Delete error for ${deleteTarget.itemType}:`, err);
            showErrorToast(`Lỗi khi xóa ${deleteTarget.itemType}: ${err.message}`);
        } finally {
            setShowConfirmDialog(false);
            setDeleteTarget(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isEdit) {
            try {
                const token = localStorage.getItem("token");
                const endpoint = activeTab === 'staff'
                    ? `http://localhost:3001/api/auth/staff/${form.id}`
                    : `http://localhost:3001/api/partner/partner/${form.id}`;

                let requestBody;
                if (activeTab === 'staff') {
                    requestBody = {
                        username: form.username,
                        full_name: form.name,
                        email: form.email,
                        phone: form.phone
                    };
                } else {
                    requestBody = {
                        username: form.username,
                        full_name: form.name,
                        email: form.email,
                        phone: form.phone,
                        address: form.address || null
                    };
                }

                const response = await fetch(endpoint, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `Không thể cập nhật ${activeTab === 'staff' ? 'nhân viên' : 'đối tác'}`);
                }

                if (activeTab === 'staff') {
                    setStaffs(staffs.map(s => (s.id === form.id ? {
                        ...s,
                        name: form.name,
                        email: form.email,
                        phone: form.phone
                    } : s)));
                } else {
                    setPartners(partners.map(p => (p.id === form.id ? {
                        ...p,
                        name: form.name,
                        email: form.email,
                        phone: form.phone,
                        address: form.address
                    } : p)));
                }

                showSuccessToast(`Cập nhật ${activeTab === 'staff' ? 'nhân viên' : 'đối tác'} thành công!`);
            } catch (err) {
                showErrorToast(`Lỗi khi cập nhật: ${err.message}`);
            }
        } else {
            try {
                const token = localStorage.getItem("token");
                let endpoint, requestBody;

                if (activeTab === 'staff') {
                    endpoint = "http://localhost:3001/api/auth/create-staff";
                    requestBody = {
                        username: form.username,
                        password: form.password,
                        full_name: form.name,
                        email: form.email,
                        phone: form.phone
                    };
                } else {
                    endpoint = "http://localhost:3001/api/partner/create-account";
                    requestBody = {
                        username: form.username,
                        password: form.password,
                        full_name: form.name,
                        email: form.email,
                        phone: form.phone,
                        gender: null,
                        date_of_birth: null,
                        address: form.address,
                        organization_name: form.name,
                        organization_address: form.address
                    };
                }

                const res = await fetch(endpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(requestBody)
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || `Không thể tạo ${activeTab === 'staff' ? 'nhân viên' : 'đối tác'} mới`);
                }

                // Gọi lại API lấy danh sách mới nhất
                const fetchData = async () => {
                    // Fetch staff data
                    const staffRes = await fetch("http://localhost:3001/api/assignment/staff", {
                        headers: { "Authorization": `Bearer ${token}` }
                    });
                    const staffData = await staffRes.json();

                    const mappedStaff = staffData.map(staff => ({
                        id: staff.user_id,
                        name: staff.full_name,
                        email: staff.email,
                        phone: staff.phone,
                        role: 'staff'
                    }));

                    // Fetch partner data
                    const partnerRes = await fetch("http://localhost:3001/api/partner/partners", {
                        headers: { "Authorization": `Bearer ${token}` }
                    });
                    const partnerData = await partnerRes.json();

                    const mappedPartners = partnerData.partners.map(partner => ({
                        id: partner.user_id,
                        name: partner.full_name,
                        email: partner.email,
                        phone: partner.phone,
                        role: 'partner',
                        gender: partner.gender,
                        date_of_birth: partner.date_of_birth,
                        address: partner.address
                    }));

                    setStaffs(mappedStaff);
                    setPartners(mappedPartners);
                };
                await fetchData();

                showSuccessToast(`Tạo tài khoản ${activeTab === 'staff' ? 'nhân viên' : 'đối tác'} thành công!`);
            } catch (err) {
                showErrorToast(err.message);
            }
        }
        setShowForm(false);
    };

    return (
        <div className={styles.staffManagement}>
            <div className={styles.pageHeader}>
                <div className={styles.headerContent}>
                    <div className={styles.headerLeft}>
                        <div className={styles.headerIcon}>👥</div>
                        <div className={styles.headerInfo}>
                            <h1 className={styles.pageTitle}>Quản lý nhân viên và đối tác</h1>
                            <p className={styles.pageSubtitle}>Quản lý thông tin và tài khoản nhân viên và đối tác</p>
                        </div>
                    </div>
                    <div className={styles.headerActions}>
                        <button
                            className={`${styles.addButton} ${styles.staffButton}`}
                            onClick={() => handleCreate('staff')}
                        >
                            <span>👨‍💼</span>
                            Tạo Tài Khoản Nhân Viên
                        </button>
                        <button
                            className={`${styles.addButton} ${styles.partnerButton}`}
                            onClick={() => handleCreate('partner')}
                        >
                            <span>🤝</span>
                            Tạo Tài Khoản Đối Tác
                        </button>
                    </div>
                </div>
            </div>

            <div className={styles.staffContent}>
                {/* Tab Navigation */}
                <div className={styles.tabNavigation}>
                    <button
                        className={`${styles.tabButton} ${activeTab === 'staff' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('staff')}
                    >
                        <span className={styles.tabIcon}>👨‍💼</span>
                        Nhân viên
                    </button>
                    <button
                        className={`${styles.tabButton} ${activeTab === 'partner' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('partner')}
                    >
                        <span className={styles.tabIcon}>🤝</span>
                        Đối tác
                    </button>
                </div>

                <div className={styles.searchSection}>
                    <div className={styles.searchContainer}>
                        <div className={styles.searchIcon}>🔍</div>
                        <input
                            className={styles.searchInput}
                            type="text"
                            placeholder={`Tìm kiếm ${activeTab === 'staff' ? 'nhân viên' : 'đối tác'} theo tên, email, số điện thoại...`}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className={styles.staffList}>
                    {filteredData.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>
                                {activeTab === 'staff' ? '👥' : '🤝'}
                            </div>
                            <div className={styles.emptyTitle}>
                                Chưa có {activeTab === 'staff' ? 'nhân viên' : 'đối tác'} nào
                            </div>
                            <div className={styles.emptyDescription}>
                                Hãy thêm {activeTab === 'staff' ? 'nhân viên' : 'đối tác'} đầu tiên
                            </div>
                        </div>
                    ) : (
                        <div className={styles.staffGrid}>
                            {filteredData.map(item => (
                                <div key={item.id} className={styles.staffCard}>
                                    <div className={styles.staffHeader}>
                                        <div className={styles.staffAvatar}>
                                            {item.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className={styles.staffInfo}>
                                            <h3 className={styles.staffName}>{item.name}</h3>
                                            <p className={styles.staffRole}>
                                                {activeTab === 'staff' ? 'Nhân viên' : 'Đối tác'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className={styles.staffDetails}>
                                        <div className={styles.staffDetail}>
                                            <span className={styles.detailIcon}>📧</span>
                                            <span className={styles.detailText}>{item.email}</span>
                                        </div>
                                        <div className={styles.staffDetail}>
                                            <span className={styles.detailIcon}>📱</span>
                                            <span className={styles.detailText}>{item.phone}</span>
                                        </div>
                                    </div>

                                    <div className={styles.staffActions}>
                                        <button
                                            className={`${styles.actionButton} ${styles.editButton}`}
                                            onClick={() => handleEdit(item)}
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
            </div>

            {showForm && (
                <div className={styles.modal}>
                    <div className={styles.modalBackdrop} onClick={() => setShowForm(false)}></div>
                    <div className={styles.modalContent}>
                        <div className={styles.formHeader}>
                            <h2 className={styles.formTitle}>
                                {isEdit
                                    ? `Chỉnh Sửa ${activeTab === 'staff' ? 'Nhân Viên' : 'Đối Tác'}`
                                    : `Thêm ${activeTab === 'staff' ? 'Nhân Viên' : 'Đối Tác'} Mới`}
                            </h2>
                            <p className={styles.formSubtitle}>
                                {isEdit
                                    ? `Cập nhật thông tin ${activeTab === 'staff' ? 'nhân viên' : 'đối tác'}`
                                    : `Điền thông tin để tạo tài khoản ${activeTab === 'staff' ? 'nhân viên' : 'đối tác'} mới`}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Tên đăng nhập</label>
                                <input
                                    type="text"
                                    name="username"
                                    placeholder="Nhập tên đăng nhập"
                                    value={form.username}
                                    onChange={handleChange}
                                    className={styles.formInput}
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>
                                    {activeTab === 'staff' ? 'Tên' : 'Tên tổ chức'}
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder={activeTab === 'staff' ? 'Nhập tên' : 'Nhập tên tổ chức'}
                                    value={form.name}
                                    onChange={handleChange}
                                    className={styles.formInput}
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Nhập email"
                                    value={form.email}
                                    onChange={handleChange}
                                    className={styles.formInput}
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Số điện thoại</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    placeholder="Nhập số điện thoại"
                                    value={form.phone}
                                    onChange={handleChange}
                                    className={styles.formInput}
                                    required
                                />
                            </div>

                            {/* Partner-specific fields */}
                            {activeTab === 'partner' && (
                                <>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Địa chỉ tổ chức</label>
                                        <textarea
                                            name="address"
                                            placeholder="Nhập địa chỉ tổ chức"
                                            value={form.address}
                                            onChange={handleChange}
                                            className={styles.formInput}
                                            rows="3"
                                        />
                                    </div>
                                </>
                            )}

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Mật khẩu</label>
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="Nhập mật khẩu"
                                    value={form.password}
                                    onChange={handleChange}
                                    className={styles.formInput}
                                    required
                                />
                            </div>
                            <div className={styles.formActions}>
                                <button
                                    type="button"
                                    className={styles.cancelButton}
                                    onClick={() => setShowForm(false)}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className={styles.submitButton}
                                >
                                    {isEdit ? 'Cập Nhật' : 'Tạo Mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirm Dialog */}
            {showConfirmDialog && (
                <div className={styles.confirmOverlay}>
                    <div className={styles.confirmDialog}>
                        <div className={styles.confirmHeader}>
                            <h3>Xác nhận xóa</h3>
                        </div>
                        <div className={styles.confirmBody}>
                            <p>Bạn có chắc muốn xóa {deleteTarget?.itemType} này?</p>
                        </div>
                        <div className={styles.confirmActions}>
                            <button
                                className={styles.cancelButton}
                                onClick={() => {
                                    setShowConfirmDialog(false);
                                    setDeleteTarget(null);
                                }}
                            >
                                Hủy
                            </button>
                            <button
                                className={styles.confirmButton}
                                onClick={confirmDelete}
                            >
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Container */}
            <ToastContainer />
        </div>
    );
};

export default StaffManagement;