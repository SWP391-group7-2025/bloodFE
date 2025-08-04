// src/frontend/src/components/ProtectedRoute/StaffProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

const StaffProtectedRoute = ({ children, requiredPermissions = [], userRole, isLoggedIn }) => {
  // Nếu chưa đăng nhập, chuyển đến login
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // Nếu không phải staff, chuyển hướng
  if (userRole !== 'staff') {
    switch (userRole) {
      case 'admin':
        return <Navigate to="/staff-management" replace />;
      case 'member':
        return <Navigate to="/" replace />;
      case 'partner':
        return <Navigate to="/partner/emergency-request" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  // Kiểm tra quyền cụ thể của staff
  const allowedTaskTypes = JSON.parse(localStorage.getItem('allowedTaskTypes') || '[]');
  
  if (requiredPermissions.length > 0) {
    const hasPermission = requiredPermissions.some(permission => allowedTaskTypes.includes(permission));
    
    if (!hasPermission) {
      // Nếu không có quyền, chuyển hướng về trang công việc
      return <Navigate to="/cong-viec" replace />;
    }
  }

  return children;
};

export default StaffProtectedRoute;
