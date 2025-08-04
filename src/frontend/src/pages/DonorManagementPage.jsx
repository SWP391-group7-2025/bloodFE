import React from 'react';
import DonorManagement from '../components/DonorManagement/DonorManagement';

const DonorManagementPage = () => {
  return (
    <div className="donor-management-page">
      <div className="page-header">
        <h1>Hệ thống quản lý hiến máu</h1>
        <p>Quản lý người hiến máu và thêm máu vào ngân hàng</p>
      </div>
      
      <DonorManagement />
    </div>
  );
};

export default DonorManagementPage;
