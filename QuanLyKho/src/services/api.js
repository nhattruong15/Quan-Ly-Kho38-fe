import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://quanlykhohangchibui-backend.onrender.com/api",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// Tự động gắn token JWT vào mọi request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Nếu nhận 401 → logout và redirect về login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ─── Products ─────────────────────────────────────────────
export const getProducts = (params) => api.get("/products", { params });
export const getProductById = (id) => api.get(`/products/${id}`);
export const createProduct = (data) => api.post("/products", data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);

// ─── Imports ───────────────────────────────────────────────
export const getImports = () => api.get("/warehouse/imports");
export const getImportById = (id) => api.get(`/warehouse/imports/${id}`);
export const createImport = (data) => api.post("/warehouse/imports", data);
export const deleteImport = (id) => api.delete(`/warehouse/imports/${id}`);

// ─── Exports ───────────────────────────────────────────────
export const getExports = () => api.get("/warehouse/exports");
export const getExportById = (id) => api.get(`/warehouse/exports/${id}`);
export const createExport = (data) => api.post("/warehouse/exports", data);
export const deleteExport = (id) => api.delete(`/warehouse/exports/${id}`);

// ─── Stats ─────────────────────────────────────────────────
export const getStats = () => api.get("/warehouse/stats");

// ─── Categories ────────────────────────────────────────────
export const getCategories = () => api.get("/categories");
export const createCategory = (data) => api.post("/categories", data);
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);

// ─── Orders ────────────────────────────────────────────────
export const getOrders = () => api.get("/orders");
export const getOrderById = (id) => api.get(`/orders/${id}`);
export const createOrder = (data) => api.post("/orders", data);
export const updateOrder = (id, data) => api.put(`/orders/${id}`, data);
export const updateOrderStatus = (id, status) => api.put(`/orders/${id}/status`, { status });
export const deleteOrder = (id) => api.delete(`/orders/${id}`);

// ─── Customers ───────────────────────────────────────────
export const getCustomers = () => api.get("/customers");
export const createCustomer = (data) => api.post("/customers", data);
export const updateCustomer = (id, data) => api.put(`/customers/${id}`, data);
export const deleteCustomer = (id) => api.delete(`/customers/${id}`);

// ─── Auth ─────────────────────────────────────────────────
export const loginApi = (data) => api.post("/auth/login", data);

// ─── Combos ─────────────────────────────────────────────
export const getCombos = () => api.get("/combos");
export const getComboById = (id) => api.get(`/combos/${id}`);
export const createCombo = (data) => api.post("/combos", data);
export const updateCombo = (id, data) => api.put(`/combos/${id}`, data);
export const deleteCombo = (id) => api.delete(`/combos/${id}`);

// ─── Appointments ──────────────────────────────────────────
export const getAppointments = (params) => api.get("/appointments", { params });
export const createAppointment = (data) => api.post("/appointments", data);
export const deleteAppointment = (id) => api.delete(`/appointments/${id}`);

export default api;
