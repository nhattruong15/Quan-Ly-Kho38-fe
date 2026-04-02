import { useEffect, useState } from "react";
import { Plus, Trash2, PackageMinus, X, Calendar, Download } from "lucide-react";
import { getExports, createExport, deleteExport, getProducts, getOrders, updateOrderStatus } from "../services/api";
import * as XLSX from "xlsx-js-style";
import { useToast } from "../components/Toast";

const PURPOSES = ["Bếp chính", "Bếp phụ", "Kiểm kê", "Hủy hàng", "Khác"];

export default function ExportPage() {
  const [exports, setExports] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  const [form, setForm] = useState({ purpose: "Bếp chính", note: "", items: [{ product: "", quantity: "" }] });
  const toast = useToast();

  const fetch = async () => {
    try {
      setLoading(true);
      const [exp, prod] = await Promise.all([getExports(), getProducts()]);
      setExports(exp.data.data);
      setProducts(prod.data.data);
    } catch { toast("Không thể tải dữ liệu", "error"); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, []);

  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, { product: "", quantity: "" }] }));
  const removeItem = (i) => setForm((f) => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i, field, val) => setForm((f) => {
    const items = [...f.items];
    items[i] = { ...items[i], [field]: val };
    return { ...f, items };
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.items.some((it) => !it.product)) return toast("Vui lòng chọn sản phẩm cho tất cả dòng", "error");
    setSaving(true);
    try {
      await createExport(form);
      toast("Tạo phiếu xuất thành công!", "success");
      setShowModal(false);
      setForm({ purpose: "Bếp chính", note: "", items: [{ product: "", quantity: "" }] });
      fetch();
    } catch (err) { toast(err.response?.data?.message || "Lỗi: Không đủ tồn kho", "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (exportObj) => {
    if (!confirm("Xóa phiếu xuất này? Tồn kho sẽ được hoàn lại.")) return;
    try {
      await deleteExport(exportObj._id);
      
      // Khôi phục trạng thái đơn đặt hàng nếu phiếu xuất này sinh ra từ đơn
      if (exportObj.note && exportObj.note.includes("Xuất kho cho đơn hàng: ")) {
        const orderCode = exportObj.note.split("Xuất kho cho đơn hàng: ")[1].trim();
        try {
          const ordersRes = await getOrders();
          if (ordersRes.data?.success || ordersRes.data?.data) {
            const ordersList = ordersRes.data.data || ordersRes.data;
            const targetOrder = ordersList.find(o => o.code === orderCode);
            if (targetOrder) {
              await updateOrderStatus(targetOrder._id, "Đã nhận");
            }
          }
        } catch (updateErr) {
          console.error("Lỗi khi khôi phục trạng thái đơn hàng:", updateErr);
        }
      }

      toast("Đã xóa phiếu xuất", "success");
      fetch();
    } catch (err) { toast(err.response?.data?.message || "Lỗi khi xóa", "error"); }
  };

  const purposeColor = { "Bếp chính": "success", "Bếp phụ": "info", "Kiểm kê": "primary", "Hủy hàng": "danger", "Khác": "warning" };

  const filteredExports = filterDate
    ? exports.filter((ex) => {
        const d = new Date(ex.exportDate);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}` === filterDate;
      })
    : exports;

  const handleExportSingleExcel = (ex) => {
    const exportData = [];
    const dateStr = new Date(ex.exportDate).toLocaleDateString("vi-VN");
    ex.items.forEach((it) => {
      exportData.push({
        "Ngày tháng năm": dateStr,
        "Sản phẩm": it.product?.name || "Sản phẩm không xác định",
        "Số lượng": it.quantity
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
        if (!worksheet[cellRef]) continue;

        let cellStyle = {
          font: { sz: 14, name: "Arial" },
          alignment: { vertical: "center", horizontal: "left" },
          border: {
            top: { style: "thin", color: { auto: 1 } },
            bottom: { style: "thin", color: { auto: 1 } },
            left: { style: "thin", color: { auto: 1 } },
            right: { style: "thin", color: { auto: 1 } }
          }
        };

        if (R === 0) {
          cellStyle = {
            font: { bold: true, sz: 16, color: { rgb: "FFFFFF" }, name: "Arial" },
            fill: { fgColor: { rgb: "4F81BD" } },
            alignment: { vertical: "center", horizontal: "center" },
            border: {
              top: { style: "medium", color: { rgb: "000000" } },
              bottom: { style: "medium", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } }
            }
          };
        }

        worksheet[cellRef].s = cellStyle;
      }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "PhieuXuat");

    worksheet["!cols"] = [{ wch: 40 }, { wch: 40 }, { wch: 40 }];
    
    XLSX.writeFile(workbook, `PhieuXuat_${ex.code}.xlsx`);
  };

  return (
    <div>
      <div className="page-header">
        {/* ... */}
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Tạo phiếu xuất
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
            : filteredExports.length === 0 ? (
              <div className="empty-state"><PackageMinus size={48} /><h3 style={{ fontSize: 15, fontWeight: 600, marginTop: 8 }}>{filterDate ? "Không có phiếu xuất trong ngày này" : "Chưa có phiếu xuất"}</h3><p>{filterDate ? "Thử chọn ngày khác hoặc xóa bộ lọc" : "Tạo phiếu xuất khi lấy hàng ra bếp"}</p></div>
            ) : (
              <table>
                <thead>
                  <tr><th>Mã phiếu</th><th>Mục đích</th><th>Số mặt hàng</th><th>Ngày xuất</th><th>Chi tiết mặt hàng</th><th>Ghi chú</th><th>Thao tác</th></tr>
                </thead>
                <tbody>
                  {filteredExports.map((ex) => (
                    <tr key={ex._id}>
                      <td><span className="badge badge-warning">{ex.code}</span></td>
                      <td><span className={`badge badge-${purposeColor[ex.purpose] || "info"}`}>{ex.purpose}</span></td>
                      <td><span className="badge badge-info">{ex.items.length} SP</span></td>
                      <td className="text-secondary">{new Date(ex.exportDate).toLocaleDateString("vi-VN")}</td>
                      <td className="text-secondary">
                        {ex.items.map((it, i) => (
                          <span key={i} style={{ display: "block", fontSize: 12 }}>
                            {it.product?.name}: <strong>{it.quantity} {it.product?.unit}</strong>
                          </span>
                        ))}
                      </td>
                      <td className="text-muted">{ex.note || "—"}</td>
                      <td>
                        <button className="btn btn-success btn-sm btn-icon" style={{ marginRight: 8 }} onClick={() => handleExportSingleExcel(ex)} title="Xuất Excel">
                          <Download size={13} />
                        </button>
                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(ex)}>
                          <Trash2 size={13} />
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
              <h3>Tạo phiếu xuất kho mới</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="grid-form mb-24">
                  <div className="form-group">
                    <label className="form-label">Mục đích xuất *</label>
                    <select className="form-select" value={form.purpose}
                      onChange={(e) => setForm({ ...form, purpose: e.target.value })}>
                      {PURPOSES.map((p) => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ghi chú</label>
                    <input className="form-input" placeholder="Ghi chú thêm..."
                      value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
                  </div>
                </div>
                <p className="section-title">Danh sách hàng xuất</p>
                {form.items.map((item, i) => (
                  <div key={i} className="item-row">
                    <div className="form-group" style={{ flex: 2 }}>
                      <label className="form-label">Sản phẩm</label>
                      <select className="form-select" value={item.product} required
                        onChange={(e) => updateItem(i, "product", e.target.value)}>
                        <option value="">-- Chọn sản phẩm --</option>
                        {products.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name} (Còn: {p.quantity} {p.unit})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Số lượng</label>
                      <input className="form-input" type="number" min="1" value={item.quantity}
                        onChange={(e) => updateItem(i, "quantity", e.target.value === "" ? "" : Number(e.target.value))} />
                    </div>
                    <button type="button" className="btn btn-danger btn-icon" style={{ marginBottom: 2 }}
                      onClick={() => removeItem(i)} disabled={form.items.length === 1}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button type="button" className="btn btn-ghost mt-8" onClick={addItem}>
                  <Plus size={14} /> Thêm mặt hàng
                </button>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Đang lưu..." : "Tạo phiếu xuất"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
