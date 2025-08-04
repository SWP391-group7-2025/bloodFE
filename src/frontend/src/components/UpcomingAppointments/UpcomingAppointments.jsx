import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './UpcomingAppointments.module.css';

function getIsLoggedIn() {
  return !!localStorage.getItem('token');
}

function formatDate(dateString) {
  const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('vi-VN', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  return timeStr.slice(0, 5);
}

function LoginModal({ show, onClose }) {
  if (!show) return null;
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalBox}>
        <div className={styles.modalTitle}>Bạn cần đăng nhập để đăng ký hiến máu</div>
        <div className={styles.modalActions}>
          <button className={styles.modalLoginBtn} onClick={() => window.location.href = '/login'}>Đăng nhập</button>
          <button className={styles.modalCancelBtn} onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
}

export default function UpcomingAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUpcomingAppointments();
  }, []);

  const fetchUpcomingAppointments = async () => {
    try {
      // Lấy lịch trong 30 ngày tới
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + 30);

      const formatDateForApi = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const fromStr = formatDateForApi(today);
      const toStr = formatDateForApi(futureDate);

      const response = await axios.get(`/api/appointments/date-range?from=${fromStr}&to=${toStr}`);
      const data = Array.isArray(response.data) ? response.data : response.data?.data || [];
      
      // Lọc và sắp xếp để lấy 4 ngày gần nhất
      const sortedAppointments = data
        .filter(apt => new Date(apt.appointment_date) >= today)
        .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date))
        .slice(0, 4);

      setAppointments(sortedAppointments);
    } catch (error) {
      console.error('Error fetching upcoming appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAll = () => {
    // Lấy ngày hôm nay và 15 ngày sau
    const today = new Date();
    const toDate = new Date();
    toDate.setDate(today.getDate() + 15);
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    const fromStr = formatDate(today);
    const toStr = formatDate(toDate);
    navigate(`/blood-schedule?from=${fromStr}&to=${toStr}`);
  };

  const handleRegister = (appointmentId) => {
    if (!getIsLoggedIn()) {
      setShowLoginModal(true);
      return;
    }
    navigate(`/blood-register?id=${appointmentId}`);
  };

  if (loading) {
    return (
      <section className={styles.container}>
        <div className={styles.loadingMessage}>
          <div style={{fontSize: '2rem', marginBottom: '16px'}}>⏳</div>
          Đang tải lịch hiến máu...
        </div>
      </section>
    );
  }

  return (
    <section className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          ❤️ lịch hiến máu gần nhất
        </h2>
        <p className={styles.subtitle}>
          💫 Tham gia hiến máu để cứu sống nhiều người - Mỗi giọt máu là một món quà quý giá
        </p>
      </div>

      {appointments.length === 0 ? (
        <div className={styles.noAppointments}>
          <div className={styles.noAppointmentsIcon}>�️</div>
          <div className={styles.noAppointmentsText}>
            Hiện tại chưa có lịch hiến máu nào được lên kế hoạch trong thời gian tới
          </div>
          <button onClick={handleViewAll} className={styles.viewAllButton}>
            🔍 Xem tất cả lịch hiến máu
          </button>
        </div>
      ) : (
        <>
          <div className={styles.appointmentsList}>
            {appointments.map((appointment) => (
              <div key={appointment.appointment_id} className={styles.appointmentCard}>
                <div className={styles.dateSection}>
                  <div className={styles.dayNumber}>
                    {new Date(appointment.appointment_date).getDate()}
                  </div>
                  <div className={styles.monthYear}>
                    <div className={styles.month}>
                      Tháng {new Date(appointment.appointment_date).getMonth() + 1}
                    </div>
                    <div className={styles.year}>
                      {new Date(appointment.appointment_date).getFullYear()}
                    </div>
                  </div>
                </div>
                
                <div className={styles.appointmentInfo}>
                  <div className={styles.appointmentDate}>
                    {formatDate(appointment.appointment_date)}
                  </div>
                  <div className={styles.appointmentTime}>
                    🕐 {formatTime(appointment.appointment_time)} - {formatTime(appointment.appointment_time_end)}
                  </div>
                  <div className={styles.appointmentStatus}>
                    ✅ Sẵn sàng đăng ký
                  </div>
                </div>

                <div className={styles.actionSection}>
                  <button 
                    onClick={() => handleRegister(appointment.appointment_id)}
                    className={styles.registerButton}
                  >
                    💉 Đăng ký ngay
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.footer}>
            <button onClick={handleViewAll} className={styles.viewAllButton}>
              🔍 Xem lịch hiến máu khác →
            </button>
          </div>
        </>
      )}

      <LoginModal show={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </section>
  );
}
