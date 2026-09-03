import React, { useEffect, useState } from "react";
import { api } from "../api/client.js";

const emptyForm = { name: "", email: "", phone: "", address: "" };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  function load() {
    api.getCustomers(search).then(setCustomers).catch((err) => setError(err.message));
  }

  useEffect(load, [search]);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      await api.createCustomer({ ...form, email: form.email || null });
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="topbar" style={{ marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Customers</h2>
        <button className="btn" onClick={() => setShowForm((s) => !s)}>{showForm ? "Cancel" : "+ New Customer"}</button>
      </div>

      {error && <div className="error-text">{error}</div>}

      {showForm && (
        <form className="card" onSubmit={handleCreate} style={{ marginBottom: 16, display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
          <input placeholder="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <button className="btn" type="submit" style={{ gridColumn: "span 2" }}>Save Customer</button>
        </form>
      )}

      <input className="search-bar" placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="card">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Address</th></tr></thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}><td>{c.name}</td><td>{c.email}</td><td>{c.phone}</td><td>{c.address}</td></tr>
            ))}
            {customers.length === 0 && <tr><td colSpan={4} style={{ color: "var(--text-muted)" }}>No customers found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
