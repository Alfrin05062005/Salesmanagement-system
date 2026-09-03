import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { CartProvider } from "./context/CartContext.jsx";
import { isAuthenticated } from "./api/client.js";
import BottomNav from "./components/BottomNav.jsx";

import Login from "./pages/Login.jsx";
import CustomerList from "./pages/CustomerList.jsx";
import ProductList from "./pages/ProductList.jsx";
import SelectCustomer from "./pages/order/SelectCustomer.jsx";
import BuildOrder from "./pages/order/BuildOrder.jsx";
import ReviewOrder from "./pages/order/ReviewOrder.jsx";
import OrderHistory from "./pages/OrderHistory.jsx";
import OrderDetail from "./pages/OrderDetail.jsx";

function ProtectedRoute() {
  return isAuthenticated() ? (
    <div className="app-frame">
      <Outlet />
      <BottomNav />
    </div>
  ) : (
    <Navigate to="/login" replace />
  );
}

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/customers" element={<CustomerList />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/new-order/customer" element={<SelectCustomer />} />
            <Route path="/new-order/build" element={<BuildOrder />} />
            <Route path="/new-order/review" element={<ReviewOrder />} />
            <Route path="/orders" element={<OrderHistory />} />
            <Route path="/orders/:orderId" element={<OrderDetail />} />
          </Route>
          <Route path="*" element={<Navigate to="/new-order/customer" replace />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}
