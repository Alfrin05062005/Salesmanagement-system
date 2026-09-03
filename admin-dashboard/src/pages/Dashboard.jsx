import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { api } from "../api/client.js";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.getSummary(), api.getSalesOverTime()])
      .then(([summaryData, salesOverTime]) => {
        setSummary(summaryData);
        setSalesData(salesOverTime.map((p) => ({ date: p.date, total: Number(p.total) })));
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="error-text">{error}</div>;
  if (!summary) return <div>Loading dashboard...</div>;

  return (
    <div>
      <h2>Business Overview</h2>
      <div className="metrics-grid">
        <div className="card">
          <div className="metric-label">Total Sales</div>
          <div className="metric-value">₹{Number(summary.total_sales).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="card">
          <div className="metric-label">Total Orders</div>
          <div className="metric-value">{summary.total_orders}</div>
        </div>
        <div className="card">
          <div className="metric-label">Total Customers</div>
          <div className="metric-value">{summary.total_customers}</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Sales Over Time</h3>
        {salesData.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>No sales data yet — orders will appear here once created.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => `₹${value}`} />
              <Line type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
