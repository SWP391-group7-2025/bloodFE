import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './OnSiteDonation.css';
import RecoveryInfo from './RecoveryInfo';

const OnSiteDonation = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    gender: '',
    date_of_birth: '',
    address: '',
    blood_group_id: '',
    blood_volume_ml: '', // Will be set when volume types are loaded
    existing_user: false
  });

  const [bloodGroups, setBloodGroups] = useState([]);
  const [volumeTypes, setVolumeTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [existingUserInfo, setExistingUserInfo] = useState(null);
  const [checkingUser, setCheckingUser] = useState(false);
  const [lastDonationInfo, setLastDonationInfo] = useState(null);

  // Load blood groups and volume types
  useEffect(() => {
    fetchBloodGroups();
    fetchVolumeTypes();
  }, []);

  // Debug formData changes
  useEffect(() => {
    console.log('=== FORM DATA CHANGED ===');
    console.log('Current formData:', formData);
    console.log('Gender value:', formData.gender);
    console.log('Existing user:', formData.existing_user);
  }, [formData]);

  const fetchBloodGroups = async () => {
    // Set fallback data immediately to ensure UI shows correct values
    const fallbackBloodGroups = [
      { blood_group_id: 1, blood_type: 'A+' },
      { blood_group_id: 2, blood_type: 'A-' },
      { blood_group_id: 3, blood_type: 'B+' },
      { blood_group_id: 4, blood_type: 'B-' },
      { blood_group_id: 5, blood_type: 'AB+' },
      { blood_group_id: 6, blood_type: 'AB-' },
      { blood_group_id: 7, blood_type: 'O+' },
      { blood_group_id: 8, blood_type: 'O-' }
    ];

    try {
      const response = await axios.get('/api/partner/blood-groups', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      console.log('Raw blood groups from API:', response.data);

      // Clean up blood group data to prevent double + or - signs
      const cleanedBloodGroups = response.data.map(group => ({
        ...group,
        blood_type: group.blood_type
          .replace(/\+\+/g, '+')  // Replace ++ with +
          .replace(/--/g, '-')   // Replace -- with -
      }));

      console.log('Cleaned blood groups:', cleanedBloodGroups);
      setBloodGroups(cleanedBloodGroups);
    } catch (error) {
      console.error('Error fetching blood groups:', error);
      console.log('Using fallback blood groups data');
      setBloodGroups(fallbackBloodGroups);
    }
  };

  const fetchVolumeTypes = async () => {
    // Set fallback data for volume types
    const fallbackVolumeTypes = [
      { volume_type_id: 1, volume_ml: 350 },
      { volume_type_id: 2, volume_ml: 400 },
      { volume_type_id: 3, volume_ml: 450 },
      { volume_type_id: 4, volume_ml: 500 }
    ];

    try {
      const response = await axios.get('/api/donors/blood-components', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      console.log('Blood components from API:', response.data);

      if (response.data.success && response.data.data.volumeTypes) {
        const sortedVolumeTypes = response.data.data.volumeTypes.sort((a, b) => a.volume_ml - b.volume_ml);
        console.log('Volume types loaded from database:', sortedVolumeTypes);
        setVolumeTypes(sortedVolumeTypes);

        // Set default volume to 450ml if available, otherwise use first option
        const defaultVolume = sortedVolumeTypes.find(v => v.volume_ml === 450);
        if (defaultVolume && !formData.blood_volume_ml) {
          setFormData(prev => ({
            ...prev,
            blood_volume_ml: defaultVolume.volume_ml.toString()
          }));
        }
      } else {
        console.log('Using fallback volume types data');
        setVolumeTypes(fallbackVolumeTypes);
      }
    } catch (error) {
      console.error('Error fetching volume types:', error);
      console.log('Using fallback volume types data');
      setVolumeTypes(fallbackVolumeTypes);
    }
  };

  // Check if user exists when email is entered
  const checkExistingUser = async (email) => {
    if (!email) return;

    setCheckingUser(true);
    try {
      const response = await axios.get(`/api/donors/check-user-by-email?email=${email}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.exists) {
        const userData = response.data.user;
        console.log('User data received:', userData);
        console.log('Gender from database:', userData.gender);

        setExistingUserInfo(userData);
        setFormData(prev => {
          const newFormData = {
            ...prev,
            full_name: userData.full_name || '',
            phone: userData.phone || '',
            gender: userData.gender || '',
            date_of_birth: userData.date_of_birth ? userData.date_of_birth.split('T')[0] : '',
            address: userData.address || '',
            blood_group_id: userData.blood_group_id || '',
            existing_user: true
          };

          console.log('New form data being set:', newFormData);
          console.log('Gender value being set:', newFormData.gender);
          console.log('Available gender options: Male, Female, Other');

          return newFormData;
        });

        // Check last donation info for recovery period directly from user data
        if (userData.donor_id && userData.last_donation_date) {
          console.log('=== CHECKING RECOVERY PERIOD FROM EMAIL SEARCH ===');
          console.log('User data from checkUserByEmail:', userData);

          const lastDonationDate = new Date(userData.last_donation_date);
          const currentDate = new Date();
          const daysSinceLastDonation = Math.floor((currentDate - lastDonationDate) / (1000 * 60 * 60 * 24));
          const recoveryPeriod = 84; // 84 days recovery period

          console.log('Last donation date:', lastDonationDate);
          console.log('Current date:', currentDate);
          console.log('Days since last donation:', daysSinceLastDonation);
          console.log('Recovery period required:', recoveryPeriod);
          console.log('Can donate?', daysSinceLastDonation >= recoveryPeriod);

          if (daysSinceLastDonation < recoveryPeriod) {
            const remainingDays = recoveryPeriod - daysSinceLastDonation;
            const canDonateDate = new Date(lastDonationDate.getTime() + (recoveryPeriod * 24 * 60 * 60 * 1000));

            const donationInfo = {
              lastDonationDate: lastDonationDate.toLocaleDateString('vi-VN'),
              daysSinceLastDonation,
              remainingDays,
              canDonateDate: canDonateDate.toLocaleDateString('vi-VN'),
              canDonate: false
            };

            console.log('Setting lastDonationInfo (CANNOT DONATE):', donationInfo);
            setLastDonationInfo(donationInfo);
          } else {
            const donationInfo = {
              lastDonationDate: lastDonationDate.toLocaleDateString('vi-VN'),
              daysSinceLastDonation,
              canDonate: true
            };

            console.log('Setting lastDonationInfo (CAN DONATE):', donationInfo);
            setLastDonationInfo(donationInfo);
          }
        } else if (userData.donor_id) {
          // Fallback to API call if last_donation_date is not available
          await checkLastDonation(userData.user_id);
        }
      } else {
        console.log('No user found with this email');
        setExistingUserInfo(null);
        setLastDonationInfo(null);
        setFormData(prev => ({
          ...prev,
          existing_user: false
        }));
      }
    } catch (error) {
      console.error('Error checking existing user:', error);
      setExistingUserInfo(null);
      setLastDonationInfo(null);
    } finally {
      setCheckingUser(false);
    }
  };

  // Check last donation for recovery period
  const checkLastDonation = async (userId) => {
    try {
      console.log('=== CHECKING LAST DONATION ===');
      console.log('Checking for userId:', userId);

      const response = await axios.get('/api/donors/my/info', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'X-User-ID': userId // Send user ID to check specific user
        }
      });

      console.log('API Response:', response.data);

      if (response.data && response.data.last_donation_date) {
        const lastDonationDate = new Date(response.data.last_donation_date);
        const currentDate = new Date();
        const daysSinceLastDonation = Math.floor((currentDate - lastDonationDate) / (1000 * 60 * 60 * 24));
        const recoveryPeriod = 84; // 84 days recovery period

        console.log('Last donation date:', lastDonationDate);
        console.log('Current date:', currentDate);
        console.log('Days since last donation:', daysSinceLastDonation);
        console.log('Recovery period required:', recoveryPeriod);
        console.log('Can donate?', daysSinceLastDonation >= recoveryPeriod);

        if (daysSinceLastDonation < recoveryPeriod) {
          const remainingDays = recoveryPeriod - daysSinceLastDonation;
          const canDonateDate = new Date(lastDonationDate.getTime() + (recoveryPeriod * 24 * 60 * 60 * 1000));

          const donationInfo = {
            lastDonationDate: lastDonationDate.toLocaleDateString('vi-VN'),
            daysSinceLastDonation,
            remainingDays,
            canDonateDate: canDonateDate.toLocaleDateString('vi-VN'),
            canDonate: false
          };

          console.log('Setting lastDonationInfo (CANNOT DONATE):', donationInfo);
          setLastDonationInfo(donationInfo);
        } else {
          const donationInfo = {
            lastDonationDate: lastDonationDate.toLocaleDateString('vi-VN'),
            daysSinceLastDonation,
            canDonate: true
          };

          console.log('Setting lastDonationInfo (CAN DONATE):', donationInfo);
          setLastDonationInfo(donationInfo);
        }
      } else {
        console.log('No last donation date found - user can donate');
        setLastDonationInfo(null);
      }
    } catch (error) {
      console.error('Error checking last donation:', error);
      console.log('Error details:', error.response?.data);
      setLastDonationInfo(null);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Check existing user when email changes
    if (name === 'email' && value.includes('@')) {
      setTimeout(() => checkExistingUser(value), 500); // Debounce
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('=== HANDLE SUBMIT ===');
    console.log('lastDonationInfo:', lastDonationInfo);
    console.log('lastDonationInfo?.canDonate:', lastDonationInfo?.canDonate);
    console.log('Condition check (!lastDonationInfo.canDonate):', lastDonationInfo && !lastDonationInfo.canDonate);

    // Check if user is in recovery period
    if (lastDonationInfo && !lastDonationInfo.canDonate) {
      const errorMessage = `❌ Người dùng này cần chờ thêm ${lastDonationInfo.remainingDays} ngày nữa trước khi có thể hiến máu lại (có thể hiến từ ${lastDonationInfo.canDonateDate}).`;
      console.log('BLOCKING DONATION:', errorMessage);
      setMessage(errorMessage);
      return;
    }

    console.log('ALLOWING DONATION - proceeding with registration');
    setLoading(true);
    setMessage('');

    try {
      const donationData = {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth,
        address: formData.address,
        blood_group_id: parseInt(formData.blood_group_id),
        blood_volume_ml: parseInt(formData.blood_volume_ml), // Ensure it's sent as integer
        donation_date: new Date().toISOString().split('T')[0], // Today's date
        user_id: existingUserInfo ? existingUserInfo.user_id : null
      };

      console.log('Sending donation data:', donationData);
      console.log('Blood volume being sent:', donationData.blood_volume_ml, 'ml');

      const response = await axios.post('/api/direct-donation/register', donationData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data) {
        setMessage(`✅ Đăng ký hiến máu tại chỗ thành công! ${existingUserInfo ? 'Đã cập nhật thông tin cho tài khoản hiện có.' : 'Đã tạo tài khoản mới với email làm tên đăng nhập và mật khẩu mặc định: 123456'}`);

        // Reset form after successful submission
        const defaultVolume = volumeTypes.find(v => v.volume_ml === 450) || volumeTypes[0];
        setFormData({
          full_name: '',
          email: '',
          phone: '',
          gender: '',
          date_of_birth: '',
          address: '',
          blood_group_id: '',
          blood_volume_ml: defaultVolume ? defaultVolume.volume_ml.toString() : '450',
          existing_user: false
        });
        setExistingUserInfo(null);
        setLastDonationInfo(null);
      }
    } catch (error) {
      console.error('Error registering on-site donation:', error);
      setMessage(`❌ Lỗi khi đăng ký hiến máu: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="on-site-donation">
      <div className="on-site-donation__header">
        <h2 className="on-site-donation__title">🩸 Hiến Máu Tại Chỗ</h2>
        <p className="on-site-donation__description">
          Đăng ký hiến máu trực tiếp tại điểm hiến máu. Hệ thống sẽ tự động kiểm tra thông tin và tạo tài khoản nếu cần.
        </p>
      </div>

      {message && (
        <div className={`on-site-donation__message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="on-site-donation__form">
        <div className="on-site-donation__form-group">
          <label className="on-site-donation__label">
            Email <span className="required">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            className="on-site-donation__input"
            placeholder="example@email.com"
          />
          {checkingUser && (
            <span className="checking-user">Đang kiểm tra tài khoản...</span>
          )}
          {existingUserInfo && (
            <div className="existing-user-info">
              ✅ Đã tìm thấy tài khoản: {existingUserInfo.full_name}
            </div>
          )}
        </div>

        {lastDonationInfo && <RecoveryInfo lastDonationInfo={lastDonationInfo} />}

        <div className="on-site-donation__form-row">
          <div className="on-site-donation__form-group">
            <label className="on-site-donation__label">
              Họ và tên <span className="required">*</span>
            </label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              required
              className="on-site-donation__input"
              readOnly={formData.existing_user}
            />
          </div>

          <div className="on-site-donation__form-group">
            <label className="on-site-donation__label">
              Số điện thoại <span className="required">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
              className="on-site-donation__input"
              readOnly={formData.existing_user}
            />
          </div>
        </div>

        <div className="on-site-donation__form-row">
          <div className="on-site-donation__form-group">
            <label className="on-site-donation__label">
              Giới tính <span className="required">*</span>
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              required
              className="on-site-donation__select"
              disabled={formData.existing_user}
            >
              <option value="">Chọn giới tính</option>
              <option value="Male">Nam</option>
              <option value="Female">Nữ</option>
              <option value="Other">Khác</option>
            </select>
          </div>

          <div className="on-site-donation__form-group">
            <label className="on-site-donation__label">
              Ngày sinh <span className="required">*</span>
            </label>
            <input
              type="date"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleInputChange}
              required
              className="on-site-donation__input"
              readOnly={formData.existing_user}
            />
          </div>
        </div>

        <div className="on-site-donation__form-group">
          <label className="on-site-donation__label">
            Địa chỉ <span className="required">*</span>
          </label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            required
            className="on-site-donation__textarea"
            rows="3"
            readOnly={formData.existing_user}
          />
        </div>

        <div className="on-site-donation__form-group">
          <label className="on-site-donation__label">
            Nhóm máu <span className="required">*</span>
          </label>
          <select
            name="blood_group_id"
            value={formData.blood_group_id}
            onChange={handleInputChange}
            required
            className="on-site-donation__select"
          >
            <option value="">Chọn nhóm máu</option>
            {bloodGroups.map(group => (
              <option key={group.blood_group_id} value={group.blood_group_id}>
                {group.blood_type}
              </option>
            ))}
          </select>
        </div>

        <div className="on-site-donation__form-group">
          <label className="on-site-donation__label">
            Lượng máu toàn phần hiến (ml) <span className="required">*</span>
          </label>
          <select
            name="blood_volume_ml"
            value={formData.blood_volume_ml}
            onChange={handleInputChange}
            required
            className="on-site-donation__select"
          >
            <option value="">Chọn lượng máu hiến</option>
            {volumeTypes.map(volumeType => (
              <option key={volumeType.volume_type_id} value={volumeType.volume_ml}>
                {volumeType.volume_ml} ml {volumeType.volume_ml === 450 ? '(Tiêu chuẩn)' : ''}
              </option>
            ))}
          </select>
          <small className="on-site-donation__help-text">
            Lượng máu toàn phần tiêu chuẩn là 450ml. Tùy thuộc vào tình trạng sức khỏe và cân nặng của người hiến máu.
          </small>
        </div>

        <div className="on-site-donation__form-actions">
          <button
            type="submit"
            disabled={loading || (lastDonationInfo && !lastDonationInfo.canDonate)}
            className="on-site-donation__submit-btn"
            style={{
              opacity: (lastDonationInfo && !lastDonationInfo.canDonate) ? 0.5 : 1,
              backgroundColor: (lastDonationInfo && !lastDonationInfo.canDonate) ? '#ccc' : ''
            }}
          >
            {loading ? 'Đang xử lý...' :
              (lastDonationInfo && !lastDonationInfo.canDonate) ?
                `⏳ Còn ${lastDonationInfo.remainingDays} ngày để hồi phục` :
                '🩸 Đăng ký hiến máu tại chỗ'}
          </button>

          {lastDonationInfo && !lastDonationInfo.canDonate && (
            <div style={{
              marginTop: '10px',
              padding: '10px',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '8px',
              color: '#856404',
              fontWeight: '600',
              textAlign: 'center'
            }}>
              ⚠️ Không thể đăng ký hiến máu: Cần chờ thêm {lastDonationInfo.remainingDays} ngày nữa
            </div>
          )}
        </div>
      </form>

      <div className="on-site-donation__info">
        <h3>📋 Lưu ý quan trọng:</h3>
        <ul>
          <li>Hệ thống sẽ tự động kiểm tra email để xác định tài khoản hiện có</li>
          <li>Nếu chưa có tài khoản, hệ thống sẽ tạo mới với email làm tên đăng nhập</li>
          <li>Mật khẩu mặc định cho tài khoản mới: <strong>123456</strong></li>
          <li>Thời gian hồi phục tối thiểu giữa các lần hiến máu: <strong>84 ngày</strong></li>
          <li>Máu hiến sẽ được đưa vào kho máu tạm để kiểm tra chất lượng</li>
          <li>Người dùng có thể xem lịch sử hiến máu khi đăng nhập vào tài khoản</li>
        </ul>
      </div>
    </div>
  );
};

export default OnSiteDonation;
