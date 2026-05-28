import { useState, useEffect } from "react";
import { Plus, Trash2, Edit, X, Save, Layers, Package, Search } from "lucide-react";
import { getProducts, getCombos, createCombo, updateCombo, deleteCombo } from "../services/api";
import { useToast } from "../components/Toast";

const emptyCombo = { name: "", description: "", items: [{ product: "", quantity: 1 }] };

export default function CombosPage() {
  const [combos, setCombos] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCombo, setEditingCombo] = useState(null);
  const [form, setForm] = useState(emptyCombo);
  const [searchTerm, setSearchTerm] = useState("");
  const toast = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [combosRes, productsRes] = await Promise.all([getCombos(), getProducts()]);
      setCombos(combosRes.data.data);
      setProducts(productsRes.data.data || []);
    } catch (err) {
      console.error(err);
      toast("Không thể tải dữ liệu", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAdd = () => {
    setEditingCombo(null);
    setForm(emptyCombo);
    setShowModal(true);
  };

  const openEdit = (combo) => {
    setEditingCombo(combo);
    setForm({
      name: combo.name,
      description: combo.description || "",
      items: combo.items.map(it => ({
        product: it.product?._id || it.product,
        quantity: it.quantity
      }))
    });
    setShowModal(true);
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { product: "", quantity: 1 }] });
  const removeItem = (index) => {
    const newItems = form.items.filter((_, i) => i !== index);
    setForm({ ...form, items: newItems.length ? newItems : [{ product: "", quantity: 1 }] });
  };
  const updateItem = (index, field, value) => {
    const newItems = [...form.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setForm({ ...form, items: newItems });
  };

  const handleSubmit = async (e, totalCost) => {
    e.preventDefault();
    if (!form.name.trim()) return toast("Vui lòng nhập tên combo", "error");
    if (form.items.some(it => !it.product)) return toast("Vui lòng chọn sản phẩm cho tất cả thành phần", "error");

    const comboData = { ...form, price: totalCost };

    try {
      if (editingCombo) {
        await updateCombo(editingCombo._id, comboData);
        toast("Cập nhật combo thành công!", "success");
      } else {
        await createCombo(comboData);
        toast("Tạo combo mới thành công!", "success");
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast(err.response?.data?.message || "Lỗi khi lưu combo", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa combo này?")) return;
    try {
      await deleteCombo(id);
      toast("Đã xóa combo", "success");
      fetchData();
    } catch (err) {
      console.error(err);
      toast("Lỗi khi xóa combo", "error");
    }
  };

  const filteredCombos = combos.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2> Quản lý Combo</h2>
          <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>chưa bao gồm dưa leo, dầu ăn, đậu bắp, bọc nilon = 2k</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Thêm Combo Mới
        </button>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrap" style={{ maxWidth: "400px" }}>
          <Search size={16} />
          <input 
            type="text" 
            className="form-input" 
            placeholder="Tìm kiếm combo..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          {loading ? (
            <div className="loading-overlay"><div className="spinner" /></div>
          ) : filteredCombos.length === 0 ? (
            <div className="empty-state">
              <Layers size={48} />
              <p>Chưa có combo nào được tạo</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Tên Combo</th>
                  <th>Thành phần</th>
                  <th>Giá Cost</th>
                  <th>Ghi chú</th>
                  <th style={{ textAlign: "center" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredCombos.map((c) => {
                  const totalCost = c.items.reduce((sum, it) => {
                    const pPrice = it.product?.price || 0;
                    return sum + (pPrice * it.quantity);
                  }, 0);

                  return (
                    <tr key={c._id}>
                      <td><span className="fw-700 text-primary">{c.name}</span></td>
                      <td>
                        <div className="d-flex flex-wrap gap-8">
                          {c.items.map((it, idx) => (
                            <span key={idx} className="badge badge-info">
                              {it.product?.name || "SP đã xóa"} x{it.quantity}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className="fw-700 text-success">
                          {totalCost.toLocaleString("vi-VN")}₫
                        </span>
                      </td>
                      <td className="text-muted">{c.description || "—"}</td>
                      <td>
                        <div className="d-flex justify-center gap-8">
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(c)}>
                            <Edit size={14} />
                          </button>
                          <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(c._id)}>
                            <Trash2 size={14} />
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingCombo ? "✏️ Sửa Combo" : "➕ Thêm Combo Mới"}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={(e) => {
              const totalCost = form.items.reduce((sum, it) => {
                const p = products.find(prod => prod._id === it.product);
                return sum + ((p?.price || 0) * it.quantity);
              }, 0);
              handleSubmit(e, totalCost);
            }}>
              <div className="modal-body">
                <div className="grid-form mb-16">
                  <div className="form-group">
                    <label className="form-label">Tên Combo *</label>
                    <input 
                      className="form-input" 
                      placeholder="VD: Combo 1, Set Nem Nướng..." 
                      value={form.name} 
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ghi chú</label>
                    <input 
                      className="form-input" 
                      placeholder="Mô tả ngắn..." 
                      value={form.description} 
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                  </div>
                </div>

                <div className="section-title">
                  <Package size={16} /> Thành phần Combo
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {form.items.map((item, idx) => (
                    <div key={idx} className="item-row" style={{ margin: 0 }}>
                      <div className="form-group" style={{ flex: 3 }}>
                        <label className="form-label">Sản phẩm</label>
                        <select 
                          className="form-select" 
                          value={item.product} 
                          onChange={(e) => updateItem(idx, "product", e.target.value)}
                          required
                        >
                          <option value="">-- Chọn sản phẩm --</option>
                          {products.map(p => (
                            <option key={p._id} value={p._id}>{p.name} ({p.unit}) - {p.price.toLocaleString("vi-VN")}₫</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Số lượng</label>
                        <input 
                          type="number" 
                          min="0"
                          step="any"
                          className="form-input" 
                          value={item.quantity} 
                          onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                          required
                        />
                      </div>
                      <button 
                        type="button" 
                        className="btn btn-danger btn-icon"
                        onClick={() => removeItem(idx)}
                        disabled={form.items.length === 1}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="d-flex justify-between align-center mt-16">
                  <button type="button" className="btn btn-ghost" onClick={addItem}>
                    <Plus size={14} /> Thêm Sản Phẩm
                  </button>
                  <div className="text-right">
                    <span className="text-muted" style={{ marginRight: '8px' }}>Tổng giá vốn dự tính:</span>
                    <span className="fw-700 text-success fs-18">
                      {form.items.reduce((sum, it) => {
                        const p = products.find(prod => prod._id === it.product);
                        return sum + ((p?.price || 0) * it.quantity);
                      }, 0).toLocaleString("vi-VN")}₫
                    </span>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} /> Lưu Combo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
