import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import TopAppBar from "../../components/TopAppBar.jsx";
import { api } from "../../api/client.js";
import { useCart } from "../../context/CartContext.jsx";

export default function ReviewOrder() {
  const { customer, items, updateQuantity, removeItem, total, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  if (!customer || items.length === 0) {
    navigate("/new-order/customer");
    return null;
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        customer_id: customer.id,
        items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
      };
      const order = await api.createOrder(payload);
      clearCart();
      navigate(`/orders/${order.id}`, { replace: true });
    } catch (err) {
      // Server-side validation errors (e.g. insufficient stock) surface here.
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <TopAppBar title="Review Order" showBack showLogout />
      <div className="screen-content">
        <p className="helper-text" style={{ marginTop: 0 }}>Step 3 of 3 &middot; Confirm and submit</p>

        <div className="card">
          <div className="list-item-sub">Customer</div>
          <div className="list-item-title">{customer.name}</div>
        </div>

        <div className="card">
          {items.map((i) => (
            <div key={i.product.id} className="cart-row">
              <div>
                <div style={{ fontWeight: 600 }}>{i.product.name}</div>
                <div className="list-item-sub">₹{Number(i.product.price).toFixed(2)} each</div>
              </div>
              <div className="qty-control">
                <button onClick={() => updateQuantity(i.product.id, i.quantity - 1)}>-</button>
                <span>{i.quantity}</span>
                <button onClick={() => updateQuantity(i.product.id, i.quantity + 1)}>+</button>
                <button onClick={() => removeItem(i.product.id)} style={{ color: "var(--danger)", border: "none", background: "none" }}>✕</button>
              </div>
            </div>
          ))}
          <div className="total-row">
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
        </div>

        {error && <div className="error-text">{error}</div>}

        <button className="btn" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Order"}
        </button>
      </div>
    </>
  );
}
