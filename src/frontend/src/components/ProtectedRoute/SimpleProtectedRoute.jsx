// src/frontend/src/components/ProtectedRoute/SimpleProtectedRoute.jsx
import { Navigate } from 'react-router-dom';

const SimpleProtectedRoute = ({ children, isLoggedIn }) => {
  // Chỉ kiểm tra đăng nhập, không kiểm tra role
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default SimpleProtectedRoute;
