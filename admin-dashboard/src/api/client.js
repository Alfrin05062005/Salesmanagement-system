const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function getToken() {
  return localStorage.getItem("admin_token");
}

export function setToken(token) {
  localStorage.setItem("admin_token", token);
}

export function clearToken() {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_full_name");
}

async function request(path, { method = "GET", body, isForm = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (body && !isForm) headers["Content-Type"] = "application/json";

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401) {
    clearToken();
    window.location.href = "/login";
    throw new Error("Session expired");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || "Request failed");
  }
  return data;
}

export async function login(username, password) {
  const form = new URLSearchParams();
  form.append("username", username);
  form.append("password", password);
  const data = await request("/api/auth/login", { method: "POST", body: form, isForm: true });
  if (data.role !== "admin") {
    throw new Error("This dashboard is for admin accounts only.");
  }
  return data;
}

export const api = {
  getSummary: () => request("/api/orders/analytics/summary"),
  getSalesOverTime: () => request("/api/orders/analytics/sales-over-time"),
  getOrders: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/orders${qs ? `?${qs}` : ""}`);
  },
  getOrder: (id) => request(`/api/orders/${id}`),
  updateOrderStatus: (id, status) => request(`/api/orders/${id}/status`, { method: "PATCH", body: { status } }),
  getCustomers: (search) => request(`/api/customers${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  getProducts: (search) => request(`/api/products?active_only=false${search ? `&search=${encodeURIComponent(search)}` : ""}`),
  createProduct: (payload) => request("/api/products", { method: "POST", body: payload }),
  updateProduct: (id, payload) => request(`/api/products/${id}`, { method: "PUT", body: payload }),
  createCustomer: (payload) => request("/api/customers", { method: "POST", body: payload }),
};
