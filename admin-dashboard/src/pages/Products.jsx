import React, { useEffect, useState } from "react";
import { api } from "../api/client.js";

const emptyForm = { sku: "", name: "", description: "", price: "", stock_quantity: "" };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  function load() {
    api.getProducts(search).then(setProducts).catch((err) => setError(err.message));
  }

  useEffect(load, [search]);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      await api.createProduct({
        ...form,
        price: parseFloat(form.price),
        stock_quantity: parseInt(form.stock_quantity, 10),
      });
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleActive(product) {
    try {
      await api.updateProduct(product.id, { is_active: !product.is_active });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="topbar" style={{ marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Products</h2>
        <button className="btn" onClick={() => setShowForm((s) => !s)}>{showForm ? "Cancel" : "+ New Product"}</button>
      </div>

      {error && <div className="error-text">{error}</div>}

      {showForm && (
        <form className="card" onSubmit={handleCreate} style={{ marginBottom: 16, display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
          <input placeholder="SKU" required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          <input placeholder="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ gridColumn: "span 2" }} />
          <input placeholder="Price" type="number" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <input placeholder="Stock Quantity" type="number" required value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} />
          <button className="btn" type="submit" style={{ gridColumn: "span 2" }}>Save Product</button>
        </form>
      )}

      <input className="search-bar" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="card">
        <table>
          <thead><tr><th>SKU</th><th>Name</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.sku}</td>
                <td>{p.name}</td>
                <td>₹{Number(p.price).toFixed(2)}</td>
                <td>{p.stock_quantity}</td>
                <td><span className={`badge ${p.is_active ? "confirmed" : "cancelled"}`}>{p.is_active ? "Active" : "Inactive"}</span></td>
                <td><button className="btn secondary" onClick={() => toggleActive(p)}>{p.is_active ? "Deactivate" : "Activate"}</button></td>
              </tr>
            ))}
            {products.length === 0 && <tr><td colSpan={6} style={{ color: "var(--text-muted)" }}>No products found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
