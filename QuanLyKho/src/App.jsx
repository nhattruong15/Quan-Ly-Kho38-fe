import { useState } from "react";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { ToastProvider } from "./components/Toast";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import DashboardPage from "./pages/DashboardPage";
import ProductsPage from "./pages/ProductsPage";
import ImportPage from "./pages/ImportPage";
import ExportPage from "./pages/ExportPage";
import InventoryPage from "./pages/InventoryPage";
import OrdersPage from "./pages/OrdersPage";
import ReportsPage from "./pages/ReportsPage";
import CustomersPage from "./pages/CustomersPage";
import LoginPage from "./pages/LoginPage";
import CalendarPage from "./pages/CalendarPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import CombosPage from "./pages/CombosPage";

// ─── Auth Guard ───────────────────────────────────────────
function RequireAuth({ children }) {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AppLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay${sidebarOpen ? " open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-area">
        <Header
          pathname={location.pathname}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="page-content">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/imports" element={<ImportPage />} />
            <Route path="/exports" element={<ExportPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/combos" element={<CombosPage />} />
            <Route path="/appointments" element={<AppointmentsPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          {/* Protected */}
          <Route
            path="/*"
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}
