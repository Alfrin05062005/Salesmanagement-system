import React, { useEffect, useState } from "react";
import TopAppBar from "../components/TopAppBar.jsx";
import { api } from "../api/client.js";

export default function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.getCustomers(search).then(setCustomers).catch((err) => setError(err.message));
  }, [search]);

  return (
    <>
      <TopAppBar title="Customers" showLogout />
      <div className="screen-content">
        <input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ marginBottom: 14 }} />
        {error && <div className="error-text">{error}</div>}

        {customers.map((c) => (
          <div key={c.id} className="card" onClick={() => setSelected(selected?.id === c.id ? null : c)}>
            <div className="list-item-title">{c.name}</div>
            <div className="list-item-sub">{c.phone || "No phone on file"}</div>
            {selected?.id === c.id && (
              <div style={{ marginTop: 10, fontSize: 13, color: "var(--text-muted)" }}>
                {c.email && <div>Email: {c.email}</div>}
                {c.address && <div>Address: {c.address}</div>}
              </div>
            )}
          </div>
        ))}
        {customers.length === 0 && !error && <div className="helper-text">No customers found.</div>}
      </div>
    </>
  );
}
