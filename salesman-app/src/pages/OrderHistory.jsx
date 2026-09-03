import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TopAppBar from "../components/TopAppBar.jsx";
import { api } from "../api/client.js";

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.getMyOrders().then(setOrders).catch((err) => setError(err.message));
  }, []);

  return (
    <>
      <TopAppBar title="My Orders" showLogout />
      <div className="screen-content">
        {error && <div className="error-text">{error}</div>}

        {orders.map((o) => (
          <div key={o.id} className="card" onClick={() => navigate(`/orders/${o.id}`)}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div className="list-item-title">{o.customer_name}</div>
              <span className={`badge ${o.status}`}>{o.status}</span>
            </div>
            <div className="list-item-sub">{new Date(o.created_at).toLocaleString()}</div>
            <div style={{ marginTop: 6, fontWeight: 700 }}>₹{Number(o.total_amount).toFixed(2)}</div>
          </div>
        ))}
        {orders.length === 0 && !error && <div className="helper-text">You haven't submitted any orders yet.</div>}
      </div>
    </>
  );
}
