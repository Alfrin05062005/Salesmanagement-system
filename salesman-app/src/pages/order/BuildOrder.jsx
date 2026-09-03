import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TopAppBar from "../../components/TopAppBar.jsx";
import { api } from "../../api/client.js";
import { useCart } from "../../context/CartContext.jsx";

export default function BuildOrder() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const { customer, items, addItem, updateQuantity, removeItem, total } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (!customer) {
      navigate("/new-order/customer");
      return;
    }
    api.getProducts(search).then(setProducts).catch((err) => setError(err.message));
  }, [search, customer]);

  function quantityFor(productId) {
    return items.find((i) => i.product.id === productId)?.quantity || 0;
  }

  if (!customer) return null;

  return (
    <>
      <TopAppBar title="New Order" showBack showLogout />
      <div className="screen-content">
        <p className="helper-text" style={{ marginTop: 0 }}>
          Step 2 of 3 &middot; Add products for <strong>{customer.name}</strong>
        </p>
        <input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ marginBottom: 14 }} />
        {error && <div className="error-text">{error}</div>}

        {products.map((p) => {
          const qty = quantityFor(p.id);
          return (
            <div key={p.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div className="list-item-title">{p.name}</div>
                  <div className="list-item-sub">₹{Number(p.price).toFixed(2)} &middot; {p.stock_quantity} in stock</div>
                </div>
                {qty === 0 ? (
                  <button className="btn" style={{ width: "auto", padding: "8px 16px" }} onClick={() => addItem(p, 1)} disabled={p.stock_quantity === 0}>
                    Add
                  </button>
                ) : (
                  <div className="qty-control">
                    <button onClick={() => updateQuantity(p.id, qty - 1)}>-</button>
                    <span>{qty}</span>
                    <button onClick={() => updateQuantity(p.id, Math.min(qty + 1, p.stock_quantity))}>+</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {products.length === 0 && !error && <div className="helper-text">No products found.</div>}
      </div>

      {items.length > 0 && (
        <div style={{ position: "sticky", bottom: 60, background: "var(--surface)", padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
          <div className="total-row" style={{ padding: "0 0 10px" }}>
            <span>Subtotal ({items.length} item{items.length > 1 ? "s" : ""})</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
          <button className="btn" onClick={() => navigate("/new-order/review")}>Review Order</button>
        </div>
      )}
    </>
  );
}
