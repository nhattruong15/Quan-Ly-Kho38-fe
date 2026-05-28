import { useEffect, useState } from "react";
import { Search, AlertTriangle, CheckCircle, Boxes } from "lucide-react";
import { getProducts } from "../services/api";
import { useToast } from "../components/Toast";

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getProducts({ search });
        setProducts(res.data.data);
      } catch { toast("Không thể tải dữ liệu", "error"); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [search, toast]);

  const filtered = products.filter((p) => {
    if (filterStatus === "low") return p.quantity <= p.minStock;
    if (filterStatus === "ok") return p.quantity > p.minStock;
    return true;
  });

  return (
    <div>
     

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 18, marginBottom: 24 }}>
        {/* <div className="stat-card primary">
          <div className="stat-card-header">
            <div>
              <p className="stat-card-label">Tổng mặt hàng</p>
              <p className="stat-card-value" style={{ marginTop: 8 }}>{products.length}</p>
            </div>
            <div className="stat-card-icon primary"><Boxes size={22} /></div>
          </div>
          <p className="stat-card-sub">Mặt hàng đang quản lý</p>
        </div> */}
        {/* <div className="stat-card violet">
          <div className="stat-card-header">
            <div>
              <p className="stat-card-label">Tổng giá trị kho</p>
              <p className="stat-card-value" style={{ marginTop: 8 }}>{(totalValue / 1_000_000).toFixed(1)}M₫</p>
            </div>
            <div className="stat-card-icon violet"><CheckCircle size={22} /></div>
          </div>
          <p className="stat-card-sub">Dựa trên giá nhập</p>
        </div> */}
        {/* <div className="stat-card warning">
          <div className="stat-card-header">
            <div>
              <p className="stat-card-label">Cần nhập thêm</p>
              <p className="stat-card-value" style={{ marginTop: 8 }}>{lowCount}</p>
            </div>
            <div className="stat-card-icon warning"><AlertTriangle size={22} /></div>
          </div>
          <p className="stat-card-sub">Dưới mức tối thiểu</p>
        </div> */}
      </div>

      {/* Filter */}
      <div className="filter-bar">
        <div className="search-input-wrap">
          <Search size={15} />
          <input className="form-input" placeholder="Tìm sản phẩm..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="d-flex gap-8">
          {["all", "ok", "low"].map((s) => (
            <button key={s}
              className={`btn ${filterStatus === s ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setFilterStatus(s)}>
              {s === "all" ? "Tất cả" : s === "ok" ? "✓ Đủ hàng" : "⚠ Cạn hàng"}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          {loading ? <div className="loading-overlay"><div className="spinner" /></div>
            : filtered.length === 0 ? (
              <div className="empty-state"><Boxes size={48} /><p>Không có sản phẩm nào</p></div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Mã SP</th><th>Tên sản phẩm</th>
                    <th>Tồn kho</th>
                    {/* <th>Mức tồn (%)</th><th>Giá trị</th> */}
                  
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const isLow = p.quantity <= p.minStock;
                    return (
                      <tr key={p._id}>
                        <td><span className="badge badge-info">{p.code}</span></td>
                        <td>
                          <p className="fw-600 text-primary">{p.name}</p>
                          {p.supplier && <p className="text-muted fs-12">{p.supplier}</p>}
                        </td>
                        {/* <td><span className="badge badge-primary">{p.category}</span></td> */}
                        {/* <td>{p.unit}</td> */}
                        <td>
                          <span className={`fw-700 ${isLow ? "text-danger" : "text-success"}`}>
                            {p.quantity}
                          </span>
                        </td>
                        {/* <td className="text-secondary">{p.minStock}</td> */}
                        {/* <td style={{ minWidth: 120 }}>
                          <div className="d-flex align-center gap-8">
                            <div className="progress-bar-bg" style={{ flex: 1 }}>
                              <div className="progress-bar-fill"
                                style={{
                                  width: `${Math.min(pct, 100)}%`,
                                  background: isLow ? "var(--accent-danger)" : "var(--accent-success)"
                                }}
                              />
                            </div>
                            <span className="fs-12 text-secondary" style={{ minWidth: 34 }}>{pct}%</span>
                          </div>
                        </td> */}
                        {/* <td className="fw-600 text-success">{value.toLocaleString("vi-VN")}₫</td> */}
                       
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
        </div>
      </div>
    </div>
  );
}
