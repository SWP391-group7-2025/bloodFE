import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  FaTint,
  FaClipboardList,
  FaCalendarAlt,
  FaClock,
  FaUserMd,
  FaHeartbeat,
  FaShieldAlt,
  FaExclamationTriangle,
  FaMedkit,
  FaVenus,
  FaInfoCircle,
  FaPaperPlane
} from 'react-icons/fa';
import styles from './BloodRegister.module.css';

export default function BloodRegister() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const appointmentId = searchParams.get('id');
  const token = localStorage.getItem('token');

  const [formData, setFormData] = useState({
    blood_group_id: '',
    hasDonatedBefore: null,
    diseaseDetails: '',
    hasDisease: null,
    hadSpecificDiseases: null,
    hadSpecificDiseasesDetails: '',
    recent12Months: null,
    recent12MonthsDetails: '',
    recent6Months: null,
    recent6MonthsDetails: '',
    recentSymptoms14Days: null,
    recentSymptoms14DaysDetails: '',
    recentMedication7Days: null,
    recentMedication7DaysDetails: '',
    femalePregnant: null,
    femaleMiscarriage: null,
  });

  const [loading, setLoading] = useState(false);
  const [appointmentInfo, setAppointmentInfo] = useState(null);
  const [bloodGroups, setBloodGroups] = useState([]);
  const [existingDonorInfo, setExistingDonorInfo] = useState(null);
  const [bloodGroupLocked, setBloodGroupLocked] = useState(false);
  const [hasActiveAppointment, setHasActiveAppointment] = useState(false);
  const [activeAppointmentInfo, setActiveAppointmentInfo] = useState(null);
  const [recoveryInfo, setRecoveryInfo] = useState(null);
  const [isInRecoveryPeriod, setIsInRecoveryPeriod] = useState(false);

  // Backup blood types nếu API không hoạt động
  const fallbackBloodTypes = {
    1: 'A+',
    2: 'A-',
    3: 'B+',
    4: 'B-',
    5: 'AB+',
    6: 'AB-',
    7: 'O+',
    8: 'O-',
    9: 'Chưa biết nhóm máu'
  };

  useEffect(() => {
    if (!token) {
      alert('Vui lòng đăng nhập để đăng ký hiến máu');
      navigate('/login');
      return;
    }

    if (!appointmentId) {
      alert('Không tìm thấy ID lịch hẹn');
      navigate('/blood-schedule');
      return;
    }

    // Lấy thông tin appointment và blood groups
    fetchAppointmentInfo();
    fetchBloodGroups();
    fetchExistingDonorInfo();
    checkActiveAppointments();
    checkPendingAppointments();
    checkRecoveryPeriod();
  }, [appointmentId, token, navigate]);

  const fetchAppointmentInfo = async () => {
    try {
      const response = await axios.get(`/api/appointments/${appointmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointmentInfo(response.data);
    } catch (error) {
      console.error('Error fetching appointment info:', error);
      if (error.response?.status === 404) {
        alert('Không tìm thấy lịch hẹn này. Vui lòng kiểm tra lại ID.');
        navigate('/blood-schedule');
      } else if (error.response?.status === 401) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        navigate('/login');
      } else {
        alert('Không thể lấy thông tin lịch hẹn. Vui lòng thử lại sau.');
      }
    }
  };

  const fetchBloodGroups = async () => {
    try {
      const response = await axios.get('/api/inventory/blood-groups', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Blood groups fetched:', response.data);
      setBloodGroups(response.data || []);
    } catch (error) {
      console.error('Error fetching blood groups:', error);
      // Sử dụng fallback data nếu API không hoạt động
      console.log('Using fallback blood types');
      setBloodGroups([]);
    }
  };

  const fetchExistingDonorInfo = async () => {
    try {
      const response = await axios.get('/api/donors/my/info', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.blood_group_id && response.data.blood_group_id !== 9) {
        // Nếu đã có nhóm máu xác định (không phải "Chưa biết nhóm máu")
        setExistingDonorInfo(response.data);
        setFormData(prev => ({
          ...prev,
          blood_group_id: response.data.blood_group_id.toString()
        }));
        setBloodGroupLocked(true);
        console.log('Blood group locked:', response.data.blood_group_id);
      }
    } catch (error) {
      console.log('No existing donor info found or error:', error);
      // Không có donor info hoặc lỗi - người dùng có thể chọn nhóm máu tự do
    }
  };

  const checkActiveAppointments = async () => {
    try {
      // Sử dụng endpoint mới để kiểm tra trạng thái hoạt động
      const response = await axios.get('/api/donors/my/active-status', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { hasActiveDonation, donationInfo, hasActiveRequest, requestInfo } = response.data.data;

      if (hasActiveDonation || hasActiveRequest) {
        setHasActiveAppointment(true);
        setActiveAppointmentInfo({
          donationInfo: donationInfo,
          requestInfo: requestInfo,
          hasActiveDonation: hasActiveDonation,
          hasActiveRequest: hasActiveRequest
        });
      }
    } catch (error) {
      console.log('No active appointments found or error:', error);
      // Không có lịch hẹn đang hoạt động hoặc lỗi - cho phép đăng ký
    }
  };

  // Kiểm tra có lịch hẹn đang chờ xử lý không
  const checkPendingAppointments = async () => {
    try {
      const response = await axios.get('/api/appointments/my/pending-check', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { hasPendingAppointment } = response.data.data;

      if (hasPendingAppointment) {
        setHasActiveAppointment(true);
        setActiveAppointmentInfo({
          hasActiveDonation: true,
          hasActiveRequest: false,
          donationInfo: {
            appointment_date: new Date().toISOString(),
            appointment_time: '00:00',
            donation_status: 'Đã lên lịch'
          }
        });
      }
    } catch (error) {
      console.log('No pending appointments found or error:', error);
      // Không có lịch hẹn đang chờ xử lý hoặc lỗi - cho phép đăng ký
    }
  };

  // Kiểm tra thời gian hồi phục 84 ngày
  const checkRecoveryPeriod = async () => {
    try {
      const response = await axios.get('/api/donors/my/info', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.last_donation_date) {
        const lastDonationDate = new Date(response.data.last_donation_date);
        const currentDate = new Date();
        const daysSinceLastDonation = Math.floor((currentDate - lastDonationDate) / (1000 * 60 * 60 * 24));
        const recoveryPeriod = 84; // 84 ngày hồi phục

        if (daysSinceLastDonation < recoveryPeriod) {
          const remainingDays = recoveryPeriod - daysSinceLastDonation;
          const canDonateDate = new Date(lastDonationDate.getTime() + (recoveryPeriod * 24 * 60 * 60 * 1000));

          setIsInRecoveryPeriod(true);
          setRecoveryInfo({
            lastDonationDate: lastDonationDate.toLocaleDateString('vi-VN'),
            daysSinceLastDonation: daysSinceLastDonation,
            remainingDays: remainingDays,
            canDonateDate: canDonateDate.toLocaleDateString('vi-VN')
          });
        }
      }
    } catch (error) {
      console.log('No donor info found or error:', error);
      // Không có thông tin hiến máu trước đó hoặc lỗi - cho phép đăng ký
    }
  };

  const handleRadioChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === 'yes' ? true : false,
      ...(value === 'no' && {
        [`${name}Details`]: '',
      }),
    }));
  };

  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.blood_group_id) {
      toast.error('Vui lòng chọn nhóm máu');
      return;
    }

    // Validation cho health questionnaire - tất cả câu trả lời phải là "Không" (false)
    const healthQuestions = [
      { field: 'hasDisease', question: 'Hiện tại, anh/chị có mắc bệnh lý nào không?' },
      { field: 'hadSpecificDiseases', question: 'Có từng mắc các bệnh nghiêm trọng (viêm gan B, C, HIV...)?' },
      { field: 'recent12Months', question: 'Trong 12 tháng gần đây có các vấn đề sức khỏe?' },
      { field: 'recent6Months', question: 'Trong 6 tháng gần đây có các dấu hiệu bất thường?' },
      { field: 'recentSymptoms14Days', question: 'Trong 14 ngày gần đây có triệu chứng ốm?' },
      { field: 'recentMedication7Days', question: 'Trong 7 ngày gần đây có dùng thuốc?' },
      { field: 'femalePregnant', question: 'Hiện đang mang thai hoặc nuôi con dưới 12 tháng?' },
      { field: 'femaleMiscarriage', question: 'Chấm dứt thai kỳ trong 12 tháng gần đây?' }
    ];

    // Kiểm tra các câu hỏi sức khỏe quan trọng
    const failedQuestions = [];

    healthQuestions.forEach(({ field, question }) => {
      if (formData[field] === true) { // Nếu trả lời "Có"
        failedQuestions.push(question);
      } else if (formData[field] === null) { // Nếu chưa trả lời
        failedQuestions.push(`Chưa trả lời: ${question}`);
      }
    });

    if (failedQuestions.length > 0) {
      toast.error(
        `Bạn không đủ điều kiện hiến máu do:\n${failedQuestions.join('\n')}`,
        {
          duration: 6000,
          style: {
            maxWidth: '600px',
            whiteSpace: 'pre-line'
          }
        }
      );
      return;
    }

    if (hasActiveAppointment) {
      toast.error('Bạn đã có lịch hẹn hoặc yêu cầu đang hoạt động. Vui lòng hoàn thành hoặc hủy trước khi đăng ký mới.');
      return;
    }

    if (isInRecoveryPeriod && recoveryInfo) {
      toast.error(`Bạn cần chờ thêm ${recoveryInfo.remainingDays} ngày nữa mới có thể hiến máu. Thời gian hồi phục tối thiểu là 84 ngày kể từ lần hiến máu gần nhất.`);
      return;
    }

    setLoading(true);

    try {
      // Đăng ký appointment
      const response = await axios.put(`/api/appointments/${appointmentId}/register`, {
        blood_group_id: parseInt(formData.blood_group_id)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 200) {
        const message = response.data.message || 'Đăng ký thành công!';
        const details = response.data.details || '';
        toast.success(`${message} ${details}`);

        setTimeout(() => {
          navigate('/lich-su');
        }, 2000);
      }
    } catch (error) {
      console.error('Error registering appointment:', error);

      // Hiển thị error message cụ thể từ server
      const errorMessage = error.response?.data?.error || 'Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.';

      if (error.response?.status === 401) {
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderYesNoQuestion = (number, label, name, detailPlaceholder, icon) => (
    <div className={styles.questionGroup}>
      <div className={styles.questionHeader}>
        {icon && <span className={styles.questionIcon}>{icon}</span>}
        <div className={styles.questionText}>
          <strong>{number}. {label}</strong>
        </div>
      </div>
      <div className={styles.radioGroup}>
        <label className={styles.radioLabel}>
          <input
            type="radio"
            name={name}
            value="yes"
            checked={formData[name] === true}
            onChange={handleRadioChange}
          />
          <span className={styles.radioText}>Có</span>
        </label>
        <label className={styles.radioLabel}>
          <input
            type="radio"
            name={name}
            value="no"
            checked={formData[name] === false}
            onChange={handleRadioChange}
          />
          <span className={styles.radioText}>Không</span>
        </label>
      </div>
      {formData[name] && detailPlaceholder && (
        <div className={styles.detailsSection}>
          <textarea
            name={`${name}Details`}
            placeholder={detailPlaceholder}
            value={formData[`${name}Details`] || ''}
            onChange={handleTextChange}
            rows={3}
            className={styles.textArea}
          />
        </div>
      )}
    </div>
  );

  return (
    <div className={styles.container}>
      {/* Header Section */}
      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <FaTint />
        </div>
        <h1 className={styles.title}>Đăng Ký Hiến Máu</h1>
        <p className={styles.subtitle}>
          Cùng nhau chia sẻ giọt máu hồng - Cứu sống một cuộc đời
        </p>
        {appointmentId && (
          <div className={styles.appointmentBadge}>
            <FaClipboardList />
            <span>Mã lịch hẹn: #{appointmentId}</span>
          </div>
        )}
      </div>

      {/* Appointment Info */}
      {appointmentInfo && (
        <div className={styles.appointmentInfo}>
          <div className={styles.infoHeader}>
            <FaCalendarAlt className={styles.infoIcon} />
            <h3>Thông tin lịch hẹn</h3>
          </div>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <FaCalendarAlt />
              <div>
                <span className={styles.infoLabel}>Ngày hẹn</span>
                <span className={styles.infoValue}>
                  {new Date(appointmentInfo.appointment_date).toLocaleDateString('vi-VN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
            <div className={styles.infoItem}>
              <FaClock />
              <div>
                <span className={styles.infoLabel}>Thời gian</span>
                <span className={styles.infoValue}>
                  {appointmentInfo.appointment_time} - {appointmentInfo.appointment_time_end}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Section */}
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Active Appointment Warning */}
        {hasActiveAppointment && activeAppointmentInfo && (
          <div className={styles.warningCard}>
            <div className={styles.warningHeader}>
              <FaExclamationTriangle className={styles.warningIcon} />
              <h3>Không thể đăng ký hiến máu</h3>
            </div>
            <div className={styles.warningContent}>
              <p className={styles.warningText}>
                Bạn hiện đang có lịch hẹn hoặc yêu cầu đang chờ xử lý. Vui lòng hoàn thành hoặc hủy trước khi đăng ký mới.
              </p>
              {activeAppointmentInfo.hasActiveDonation && activeAppointmentInfo.donationInfo && (
                <div className={styles.appointmentList}>
                  <h4>🩸 Lịch hẹn hiến máu:</h4>
                  <div className={styles.appointmentItem}>
                    • Ngày: {new Date(activeAppointmentInfo.donationInfo.appointment_date).toLocaleDateString('vi-VN')} lúc {activeAppointmentInfo.donationInfo.appointment_time}
                    <br />• Trạng thái: {activeAppointmentInfo.donationInfo.donation_status}
                  </div>
                </div>
              )}
              {activeAppointmentInfo.hasActiveRequest && activeAppointmentInfo.requestInfo && (
                <div className={styles.appointmentList}>
                  <h4>🏥 Yêu cầu nhận máu:</h4>
                  <div className={styles.appointmentItem}>
                    • Thành phần: {activeAppointmentInfo.requestInfo.component_name}
                    <br />• Ngày yêu cầu: {new Date(activeAppointmentInfo.requestInfo.request_date).toLocaleDateString('vi-VN')}
                    <br />• Trạng thái: {activeAppointmentInfo.requestInfo.status}
                  </div>
                </div>
              )}
              <p className={styles.warningNote}>
                Vui lòng hoàn thành hoặc hủy lịch hẹn hiện tại trước khi đăng ký mới.
              </p>
            </div>
          </div>
        )}

        {/* Recovery Period Warning */}
        {isInRecoveryPeriod && recoveryInfo && (
          <div className={styles.warningCard}>
            <div className={styles.warningHeader}>
              <FaExclamationTriangle className={styles.warningIcon} />
              <h3>Đang trong thời gian hồi phục</h3>
            </div>
            <div className={styles.warningContent}>
              <p className={styles.warningText}>
                Bạn hiện đang trong thời gian hồi phục sau lần hiến máu trước. Cần chờ thêm thời gian trước khi có thể hiến máu lại.
              </p>
              <div className={styles.appointmentList}>
                <h4>⏰ Thông tin thời gian hồi phục:</h4>
                <div className={styles.appointmentItem}>
                  • Lần hiến máu gần nhất: {recoveryInfo.lastDonationDate}
                  <br />• Số ngày đã trải qua: {recoveryInfo.daysSinceLastDonation} ngày
                  <br />• Số ngày còn lại: {recoveryInfo.remainingDays} ngày
                  <br />• Có thể hiến máu lại từ: {recoveryInfo.canDonateDate}
                </div>
              </div>
              <p className={styles.warningNote}>
                Thời gian hồi phục tối thiểu là 84 ngày để đảm bảo sức khỏe của bạn.
              </p>
            </div>
          </div>
        )}

        {/* Blood Group Selection */}
        <div className={`${styles.sectionCard} ${hasActiveAppointment || isInRecoveryPeriod ? styles.disabledSection : ''}`}>
          <div className={styles.sectionHeader}>
            <FaTint className={styles.sectionIcon} />
            <h3>Thông tin nhóm máu</h3>
          </div>
          <div className={styles.questionGroup}>
            <label className={styles.fieldLabel}>
              <FaInfoCircle className={styles.fieldIcon} />
              Nhóm máu của bạn
            </label>
            <select
              name="blood_group_id"
              value={formData.blood_group_id}
              onChange={(e) => setFormData(prev => ({ ...prev, blood_group_id: e.target.value }))}
              className={styles.selectField}
              required
              disabled={bloodGroupLocked || hasActiveAppointment || isInRecoveryPeriod}
            >
              <option value="">-- Chọn nhóm máu của bạn --</option>
              {bloodGroups.length > 0 ? (
                bloodGroups.map(bg => (
                  <option key={bg.blood_group_id} value={bg.blood_group_id}>
                    {bg.blood_type}
                  </option>
                ))
              ) : (
                // Fallback options nếu API không hoạt động
                Object.entries(fallbackBloodTypes).map(([id, type]) => (
                  <option key={id} value={id}>{type}</option>
                ))
              )}
            </select>
            {bloodGroupLocked && existingDonorInfo && (
              <div className={styles.lockedInfo}>
                <FaShieldAlt className={styles.lockIcon} />
                Nhóm máu của bạn đã được xác định là <strong>
                  {existingDonorInfo.blood_type}{existingDonorInfo.rh_factor}
                </strong> dựa trên lần hiến máu trước. Bạn không thể thay đổi nhóm máu này.
              </div>
            )}
          </div>
        </div>

        {/* Health Questionnaire */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <FaUserMd className={styles.sectionIcon} />
            <h3>Khảo sát sức khỏe</h3>
            <p className={styles.sectionDescription}>
              Vui lòng trả lời thật lòng để đảm bảo an toàn cho cả bạn và người nhận máu
            </p>
            <div className={styles.healthWarning}>
              <FaExclamationTriangle className={styles.warningIcon} />
              <p>
                <strong>Lưu ý quan trọng:</strong> Để đảm bảo an toàn, bạn cần trả lời "KHÔNG" cho tất cả các câu hỏi dưới đây mới có thể hiến máu.
              </p>
            </div>
          </div>

          {renderYesNoQuestion(
            1,
            'Anh/chị từng hiến máu chưa?',
            'hasDonatedBefore',
            null,
            <FaHeartbeat />
          )}

          {renderYesNoQuestion(
            2,
            'Hiện tại, anh/chị có mắc bệnh lý nào không?',
            'hasDisease',
            'Vui lòng ghi rõ bệnh lý',
            <FaMedkit />
          )}

          {renderYesNoQuestion(
            3,
            'Trước đây, anh/chị có từng mắc một trong các bệnh: viêm gan B, C, HIV, vảy nến, phì đại tiền liệt tuyến, sốc phản vệ, tai biến mạch máu não, nhồi máu cơ tim, lupus ban đỏ, động kinh, ung thư, hen, được cấy ghép mô tạng?',
            'hadSpecificDiseases',
            'Vui lòng ghi rõ',
            <FaExclamationTriangle />
          )}

          {renderYesNoQuestion(
            4,
            'Trong 12 tháng gần đây, anh/chị có: khỏi bệnh sau sốt rét, giang mai, lao, viêm não - màng não, uốn ván, phẫu thuật ngoại khoa hoặc được truyền máu, các chế phẩm máu?',
            'recent12Months',
            'Vui lòng ghi rõ',
            <FaShieldAlt />
          )}

          {renderYesNoQuestion(
            5,
            'Trong 6 tháng gần đây, anh/chị có các dấu hiệu hoặc hành vi như: thương hàn, nhiễm trùng máu, bị rắn cắn, viêm tắc động mạch, viêm tụy, viêm tủy xương, sụt cân nhanh không rõ nguyên nhân, nổi hạch kéo dài, thủ thuật y tế xâm lấn, xăm/xỏ lỗ tai, sử dụng ma túy, tiếp xúc máu người khác, sống chung với người viêm gan B, quan hệ với người viêm gan B,C,HIV, giang mai, hoặc quan hệ tình dục với người cùng giới?',
            'recent6Months',
            'Vui lòng ghi rõ',
            <FaExclamationTriangle />
          )}

          {renderYesNoQuestion(
            6,
            'Trong 14 ngày gần đây, anh/chị có bị cúm, cảm lạnh, ho, nhức đầu, sốt, đau họng?',
            'recentSymptoms14Days',
            'Vui lòng ghi rõ',
            <FaMedkit />
          )}

          {renderYesNoQuestion(
            7,
            'Trong 7 ngày gần đây, anh/chị có dùng thuốc kháng sinh, kháng viêm, Aspirin, Corticoid?',
            'recentMedication7Days',
            'Vui lòng ghi rõ',
            <FaMedkit />
          )}
        </div>

        {/* Female-specific Questions */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <FaVenus className={styles.sectionIcon} />
            <h3>Câu hỏi dành cho phụ nữ</h3>
          </div>

          {renderYesNoQuestion(
            '8.1',
            'Hiện chị đang mang thai hoặc nuôi con dưới 12 tháng tuổi?',
            'femalePregnant',
            null,
            <FaVenus />
          )}

          {renderYesNoQuestion(
            '8.2',
            'Chấm dứt thai kỳ trong 12 tháng gần đây (sảy thai, phá thai, thai ngoài tử cung)?',
            'femaleMiscarriage',
            null,
            <FaVenus />
          )}
        </div>

        {/* Submit Button */}
        <div className={styles.submitSection}>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading || hasActiveAppointment || isInRecoveryPeriod}
          >
            <FaPaperPlane />
            {hasActiveAppointment ? 'Không thể đăng ký' :
              isInRecoveryPeriod ? 'Đang trong thời gian hồi phục' :
                (loading ? 'Đang xử lý...' : 'Gửi đăng ký hiến máu')}
          </button>
          <p className={styles.submitNote}>
            Bằng cách gửi đăng ký, bạn xác nhận rằng tất cả thông tin đã cung cấp là chính xác và đầy đủ.
          </p>
        </div>
      </form>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}