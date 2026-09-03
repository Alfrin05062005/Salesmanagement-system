import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import TopAppBar from "../components/TopAppBar.jsx";
import { api } from "../api/client.js";

export default function OrderDetail() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getOrder(orderId).then(setOrder).catch((err) => setError(err.message));
  }, [orderId]);

  return (
    <>
      <TopAppBar title="Order Details" showBack showLogout />
      <div className="screen-content">
        {error && <div className="error-text">{error}</div>}
        {!order && !error && <div className="helper-text">Loading order...</div>}

        {order && (
          <>
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="list-item-title">{order.customer_name}</div>
                <span className={`badge ${order.status}`}>{order.status}</span>
              </div>
              <div className="list-item-sub">{new Date(order.created_at).toLocaleString()}</div>
            </div>

            <div className="card">
              {order.items.map((item) => (
                <div key={item.id} className="cart-row">
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.product_name}</div>
                    <div className="list-item-sub">{item.quantity} × ₹{Number(item.unit_price).toFixed(2)}</div>
                  </div>
                  <div style={{ fontWeight: 700 }}>₹{Number(item.subtotal).toFixed(2)}</div>
                </div>
              ))}
              <div className="total-row">
                <span>Total</span>
                <span>₹{Number(order.total_amount).toFixed(2)}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
