import React, { useState } from 'react';
import SummaryCard from '../components/Summary/SummaryCard';
import InventoryReport from '../components/Summary/InventoryReport';
import DonationReport from '../components/Summary/DonationReport';

import DonationReminderList from '../components/Summary/DonationReminderList';
import styles from '../styles/Summary.module.css';

const summaryList = [
  { key: 'summary', label: 'Tổng quan hệ thống', icon: '' },
  { key: 'inventory', label: '🩸 Báo cáo tồn kho máu', icon: '🩸' },
  { key: 'donation', label: '🧾 Báo cáo hiến máu', icon: '🧾' },
  { key: 'appointment', label: '📅 Báo cáo lịch hẹn và nhắc nhở', icon: '📅' },
];

const Summary = () => {
  const [open, setOpen] = useState(null);

  const renderDetail = () => {
    let title = '';
    let content = null;
    switch (open) {
      case 'summary':
        title = 'Tổng quan hệ thống';
        content = <SummaryCard />;
        break;
      case 'inventory':
        title = '🩸 Báo cáo tồn kho máu';
        content = <InventoryReport />;
        break;
      case 'donation':
        title = '🧾 Báo cáo hiến máu';
        content = <DonationReport />;
        break;
      case 'appointment':
        title = '📅 Báo cáo lịch hẹn và nhắc nhở';
        content = <DonationReminderList />;
        break;
      default:
        break;
    }
    return { title, content };
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h1 className={styles.title}>Báo Cáo & Thống Kê</h1>
          <p className={styles.subtitle}>Tổng quan hoạt động và phân tích dữ liệu hệ thống</p>
        </div>

        {open ? (
          <div className={styles.content}>
            <div className={styles.contentHeader}>
              <h2 className={styles.contentTitle}>{renderDetail().title}</h2>
              <p className={styles.contentSubtitle}>Chi tiết thông tin và dữ liệu</p>
            </div>
            <div className={styles.reportContainer}>
              {renderDetail().content}
            </div>
            <div className={styles.actionButtons}>
              <button
                className={styles.secondaryButton}
                onClick={() => setOpen(null)}
              >
                ← Quay lại tổng quan
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.navigation}>
            <div className={styles.menuGrid}>
              {summaryList.map(item => (
                <div
                  className={`${styles.menuItem} ${open === item.key ? styles.active : ''}`}
                  key={item.key}
                  onClick={() => setOpen(item.key)}
                >
                  <div className={styles.menuContent}>
                    <div className={styles.menuIcon}>
                      {item.icon || '📊'}
                    </div>
                    <div className={styles.menuText}>
                      <h3 className={styles.menuLabel}>{item.label}</h3>
                      <p className={styles.menuDescription}>
                        Xem chi tiết thông tin và thống kê
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Summary;