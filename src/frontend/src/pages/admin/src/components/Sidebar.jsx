import React from 'react';
import { NavLink } from 'react-router-dom';
import "../styles/sidebar.css";

const Sidebar = () => {
  return (
    <div className="sidebar">
      <ul>
        <li>
          <NavLink to="/admin/staff-management" className={({ isActive }) => isActive ? "active" : ""}>
            Quản lý nhân viên và đối tác
          </NavLink>
        </li>
        <li>
          <NavLink to="/admin/assignment" className={({ isActive }) => isActive ? "active" : ""}>

            Phân công
          </NavLink>
        </li>

        <li>
          <NavLink to="/admin/schedule-management" className={({ isActive }) => isActive ? "active" : ""}>
            Quản lý lịch
          </NavLink>
        </li>
        <li>
          <NavLink to="/admin/summary" className={({ isActive }) => isActive ? "active" : ""}>
            Tổng quan
          </NavLink>
        </li>

      </ul>
    </div>
  );
};

export default Sidebar;