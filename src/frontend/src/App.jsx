import { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';  // Sửa import ở đây

import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import Login from "./components/Login/Login";
import Register from "./components/Register/Register";
import ProfilePage from "./components/ProfilePage/ProfilePage";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import SimpleProtectedRoute from "./components/ProtectedRoute/SimpleProtectedRoute";
import StaffProtectedRoute from "./components/ProtectedRoute/StaffProtectedRoute";
import ToastProvider from "./components/ToastProvider/ToastProvider";

import HomePage from "./pages/HomePage";
import ContactPage from "./pages/ContactPage";
import FaqPage from "./pages/FaqPage";
import BloodInfoPage from "./pages/BloodInfoPage";
import NotFoundPage from "./pages/NotFoundPage";

// Import các trang theo vai trò
import { LichSu, DangKyNhanMau } from "./pages/MemberPages";
import { CongViec, QuanLyHienMau, QuanLyNhanMau, NganHangMau, KhoMauTam } from "./pages/staff/pages/StaffPage";

// Import các trang admin mới
import { Assignment, StaffManagement, Summary, ScheduleManagement } from "./pages/admin/src/pages";

// Import partner component
import PartnerEmergencyRequest from "./components/PartnerEmergency/PartnerEmergencyRequest";
import PartnerHistory from "./components/PartnerHistory/PartnerHistory";
import UnicodeTest from "./components/UnicodeTest/UnicodeTest";

import BloodSchedulePage from "./pages/BloodSchedulePage";
import BloodRegisterPage from './pages/BloodRegisterPage';

import "./App.css";


export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState({ email: "", full_name: "", role: "" });
  const navigate = useNavigate();

  // Load userInfo từ localStorage nếu có, ưu tiên hơn token
  useEffect(() => {
    const storedUserInfo = localStorage.getItem("userInfo");
    if (storedUserInfo) {
      const user = JSON.parse(storedUserInfo);
      setUserInfo(user);
      setIsLoggedIn(true);            // Chuyển hướng theo vai trò nếu đang ở trang chủ
      if (window.location.pathname === '/') {
        switch (user.role) {
          case 'admin':
            navigate("/staff-management");
            break;
          case 'staff':
            navigate("/cong-viec");
            break;
          case 'partner':
            navigate("/partner/emergency-request");
            break;
          default:
            break;
        }
      }
    } else {
      // Nếu không có userInfo, thử lấy token rồi decode
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decoded = jwtDecode(token);
          const user = {
            full_name: decoded.full_name,
            username: decoded.username,
            userId: decoded.userId,
            role: decoded.role,
          };
          setUserInfo(user);
          setIsLoggedIn(true);

          // Chuyển hướng theo vai trò nếu đang ở trang chủ
          if (window.location.pathname === '/') {
            switch (user.role) {
              case 'admin':
                navigate("/staff-management");
                break;
              case 'staff':
                navigate("/cong-viec");
                break;
              case 'partner':
                navigate("/partner/emergency-request");
                break;
              default:
                break;
            }
          }
        } catch (error) {
          console.error("Token không hợp lệ:", error);
          localStorage.removeItem("token");
          setIsLoggedIn(false);
        }
      }
    }
  }, [navigate]);

  function handleLoginSuccess(user) {
    setIsLoggedIn(true);
    setUserInfo(user);
    localStorage.setItem("userInfo", JSON.stringify(user)); // lưu userInfo

    // Chuyển hướng theo vai trò
    switch (user.role) {
      case 'admin':
        navigate("/staff-management");
        break;
      case 'staff':
        navigate("/cong-viec");
        break;
      case 'partner':
        navigate("/partner/emergency-request");
        break;
      case 'member':
        navigate("/");
        break;
      default:
        navigate("/");
        break;
    }
  }

  function handleLogout() {
    setIsLoggedIn(false);
    setUserInfo({ email: "", full_name: "", role: "" });
    localStorage.removeItem("token");
    localStorage.removeItem("userInfo");
    navigate("/login");  // điều hướng về login sau logout
  }

  const userRole = userInfo.role;


  return (
    <ToastProvider>
      <div className="app-root" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header
          isLoggedIn={isLoggedIn}
          userInfo={userInfo}
          handleLogout={handleLogout}
          userRole={userRole}
        />

        <main style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Routes>
            {/* Trang chủ - công khai cho tất cả */}
            <Route path="/" element={<HomePage />} />

            {/* Các trang công khai - tất cả đều được xem */}
            <Route path="/hoi-dap" element={<FaqPage />} />
            <Route path="/lien-he" element={<ContactPage />} />
            <Route path="/thong-tin-mau" element={<BloodInfoPage />} />
            <Route path="/profile" element={
              <SimpleProtectedRoute isLoggedIn={isLoggedIn}>
                <ProfilePage />
              </SimpleProtectedRoute>
            } />

            {/* Routes cho thành viên */}
            {isLoggedIn && userRole === "member" && (
              <>
                <Route path="/dang-ky-hien-mau" element={<BloodRegisterPage />} />
                <Route path="/lich-su" element={<LichSu />} />
                <Route path="/dang-ky-nhan-mau" element={<DangKyNhanMau />} />
              </>
            )}

            {/* Routes cho partner */}
            {isLoggedIn && userRole === "partner" && (
              <>
                <Route path="/partner/emergency-request" element={<PartnerEmergencyRequest />} />
                <Route path="/partner/history" element={<PartnerHistory />} />
              </>
            )}

            {/* Routes cho admin */}
            {isLoggedIn && userRole === "admin" && (
              <>
                <Route path="/staff-management" element={<StaffManagement />} />
                <Route path="/assignment" element={<Assignment />} />
                <Route path="/summary" element={<Summary />} />
                <Route path="/schedule-management" element={<ScheduleManagement />} />
              </>
            )}

            {/* Routes cho staff */}
            {isLoggedIn && userRole === "staff" && (
              <>
                <Route path="/cong-viec" element={<CongViec />} />
                <Route path="/quan-ly-hien-mau" element={
                  <StaffProtectedRoute
                    requiredPermissions={['blood_collection']}
                    userRole={userRole}
                    isLoggedIn={isLoggedIn}
                  >
                    <QuanLyHienMau />
                  </StaffProtectedRoute>
                } />
                <Route path="/quan-ly-nhan-mau" element={
                  <StaffProtectedRoute
                    requiredPermissions={['donation_management']}
                    userRole={userRole}
                    isLoggedIn={isLoggedIn}
                  >
                    <QuanLyNhanMau />
                  </StaffProtectedRoute>
                } />
                <Route path="/ngan-hang-mau" element={
                  <StaffProtectedRoute
                    requiredPermissions={['blood_testing']}
                    userRole={userRole}
                    isLoggedIn={isLoggedIn}
                  >
                    <NganHangMau />
                  </StaffProtectedRoute>
                } />
                <Route path="/kho-mau-tam" element={
                  <StaffProtectedRoute
                    requiredPermissions={['temporary_storage']}
                    userRole={userRole}
                    isLoggedIn={isLoggedIn}
                  >
                    <KhoMauTam />
                  </StaffProtectedRoute>
                } />
              </>
            )}

            {/* Các trang chung - tất cả đều được xem */}
            <Route path="/blood-schedule" element={<BloodSchedulePage />} />
            <Route path="/blood-register" element={
              <ProtectedRoute allowedRoles={['member']} userRole={userRole} isLoggedIn={isLoggedIn}>
                <BloodRegisterPage />
              </ProtectedRoute>
            } />

            {/* Trang đăng nhập/đăng ký */}
            <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>

        <Footer isLoggedIn={isLoggedIn} />
      </div>
    </ToastProvider>
  );
}
