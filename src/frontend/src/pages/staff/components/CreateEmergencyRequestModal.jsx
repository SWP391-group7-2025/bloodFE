import React, { useState, useEffect } from 'react';
import './CreateEmergencyRequestModal.css';

function CreateEmergencyRequestModal({ isOpen, onClose, onRequestCreated }) {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        gender: '',
        date_of_birth: '',
        address: '',
        blood_group_id: '',
        component_id: '',
        request_date: ''
    });

    const [bloodGroups, setBloodGroups] = useState([]);
    const [components, setComponents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isOpen) {
            fetchBloodGroups();
            fetchComponents();
            // Set default request date to current date
            const now = new Date();
            const currentDateTime = now.toISOString().slice(0, 16);
            setFormData(prev => ({ ...prev, request_date: currentDateTime }));
        }
    }, [isOpen]);

    const fetchBloodGroups = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3001/api/partner/blood-groups', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setBloodGroups(data);
            }
        } catch (error) {
            console.error('Error fetching blood groups:', error);
        }
    };

    const fetchComponents = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3001/api/partner/components', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setComponents(data);
            }
        } catch (error) {
            console.error('Error fetching components:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.full_name.trim()) newErrors.full_name = 'Họ tên là bắt buộc';
        if (!formData.email.trim()) newErrors.email = 'Email là bắt buộc';
        if (!formData.phone.trim()) newErrors.phone = 'Số điện thoại là bắt buộc';
        if (!formData.gender) newErrors.gender = 'Giới tính là bắt buộc';
        if (!formData.date_of_birth) newErrors.date_of_birth = 'Ngày sinh là bắt buộc';
        if (!formData.address.trim()) newErrors.address = 'Địa chỉ là bắt buộc';
        if (!formData.blood_group_id) newErrors.blood_group_id = 'Nhóm máu là bắt buộc';
        if (!formData.component_id) newErrors.component_id = 'Thành phần máu là bắt buộc';
        if (!formData.request_date) newErrors.request_date = 'Ngày yêu cầu là bắt buộc';

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.email && !emailRegex.test(formData.email)) {
            newErrors.email = 'Email không hợp lệ';
        }

        // Phone validation
        const phoneRegex = /^[0-9]{10,11}$/;
        if (formData.phone && !phoneRegex.test(formData.phone)) {
            newErrors.phone = 'Số điện thoại phải có 10-11 chữ số';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3001/api/partner/staff/emergency-request', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...formData,
                    blood_group_id: parseInt(formData.blood_group_id),
                    component_id: parseInt(formData.component_id)
                })
            });

            if (response.ok) {
                const result = await response.json();
                alert('Tạo yêu cầu khẩn cấp thành công!');
                onRequestCreated();
                handleClose();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Không thể tạo yêu cầu');
            }
        } catch (error) {
            console.error('Error creating emergency request:', error);
            alert('Lỗi khi tạo yêu cầu: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            full_name: '',
            email: '',
            phone: '',
            gender: '',
            date_of_birth: '',
            address: '',
            blood_group_id: '',
            component_id: '',
            request_date: ''
        });
        setErrors({});
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
            <div className="modal-content">
                <div className="modal-header">
                    <h3 className="modal-title">Tạo yêu cầu máu khẩn cấp</h3>
                    <button className="close-button" onClick={handleClose}>
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label>Họ và tên <span className="required">*</span></label>
                            <input
                                type="text"
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleInputChange}
                                placeholder="Nhập họ và tên"
                            />
                            {errors.full_name && <div className="form-error">{errors.full_name}</div>}
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Email <span className="required">*</span></label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="Nhập email"
                                />
                                {errors.email && <div className="form-error">{errors.email}</div>}
                            </div>

                            <div className="form-group">
                                <label>Số điện thoại <span className="required">*</span></label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder="Nhập số điện thoại"
                                />
                                {errors.phone && <div className="form-error">{errors.phone}</div>}
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Giới tính <span className="required">*</span></label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleInputChange}
                                >
                                    <option value="">Chọn giới tính</option>
                                    <option value="male">Nam</option>
                                    <option value="female">Nữ</option>
                                    <option value="other">Khác</option>
                                </select>
                                {errors.gender && <div className="form-error">{errors.gender}</div>}
                            </div>

                            <div className="form-group">
                                <label>Ngày sinh <span className="required">*</span></label>
                                <input
                                    type="date"
                                    name="date_of_birth"
                                    value={formData.date_of_birth}
                                    onChange={handleInputChange}
                                />
                                {errors.date_of_birth && <div className="form-error">{errors.date_of_birth}</div>}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Địa chỉ <span className="required">*</span></label>
                            <textarea
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                placeholder="Nhập địa chỉ chi tiết"
                            />
                            {errors.address && <div className="form-error">{errors.address}</div>}
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Nhóm máu <span className="required">*</span></label>
                                <select
                                    name="blood_group_id"
                                    value={formData.blood_group_id}
                                    onChange={handleInputChange}
                                >
                                    <option value="">Chọn nhóm máu</option>
                                    {bloodGroups.map(group => (
                                        <option key={group.blood_group_id} value={group.blood_group_id}>
                                            {group.blood_type}{group.rh_factor}
                                        </option>
                                    ))}
                                </select>
                                {errors.blood_group_id && <div className="form-error">{errors.blood_group_id}</div>}
                            </div>

                            <div className="form-group">
                                <label>Thành phần máu <span className="required">*</span></label>
                                <select
                                    name="component_id"
                                    value={formData.component_id}
                                    onChange={handleInputChange}
                                >
                                    <option value="">Chọn thành phần máu</option>
                                    {components.map(component => (
                                        <option key={component.component_id} value={component.component_id}>
                                            {component.component_name}
                                        </option>
                                    ))}
                                </select>
                                {errors.component_id && <div className="form-error">{errors.component_id}</div>}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Ngày yêu cầu <span className="required">*</span></label>
                            <input
                                type="datetime-local"
                                name="request_date"
                                value={formData.request_date}
                                onChange={handleInputChange}
                            />
                            {errors.request_date && <div className="form-error">{errors.request_date}</div>}
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={handleClose}>
                            Hủy
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Đang tạo...' : 'Tạo yêu cầu'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateEmergencyRequestModal;
