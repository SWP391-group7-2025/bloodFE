import { Link } from 'react-router-dom';
import { useContext } from 'react';
import styles from './Footer.module.css';
import logoImg from '../../assets/images/logo.png';

export default function Footer({ isLoggedIn }) {
    return (
        <footer className={styles.footer}>
            <div className={styles.footerContainer}>
                {/* Logo và slogan bên trái */}
                <div className={styles.footerBrand}>
                    <div className={styles.footerLogo}>
                        <img src={logoImg} alt="HCM Donation Logo" className={styles.footerLogoImg} />
                        <div className={styles.footerBrandText}>
                            <h3 className={styles.footerBrandName}>HCM Donation</h3>
                            <p className={styles.footerSlogan}>Sẻ chia giọt máu – Kết nối tình người.</p>
                        </div>
                    </div>
                </div>

                {/* Dịch vụ ở giữa */}
                <div className={styles.footerSection}>
                    <h4 className={styles.footerSectionTitle}>Dịch Vụ</h4>
                    <ul className={styles.footerLinks}>
                        <li>
                          {isLoggedIn ? (
                            <Link to="/blood-schedule" className={styles.footerLink}>Đặt lịch hiến máu</Link>
                          ) : (
                            <span className={styles.footerLink + ' ' + styles.disabledLink}>Đặt lịch hiến máu</span>
                          )}
                        </li>
                        <li>
                          {isLoggedIn ? (
                            <Link to="/lich-su" className={styles.footerLink}>Lịch sử</Link>
                          ) : (
                            <span className={styles.footerLink + ' ' + styles.disabledLink}>Lịch sử</span>
                          )}
                        </li>
                        <li>
                          {isLoggedIn ? (
                            <Link to="/dang-ky-nhan-mau" className={styles.footerLink}>Đăng ký nhận máu</Link>
                          ) : (
                            <span className={styles.footerLink + ' ' + styles.disabledLink}>Đăng ký nhận máu</span>
                          )}
                        </li>
                    </ul>
                </div>

                {/* Thông tin liên hệ bên phải */}
                <div className={styles.footerSection}>
                    <h4 className={styles.footerSectionTitle}>Liên Hệ</h4>
                    <div className={styles.footerContact}>
                        <div className={styles.contactItem}>
                            <span>📧 blooddonation259@gmail.com</span>
                        </div>
                        <div className={styles.contactItem}>
                            <span>🏥 TT Hiến Máu: 1234567890</span>
                        </div>
                        <div className={styles.contactItem}>
                            <span>🩸 TT Nhận Máu: 0123459876</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Copyright */}
            <div className={styles.footerBottom}>
                <p>© 2025 HCM Donation. Tất cả quyền được bảo lưu.</p>
            </div>
        </footer>
    );
}
