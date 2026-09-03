import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function loadOrders() {
    const params = {};
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    api.getOrders(params).then(setOrders).catch((err) => setError(err.message));
  }

  useEffect(loadOrders, [search, statusFilter]);

  return (
    <div>
      <h2>Orders</h2>
      {error && <div className="error-text">{error}</div>}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <input
          className="search-bar"
          placeholder="Search by customer or salesman..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ maxWidth: 180 }}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Salesman</th>
              <th>Date</th>
              <th>Status</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} onClick={() => navigate(`/orders/${order.id}`)}>
                <td>{order.id.slice(0, 8)}...</td>
                <td>{order.customer_name}</td>
                <td>{order.salesman_name}</td>
                <td>{new Date(order.created_at).toLocaleString()}</td>
                <td><span className={`badge ${order.status}`}>{order.status}</span></td>
                <td>₹{Number(order.total_amount).toFixed(2)}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={6} style={{ color: "var(--text-muted)" }}>No orders found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
