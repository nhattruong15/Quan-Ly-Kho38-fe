import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Search, Package, Settings2, X, Check, XCircle } from "lucide-react";
import { 
  getProducts, createProduct, updateProduct, deleteProduct,
  getCategories, createCategory, updateCategory, deleteCategory
} from "../services/api";
import { useToast } from "../components/Toast";

const UNITS = ["kg", "g", "lít", "ml", "cái", "túi", "gói", "hộp", "chai", "thùng", "bó", "bịch", "phần", "ly"];
const emptyProduct = { name: "", code: "", category: "", unit: "kg", price: "", quantity: 0, itemsPerPack: 1, packUnit: "gói", minStock: "", description: "", supplier: "" };

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  
  const [showModal, setShowModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  const [editItem, setEditItem] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [saving, setSaving] = useState(false);

  // Category State
  const [newCatName, setNewCatName] = useState("");
  const [catSaving, setCatSaving] = useState(false);
  const [editingCatId, setEditingCatId] = useState(null);
  const [editingCatName, setEditingCatName] = useState("");
  
  const toast = useToast();

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (filterCategory) params.category = filterCategory;
      const res = await getProducts(params);
      setProducts(res.data.data);
    } catch { toast("Không thể tải sản phẩm", "error"); }
    finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterCategory]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await getCategories();
      setCategories(res.data.data);
    } catch { toast("Không thể tải danh mục", "error"); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  // Product Handlers
  const openAdd = () => { 
    setEditItem(null); 
    setForm({ ...emptyProduct, category: categories[0]?.name || "Khác" }); 
    setShowModal(true); 
  };
  const openEdit = (p) => { setEditItem(p); setForm({ ...p }); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editItem) {
        await updateProduct(editItem._id, form);
        toast("Cập nhật sản phẩm thành công!", "success");
      } else {
        await createProduct(form);
        toast("Thêm sản phẩm thành công!", "success");
      }
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      toast(err.response?.data?.message || "Lỗi khi lưu", "error");
    } finally { setSaving(false); }
  };

  const handleDelete = async (p) => {
    if (!confirm(`Xóa sản phẩm "${p.name}"?`)) return;
    try {
      await deleteProduct(p._id);
      toast("Đã xóa sản phẩm", "success");
      fetchProducts();
    } catch (err) { toast(err.response?.data?.message || "Lỗi khi xóa", "error"); }
  };

  const openDetail = (p) => {
    setSelectedProduct(p);
    setShowDetailModal(true);
  };

  // Category Handlers
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return toast("Tên danh mục không được để trống", "warning");
    setCatSaving(true);
    try {
      await createCategory({ name: newCatName.trim() });
      toast("Thêm danh mục thành công", "success");
      setNewCatName("");
      fetchCategories();
    } catch (err) { toast(err.response?.data?.message || "Lỗi", "error"); }
    finally { setCatSaving(false); }
  };

  const startEditCategory = (cat) => {
    setEditingCatId(cat._id);
    setEditingCatName(cat.name);
  };

  const saveEditCategory = async (id) => {
    if (!editingCatName.trim()) return setEditingCatId(null);
    try {
      await updateCategory(id, { name: editingCatName.trim() });
      toast("Đã cập nhật danh mục", "success");
      setEditingCatId(null);
      fetchCategories();
      fetchProducts(); // Refresh products to show updated category names if backend handles it
    } catch (err) { toast(err.response?.data?.message || "Lỗi", "error"); }
  };

  const handleDeleteCategory = async (id, name) => {
    if (!confirm(`Xóa danh mục "${name}"? Các sản phẩm hiện tại sẽ giữ tên danh mục cũ.`)) return;
    try {
      await deleteCategory(id);
      toast("Đã xóa", "success");
      fetchCategories();
    } catch (err) { toast(err.response?.data?.message || "Lỗi", "error"); }
  };

  return (
    <div>
      <div className="page-header">
       
        <div className="d-flex gap-8" style={{ flexWrap: "wrap" }}>
          <button className="btn btn-ghost" onClick={() => setShowCatModal(true)}>
            <Settings2 size={16} /> Quản lý danh mục
          </button>
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={16} /> Thêm sản phẩm
          </button>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrap">
          <Search size={15} />
          <input
            className="form-input" placeholder="Tìm kiếm sản phẩm..."
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-select" style={{ width: 220, maxWidth: "100%" }}
          value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          {loading ? (
            <div className="loading-overlay"><div className="spinner" /></div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <Package size={48} />
              <h3 style={{ fontSize: 15, fontWeight: 600, marginTop: 8 }}>Chưa có sản phẩm</h3>
              <p>Bấm "Thêm sản phẩm" để bắt đầu</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Tên sản phẩm</th>
                 <th>Giá nhập</th><th>Tồn kho</th><th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const isLow = p.quantity <= p.minStock;
                  return (
                    <tr key={p._id} onClick={() => openDetail(p)} style={{ cursor: "pointer" }}>
                    
                      <td>
                        <p className="fw-600 text-primary">{p.name}</p>
                        {p.itemsPerPack > 1 && (
                          <p className="text-secondary fs-12" style={{ fontStyle: "italic" }}>
                            Quy cách: 1 {p.packUnit || "gói"} = {p.itemsPerPack} {p.unit}
                          </p>
                        )}
                        {p.supplier && <p className="text-muted fs-12">{p.supplier}</p>}
                      </td>
                      <td className="text-success fw-600">{Number(p.price).toLocaleString("vi-VN")}₫</td>
                      <td>
                        <span className={`fw-700 ${isLow ? "text-danger" : "text-success"}`}>
                          {p.quantity} {p.unit}
                        </span>
                      </td>
                     
                      <td>
                        <div className="d-flex gap-8" onClick={(e) => e.stopPropagation()}>
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(p)} title="Sửa">
                            <Pencil size={13} />
                          </button>
                          <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(p)} title="Xóa">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── PRODUCT MODAL ────────────────────────────────────── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editItem ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}</h3>
              <button type="button" className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="grid-form mb-16">
                  <div className="form-group">
                    <label className="form-label">Tên sản phẩm *</label>
                    <input className="form-input" placeholder="VD: Thịt bò" required
                      value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mã sản phẩm *</label>
                    <input className="form-input" placeholder="VD: TB001" required
                      value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Danh mục *</label>
                    <select className="form-select" value={form.category} required
                      onChange={(e) => setForm({ ...form, category: e.target.value })}>
                      {categories.length === 0 && <option value="">-- Chưa có DM --</option>}
                      {categories.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                   <div className="form-group">
                    <label className="form-label">Đơn vị *</label>
                    <select className="form-select" value={form.unit} required
                      onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                      {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tên bộ/gói (Quy cách)</label>
                    <input className="form-input" placeholder="VD: bịch, thùng, hộp..."
                      value={form.packUnit} onChange={(e) => setForm({ ...form, packUnit: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Số lượng lẻ trong 1 gói</label>
                    <input className="form-input" type="number" min="1" placeholder="VD: 10 (nếu 1 bịch có 10 cái)"
                      value={form.itemsPerPack} onChange={(e) => setForm({ ...form, itemsPerPack: Number(e.target.value) })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Giá nhập (₫) *</label>
                    <input className="form-input" type="number" min="0" placeholder="VD: 150000" required
                      value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tồn kho tối thiểu</label>
                    <input className="form-input" type="number" min="0" placeholder="VD: 5"
                      value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nhà cung cấp</label>
                    <input className="form-input" placeholder="Tên nhà cung cấp"
                      value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ghi chú</label>
                    <input className="form-input" placeholder="Mô tả thêm..."
                      value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Đang lưu..." : editItem ? "Cập nhật" : "Thêm sản phẩm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CATEGORY MODAL ───────────────────────────────────── */}
      {showCatModal && (
        <div className="modal-overlay" onClick={() => setShowCatModal(false)}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Quản lý danh mục</h3>
              <button type="button" className="btn btn-ghost btn-icon" onClick={() => setShowCatModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAddCategory} className="d-flex gap-8 mb-24">
                <input 
                  className="form-input flex-1" placeholder="Nhập tên danh mục mới..." 
                  value={newCatName} onChange={e => setNewCatName(e.target.value)} required
                />
                <button type="submit" className="btn btn-success" disabled={catSaving}>
                  <Plus size={16} /> Thêm
                </button>
              </form>

              <div className="table-wrapper" style={{ maxHeight: 350, overflowY: "auto" }}>
                <table>
                  <thead>
                    <tr><th style={{ paddingLeft: 12 }}>Tên danh mục</th><th style={{ width: 100, textAlign: "right", paddingRight: 12 }}>Thao tác</th></tr>
                  </thead>
                  <tbody>
                    {categories.length === 0 ? (
                      <tr><td colSpan={2} style={{ textAlign: "center", padding: 24 }} className="text-muted">Chưa có danh mục nào</td></tr>
                    ) : (
                      categories.map(cat => (
                        <tr key={cat._id}>
                          <td style={{ paddingLeft: 12 }}>
                            {editingCatId === cat._id ? (
                              <input 
                                className="form-input" value={editingCatName} autoFocus
                                onChange={e => setEditingCatName(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') saveEditCategory(cat._id); if (e.key === 'Escape') setEditingCatId(null); }}
                              />
                            ) : (
                              <span className="fw-600 text-primary">{cat.name}</span>
                            )}
                          </td>
                          <td style={{ textAlign: "right", paddingRight: 12 }}>
                            {editingCatId === cat._id ? (
                              <div className="d-flex gap-8 justify-end">
                                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => saveEditCategory(cat._id)} title="Lưu"><Check size={14} className="text-success" /></button>
                                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setEditingCatId(null)} title="Hủy"><XCircle size={14} className="text-danger" /></button>
                              </div>
                            ) : (
                              <div className="d-flex gap-8 justify-end">
                                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => startEditCategory(cat)} title="Sửa"><Pencil size={13} /></button>
                                <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDeleteCategory(cat._id, cat.name)} title="Xóa"><Trash2 size={13} /></button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-primary" onClick={() => setShowCatModal(false)}>Xong</button>
            </div>
          </div>
        </div>
      )}
      {/* ── PRODUCT DETAIL MODAL ────────────────────────────────── */}
      {showDetailModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chi tiết sản phẩm</h3>
              <button type="button" className="btn btn-ghost btn-icon" onClick={() => setShowDetailModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label className="form-label text-muted" style={{ display: "block", marginBottom: 4 }}>Tên sản phẩm</label>
                  <p style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>{selectedProduct.name}</p>
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label className="form-label text-muted" style={{ display: "block", marginBottom: 4 }}>Mã hàng</label>
                    <p className="fw-600">{selectedProduct.code || "---"}</p>
                  </div>
                  <div>
                    <label className="form-label text-muted" style={{ display: "block", marginBottom: 4 }}>Danh mục</label>
                    <p className="fw-600">{selectedProduct.category}</p>
                  </div>
                </div>

                <div>
                  <label className="form-label text-muted" style={{ display: "block", marginBottom: 4 }}>Quy cách</label>
                  <p className="fw-600">
                    {selectedProduct.itemsPerPack > 1 
                      ? `1 ${selectedProduct.packUnit || "gói"} = ${selectedProduct.itemsPerPack} ${selectedProduct.unit}`
                      : `Bán lẻ theo ${selectedProduct.unit}`
                    }
                  </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label className="form-label text-muted" style={{ display: "block", marginBottom: 4 }}>Giá nhập</label>
                    <p className="text-success fw-800" style={{ fontSize: 17 }}>{Number(selectedProduct.price).toLocaleString("vi-VN")}₫</p>
                  </div>
                  <div>
                    <label className="form-label text-muted" style={{ display: "block", marginBottom: 4 }}>Tồn kho hiện tại</label>
                    <p className={`fw-800`} style={{ fontSize: 17, color: selectedProduct.quantity <= selectedProduct.minStock ? "var(--accent-danger)" : "var(--accent-success)" }}>
                      {selectedProduct.quantity} {selectedProduct.unit}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="form-label text-muted" style={{ display: "block", marginBottom: 4 }}>Nhà cung cấp</label>
                  <p className="fw-600">{selectedProduct.supplier || "Chưa xác định"}</p>
                </div>

                <div>
                  <label className="form-label text-muted" style={{ display: "block", marginBottom: 4 }}>Ghi chú</label>
                  <div style={{ 
                    padding: "12px", 
                    background: "var(--bg-primary)", 
                    borderRadius: "8px", 
                    border: "1px solid var(--border)",
                    minHeight: "60px",
                    color: selectedProduct.description ? "var(--text-secondary)" : "var(--text-muted)",
                    fontSize: 13,
                    lineHeight: 1.5
                  }}>
                    {selectedProduct.description || "Không có ghi chú nào cho sản phẩm này."}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-primary" onClick={() => setShowDetailModal(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
