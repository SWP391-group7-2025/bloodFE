import React from 'react';
import styles from './ContactForm.module.css'; // Thay đổi cách import

export default function ContactForm() {
  return (
    <section className={styles['contact-section']}>
      <div className={styles['contact-card']}>
        <div className={styles['contact-icon']}>
          <svg width="48" height="48" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#1e40af"/><path d="M7 9.5C7 8.11929 8.11929 7 9.5 7H14.5C15.8807 7 17 8.11929 17 9.5V14.5C17 15.8807 15.8807 17 14.5 17H9.5C8.11929 17 7 15.8807 7 14.5V9.5Z" fill="#fff"/><path d="M9 10H15V11.5C15 12.3284 14.3284 13 13.5 13H10.5C9.67157 13 9 12.3284 9 11.5V10Z" fill="#1e40af"/></svg>
        </div>
        <div>
          <h2 className={styles['contact-title']}>Liên hệ với chúng tôi</h2>
          <p className={styles['contact-desc']}>Chúng tôi luôn sẵn sàng hỗ trợ bạn. Hãy liên hệ qua các kênh dưới đây:</p>
        </div>
      </div>
      <div className={styles['contact-info-grid']}>
        <div className={styles['info-block']}>
          <span className={styles['info-label']}>Email</span>
          <a href="mailto:blooddonation259@gmail.com" className={styles['info-value']}>blooddonation259@gmail.com</a>
        </div>
        <div className={styles['info-block']}>
          <span className={styles['info-label']}>TT Hiến Máu Nhân Đạo</span>
          <span className={styles['info-value']}>1234567890</span>
          <span className={styles['info-value']}>1234876509</span>
        </div>
        <div className={styles['info-block']}>
          <span className={styles['info-label']}>Bệnh viện BTH</span>
          <span className={styles['info-value']}>4321567890</span>
          <span className={styles['info-value']}>0987651234</span>
        </div>
        <div className={styles['info-block']}>
          <span className={styles['info-label']}>TT nhận máu</span>
          <span className={styles['info-value']}>0123459876</span>
        </div>
      </div>
    </section>
  );
}