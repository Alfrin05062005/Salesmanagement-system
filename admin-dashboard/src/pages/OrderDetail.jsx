import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client.js";

export default function OrderDetail() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  function load() {
    api.getOrder(orderId).then(setOrder).catch((err) => setError(err.message));
  }

  useEffect(load, [orderId]);

  async function handleStatusChange(status) {
    setUpdating(true);
    try {
      const updated = await api.updateOrderStatus(orderId, status);
      setOrder(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  }

  if (error) return <div className="error-text">{error}</div>;
  if (!order) return <div>Loading order...</div>;

  return (
    <div>
      <Link to="/orders">&larr; Back to orders</Link>
      <h2>Order #{order.id.slice(0, 8)}</h2>

      <div className="metrics-grid">
        <div className="card">
          <div className="metric-label">Customer</div>
          <div>{order.customer_name}</div>
        </div>
        <div className="card">
          <div className="metric-label">Salesman</div>
          <div>{order.salesman_name}</div>
        </div>
        <div className="card">
          <div className="metric-label">Date</div>
          <div>{new Date(order.created_at).toLocaleString()}</div>
        </div>
        <div className="card">
          <div className="metric-label">Total</div>
          <div>₹{Number(order.total_amount).toFixed(2)}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            Status: <span className={`badge ${order.status}`}>{order.status}</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn secondary" disabled={updating || order.status === "confirmed"} onClick={() => handleStatusChange("confirmed")}>
              Mark Confirmed
            </button>
            <button className="btn secondary" disabled={updating || order.status === "cancelled"} onClick={() => handleStatusChange("cancelled")}>
              Cancel Order
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Items</h3>
        <table>
          <thead>
            <tr><th>Product</th><th>Quantity</th><th>Unit Price</th><th>Subtotal</th></tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td>{item.product_name}</td>
                <td>{item.quantity}</td>
                <td>₹{Number(item.unit_price).toFixed(2)}</td>
                <td>₹{Number(item.subtotal).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
