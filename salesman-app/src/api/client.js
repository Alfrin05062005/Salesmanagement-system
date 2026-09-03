const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function getToken() {
  return localStorage.getItem("sales_token");
}

export function setToken(token) {
  localStorage.setItem("sales_token", token);
}

export function clearToken() {
  localStorage.removeItem("sales_token");
  localStorage.removeItem("sales_full_name");
}

export function isAuthenticated() {
  return Boolean(getToken());
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
    // Surface FastAPI's `detail` message, falling back to something readable for 422 arrays.
    const message = typeof data.detail === "string" ? data.detail : "Please check your input and try again.";
    throw new Error(message);
  }
  return data;
}

export async function login(username, password) {
  const form = new URLSearchParams();
  form.append("username", username);
  form.append("password", password);
  const data = await request("/api/auth/login", { method: "POST", body: form, isForm: true });
  if (data.role !== "salesman") {
    throw new Error("This app is for salesman accounts only.");
  }
  return data;
}

export const api = {
  getCustomers: (search) => request(`/api/customers${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  getCustomer: (id) => request(`/api/customers/${id}`),
  getProducts: (search) => request(`/api/products${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  getProduct: (id) => request(`/api/products/${id}`),
  createOrder: (payload) => request("/api/orders", { method: "POST", body: payload }),
  getMyOrders: () => request("/api/orders"),
  getOrder: (id) => request(`/api/orders/${id}`),
};
