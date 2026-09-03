import React from "react";
import { useNavigate } from "react-router-dom";
import { clearToken } from "../api/client.js";

export default function TopAppBar({ title, showBack = false, showLogout = false }) {
  const navigate = useNavigate();

  function handleLogout() {
    clearToken();
    navigate("/login");
  }

  return (
    <div className="top-app-bar">
      {showBack ? (
        <button className="back" onClick={() => navigate(-1)}>&larr; Back</button>
      ) : (
        <span />
      )}
      <h1>{title}</h1>
      {showLogout ? (
        <button className="back" onClick={handleLogout}>Logout</button>
      ) : (
        <span style={{ width: 40 }} />
      )}
    </div>
  );
}
