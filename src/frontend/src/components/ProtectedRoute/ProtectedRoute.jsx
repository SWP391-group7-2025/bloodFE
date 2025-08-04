// src/frontend/src/components/ProtectedRoute/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles, userRole, isLoggedIn }) => {
  // Nếu chưa đăng nhập, chuyển đến login
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // Nếu có vai trò và vai trò hiện tại không được phép
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Chuyển hướng về trang mặc định theo vai trò
    switch (userRole) {
      case 'admin':
        return <Navigate to="/staff-management" replace />;
      case 'staff':
        return <Navigate to="/cong-viec" replace />;
      case 'member':
        return <Navigate to="/" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
