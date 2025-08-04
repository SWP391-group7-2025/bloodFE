import React, { useState, useEffect } from 'react';
import LenLich from '../components/LenLich/LenLich';
import styles from '../styles/ScheduleManagement.module.css';

const ScheduleManagement = () => {
  // Dữ liệu mẫu, sau này thay bằng dữ liệu từ server
  const [schedules, setSchedules] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

  // TODO: Nhận dữ liệu từ backend khi component mount
  useEffect(() => {
    fetch('http://localhost:3001/api/appointments/list')
      .then(res => res.json())
      .then(data => {
        const filtered = data.map(item => ({
          appointment_id: item.appointment_id,
          appointment_date: item.appointment_date,
          appointment_time: item.appointment_time,
          appointment_time_end: item.appointment_time_end, // Đúng tên trường
          status: item.status,
          notes: item.notes
        }));
        setSchedules(filtered);
      })
      .catch(err => {
        console.error('Lỗi khi lấy danh sách lịch:', err);
        setSchedules([]);
      });
  }, []);

  // Thêm hoặc cập nhật lịch mới
  const handleAddSchedule = () => {
    // Đóng form
    setShowForm(false);
    setEditIndex(null);
    // Gọi lại API để lấy danh sách mới
    fetch('http://localhost:3001/api/appointments/list')
      .then(res => res.json())
      .then(data => {
        const filtered = data.map(item => ({
          appointment_id: item.appointment_id,
          appointment_date: item.appointment_date,
          appointment_time: item.appointment_time,
          appointment_time_end: item.appointment_time_end,
          status: item.status,
          notes: item.notes
        }));
        setSchedules(filtered);
      })
      .catch(err => {
        console.error('Lỗi khi lấy danh sách lịch:', err);
        setSchedules([]);
      });
  };

  // Xử lý sửa
  const handleEdit = (idx) => {
    setEditIndex(idx);
    setShowForm(true);
  };

  // Xử lý xóa
  const handleDelete = async (idx) => {
    const appointmentId = schedules[idx].appointment_id;
    if (window.confirm("Bạn có chắc muốn xóa lịch này?")) {
      try {
        const res = await fetch(`http://localhost:3001/api/appointments/${appointmentId}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" }
        });
        if (!res.ok) throw new Error("Xóa lịch thất bại!");
        // Sau khi xóa thành công, cập nhật lại danh sách
        setSchedules(schedules.filter((_, i) => i !== idx));
      } catch (err) {
        alert(err.message || "Có lỗi xảy ra!");
      }
    }
  };

  // Dữ liệu truyền vào form khi sửa
  const editData = editIndex !== null ? schedules[editIndex] : undefined;

  return (
    <div className={styles.scheduleManagement}>
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>📅</div>
            <div className={styles.headerInfo}>
              <h1 className={styles.pageTitle}>Quản lý lịch trình</h1>
              <p className={styles.pageSubtitle}>Quản lý và theo dõi các cuộc hẹn hiến máu</p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button
              className={styles.createButton}
              onClick={() => { setShowForm(true); setEditIndex(null); }}
            >
              <span>➕</span>
              Thêm lịch mới
            </button>
          </div>
        </div>
      </div>

      <div className={styles.scheduleContent}>
        <div className={styles.scheduleList}>
          <div className={styles.listHeader}>
            <h3 className={styles.listTitle}>Danh sách lịch hẹn</h3>
            <div className={styles.quickStats}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>📊</div>
                <div className={styles.statInfo}>
                  <div className={styles.statValue}>{schedules.length}</div>
                  <div className={styles.statLabel}>Tổng lịch hẹn</div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.scheduleTable}>
              <thead>
                <tr>
                  <th>Ngày hẹn</th>
                  <th>Giờ hẹn</th>
                  <th>Giờ kết thúc</th>
                  <th>Trạng thái</th>
                  <th>Ghi chú</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {schedules.length > 0 ? (
                  schedules.map((item, idx) => (
                    <tr key={idx} className={styles.scheduleRow}>
                      <td className={styles.scheduleDate}>
                        {new Date(item.appointment_date).toLocaleDateString('vi-VN')}
                      </td>
                      <td className={styles.scheduleTime}>
                        {item.appointment_time
                          ? new Date(item.appointment_time).toISOString().substring(11, 16)
                          : ""}
                      </td>
                      <td className={styles.scheduleTimeEnd}>
                        {item.appointment_time_end
                          ? new Date(item.appointment_time_end).toISOString().substring(11, 16)
                          : ""}
                      </td>
                      <td>
                        <span className={`${styles.scheduleStatus} ${styles[`status${item.status.charAt(0).toUpperCase() + item.status.slice(1)}`]}`}>
                          {item.status === 'scheduled' && '📅 Đã lên lịch'}
                          {item.status === 'completed' && '✅ Đã hoàn thành'}
                          {item.status === 'cancelled' && '❌ Đã hủy'}
                        </span>
                      </td>
                      <td className={styles.scheduleNotes}>{item.notes || 'Không có ghi chú'}</td>
                      <td className={styles.scheduleActions}>
                        <button
                          className={`${styles.actionButton} ${styles.actionEdit}`}
                          title="Sửa"
                          onClick={() => handleEdit(idx)}
                        >
                          ✏️
                        </button>
                        <button
                          className={`${styles.actionButton} ${styles.actionDelete}`}
                          title="Xóa"
                          onClick={() => handleDelete(idx)}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className={styles.emptyState}>
                      <div className={styles.emptyIcon}>📭</div>
                      <div className={styles.emptyTitle}>Chưa có lịch hẹn nào</div>
                      <div className={styles.emptyDescription}>Hãy thêm lịch hẹn đầu tiên của bạn</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showForm && (
        <div className={styles.modal}>
          <div className={styles.modalBackdrop} onClick={() => { setShowForm(false); setEditIndex(null); }}></div>
          <div className={styles.modalContent}>
            <LenLich
              onSubmit={handleAddSchedule}
              onClose={() => { setShowForm(false); setEditIndex(null); }}
              defaultData={editData}
              isEdit={editIndex !== null}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleManagement;