import { useEffect, useState } from "react";
import { Plus, Trash2, PackagePlus, X, Calendar, Eye } from "lucide-react";
import { getImports, createImport, deleteImport, getProducts } from "../services/api";
import { useToast } from "../components/Toast";

const PURPOSES = ["Nhà cung cấp A", "Nhà cung cấp B", "Chợ đầu mối", "Siêu thị", "Khác"];

export default function ImportPage() {
  const [imports, setImports] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  const [form, setForm] = useState({ supplier: "kho 38", note: "" });
  const [importInputs, setImportInputs] = useState({});
  const [viewDetails, setViewDetails] = useState(null);
  const toast = useToast();

  const fetch = async () => {
    try {
      setLoading(true);
      const [imp, prod] = await Promise.all([getImports(), getProducts()]);
      setImports(imp.data.data);
      const sortedProds = (prod.data.data || []).sort((a, b) => (a.code || "").localeCompare(b.code || "", undefined, { numeric: true, sensitivity: 'base' }));
      setProducts(sortedProds);
    } catch { toast("Không thể tải dữ liệu", "error"); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, []);

  const totalAmount = products.reduce((sum, p) => {
    const qty = Number(importInputs[p._id]?.quantity) || 0;
    const price = Number(importInputs[p._id]?.price) || 0;
    return sum + (qty * price);
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const items = products
      .filter(p => Number(importInputs[p._id]?.quantity) > 0)
      .map(p => ({
        product: p._id,
        quantity: Number(importInputs[p._id].quantity),
        price: Number(importInputs[p._id].price) || p.price || 0
      }));

    if (items.length === 0) return toast("Vui lòng nhập số lượng cho ít nhất 1 sản phẩm", "warning");

    setSaving(true);
    try {
      await createImport({ ...form, items });
      toast("Tạo phiếu nhập thành công!", "success");
      setShowModal(false);
      setForm({ supplier: "kho 38", note: "" });
      setImportInputs({});
      fetch();
    } catch (err) { toast(err.response?.data?.message || "Lỗi khi lưu", "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Xóa phiếu nhập này? Tồn kho sẽ được hoàn lại.")) return;
    try {
      await deleteImport(id);
      toast("Đã xóa phiếu nhập", "success");
      fetch();
    } catch (err) { toast(err.response?.data?.message || "Lỗi khi xóa", "error"); }
  };

  const filteredImports = filterDate
    ? imports.filter((imp) => {
        const d = new Date(imp.importDate);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}` === filterDate;
      })
    : imports;

  return (
    <div>
      <div className="page-header">
        
        <button className="btn btn-success" onClick={() => {
          setForm({ supplier: "kho 38", note: "" });
          const initials = {};
          products.forEach(p => initials[p._id] = { quantity: "", price: p.price || "" });
          setImportInputs(initials);
          setShowModal(true);
        }}>
          <Plus size={16} /> Tạo phiếu nhập
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Calendar size={15} style={{ color: "var(--text-muted)" }} />
            <input
              type="date"
              className="form-input"
              style={{ width: 180 }}
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
            {filterDate && (
              <button className="btn btn-ghost btn-sm" onClick={() => setFilterDate("")}>
                <X size={14} /> Xóa lọc
              </button>
            )}
          </div>
        </div>
        <div className="table-wrapper">
          {loading ? <div className="loading-overlay"><div className="spinner" /></div>
            : filteredImports.length === 0 ? (
              <div className="empty-state"><PackagePlus size={48} /><h3 style={{ fontSize: 15, fontWeight: 600, marginTop: 8 }}>{filterDate ? "Không có phiếu nhập trong ngày này" : "Chưa có phiếu nhập"}</h3><p>{filterDate ? "Thử chọn ngày khác hoặc xóa bộ lọc" : "Tạo phiếu nhập mới để bắt đầu"}</p></div>
            ) : (
              <table>
                <thead>
                  <tr><th>Mã phiếu</th><th>Nhà cung cấp</th><th>Số mặt hàng</th><th>Tổng tiền</th><th>Ngày nhập</th><th>Ghi chú</th><th>Thao tác</th></tr>
                </thead>
                <tbody>
                  {filteredImports.map((imp) => (
                    <tr key={imp._id}>
                      <td><span className="badge badge-success">{imp.code}</span></td>
                      <td className="fw-600 text-primary">{imp.supplier}</td>
                      <td><span className="badge badge-info">{imp.items.length} SP</span></td>
                      <td className="text-success fw-700">{imp.totalAmount?.toLocaleString("vi-VN")}₫</td>
                      <td className="text-secondary">{new Date(imp.importDate).toLocaleDateString("vi-VN")}</td>
                      <td className="text-muted">{imp.note || "—"}</td>
                      <td>
                        <button className="btn btn-info btn-sm btn-icon" style={{ marginRight: 8, color: "var(--primary-color)" }} onClick={() => setViewDetails(imp)} title="Xem chi tiết">
                          <Eye size={16} />
                        </button>
                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(imp._id)} title="Xóa phiếu">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tạo phiếu nhập kho mới</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="grid-form mb-24">
                  <div className="form-group">
                    <label className="form-label">Nhà cung cấp *</label>
                    <input className="form-input" placeholder="Tên nhà cung cấp" required
                      value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ghi chú</label>
                    <input className="form-input" placeholder="Ghi chú thêm..."
                      value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
                  </div>
                </div>
                <p className="section-title">Nhập số lượng hàng</p>
                <div className="table-wrapper" style={{ maxHeight: "400px", overflowY: "auto" }}>
                  <table style={{ margin: 0 }}>
                    <thead style={{ position: "sticky", top: 0, zIndex: 1, background: "var(--card-bg)" }}>
                      <tr>
                        <th>TÊN MÓN</th>
                        <th style={{ width: 120, textAlign: "center" }}>SỐ LƯỢNG</th>
                        <th style={{ width: 140, textAlign: "center" }}>ĐƠN GIÁ (₫)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(p => (
                        <tr key={p._id}>
                          <td className="fw-600">{p.name} {p.unit ? `(${p.unit})` : ''}</td>
                          <td>
                            <input 
                              type="number" 
                              min="0" 
                              className="form-input" 
                              style={{ textAlign: "center", fontWeight: "bold" }}
                              placeholder="0"
                              value={importInputs[p._id]?.quantity || ""}
                              onChange={(e) => setImportInputs(prev => ({
                                ...prev,
                                [p._id]: { ...prev[p._id], quantity: e.target.value }
                              }))}
                            />
                          </td>
                          <td>
                            <input 
                              type="number" 
                              min="0" 
                              className="form-input" 
                              style={{ textAlign: "center" }}
                              value={importInputs[p._id]?.price === undefined ? (p.price || "") : importInputs[p._id].price}
                              onChange={(e) => setImportInputs(prev => ({
                                ...prev,
                                [p._id]: { ...prev[p._id], price: e.target.value }
                              }))}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="d-flex justify-between align-center mt-16" style={{ padding: "12px 16px", background: "var(--bg-primary)", borderRadius: "var(--radius-md)" }}>
                  <span className="fw-600">Tổng tiền nhập:</span>
                  <span className="fw-700 text-success" style={{ fontSize: 18 }}>{totalAmount.toLocaleString("vi-VN")}₫</span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-success" disabled={saving}>
                  {saving ? "Đang lưu..." : "Tạo phiếu nhập"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}      {/* --- Modal Xem Chi Tiết --- */}
      {viewDetails && (
        <div className="modal-overlay" onClick={() => setViewDetails(null)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chi tiết phiếu nhập: {viewDetails.code}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setViewDetails(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="grid-2 mb-24">
                <div>
                  <p className="text-secondary fs-13 mb-4">Nhà cung cấp</p>
                  <p className="fw-600">{viewDetails.supplier}</p>
                </div>
                <div>
                  <p className="text-secondary fs-13 mb-4">Ngày nhập</p>
                  <p className="fw-600">{new Date(viewDetails.importDate).toLocaleDateString("vi-VN")} {new Date(viewDetails.importDate).toLocaleTimeString("vi-VN")}</p>
                </div>
                <div style={{ gridColumn: "1 / -1", marginTop: 8 }}>
                  <p className="text-secondary fs-13 mb-4">Ghi chú</p>
                  <p>{viewDetails.note || "Không có ghi chú"}</p>
                </div>
              </div>

              <p className="section-title">Danh sách sản phẩm</p>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      <th>Số lượng</th>
                      <th>Đơn giá</th>
                      <th>Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewDetails.items.map((item, idx) => {
                      const product = products.find(p => p._id === (item.product?._id || item.product));
                      const name = product ? product.name : "Sản phẩm đã xóa";
                      const unit = product ? product.unit : "";
                      return (
                        <tr key={idx}>
                          <td className="fw-600">{name}</td>
                          <td>{item.quantity} {unit}</td>
                          <td>{(item.price || 0).toLocaleString("vi-VN")}₫</td>
                          <td className="fw-700 text-success">{((item.quantity || 0) * (item.price || 0)).toLocaleString("vi-VN")}₫</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3" className="fw-600" style={{ textAlign: "right", paddingRight: "16px" }}>Tổng cộng:</td>
                      <td className="fw-700 text-success fs-16">{viewDetails.totalAmount?.toLocaleString("vi-VN")}₫</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setViewDetails(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
