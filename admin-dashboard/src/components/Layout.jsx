import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken } from "../api/client.js";

export default function Layout() {
  const navigate = useNavigate();
  const fullName = localStorage.getItem("admin_full_name") || "Admin";

  function handleLogout() {
    clearToken();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h2>Sales Admin</h2>
        <nav>
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/orders">Orders</NavLink>
          <NavLink to="/customers">Customers</NavLink>
          <NavLink to="/products">Products</NavLink>
        </nav>
      </aside>
      <main className="main-content">
        <div className="topbar">
          <div>Welcome, {fullName}</div>
          <button className="btn secondary" onClick={handleLogout}>Logout</button>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
