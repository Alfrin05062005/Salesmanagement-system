import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TopAppBar from "../../components/TopAppBar.jsx";
import { api } from "../../api/client.js";
import { useCart } from "../../context/CartContext.jsx";

export default function SelectCustomer() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const { customer, setCustomer } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    api.getCustomers(search).then(setCustomers).catch((err) => setError(err.message));
  }, [search]);

  function handleSelect(c) {
    setCustomer(c);
    navigate("/new-order/build");
  }

  return (
    <>
      <TopAppBar title="New Order" showLogout />
      <div className="screen-content">
        <p className="helper-text" style={{ marginTop: 0 }}>Step 1 of 3 &middot; Select a customer</p>
        <input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ marginBottom: 14 }} />
        {error && <div className="error-text">{error}</div>}

        {customer && (
          <div className="card" style={{ borderColor: "var(--primary)" }} onClick={() => handleSelect(customer)}>
            <div className="list-item-sub">Currently selected</div>
            <div className="list-item-title">{customer.name}</div>
          </div>
        )}

        {customers.map((c) => (
          <div key={c.id} className="card" onClick={() => handleSelect(c)}>
            <div className="list-item-title">{c.name}</div>
            <div className="list-item-sub">{c.phone || "No phone on file"}</div>
          </div>
        ))}
        {customers.length === 0 && !error && <div className="helper-text">No customers found.</div>}
      </div>
    </>
  );
}
