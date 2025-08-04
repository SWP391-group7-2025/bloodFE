import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaExclamationTriangle } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { showSuccessToast, showErrorToast, showWarningToast, showInfoToast } from '../../utils/toast';
import styles from './DangKyNhanMau.module.css';


const API_BASE_URL = 'http://localhost:3001';
axios.defaults.baseURL = API_BASE_URL;

function DangKyNhanMau() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [bloodGroups, setBloodGroups] = useState([]);
  const [components, setComponents] = useState([]);
  const [bloodGroupId, setBloodGroupId] = useState('');
  const [componentId, setComponentId] = useState('');
  const [medicalCondition, setMedicalCondition] = useState('');
  const [registrationDate, setRegistrationDate] = useState(new Date().toISOString().slice(0, 16));
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingRecipients, setExistingRecipients] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [hasActiveAppointment, setHasActiveAppointment] = useState(false);
  const [activeAppointmentInfo, setActiveAppointmentInfo] = useState(null);
  const [donationHistory, setDonationHistory] = useState([]);
  const [hasEverDonated, setHasEverDonated] = useState(false);
  const [checkingDonationHistory, setCheckingDonationHistory] = useState(true);

  const token = localStorage.getItem('token');

  // Helper functions cho SweetAlert2
  const showSuccess = (title, text, options = {}) => {
    return Swal.fire({
      icon: 'success',
      title: title,
      text: text,
      confirmButtonText: 'OK',
      confirmButtonColor: '#28a745',
      ...options
    });
  };

  const showError = (title, text, options = {}) => {
    return Swal.fire({
      icon: 'error',
      title: title,
      text: text,
      confirmButtonText: 'OK',
      confirmButtonColor: '#dc3545',
      ...options
    });
  };

  const showWarning = (title, text, options = {}) => {
    return Swal.fire({
      icon: 'warning',
      title: title,
      text: text,
      confirmButtonText: 'OK',
      confirmButtonColor: '#ffc107',
      ...options
    });
  };

  const showInfo = (title, text, options = {}) => {
    return Swal.fire({
      icon: 'info',
      title: title,
      text: text,
      confirmButtonText: 'OK',
      confirmButtonColor: '#17a2b8',
      ...options
    });
  };

  const showAuthError = (text) => {
    return Swal.fire({
      icon: 'warning',
      title: 'Phiên đăng nhập hết hạn',
      text: text,
      confirmButtonText: 'Đăng nhập',
      confirmButtonColor: '#007bff'
    });
  };

  // Helper functions cho datetime
  const getCurrentDateTime = () => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  };

  const formatDisplayDateTime = (datetime) => {
    if (!datetime) return '';
    const date = new Date(datetime);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMinDateTime = () => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  };

  const getMaxDateTime = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 6); // Cho phép đăng ký tối đa 6 tháng trước
    return maxDate.toISOString().slice(0, 16);
  };

  // Test API connectivity
  const testConnection = async () => {
    try {
      const response = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000
      });
      setConnectionStatus('connected');
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNREFUSED' || error.message.includes('ECONNREFUSED')) {
        setConnectionStatus('server-down');
        setError('Không thể kết nối đến server. Vui lòng đảm bảo server đang chạy trên http://localhost:3001');
      } else if (error.response?.status === 401) {
        setConnectionStatus('auth-error');
        setError('Token không hợp lệ. Vui lòng đăng nhập lại.');
      } else if (error.response?.status >= 500) {
        setConnectionStatus('server-error');
        setError('Server đang gặp sự cố. Vui lòng thử lại sau.');
      } else {
        setConnectionStatus('error');
        setError('Lỗi kết nối: ' + (error.response?.data?.message || error.message));
      }
      return false;
    }
  };

  // Kiểm tra lịch sử hiến máu của người dùng
  const checkDonationHistory = async () => {
    try {
      setCheckingDonationHistory(true);
      const response = await axios.get('/api/donors/my/history', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const donationData = response.data.data || response.data || [];
      setDonationHistory(donationData);

      // Kiểm tra xem có ít nhất 1 lần hiến máu hoàn thành không
      const hasCompletedDonation = donationData.some(donation => {
        const hasDonatedStatus = donation.donation_status === 'donated';
        const hasCompletedStatus = donation.status === 'completed';
        const hasCollectionDate = donation.collection_date && donation.collection_date !== '';
        const hasDonationDate = donation.donation_date && donation.donation_date !== '';
        const hasBloodComponents = donation.blood_components && donation.blood_components.length > 0;

        return hasDonatedStatus || hasCompletedStatus || hasCollectionDate || hasDonationDate || hasBloodComponents;
      });

      setHasEverDonated(hasCompletedDonation);
    } catch (error) {
      console.error('Error checking donation history:', error);
      // Nếu không tìm thấy lịch sử hiến máu hoặc lỗi API, coi như chưa hiến máu
      setHasEverDonated(false);
      setDonationHistory([]);
    } finally {
      setCheckingDonationHistory(false);
    }
  };

  // Kiểm tra có yêu cầu nhận máu đang chờ xử lý không
  const checkPendingRequests = async () => {
    try {
      const response = await axios.get('/api/recipients/my/pending-check', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { hasPendingRequest } = response.data.data;

      if (hasPendingRequest) {
        setHasActiveAppointment(true);
        setActiveAppointmentInfo({
          hasActiveDonation: false,
          hasActiveRequest: true,
          requestInfo: {
            status: 'Đang chờ xử lý',
            request_date: new Date().toISOString(),
            component_name: 'Yêu cầu nhận máu'
          }
        });
      }
    } catch (error) {
      console.log('No pending requests found or error:', error);
      // Không có yêu cầu đang chờ xử lý hoặc lỗi - cho phép đăng ký
    }
  };

  // Kiểm tra trạng thái hoạt động của người dùng
  const checkActiveStatus = async () => {
    try {
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

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setError('Vui lòng đăng nhập để tiếp tục');
        setLoading(false);
        return;
      }

      // Test connection first
      const isConnected = await testConnection();
      if (!isConnected) {
        setLoading(false);
        return;
      }

      try {
        // Lấy thông tin user và lịch sử đăng ký hiện tại song song
        const [userRes, bloodGroupsRes, componentsRes, recipientsRes] = await Promise.allSettled([
          axios.get('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('/api/inventory/blood-groups', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('/api/inventory/components', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('/api/recipients/my/info', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        // Xử lý thông tin user
        if (userRes.status === 'fulfilled') {
          setUser(userRes.value.data);
        } else {
          console.error('User fetch error:', userRes.reason);
          throw new Error('Không thể tải thông tin người dùng');
        }

        // Xử lý danh sách nhóm máu
        if (bloodGroupsRes.status === 'fulfilled') {
          setBloodGroups(bloodGroupsRes.value.data || []);
        } else {
          console.error('Blood groups fetch error:', bloodGroupsRes.reason);
          // Không throw error - cho phép tiếp tục mà không có blood groups
          // Chỉ hiển thị warning trong console, không cần thông báo cho user
          setBloodGroups([]);
        }

        // Xử lý danh sách components
        if (componentsRes.status === 'fulfilled') {
          setComponents(componentsRes.value.data || []);
        } else {
          console.error('Components fetch error:', componentsRes.reason);
          setComponents([]);
        }

        // Xử lý thông tin recipient hiện tại (có thể có nhiều đăng ký)
        if (recipientsRes.status === 'fulfilled') {
          const responseData = recipientsRes.value.data;

          // Kiểm tra response format mới
          if (responseData && responseData.success) {
            if (responseData.hasRegistrations && responseData.recipients) {
              setExistingRecipients(responseData.recipients);
            } else {
              setExistingRecipients([]);
            }
          } else if (Array.isArray(responseData)) {
            // Backward compatibility với format cũ
            setExistingRecipients(responseData);
          } else {
            setExistingRecipients([]);
          }
        } else {
          // Xử lý tất cả các lỗi từ recipients API
          const error = recipientsRes.reason;

          if (error?.response?.status === 404) {
            // 404 là bình thường - user chưa có đăng ký nào
            setExistingRecipients([]);
          } else if (error?.response?.status >= 500) {
            // Server errors
            console.error('Server error when fetching recipients');
            setError('Lỗi server khi tải lịch sử nhận máu. Vui lòng thử lại sau.');
            setExistingRecipients([]);
          } else if (error?.response?.status === 401) {
            // Auth error
            console.error('Authentication error when fetching recipients');
            setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            setExistingRecipients([]);
          } else {
            // Các lỗi khác
            console.error('Recipients fetch error:', error);
            setExistingRecipients([]);
          }
        }

        // Kiểm tra trạng thái hoạt động (lịch hẹn/yêu cầu đang chờ)
        await checkActiveStatus();

        // Kiểm tra có yêu cầu nhận máu đang chờ xử lý không
        await checkPendingRequests();

        // Kiểm tra lịch sử hiến máu để xác định điều kiện đủ tiêu chuẩn
        await checkDonationHistory();

        // ...existing code...
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu:', err);
        setError(err.response?.data?.message || err.message || 'Đã xảy ra lỗi khi tải dữ liệu');
      } finally {
        setLoading(false);
        // Reset error nếu đã load thành công user data và không có lỗi nghiêm trọng
        setTimeout(() => {
          if (user && !error.includes('Token không hợp lệ') && !error.includes('server')) {
            setError('');
          }
        }, 100);
      }
    };

    fetchData();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    // Validation
    if (!medicalCondition.trim()) {
      showWarningToast('Vui lòng điền thông tin tiền sử bệnh');
      setSubmitting(false);
      return;
    }

    // Xử lý Unicode cho tiếng Việt - chỉ loại bỏ ký tự thực sự nguy hiểm
    const sanitizedCondition = medicalCondition.trim()
      .normalize('NFC') // Chuẩn hóa Unicode cho tiếng Việt TRƯỚC
      .replace(/[<>]/g, '') // Chỉ loại bỏ ký tự HTML nguy hiểm
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Loại bỏ control characters nhưng GIỮ LẠI tiếng Việt
      .substring(0, 1000); // Giới hạn độ dài

    if (!sanitizedCondition) {
      showWarningToast('Thông tin tiền sử bệnh không hợp lệ');
      setSubmitting(false);
      return;
    }

    if (hasActiveAppointment) {
      showWarning('Yêu cầu đang chờ xử lý', 'Bạn đã có lịch hẹn hoặc yêu cầu đang chờ xử lý. Vui lòng hoàn thành hoặc xóa yêu cầu trước khi đăng ký mới.');
      setSubmitting(false);
      return;
    }

    // Kiểm tra điều kiện đã hiến máu ít nhất 1 lần
    if (!hasEverDonated) {
      showInfo('Cần hiến máu trước', 'Bạn cần phải hiến máu ít nhất 1 lần trước khi có thể đăng ký nhận máu. Vui lòng đăng ký hiến máu trước.');
      setSubmitting(false);
      return;
    }

    if (!registrationDate) {
      showWarning('Thiếu thông tin', 'Vui lòng chọn ngày và giờ đăng ký');
      setSubmitting(false);
      return;
    }

    // Kiểm tra ngày đăng ký không được trong quá khứ
    const selectedDate = new Date(registrationDate);
    const now = new Date();
    if (selectedDate < now) {
      showWarning('Ngày không hợp lệ', 'Ngày đăng ký không thể là thời điểm trong quá khứ');
      setSubmitting(false);
      return;
    }

    try {
      const response = await axios.post('/api/recipients/register', {
        blood_group_id: bloodGroupId || null,
        component_id: componentId || null,
        medical_condition: sanitizedCondition,
        registration_date: registrationDate
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json; charset=utf-8'
        }
      });

      // Thêm recipient mới vào danh sách
      const newRecipient = response.data.recipient;
      if (newRecipient) {
        setExistingRecipients(prev => [newRecipient, ...prev]);
      }

      // Hiển thị thông báo thành công với SweetAlert2
      showSuccess(
        'Đăng ký thành công! 🎉',
        'Yêu cầu nhận máu của bạn đã được ghi nhận. Chúng tôi sẽ liên hệ khi có kết quả.',
        {
          showCancelButton: true,
          cancelButtonText: 'Xem lịch sử',
          cancelButtonColor: '#6c757d'
        }
      ).then((result) => {
        if (result.dismiss === Swal.DismissReason.cancel) {
          // Nếu nhấn "Xem lịch sử"
          navigate('/lich-su');
        }
        // Reset form sau khi đóng popup
        setBloodGroupId('');
        setComponentId('');
        setMedicalCondition('');
        setRegistrationDate('');
        setSubmitted(false);
      });
    } catch (err) {
      console.error('Lỗi khi đăng ký:', err);
      console.error('Error response:', err.response);

      let errorMessage = '';

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        const dbError = err.response.data.error;
        if (dbError.includes('CHECK constraint')) {
          errorMessage = 'Lỗi cơ sở dữ liệu: Giá trị trạng thái không hợp lệ. Vui lòng thử lại sau.';
        } else if (dbError.includes('FOREIGN KEY')) {
          errorMessage = 'Lỗi: Nhóm máu được chọn không hợp lệ.';
        } else {
          errorMessage = `Lỗi database: ${dbError}`;
        }
      } else if (err.response?.status === 401) {
        errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        localStorage.removeItem('token');
        // Hiển thị thông báo đăng nhập hết hạn với SweetAlert2
        showAuthError('Vui lòng đăng nhập lại để tiếp tục.').then(() => {
          window.location.href = '/login';
        });
        return;
      } else if (err.response?.status === 500) {
        errorMessage = 'Lỗi server nội bộ. Vui lòng thử lại sau hoặc liên hệ admin.';
      } else if (err.code === 'NETWORK_ERROR' || !err.response) {
        errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
      } else {
        errorMessage = `Lỗi không xác định (${err.response?.status || 'No status'}): ${err.message}`;
      }

      // Hiển thị lỗi với SweetAlert2
      showError('Lỗi đăng ký', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <p>Đang tải thông tin...</p>
          {connectionStatus === 'checking' && <p>Đang kiểm tra kết nối server...</p>}
          {connectionStatus === 'server-down' && <p style={{ color: 'red' }}>⚠️ Server không phản hồi</p>}
          {connectionStatus === 'connected' && <p style={{ color: 'green' }}>✅ Kết nối server thành công</p>}
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!token || !user) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>Vui lòng đăng nhập để tiếp tục</p>
        </div>
      </div>
    );
  }

  // Không cần check already registered nữa - cho phép đăng ký nhiều lần

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Đăng ký nhận máu</h2>

      {/* Active Appointment Warning */}
      {hasActiveAppointment && activeAppointmentInfo && (
        <div className={styles.warningCard}>
          <div className={styles.warningHeader}>
            <FaExclamationTriangle className={styles.warningIcon} />
            <h3>Không thể đăng ký nhận máu</h3>
          </div>
          <div className={styles.warningContent}>
            <p className={styles.warningText}>
              Bạn hiện đang có lịch hẹn hoặc yêu cầu đang chờ xử lý. Vui lòng hoàn thành hoặc xóa yêu cầu trước khi đăng ký mới.
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
              Vui lòng hoàn thành hoặc xóa yêu cầu hiện tại trước khi đăng ký mới. Bạn có thể xóa yêu cầu có trạng thái "Đã yêu cầu" trong lịch sử nhận máu.
            </p>
          </div>
        </div>
      )}

      {/* Donation History Requirement Warning */}
      {!checkingDonationHistory && !hasEverDonated && (
        <div className={styles.warningCard}>
          <div className={styles.warningHeader}>
            <FaExclamationTriangle className={styles.warningIcon} />
            <h3>Chưa đủ điều kiện nhận máu</h3>
          </div>
          <div className={styles.warningContent}>
            <p className={styles.warningText}>
              Để có thể đăng ký nhận máu, bạn cần phải hiến máu ít nhất 1 lần trước đó.
            </p>
            <div style={{ marginTop: '15px' }}>
              <p><strong>📝 Lý do:</strong></p>
              <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
                <li>Đảm bảo tinh thần chia sẻ cộng đồng</li>
                <li>Hiểu được quá trình và tầm quan trọng của việc hiến máu</li>
                <li>Góp phần duy trì nguồn máu dự trữ</li>
              </ul>
            </div>
            <div style={{
              marginTop: '15px',
              padding: '10px',
              backgroundColor: '#e8f4fd',
              borderRadius: '5px',
              border: '1px solid #2196f3'
            }}>
              <p style={{ margin: 0, color: '#1565c0' }}>
                💡 <strong>Hướng dẫn:</strong> Hãy đăng ký hiến máu trước. Sau khi hoàn thành việc hiến máu,
                bạn sẽ có thể đăng ký nhận máu khi cần thiết.
              </p>
            </div>
            <div style={{ marginTop: '15px', textAlign: 'center' }}>
              <button
                onClick={() => navigate('/blood-schedule')}
                style={{
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                🩸 Xem lịch hiến máu
              </button>
            </div>
          </div>
        </div>
      )}

      {checkingDonationHistory && (
        <div style={{
          background: '#f0f8ff',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          borderLeft: '4px solid #2196f3',
          fontSize: '0.95em',
          color: '#666'
        }}>
          <p>🔄 Đang kiểm tra lịch sử hiến máu của bạn...</p>
        </div>
      )}

      {/* Hiển thị lịch sử đăng ký nếu có */}
      {existingRecipients.length > 0 ? (
        <div className={styles.historySection}>
          <div className={styles.historyHeader}>
            <h3>Lịch sử đăng ký nhận máu ({existingRecipients.length})</h3>
            <button
              type="button"
              className={styles.toggleButton}
              onClick={() => setShowHistory(!showHistory)}
            >
              {showHistory ? 'Ẩn' : 'Xem'} lịch sử
            </button>
          </div>

          {showHistory && (
            <div className={styles.historyList}>
              {existingRecipients.map((recipient, index) => (
                <div key={recipient.recipient_id || index} className={styles.historyItem}>
                  <div className={styles.historyInfo}>
                    <p><span>Nhóm máu:</span> {recipient.blood_type || 'Chưa chỉ định'}</p>
                    <p><span>Thành phần máu:</span> {recipient.component_name || 'Chưa chỉ định'}</p>
                    <p><span>Tiền sử bệnh:</span> {recipient.medical_condition}</p>
                    <p><span>Ngày giờ mong muốn:</span>
                      {recipient.registration_date ?
                        new Date(recipient.registration_date).toLocaleString('vi-VN') :
                        'Chưa chỉ định'
                      }
                    </p>
                    <p><span>Trạng thái:</span>
                      <span className={`${styles.status} ${styles[recipient.receive_status]}`}>
                        {recipient.receive_status === 'pending' ? 'Đang chờ xử lý' :
                          recipient.receive_status === 'requested' ? 'Đang chờ xử lý' :
                            recipient.receive_status === 'approved' ? 'Đã duyệt' :
                              recipient.receive_status === 'completed' ? 'Đã hoàn thành' :
                                recipient.receive_status === 'received' ? 'Đã nhận máu' :
                                  recipient.receive_status}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className={styles.noHistorySection} style={{
          background: '#f0f8ff',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          borderLeft: '4px solid #2196f3',
          fontSize: '0.95em',
          color: '#666'
        }}>
          <p>📝 Bạn chưa có lịch sử đăng ký nhận máu nào. Hãy điền form bên dưới để tạo đăng ký đầu tiên của bạn.</p>
        </div>
      )}

      <div className={styles.userInfo}>
        <h4>Thông tin người đăng ký:</h4>
        <p><span>Họ tên:</span> {user.full_name}</p>
        <p><span>Email:</span> {user.email}</p>
        <p><span>SĐT:</span> {user.phone}</p>
        {user.gender && <p><span>Giới tính:</span> {user.gender}</p>}
        {user.date_of_birth && <p><span>Ngày sinh:</span> {new Date(user.date_of_birth).toLocaleDateString()}</p>}
        {user.address && <p><span>Địa chỉ:</span> {user.address}</p>}

        {/* Hiển thị thông tin lịch sử hiến máu */}
        {!checkingDonationHistory && (
          <div style={{ marginTop: '10px', padding: '10px', backgroundColor: hasEverDonated ? '#e8f5e8' : '#ffe8e8', borderRadius: '5px' }}>
            <p><span>Trạng thái hiến máu:</span>
              {hasEverDonated ? (
                <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                  ✅ Đã hiến máu ({donationHistory.length} lần)
                </span>
              ) : (
                <span style={{ color: '#f44336', fontWeight: 'bold' }}>
                  ❌ Chưa hiến máu lần nào
                </span>
              )}
            </p>
            {hasEverDonated && donationHistory.length > 0 && (
              <small style={{ color: '#666' }}>
                Lần gần nhất: {new Date(
                  donationHistory[0]?.collection_date ||
                  donationHistory[0]?.donation_date ||
                  donationHistory[0]?.last_donation_date
                ).toLocaleDateString('vi-VN')}
              </small>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className={hasActiveAppointment || !hasEverDonated ? styles.disabledForm : ''}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Nhóm máu cần nhận:</label>
          <select
            value={bloodGroupId}
            onChange={e => setBloodGroupId(e.target.value)}
            disabled={submitting || hasActiveAppointment || !hasEverDonated}
          >
            <option value="">-- Chọn nhóm máu (tùy chọn) --</option>
            {bloodGroups.length > 0 ? (
              bloodGroups.map(bg => (
                <option key={bg.blood_group_id} value={bg.blood_group_id}>
                  {bg.blood_type}
                </option>
              ))
            ) : (
              <option disabled>Không thể tải danh sách nhóm máu</option>
            )}
          </select>

          {bloodGroups.length === 0 && (
            <small style={{ color: '#666', fontSize: '0.9em', marginTop: '5px', display: 'block' }}>
              Bạn có thể bỏ trống trường này và điền vào phần mô tả bệnh lý
            </small>
          )}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Thành phần máu cần nhận:</label>
          <select
            value={componentId}
            onChange={e => setComponentId(e.target.value)}
            disabled={submitting || hasActiveAppointment || !hasEverDonated}
          >
            <option value="">-- Chọn thành phần máu (tùy chọn) --</option>
            {components.length > 0 ? (
              components.map(component => (
                <option key={component.component_id} value={component.component_id}>
                  {component.component_name}
                </option>
              ))
            ) : (
              <option disabled>Không thể tải danh sách thành phần máu</option>
            )}
          </select>
          {components.length === 0 && (
            <small style={{ color: '#666', fontSize: '0.9em', marginTop: '5px', display: 'block' }}>
              Bạn có thể bỏ trống trường này và mô tả trong phần bệnh lý
            </small>
          )}
          <small style={{ color: '#666', fontSize: '0.9em', marginTop: '5px', display: 'block' }}>
            💡 <strong>Gợi ý:</strong> Hồng cầu (phổ biến nhất), Tiểu cầu, Huyết tương, hoặc Máu toàn phần
          </small>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Tiền sử bệnh / tình trạng sức khỏe: *</label>
          <textarea
            className={styles.textarea}
            value={medicalCondition}
            onChange={e => setMedicalCondition(e.target.value)}
            required
            disabled={submitting || hasActiveAppointment || !hasEverDonated}
            placeholder="Mô tả tình trạng sức khỏe, tiền sử bệnh, lý do cần nhận máu..."
            maxLength={1000}
          />
          <small style={{ color: '#666', fontSize: '0.8em', marginTop: '5px', display: 'block' }}>
            Số ký tự: {medicalCondition.length}/1000
          </small>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Ngày và giờ mong muốn nhận máu: *</label>
          <div className={styles.dateTimeContainer}>
            <div className={styles.dateGroup}>
              <label className={styles.subLabel}>Ngày:</label>
              <input
                type="date"
                className={styles.dateInput}
                value={registrationDate.split('T')[0]}
                onChange={e => {
                  const time = registrationDate.split('T')[1] || '09:00';
                  setRegistrationDate(`${e.target.value}T${time}`);
                }}
                required
                disabled={submitting || hasActiveAppointment || !hasEverDonated}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className={styles.timeGroup}>
              <label className={styles.subLabel}>Giờ:</label>
              <select
                className={styles.timeSelect}
                value={registrationDate.split('T')[1] || '09:00'}
                onChange={e => {
                  const date = registrationDate.split('T')[0];
                  setRegistrationDate(`${date}T${e.target.value}`);
                }}
                required
                disabled={submitting || hasActiveAppointment || !hasEverDonated}
              >
                <option value="08:00">08:00 (8 giờ sáng)</option>
                <option value="09:00">09:00 (9 giờ sáng)</option>
                <option value="10:00">10:00 (10 giờ sáng)</option>
                <option value="11:00">11:00 (11 giờ sáng)</option>
                <option value="13:00">13:00 (1 giờ chiều)</option>
                <option value="14:00">14:00 (2 giờ chiều)</option>
                <option value="15:00">15:00 (3 giờ chiều)</option>
                <option value="16:00">16:00 (4 giờ chiều)</option>
              </select>
            </div>
          </div>
          <small className={styles.helpText}>
            📅 Chọn ngày và giờ thuận tiện cho bạn. Chúng tôi sẽ liên hệ xác nhận lịch hẹn.
          </small>
        </div>

        <button
          className={styles.button}
          type="submit"
          disabled={submitting || !medicalCondition.trim() || !registrationDate || hasActiveAppointment || !hasEverDonated}
        >
          {submitting ? 'Đang gửi...' :
            hasActiveAppointment ? 'Không thể đăng ký' :
              !hasEverDonated ? 'Cần hiến máu trước' :
                'Gửi Đăng Ký'}
        </button>

        {error && (
          <div className={styles.error}>
            <p>{error}</p>
            {(connectionStatus === 'server-down' || connectionStatus === 'error' || error.includes('server') || error.includes('database')) && (
              <div style={{ marginTop: '10px' }}>
                <button
                  onClick={() => window.location.reload()}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#2196f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginRight: '10px'
                  }}
                >
                  Tải lại trang
                </button>
                <button
                  onClick={() => setError('')}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Thử lại
                </button>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}

export default DangKyNhanMau;
