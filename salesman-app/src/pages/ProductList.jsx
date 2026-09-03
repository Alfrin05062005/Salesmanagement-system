import React, { useEffect, useState } from "react";
import TopAppBar from "../components/TopAppBar.jsx";
import { api } from "../api/client.js";

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.getProducts(search).then(setProducts).catch((err) => setError(err.message));
  }, [search]);

  return (
    <>
      <TopAppBar title="Products" showLogout />
      <div className="screen-content">
        <input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ marginBottom: 14 }} />
        {error && <div className="error-text">{error}</div>}

        {products.map((p) => (
          <div key={p.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div className="list-item-title">{p.name}</div>
                <div className="list-item-sub">SKU: {p.sku} &middot; {p.stock_quantity} in stock</div>
              </div>
              <div style={{ fontWeight: 700 }}>₹{Number(p.price).toFixed(2)}</div>
            </div>
            {p.description && <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6 }}>{p.description}</div>}
          </div>
        ))}
        {products.length === 0 && !error && <div className="helper-text">No products found.</div>}
      </div>
    </>
  );
}
