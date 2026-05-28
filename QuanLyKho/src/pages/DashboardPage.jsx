import { useEffect, useState } from "react";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Package, PackagePlus, PackageMinus, AlertTriangle,
  DollarSign, Archive, Activity, TrendingUp,
} from "lucide-react";
import { getStats } from "../services/api";

const CHART_COLORS = ["#22d3ee", "#a78bfa", "#10b981", "#fbbf24", "#f87171", "#60a5fa"];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="card" style={{ padding: "10px 14px", border: "1px solid var(--border-strong)" }}>
        <p className="text-secondary fs-12" style={{ marginBottom: 4 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, fontSize: 13, fontWeight: 600 }}>
            {p.name}: {typeof p.value === "number" ? p.value.toLocaleString("vi-VN") : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getStats();
        setStats(res.data.data);
      } catch {
        setStats({
          totalProducts: 0, lowStockProducts: 0, totalImports: 0, totalExports: 0,
          inventoryValue: 0, recentImports: [], recentExports: [],
          lowStockList: [], categoryStats: [],
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;

  return (
    <div>
      {/* ── KPI Cards ──────────────────────────────── */}
      {/* <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))", gap: 18, marginBottom: 24 }}>
        {kpiCards.map((c) => (
          <div key={c.label} className={`stat-card ${c.color}`}>
            <div className="stat-card-header">
              <div style={{ minWidth: 0 }}>
                <p className="stat-card-label">{c.label}</p>
                <p className="stat-card-value" style={{ marginTop: 8 }}>{c.value}</p>
              </div>
              <div className={`stat-card-icon ${c.color}`}><c.icon size={22} /></div>
            </div>
            {c.sub && <p className="stat-card-sub">{c.sub}</p>}
          </div>
        ))}
      </div> */}

      {/* ── Charts Row ─────────────────────────────── */}
      

      {/* ── Low Stock Alert ─────────────────────────── */}
      {stats.lowStockList?.length > 0 && (
        <div className="card">
          <div className="d-flex align-center gap-8 mb-16">
            <AlertTriangle size={18} color="var(--accent-warning)" />
            <p className="fw-700">⚠ Cảnh báo tồn kho thấp</p>
            <span className="badge badge-danger" style={{ marginLeft: "auto" }}>{stats.lowStockList.length} mặt hàng</span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Mã SP</th><th>Tên sản phẩm</th><th>Tồn kho</th><th>Tối thiểu</th><th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {stats.lowStockList.map((p) => (
                  <tr key={p._id}>
                    <td><span className="badge badge-primary">{p.code}</span></td>
                    <td className="fw-600 text-primary">{p.name}</td>
                    <td className="text-danger fw-700">{p.quantity} {p.unit}</td>
                    <td className="text-secondary">{p.minStock} {p.unit}</td>
                    <td><span className="badge badge-danger">⚠ Cần nhập thêm</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Welcome when empty ───────────────────────── */}
      {stats.totalProducts === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <TrendingUp size={52} color="var(--accent-primary)" style={{ margin: "0 auto 16px" }} />
          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Chào mừng đến Kho Chi Bụi!</h3>
          <p className="text-secondary">Hãy bắt đầu bằng cách thêm sản phẩm vào kho, sau đó tạo phiếu nhập để theo dõi hàng hóa.</p>
        </div>
      )}
    </div>
  );
}
