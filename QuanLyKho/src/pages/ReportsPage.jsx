import { useEffect, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { BarChart3, TrendingUp, TrendingDown, FileSpreadsheet } from "lucide-react";
import { getImports, getExports, getProducts } from "../services/api";
import { useToast } from "../components/Toast";
import * as XLSX from "xlsx";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="card" style={{ padding: "10px 14px", border: "1px solid var(--border-strong)" }}>
        <p className="text-secondary fs-12 mb-4">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, fontSize: 13, fontWeight: 600 }}>
            {p.name}: {p.value?.toLocaleString("vi-VN")}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ReportsPage() {
  const [imports, setImports] = useState([]);
  const [exports, setExports] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [imp, exp, prod] = await Promise.all([getImports(), getExports(), getProducts()]);
        setImports(imp.data.data);
        setExports(exp.data.data);
        setProducts(prod.data.data);
      } catch { toast("Không thể tải dữ liệu", "error"); }
      finally { setLoading(false); }
    };
    fetchAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Build 30-day chart data
  const chartData = (() => {
    const map = {};
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
      map[key] = { date: key, "Nhập kho": 0, "Xuất kho": 0, "Giá trị nhập (K₫)": 0 };
    }
    imports.forEach((imp) => {
      const key = new Date(imp.importDate).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
      if (map[key]) {
        map[key]["Nhập kho"] += 1;
        map[key]["Giá trị nhập (K₫)"] += Math.round((imp.totalAmount || 0) / 1000);
      }
    });
    exports.forEach((exp) => {
      const key = new Date(exp.exportDate).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
      if (map[key]) map[key]["Xuất kho"] += 1;
    });
    return Object.values(map).slice(-14); // Last 14 days
  })();

  // Top products by value
  const topProducts = [...products]
    .map((p) => ({ name: p.name, value: p.quantity * p.price, quantity: p.quantity, unit: p.unit }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const totalImportValue = imports.reduce((s, i) => s + (i.totalAmount || 0), 0);
  const totalInventoryValue = products.reduce((s, p) => s + p.quantity * p.price, 0);

  if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Báo cáo & Thống kê</h2>
          <p>Phân tích hoạt động nhập xuất kho</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 18, marginBottom: 24 }}>
        <div className="stat-card success">
          <div className="stat-card-header">
            <div>
              <p className="stat-card-label">Tổng giá trị nhập</p>
              <p className="stat-card-value" style={{ marginTop: 8 }}>{(totalImportValue / 1_000_000).toFixed(1)}M₫</p>
            </div>
            <div className="stat-card-icon success"><TrendingUp size={22} /></div>
          </div>
          <p className="stat-card-sub">Tổng chi phí nhập kho</p>
        </div>
        <div className="stat-card primary">
          <div className="stat-card-header">
            <div>
              <p className="stat-card-label">Tổng phiếu giao dịch</p>
              <p className="stat-card-value" style={{ marginTop: 8 }}>{imports.length + exports.length}</p>
            </div>
            <div className="stat-card-icon primary"><BarChart3 size={22} /></div>
          </div>
          <p className="stat-card-sub">{imports.length} nhập + {exports.length} xuất</p>
        </div>
        <div className="stat-card violet">
          <div className="stat-card-header">
            <div>
              <p className="stat-card-label">Giá trị tồn kho</p>
              <p className="stat-card-value" style={{ marginTop: 8 }}>{(totalInventoryValue / 1_000_000).toFixed(1)}M₫</p>
            </div>
            <div className="stat-card-icon violet"><TrendingDown size={22} /></div>
          </div>
          <p className="stat-card-sub">Tổng giá trị hàng còn lại</p>
        </div>
      </div>

      <div className="grid-2 mb-24">
        {/* Bar chart nhập xuất */}
        <div className="card">
          <p className="fw-700 mb-4">Phiếu nhập/xuất 14 ngày gần nhất</p>
          <p className="text-muted fs-12 mb-16">Số lượng phiếu giao dịch theo ngày</p>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={chartData} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
              <Bar dataKey="Nhập kho" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Xuất kho" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Line chart giá trị nhập */}
        <div className="card">
          <p className="fw-700 mb-4">Giá trị nhập hàng (nghìn ₫)</p>
          <p className="text-muted fs-12 mb-16">Tổng giá trị nhập theo ngày</p>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
              <Line
                type="monotone" dataKey="Giá trị nhập (K₫)"
                stroke="#f59e0b" strokeWidth={2}
                dot={{ fill: "#f59e0b", r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top products */}
      <div className="card">
        <p className="fw-700 mb-4">Top sản phẩm theo giá trị tồn kho</p>
        <p className="text-muted fs-12 mb-16">Xếp hạng sản phẩm có giá trị lớn nhất trong kho</p>
        {topProducts.length === 0 ? (
          <div className="empty-state"><BarChart3 size={36} /><p>Chưa có dữ liệu sản phẩm</p></div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topProducts} layout="vertical" barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}K₫`} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} width={120} />
              <Tooltip content={<CustomTooltip />} formatter={(v) => [`${v.toLocaleString("vi-VN")}₫`, "Giá trị"]} />
              <Bar dataKey="value" name="Giá trị (₫)" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
