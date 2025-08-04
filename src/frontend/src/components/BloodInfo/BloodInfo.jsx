import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './BloodInfo.module.css';

const BloodInfo = () => {
    const [searchBloodType, setSearchBloodType] = useState('');
    const [searchRh, setSearchRh] = useState('');
    const [searchComponent, setSearchComponent] = useState('');
    const [searchResult, setSearchResult] = useState(null);

    // States for donor search
    const [donorSearchBloodType, setDonorSearchBloodType] = useState('');
    const [donorSearchRh, setDonorSearchRh] = useState('');
    const [donorSearchComponent, setDonorSearchComponent] = useState('');
    const [compatibleDonors, setCompatibleDonors] = useState([]);
    const [isSearchingDonors, setIsSearchingDonors] = useState(false);
    const [donorSearchError, setDonorSearchError] = useState(null);

    // Check if user is logged in
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        setIsLoggedIn(!!token);
    }, []);





    // Dữ liệu tương thích cho từng loại thành phần máu
    const compatibilityData = {
        'whole-blood': {
            'O-': ['O-'],
            'O+': ['O-', 'O+'],
            'A-': ['O-', 'A-'],
            'A+': ['O-', 'O+', 'A-', 'A+'],
            'B-': ['O-', 'B-'],
            'B+': ['O-', 'O+', 'B-', 'B+'],
            'AB-': ['O-', 'A-', 'B-', 'AB-'],
            'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']
        },
        'red-cells': {
            'O-': ['O-'],
            'O+': ['O-', 'O+'],
            'A-': ['O-', 'A-'],
            'A+': ['O-', 'O+', 'A-', 'A+'],
            'B-': ['O-', 'B-'],
            'B+': ['O-', 'O+', 'B-', 'B+'],
            'AB-': ['O-', 'A-', 'B-', 'AB-'],
            'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']
        },
        'plasma': {
            'O': ['O', 'A', 'B', 'AB'],
            'A': ['A', 'AB'],
            'B': ['B', 'AB'],
            'AB': ['AB']
        },
        'platelets': {
            'O-': ['O-'],
            'O+': ['O-', 'O+'],
            'A-': ['A-', 'O-'],
            'A+': ['A+', 'A-', 'O+', 'O-'],
            'B-': ['B-', 'O-'],
            'B+': ['B+', 'B-', 'O+', 'O-'],
            'AB-': ['AB-', 'A-', 'B-', 'O-'],
            'AB+': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-']
        }
    };

    const handleSearch = () => {
        if (!searchBloodType || !searchComponent) {
            setSearchResult(null);
            return;
        }

        let bloodTypeKey = searchBloodType;
        if (searchComponent !== 'plasma') {
            bloodTypeKey = searchBloodType + searchRh;
        }

        const compatible = compatibilityData[searchComponent]?.[bloodTypeKey] || [];

        setSearchResult({
            bloodType: searchBloodType,
            rh: searchRh,
            component: searchComponent,
            compatible: compatible
        });
    };

    const getComponentName = (component) => {
        const names = {
            'whole-blood': 'Máu toàn phần',
            'red-cells': 'Hồng cầu',
            'plasma': 'Huyết tương',
            'platelets': 'Tiểu cầu'
        };
        return names[component] || component;
    };

    // Function to search for compatible donors
    const handleSearchDonors = async () => {
        if (!donorSearchBloodType || !donorSearchComponent || 
            (donorSearchComponent !== 'plasma' && !donorSearchRh)) {
            setDonorSearchError('Vui lòng chọn đầy đủ thông tin tìm kiếm');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            setDonorSearchError('Vui lòng đăng nhập để sử dụng tính năng này');
            return;
        }

        setIsSearchingDonors(true);
        setDonorSearchError(null);

        try {
            const requestParams = {
                bloodType: donorSearchBloodType,
                component: donorSearchComponent
            };

            // Only add rhFactor if not plasma
            if (donorSearchComponent !== 'plasma') {
                requestParams.rhFactor = donorSearchRh;
            } else {
                requestParams.rhFactor = null;
            }

            console.log('Searching donors with params:', requestParams);

            const response = await axios.get('http://localhost:3001/api/donors/compatible', {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                params: requestParams
            });

            if (!response.data) {
                throw new Error('Không nhận được dữ liệu từ server');
            }

            console.log('Server response:', response.data);
            setCompatibleDonors(response.data);
        } catch (error) {
            console.error('Error searching donors:', error);
            let errorMessage = 'Không thể tìm kiếm người hiến máu. Vui lòng thử lại sau.';

            if (error.response) {
                console.error('Server error details:', error.response.data);
                errorMessage = error.response.data?.message ||
                    `Lỗi server (${error.response.status}): ${error.response.data?.error || 'Không xác định'}`;
            } else if (error.request) {
                console.error('No response received:', error.request);
                errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
            } else {
                console.error('Request setup error:', error.message);
                errorMessage = 'Lỗi kết nối: ' + error.message;
            }

            setDonorSearchError(errorMessage);
            setCompatibleDonors([]);
        } finally {
            setIsSearchingDonors(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>
                    <span className={styles.icon}>🩸</span>
                    Thông Tin Về Máu & Tương Thích Truyền Máu
                </h1>
                <p className={styles.subtitle}>
                    Kiến thức cơ bản về các thành phần máu và nguyên tắc tương thích trong truyền máu
                </p>
            </div>

            {/* Phần tìm kiếm tương thích */}
            <section className={styles.searchSection}>
                <h2 className={styles.searchTitle}>
                    🔍 Tìm Kiếm Tương Thích Nhóm Máu
                </h2>
                <p className={styles.searchSubtitle}>
                    Nhập thông tin nhóm máu để tìm kiếm các thành phần máu tương thích
                </p>

                <div className={styles.searchForm}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Nhóm máu ABO:</label>
                        <select
                            value={searchBloodType}
                            onChange={(e) => setSearchBloodType(e.target.value)}
                            className={styles.select}
                        >
                            <option value="">Chọn nhóm máu</option>
                            <option value="O">O</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="AB">AB</option>
                        </select>
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Yếu tố Rh:</label>
                        <select
                            value={searchRh}
                            onChange={(e) => setSearchRh(e.target.value)}
                            className={styles.select}
                            disabled={searchComponent === 'plasma'}
                        >
                            <option value="">Chọn Rh</option>
                            <option value="+">Dương (+)</option>
                            <option value="-">Âm (-)</option>
                        </select>
                        {searchComponent === 'plasma' && (
                            <small className={styles.note}>Huyết tương không xét yếu tố Rh</small>
                        )}
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Thành phần máu:</label>
                        <select
                            value={searchComponent}
                            onChange={(e) => setSearchComponent(e.target.value)}
                            className={styles.select}
                        >
                            <option value="">Chọn thành phần</option>
                            <option value="whole-blood">Máu toàn phần</option>
                            <option value="red-cells">Hồng cầu</option>
                            <option value="plasma">Huyết tương</option>
                            <option value="platelets">Tiểu cầu</option>
                        </select>
                    </div>

                    <button
                        onClick={handleSearch}
                        className={styles.searchButton}
                        disabled={!searchBloodType || !searchComponent || (searchComponent !== 'plasma' && !searchRh)}
                    >
                        Tìm kiếm
                    </button>
                </div>

                {/* Kết quả tìm kiếm */}
                {searchResult && (
                    <div className={styles.searchResult}>
                        <h3 className={styles.resultTitle}>
                            📋 Kết quả tìm kiếm
                        </h3>
                        <div className={styles.resultInfo}>
                            <p>
                                <strong>Người nhận:</strong> {searchResult.bloodType}{searchResult.component !== 'plasma' ? searchResult.rh : ''}
                            </p>
                            <p>
                                <strong>Thành phần:</strong> {getComponentName(searchResult.component)}
                            </p>
                        </div>
                        <div className={styles.compatibleList}>
                            <h4>Có thể nhận từ các nhóm máu:</h4>
                            <div className={styles.bloodTypeGrid}>
                                {searchResult.compatible.map((type, index) => (
                                    <span key={index} className={styles.compatibleBloodType}>
                                        {type}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* Donor Search Section - Only show when logged in */}
            {isLoggedIn && (
                <section className={styles.searchSection}>
                    <h2 className={styles.searchTitle}>
                        👥 Tìm Kiếm Người Hiến Máu
                    </h2>
                    <p className={styles.searchSubtitle}>
                        Tìm những người hiến máu đã hiến thành công, có nhóm máu tương thích theo khoảng cách
                    </p>

                    <div className={styles.searchForm}>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Nhóm máu ABO:</label>
                            <select
                                value={donorSearchBloodType}
                                onChange={(e) => setDonorSearchBloodType(e.target.value)}
                                className={styles.select}
                            >
                                <option value="">Chọn nhóm máu</option>
                                <option value="O">O</option>
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="AB">AB</option>
                            </select>
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Yếu tố Rh:</label>
                            <select
                                value={donorSearchRh}
                                onChange={(e) => setDonorSearchRh(e.target.value)}
                                className={styles.select}
                                disabled={donorSearchComponent === 'plasma'}
                            >
                                <option value="">Chọn Rh</option>
                                <option value="+">Dương (+)</option>
                                <option value="-">Âm (-)</option>
                            </select>
                            {donorSearchComponent === 'plasma' && (
                                <small className={styles.note}>Huyết tương không xét yếu tố Rh</small>
                            )}
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Thành phần máu:</label>
                            <select
                                value={donorSearchComponent}
                                onChange={(e) => setDonorSearchComponent(e.target.value)}
                                className={styles.select}
                            >
                                <option value="">Chọn thành phần</option>
                                <option value="whole-blood">Máu toàn phần</option>
                                <option value="red-cells">Hồng cầu</option>
                                <option value="plasma">Huyết tương</option>
                                <option value="platelets">Tiểu cầu</option>
                            </select>
                        </div>

                        <button
                            onClick={handleSearchDonors}
                            className={styles.searchButton}
                            disabled={isSearchingDonors || !donorSearchBloodType || !donorSearchComponent || 
                                     (donorSearchComponent !== 'plasma' && !donorSearchRh)}
                        >
                            {isSearchingDonors ? 'Đang tìm kiếm...' : 'Tìm người hiến máu'}
                        </button>
                    </div>

                    {donorSearchError && (
                        <div className={styles.errorMessage}>
                            {donorSearchError}
                        </div>
                    )}

                    {compatibleDonors.length > 0 && (
                        <div className={styles.searchResult}>
                            <h3 className={styles.resultTitle}>
                                👥 Danh sách người hiến máu tương thích
                            </h3>
                            <p className={styles.resultSubtitle}>
                                Những người đã hiến máu thành công, sắp xếp theo khoảng cách từ gần đến xa
                            </p>
                            <div className={styles.donorList}>
                                {compatibleDonors.map((donor) => (
                                    <div key={donor.donor_id} className={styles.donorCard}>
                                        <div className={styles.donorInfo}>
                                            <div className={styles.donorName}>
                                                <strong>{donor.full_name}</strong>
                                            </div>
                                            <div className={styles.donorEmail}>
                                                📧 {donor.email}
                                            </div>
                                            <div className={styles.donorBloodType}>
                                                🩸 Nhóm máu: {donor.blood_type}
                                            </div>
                                            {donor.last_donation_date && (
                                                <div className={styles.donorLastDonation}>
                                                    📅 Hiến máu gần nhất: {new Date(donor.last_donation_date).toLocaleDateString('vi-VN')}
                                                </div>
                                            )}
                                            {donor.distance_km && (
                                                <div className={styles.donorDistance}>
                                                    📍 Khoảng cách: {donor.distance_km.toFixed(1)} km
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {compatibleDonors.length === 0 && !donorSearchError && !isSearchingDonors && 
                     donorSearchBloodType && donorSearchComponent && 
                     (donorSearchComponent === 'plasma' || donorSearchRh) && (
                        <div className={styles.noResults}>
                            Không tìm thấy người hiến máu có nhóm máu tương thích đã hiến máu thành công
                        </div>
                    )}
                </section>
            )}

            {/* Separate donor search section */}
            <div className={styles.content}>
                {/* 1. Máu toàn phần */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        🔴 1. Truyền Máu Toàn Phần (Whole Blood)
                    </h2>
                    <div className={styles.info}>
                        <p><strong>🧪 Thành phần:</strong> Hồng cầu + Huyết tương + Tiểu cầu + Bạch cầu</p>
                        <p><strong>✅ Nguyên tắc tương thích:</strong> Phải khớp hoàn toàn cả ABO và Rh</p>
                        <p><strong>📌 Lưu ý:</strong> Hiện tại ít sử dụng, thay thế bằng các thành phần riêng biệt</p>
                    </div>
                </section>

                {/* 2. Hồng cầu */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        🔴 2. Truyền Hồng Cầu (Red Blood Cells)
                    </h2>
                    <div className={styles.info}>
                        <p><strong>🧪 Thành phần:</strong> Chủ yếu hồng cầu, loại bỏ huyết tương</p>
                        <p><strong>✅ Nguyên tắc tương thích:</strong></p>
                        <ul>
                            <li>Phụ thuộc vào kháng nguyên ABO trên hồng cầu</li>
                            <li>Hầu như giống hệt quy tắc của máu toàn phần</li>
                            <li>Yếu tố Rh vẫn được xét đến</li>
                        </ul>
                    </div>

                    <div className={styles.tableContainer}>
                        <h3 className={styles.tableTitle}>Bảng Tương Thích Hồng Cầu</h3>
                        <table className={styles.compatibilityTable}>
                            <thead>
                                <tr>
                                    <th>Người nhận</th>
                                    <th>Nhận hồng cầu từ</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className={styles.bloodType}>O−</td>
                                    <td>O−</td>
                                </tr>
                                <tr>
                                    <td className={styles.bloodType}>O+</td>
                                    <td>O−, O+</td>
                                </tr>
                                <tr>
                                    <td className={styles.bloodType}>A−</td>
                                    <td>O−, A−</td>
                                </tr>
                                <tr>
                                    <td className={styles.bloodType}>A+</td>
                                    <td>O−, O+, A−, A+</td>
                                </tr>
                                <tr>
                                    <td className={styles.bloodType}>B−</td>
                                    <td>O−, B−</td>
                                </tr>
                                <tr>
                                    <td className={styles.bloodType}>B+</td>
                                    <td>O−, O+, B−, B+</td>
                                </tr>
                                <tr>
                                    <td className={styles.bloodType}>AB−</td>
                                    <td>O−, A−, B−, AB−</td>
                                </tr>
                                <tr>
                                    <td className={styles.bloodType}>AB+</td>
                                    <td className={styles.universal}>Tất cả</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* 3. Huyết tương */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        🟡 3. Truyền Huyết Tương (Plasma)
                    </h2>
                    <div className={styles.info}>
                        <p><strong>🧪 Thành phần:</strong> Chỉ huyết tương (kháng thể), không có hồng cầu</p>
                        <p><strong>✅ Nguyên tắc tương thích:</strong></p>
                        <ul>
                            <li>Quy tắc ngược lại với truyền hồng cầu</li>
                            <li>Xét đến kháng thể trong huyết tương người cho</li>
                            <li>Người có nhóm AB là người cho huyết tương phổ quát</li>
                            <li>Người có nhóm O là người nhận huyết tương phổ quát</li>
                        </ul>
                        <p><strong>📌 Lưu ý:</strong> Huyết tương AB không chứa kháng thể anti-A và anti-B → an toàn cho mọi người nhận</p>
                    </div>

                    <div className={styles.tableContainer}>
                        <h3 className={styles.tableTitle}>Bảng Tương Thích Huyết Tương</h3>
                        <div className={styles.dualTable}>
                            <div className={styles.tableHalf}>
                                <h4>Người nhận</h4>
                                <table className={styles.compatibilityTable}>
                                    <thead>
                                        <tr>
                                            <th>Người nhận</th>
                                            <th>Nhận huyết tương từ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className={styles.bloodType}>O</td>
                                            <td className={styles.universal}>O, A, B, AB</td>
                                        </tr>
                                        <tr>
                                            <td className={styles.bloodType}>A</td>
                                            <td>A, AB</td>
                                        </tr>
                                        <tr>
                                            <td className={styles.bloodType}>B</td>
                                            <td>B, AB</td>
                                        </tr>
                                        <tr>
                                            <td className={styles.bloodType}>AB</td>
                                            <td>AB</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div className={styles.tableHalf}>
                                <h4>Người cho</h4>
                                <table className={styles.compatibilityTable}>
                                    <thead>
                                        <tr>
                                            <th>Người cho</th>
                                            <th>Huyết tương truyền được cho</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className={styles.bloodType}>AB</td>
                                            <td className={styles.universal}>Tất cả</td>
                                        </tr>
                                        <tr>
                                            <td className={styles.bloodType}>A</td>
                                            <td>A, O</td>
                                        </tr>
                                        <tr>
                                            <td className={styles.bloodType}>B</td>
                                            <td>B, O</td>
                                        </tr>
                                        <tr>
                                            <td className={styles.bloodType}>O</td>
                                            <td>O</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 4. Tiểu cầu */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        🧬 4. Truyền Tiểu Cầu (Platelets)
                    </h2>
                    <div className={styles.info}>
                        <p><strong>🧪 Thành phần:</strong> Chủ yếu là tiểu cầu, nhưng có một ít huyết tương còn sót</p>
                        <p><strong>✅ Nguyên tắc tương thích:</strong></p>
                        <ul>
                            <li>Ưu tiên cùng nhóm ABO, nhưng không bắt buộc tuyệt đối</li>
                            <li>Có thể truyền chéo nhóm ABO, nhưng có rủi ro phản ứng nhẹ do kháng thể trong huyết tương còn sót</li>
                            <li>Yếu tố Rh cũng quan trọng → người Rh- không nên nhận từ Rh+ (nếu không bắt buộc)</li>
                            <li><strong>AB:</strong> người nhận tiểu cầu lý tưởng (do không có kháng thể anti-A, anti-B)</li>
                            <li><strong>O:</strong> người cho tiểu cầu lý tưởng (ít kháng nguyên, ít gây phản ứng)</li>
                        </ul>
                        <p><strong>📌 Lưu ý:</strong> Trường hợp khẩn cấp, tiểu cầu có thể được truyền chéo nhóm, nếu đã kiểm tra kháng thể huyết tương.</p>
                    </div>

                    <div className={styles.tableContainer}>
                        <h3 className={styles.tableTitle}>Bảng Tương Thích Tiểu Cầu (Ưu tiên)</h3>
                        <table className={styles.compatibilityTable}>
                            <thead>
                                <tr>
                                    <th>Người nhận</th>
                                    <th>Nhận tiểu cầu từ (ưu tiên)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className={styles.bloodType}>O−</td>
                                    <td>O−</td>
                                </tr>
                                <tr>
                                    <td className={styles.bloodType}>O+</td>
                                    <td>O−, O+</td>
                                </tr>
                                <tr>
                                    <td className={styles.bloodType}>A−</td>
                                    <td>A−, O−</td>
                                </tr>
                                <tr>
                                    <td className={styles.bloodType}>A+</td>
                                    <td>A+, A−, O+, O−</td>
                                </tr>
                                <tr>
                                    <td className={styles.bloodType}>B−</td>
                                    <td>B−, O−</td>
                                </tr>
                                <tr>
                                    <td className={styles.bloodType}>B+</td>
                                    <td>B+, B−, O+, O−</td>
                                </tr>
                                <tr>
                                    <td className={styles.bloodType}>AB−</td>
                                    <td>AB−, A−, B−, O−</td>
                                </tr>
                                <tr>
                                    <td className={styles.bloodType}>AB+</td>
                                    <td className={styles.universal}>Tất cả</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* 5. Tổng kết */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        💡 5. Tổng Kết Quy Tắc Tương Thích
                    </h2>
                    <div className={styles.tableContainer}>
                        <table className={styles.summaryTable}>
                            <thead>
                                <tr>
                                    <th>Thành phần máu</th>
                                    <th>Xét ABO</th>
                                    <th>Xét Rh</th>
                                    <th>Ghi chú</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><strong>Máu toàn phần</strong></td>
                                    <td className={styles.checkMark}>✔</td>
                                    <td className={styles.checkMark}>✔</td>
                                    <td>Khớp hoàn toàn</td>
                                </tr>
                                <tr>
                                    <td><strong>Hồng cầu</strong></td>
                                    <td className={styles.checkMark}>✔</td>
                                    <td className={styles.checkMark}>✔</td>
                                    <td>Rất nghiêm ngặt</td>
                                </tr>
                                <tr>
                                    <td><strong>Huyết tương</strong></td>
                                    <td className={styles.checkMark}>✔</td>
                                    <td className={styles.crossMark}>✖</td>
                                    <td>Không xét Rh</td>
                                </tr>
                                <tr>
                                    <td><strong>Tiểu cầu</strong></td>
                                    <td className={styles.priority}>✔ (ưu tiên)</td>
                                    <td className={styles.priority}>✔ (ưu tiên)</td>
                                    <td>Có thể chéo nhóm nếu cần, nhưng nên tránh</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Lưu ý quan trọng */}
                <section className={styles.warningSection}>
                    <h2 className={styles.warningTitle}>
                        ⚠️ Lưu Ý Quan Trọng
                    </h2>
                    <div className={styles.warningBox}>
                        <ul>
                            <li>Luôn kiểm tra kỹ nhóm máu và yếu tố Rh trước khi truyền</li>
                            <li>Trong trường hợp khẩn cấp, có thể sử dụng O− (người cho phổ quát) cho hồng cầu</li>
                            <li>AB+ là người nhận phổ quát cho hồng cầu</li>
                            <li>AB là người cho phổ quát cho huyết tương</li>
                            <li>O là người nhận phổ quát cho huyết tương</li>
                            <li>Luôn theo dõi phản ứng sau truyền máu</li>
                        </ul>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default BloodInfo;
