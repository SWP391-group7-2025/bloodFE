import React, { useState, useEffect } from "react";
import styles from "./LenLich.module.css";

const defaultForm = {
    appointment_id: "",
    appointment_date: "",
    appointment_time: "",
    appointment_time_end: "",
    status: "scheduled",
    notes: ''
};

const LenLich = ({ onSubmit, onClose, defaultData, isEdit }) => {
    const [form, setForm] = useState(defaultForm);

    // Khi defaultData thay đổi (ấn Sửa), cập nhật lại form
    useEffect(() => {
        if (defaultData) {
            setForm(defaultData);
        } else {
            setForm(defaultForm);
        }
    }, [defaultData]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const formatTime = (time) => {
        if (!time) return "";
        // Nếu đã có giây, chỉ lấy HH:mm:ss
        if (time.length >= 8) return time.substring(0, 8);
        // Nếu chỉ có HH:mm, thêm :00
        return time + ":00";
    };

    const formatDate = (date) => {
        if (!date) return "";
        // Nếu đã có giờ, giữ nguyên
        if (date.length > 10) return date;
        // Nếu chỉ có YYYY-MM-DD, thêm 00:00:00.000
        return date + " 00:00:00.000";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let url, method;
            if (isEdit) {
                url = `/api/appointments/${form.appointment_id}`;
                method = "PUT";
            } else {
                url = "/api/appointments/schedule";
                method = "POST";
            }
            // Chuẩn hóa dữ liệu
            const payload = {
                ...form,
                appointment_date: formatDate(form.appointment_date),
                appointment_time: formatTime(form.appointment_time),
                appointment_time_end: formatTime(form.appointment_time_end),
            };
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("Lỗi khi gửi dữ liệu lên server");
            const data = await res.json();
            if (onSubmit) onSubmit(data);
        } catch (err) {
            alert(err.message || "Có lỗi xảy ra!");
        }
    };

    console.log(form);

    return (
        <div className={styles.lenLichContainer}>
            <div className={styles.lenLichHeader}>
                <div className={styles.titleIcon}>📅</div>
                <h2 className={styles.lenLichTitle}>
                    {isEdit ? "Chỉnh sửa lịch trình" : "Lên lịch trình hiến máu"}
                </h2>
            </div>
            <form className={styles.scheduleForm} onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Mã lịch hẹn</label>
                    <input
                        className={styles.formInput}
                        type="text"
                        name="appointment_id"
                        value={form.appointment_id}
                        onChange={handleChange}
                        readOnly
                        placeholder="Mã sẽ được tự động tạo"
                    />
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Ngày hẹn</label>
                    <input
                        className={styles.formInput}
                        type="date"
                        name="appointment_date"
                        value={form.appointment_date}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Giờ bắt đầu</label>
                    <input
                        className={styles.formInput}
                        type="time"
                        name="appointment_time"
                        value={form.appointment_time}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Giờ kết thúc</label>
                    <input
                        className={styles.formInput}
                        type="time"
                        name="appointment_time_end"
                        value={form.appointment_time_end || ""}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Ghi chú</label>
                    <textarea
                        className={styles.formTextarea}
                        name="notes"
                        value={form.notes}
                        onChange={handleChange}
                        placeholder="Nhập ghi chú cho lịch hẹn..."
                        rows="3"
                    />
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Trạng thái</label>
                    <select
                        className={styles.formSelect}
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                        required
                    >
                        <option value="scheduled">Đã lên lịch</option>
                        <option value="completed">Đã hoàn thành</option>
                        <option value="cancelled">Đã hủy</option>
                    </select>
                </div>
                <div className={styles.formActions}>
                    <button
                        type="button"
                        className={styles.cancelButton}
                        onClick={onClose}
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        className={styles.submitButton}
                    >
                        {isEdit ? "Cập nhật lịch trình" : "Tạo lịch trình"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default LenLich;