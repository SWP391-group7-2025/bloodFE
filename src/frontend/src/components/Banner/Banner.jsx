import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';
import viCustom from '../../locales/vi-custom';
import styles from './Banner.module.css';

export default function Banner() {
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [donationRecoveryInfo, setDonationRecoveryInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  // Kiểm tra lần hiến máu cuối cùng và tính ngày hồi phục
  useEffect(() => {
    const fetchLastDonation = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Lấy lịch sử hiến máu của user
        const response = await axios.get('/api/donors/my/history', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const donationHistory = response.data;
        if (donationHistory && donationHistory.length > 0) {
          // Tìm lần hiến máu "completed" hoặc "donated" gần nhất
          const completedDonations = donationHistory.filter(
            donation => donation.donation_status === 'completed' || donation.donation_status === 'donated'
          );

          if (completedDonations.length > 0) {
            // Sắp xếp theo ngày hiến gần nhất
            const sortedDonations = completedDonations.sort(
              (a, b) => new Date(b.collection_date || b.donation_date) - new Date(a.collection_date || a.donation_date)
            );

            const lastDonation = sortedDonations[0];
            const lastDonationDate = new Date(lastDonation.collection_date || lastDonation.donation_date);
            const currentDate = new Date();

            // Fix timezone issue - chỉ so sánh ngày, không so sánh giờ
            // Set về cùng múi giờ để tránh lỗi tính toán
            const lastDonationDateOnly = new Date(lastDonationDate.getFullYear(), lastDonationDate.getMonth(), lastDonationDate.getDate());
            const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

            // Tính số ngày đã trôi qua kể từ lần hiến cuối
            const daysPassed = Math.floor((currentDateOnly - lastDonationDateOnly) / (1000 * 60 * 60 * 24));
            const recoveryPeriod = 84; // 84 ngày hồi phục
            const daysRemaining = recoveryPeriod - daysPassed;



            setDonationRecoveryInfo({
              lastDonationDate: lastDonationDateOnly, // Sử dụng ngày đã chuẩn hóa
              daysPassed: daysPassed,
              daysRemaining: Math.max(0, daysRemaining),
              canDonate: daysPassed >= recoveryPeriod,
              bloodType: lastDonation.blood_group_id
            });
          }
        }
      } catch (error) {
        console.log('Could not fetch donation history or user not logged in:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLastDonation();
  }, [token]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!from || !to) {
      alert('Vui lòng chọn đầy đủ ngày từ - đến');
      return;
    }

    // Kiểm tra xem user có đang trong thời gian hồi phục không
    if (donationRecoveryInfo && donationRecoveryInfo.daysRemaining > 0) {
      alert(`Bạn cần chờ thêm ${donationRecoveryInfo.daysRemaining} ngày nữa trước khi có thể hiến máu lại. Thời gian hồi phục tối thiểu là 84 ngày sau lần hiến máu cuối cùng.`);
      return;
    }

    // Tránh vấn đề timezone bằng cách format ngày theo local timezone
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const fromStr = formatDate(from);
    const toStr = formatDate(to);

    navigate(`/blood-schedule?from=${fromStr}&to=${toStr}`);
  };

  return (
    <section className={styles.banner}>
      {/* Thông báo hồi phục sau hiến máu */}
      {!loading && donationRecoveryInfo && (
        <div className={styles.recoveryNotification}>
          {donationRecoveryInfo.canDonate ? (
            <div className={styles.canDonateMessage}>
              <span className={styles.recoveryIcon}>✅</span>
              <div className={styles.recoveryText}>
                <strong>Bạn đã sẵn sàng hiến máu!</strong>
                <p>Đã qua {donationRecoveryInfo.daysPassed} ngày kể từ lần hiến cuối ({donationRecoveryInfo.lastDonationDate.toLocaleDateString('vi-VN')})</p>
              </div>
            </div>
          ) : (
            <div className={styles.recoveryMessage}>
              <span className={styles.recoveryIcon}>⏰</span>
              <div className={styles.recoveryText}>
                <strong>Thời gian hồi phục sau hiến máu</strong>
                <p>Còn <span className={styles.daysHighlight}>{donationRecoveryInfo.daysRemaining} ngày</span> để có thể hiến máu tiếp theo</p>
                <small>Lần hiến cuối: {donationRecoveryInfo.lastDonationDate.toLocaleDateString('vi-VN')} ({donationRecoveryInfo.daysPassed}/84 ngày)</small>
              </div>
            </div>
          )}
        </div>
      )}

      <form className={styles.dateSearchBox} onSubmit={handleSubmit}>
        <label className={styles.dateLabel}>
          <span role="img" aria-label="calendar" className={styles.dateIcon}>📅</span>
          Bạn cần đặt lịch vào thời gian nào?
        </label>
        <div className={styles.dateInputGroup}>
          <DatePicker
            selected={from}
            onChange={date => setFrom(date)}
            selectsStart
            startDate={from}
            endDate={to}
            minDate={new Date()} // Chỉ cho phép chọn từ ngày hiện tại trở đi
            placeholderText="Từ ngày"
            className={styles.dateInput}
            locale={viCustom}
            dateFormat="dd/MM/yyyy"
            popperPlacement="bottom"
            popperClassName={styles.customDatepickerPopper}
          />
          <span className={styles.dateSeparator}>-</span>
          <DatePicker
            selected={to}
            onChange={date => setTo(date)}
            selectsEnd
            startDate={from}
            endDate={to}
            minDate={from || new Date()} // Tối thiểu là ngày "từ" hoặc ngày hiện tại
            placeholderText="Đến ngày"
            className={styles.dateInput}
            locale={viCustom}
            dateFormat="dd/MM/yyyy"
            popperPlacement="bottom"
            popperClassName={styles.customDatepickerPopper}
          />
          <button type="submit" className={styles.dateSearchBtn}>Tìm kiếm</button>
        </div>
      </form>
    </section>
  );
}
