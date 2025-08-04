// src/frontend/src/components/Header.jsx
import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import ProfilePage from '../ProfilePage/ProfilePage';
import styles from "./Header.module.css";

export default function Header({ isLoggedIn, userInfo, handleLogout, userRole }) {
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const menuByRole = {
        member: [
            { to: "/dang-ky-nhan-mau", label: "Nhận Máu", icon: "🩸" },
            { to: "/lich-su", label: "Lịch Sử", icon: "📋" },
            { to: "/thong-tin-mau", label: "Thông Tin Máu", icon: "🧬" },
            { to: "/hoi-dap", label: "Hỏi – Đáp", icon: "❓" },
            { to: "/lien-he", label: "Liên Hệ", icon: "📞" },
        ],
        partner: [
            { to: "/partner/emergency-request", label: "Đăng Ký Nhận Máu", icon: "🚨" },
            { to: "/partner/history", label: "Lịch Sử Yêu Cầu", icon: "📋" },
            { to: "/thong-tin-mau", label: "Thông Tin Máu", icon: "🧬" },
            { to: "/hoi-dap", label: "Hỏi – Đáp", icon: "❓" },
            { to: "/lien-he", label: "Liên Hệ", icon: "📞" },
        ],
        admin: [
            { to: "/staff-management", label: "Quản Lý Nhân Viên Và Đối Tác", icon: "👥" },
            { to: "/assignment", label: "Phân Công", icon: "📋" },
            { to: "/summary", label: "Tổng Kết", icon: "📊" },
            { to: "/schedule-management", label: "Quản Lý Lịch", icon: "📅" },
            { to: "/thong-tin-mau", label: "Thông Tin Máu", icon: "🧬" },
        ],
        staff: [
            { to: "/cong-viec", label: "Công Việc", icon: "💼" },
            { to: "/quan-ly-hien-mau", label: "Quản Lý Hiến Máu", icon: "🩸" },
            { to: "/quan-ly-nhan-mau", label: "Quản Lý Nhận Máu", icon: "🏥" },
            { to: "/ngan-hang-mau", label: "Quản Lý Máu", icon: "🏦" },
            { to: "/thong-tin-mau", label: "Thông Tin Máu", icon: "🧬" },
        ],
    };

    const getInitials = (fullName) => {
        if (!fullName) return "U";
        return fullName
            .split(" ")
            .map((word) => word[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
    };

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                {/* Logo và Brand */}
                <div className={styles.brand}>
                    <img src={logo} alt="HCM Donation Logo" className={styles.logo} />
                    <div className={styles.brandText}>
                        <h1 className={styles.brandName}>HCM Donation</h1>
                        <span className={styles.brandSlogan}>Sẻ chia giọt máu</span>
                        <span className={styles.brandSlogan}>Kết nối tình người</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className={styles.nav}>
                    {/* Trang Chủ chỉ hiển thị cho member và guest (chưa đăng nhập) */}
                    {(!isLoggedIn || userRole === 'member') && (
                        <NavLink
                            to="/"
                            end
                            className={({ isActive }) =>
                                `${styles.navLink} ${isActive ? styles.activeLink : ''}`
                            }
                        >
                            <span className={styles.navIcon}>🏠</span>
                            <span>Trang Chủ</span>
                        </NavLink>
                    )}

                    {!isLoggedIn && (
                        <>
                            <NavLink
                                to="/thong-tin-mau"
                                className={({ isActive }) =>
                                    `${styles.navLink} ${isActive ? styles.activeLink : ''}`
                                }
                            >
                                <span className={styles.navIcon}>🧬</span>
                                <span>Thông Tin Máu</span>
                            </NavLink>
                            <NavLink
                                to="/hoi-dap"
                                className={({ isActive }) =>
                                    `${styles.navLink} ${isActive ? styles.activeLink : ''}`
                                }
                            >
                                <span className={styles.navIcon}>❓</span>
                                <span>Hỏi – Đáp</span>
                            </NavLink>
                            <NavLink
                                to="/lien-he"
                                className={({ isActive }) =>
                                    `${styles.navLink} ${isActive ? styles.activeLink : ''}`
                                }
                            >
                                <span className={styles.navIcon}>📞</span>
                                <span>Liên Hệ</span>
                            </NavLink>
                        </>
                    )}

                    {isLoggedIn && userRole === 'partner' && (
                        <div className={styles.partnerNav}>
                            <NavLink
                                to="/partner/emergency-request"
                                className={({ isActive }) =>
                                    `${styles.navLink} ${isActive ? styles.activeLink : ''}`
                                }
                            >
                                <span className={styles.navIcon}>🚨</span>
                                <span>Đăng Ký Khẩn Cấp</span>
                            </NavLink>
                            <NavLink
                                to="/partner/history"
                                className={({ isActive }) =>
                                    `${styles.navLink} ${isActive ? styles.activeLink : ''}`
                                }
                            >
                                <span className={styles.navIcon}>📋</span>
                                <span>Lịch Sử</span>
                            </NavLink>
                            <NavLink
                                to="/thong-tin-mau"
                                className={({ isActive }) =>
                                    `${styles.navLink} ${isActive ? styles.activeLink : ''}`
                                }
                            >
                                <span className={styles.navIcon}>🧬</span>
                                <span>Thông Tin Máu</span>
                            </NavLink>
                            <NavLink
                                to="/hoi-dap"
                                className={({ isActive }) =>
                                    `${styles.navLink} ${isActive ? styles.activeLink : ''}`
                                }
                            >
                                <span className={styles.navIcon}>❓</span>
                                <span>Hỏi – Đáp</span>
                            </NavLink>
                            <NavLink
                                to="/lien-he"
                                className={({ isActive }) =>
                                    `${styles.navLink} ${isActive ? styles.activeLink : ''}`
                                }
                            >
                                <span className={styles.navIcon}>📞</span>
                                <span>Liên Hệ</span>
                            </NavLink>
                        </div>
                    )}

                    {isLoggedIn && userRole !== 'partner' &&
                        menuByRole[userRole]?.map(({ to, label, icon }) => (
                            <NavLink
                                key={to}
                                to={to}
                                className={({ isActive }) =>
                                    `${styles.navLink} ${isActive ? styles.activeLink : ''}`
                                }
                            >
                                <span className={styles.navIcon}>{icon}</span>
                                <span>{label}</span>
                            </NavLink>
                        ))}
                </nav>

                {/* User Section */}
                <div className={styles.userSection}>
                    {!isLoggedIn ? (
                        <div className={styles.authButtons}>
                            <NavLink to="/login" className={styles.loginBtn}>
                                Đăng Nhập
                            </NavLink>
                            <NavLink to="/register" className={styles.registerBtn}>
                                Đăng Ký
                            </NavLink>
                        </div>
                    ) : (
                        <div className={styles.userDropdown} ref={dropdownRef}>
                            <div
                                className={styles.userInfo}
                                onClick={() => setShowDropdown(!showDropdown)}
                            >
                                <div className={styles.userAvatar}>
                                    {getInitials(userInfo?.full_name)}
                                </div>
                                <div className={styles.userDetails}>
                                    <span className={styles.userName}>
                                        {userInfo?.full_name || "Người dùng"}
                                    </span>
                                    <span className={styles.userRole}>
                                        {userRole === 'admin' ? 'Quản trị viên' :
                                            userRole === 'staff' ? 'Nhân viên' :
                                                userRole === 'partner' ? 'Đối tác' : 'Thành viên'}
                                    </span>
                                    {userInfo?.distance_km && (
                                        <span className={styles.userDistance}>
                                            📍 {userInfo.distance_km} km
                                        </span>
                                    )}
                                </div>
                                <span className={styles.dropdownArrow}>
                                    {showDropdown ? '▲' : '▼'}
                                </span>
                            </div>
                            {showDropdown && (
                                <div className={styles.dropdownMenu}>
                                    <button className={styles.dropdownItem} onClick={() => { setShowDropdown(false); navigate('/profile'); }}>
                                        <span>👤</span>
                                        <span>Thông tin cá nhân</span>
                                    </button>
                                    <div className={styles.dropdownDivider}></div>
                                    <button
                                        className={`${styles.dropdownItem} ${styles.logoutItem}`}
                                        onClick={handleLogout}
                                    >
                                        <span>🚪</span>
                                        <span>Đăng xuất</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
