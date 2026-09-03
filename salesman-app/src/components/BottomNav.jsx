import React from "react";
import { NavLink } from "react-router-dom";

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/new-order/customer" className={({ isActive }) => (isActive ? "active" : "")}>New Order</NavLink>
      <NavLink to="/customers" className={({ isActive }) => (isActive ? "active" : "")}>Customers</NavLink>
      <NavLink to="/products" className={({ isActive }) => (isActive ? "active" : "")}>Products</NavLink>
      <NavLink to="/orders" className={({ isActive }) => (isActive ? "active" : "")}>Orders</NavLink>
    </nav>
  );
}
