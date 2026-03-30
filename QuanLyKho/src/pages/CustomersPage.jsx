import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Search, Users, X } from "lucide-react";
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from "../services/api";
import { useToast } from "../components/Toast";

const emptyCustomer = { name: "", address: "", phone: "" };

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyCustomer);
  const [saving, setSaving] = useState(false);
  const addToast = useToast();

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getCustomers();
      setCustomers(res.data.data);
    } catch {
      addToast("Không thể tải danh sách khách hàng", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const openAdd = () => {
    setEditItem(null);
    setForm(emptyCustomer);
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditItem(c);
    setForm({ ...c });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editItem) {
        await updateCustomer(editItem._id, form);
        addToast("Cập nhật khách hàng thành công!", "success");
      } else {
        await createCustomer(form);
        addToast("Thêm khách hàng thành công!", "success");
      }
      setShowModal(false);
      fetchCustomers();
    } catch (err) {
      addToast(err.response?.data?.message || err.message || "Lỗi không xác định", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c) => {
    if (!confirm(`Xóa khách hàng "${c.name}"?`)) return;
    try {
      await deleteCustomer(c._id);
      addToast("Đã xóa khách hàng", "success");
      fetchCustomers();
    } catch (err) {
      addToast(err.response?.data?.message || "Lỗi khi xóa", "error");
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.toLowerCase().includes(search.toLowerCase()) ||
      c.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Quản Lý Khách Hàng</h2>
          <p>Danh sách khách hàng trong hệ thống</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Thêm khách hàng
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="filter-bar" style={{ padding: "16px 20px" }}>
          <div className="search-input-wrap">
            <Search size={16} />
            <input
              className="form-input"
              placeholder="Tìm kiếm khách hàng (tên, sđt, địa chỉ)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-wrapper">
          {loading ? (
            <div className="loading-overlay">
              <div className="spinner" />
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="empty-state" style={{ padding: "40px" }}>
              <Users size={48} />
              <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 16 }}>Chưa có khách hàng</h3>
              <p>Bấm "Thêm khách hàng" để bắt đầu</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Tên khách hàng</th>
                  <th>Số điện thoại</th>
                  <th>Địa chỉ</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <span className="fw-700 text-primary">{c.name}</span>
                    </td>
                    <td>{c.phone || "---"}</td>
                    <td>{c.address || "---"}</td>
                    <td>{new Date(c.createdAt).toLocaleDateString("vi-VN")}</td>
                    <td>
                      <div className="d-flex gap-8">
                        <button
                          className="btn btn-ghost btn-sm btn-icon"
                          onClick={() => openEdit(c)}
                          title="Sửa"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm btn-icon text-danger"
                          onClick={() => handleDelete(c)}
                          title="Xóa"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
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
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editItem ? "Chỉnh sửa khách hàng" : "Thêm khách hàng mới"}</h3>
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                onClick={() => setShowModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div className="form-group">
                    <label className="form-label">Tên khách hàng *</label>
                    <input
                      className="form-input"
                      placeholder="VD: Nguyễn Văn A"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Số điện thoại</label>
                    <input
                      className="form-input"
                      placeholder="VD: 0901234567"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Địa chỉ</label>
                    <textarea
                      className="form-textarea"
                      placeholder="VD: 123 Đường ABC, Quận 1, TP.HCM"
                      style={{ height: "80px" }}
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowModal(false)}
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Đang lưu..." : editItem ? "Cập nhật" : "Thêm khách hàng"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
