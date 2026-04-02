import { useState, useEffect } from "react";
import { Plus, Search, Trash2, ShoppingCart, CheckCircle, AlertTriangle, PackagePlus, BarChart2, X, FileSpreadsheet, Calendar, Zap, Filter, Pencil } from "lucide-react";
import * as XLSX from "xlsx-js-style";
import { getOrders, createOrder, deleteOrder, updateOrder, getProducts, getCustomers, createExport, updateOrderStatus, getExports } from "../services/api";
import { useToast } from "../components/Toast";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [exportsList, setExportsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [exportModal, setExportModal] = useState(null);
  const [orderInputs, setOrderInputs] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const addToast = useToast();

  const [formData, setFormData] = useState({
    customerName: "",
    orderDate: new Date().toISOString().substring(0, 10),
    note: "",
    totalAmount: 0,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [orderRes, prodRes, custRes, expRes] = await Promise.all([getOrders(), getProducts(), getCustomers(), getExports()]);
      if (orderRes.data.success) setOrders(orderRes.data.data);
      if (prodRes.data.success) {
        const sortedProds = (prodRes.data.data || []).sort((a, b) => (a.code || "").localeCompare(b.code || "", undefined, { numeric: true, sensitivity: 'base' }));
        setProducts(sortedProds);
      }
      if (custRes.data.success) setCustomers(custRes.data.data);
      if (expRes?.data?.data) setExportsList(expRes.data.data);
    } catch (err) {
      addToast("Lỗi khi tải dữ liệu: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const items = products
      .filter(p => Number(orderInputs[p._id]?.quantity) > 0)
      .map(p => ({
        product: p._id,
        quantity: Number(orderInputs[p._id].quantity)
      }));

    if (items.length === 0) return addToast("Vui lòng nhập số lượng cho ít nhất 1 sản phẩm", "warning");

    try {
      const payload = { ...formData, items };
      const res = await createOrder(payload);
      if (res.data.success) {
        setOrders(prev => [res.data.data, ...prev]);
        setShowModal(false);
        setFormData({
          customerName: "",
          orderDate: new Date().toISOString().substring(0, 10),
          note: "",
          totalAmount: 0,
        });
        setOrderInputs({});
      }
    } catch (err) {
      addToast("Lỗi: " + (err.response?.data?.message || err.message || "Không xác định"), "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa đơn đặt hàng này không?")) return;
    try {
      const res = await deleteOrder(id);
      if (res.data.success) {
        addToast("Xóa đơn hàng thành công", "success");
        setOrders(prev => prev.filter(o => o._id !== id));
      }
    } catch (err) {
      addToast("Lỗi: " + err.message, "error");
    }
  };

  const handleEdit = (order) => {
    setEditingOrder(order);
    setFormData({
      customerName: order.customerName,
      orderDate: new Date(order.orderDate).toISOString().substring(0, 10),
      note: order.note || "",
      totalAmount: order.totalAmount || 0,
    });
    
    const initials = {};
    order.items.forEach(it => {
        initials[it.product?._id || it.product] = { quantity: it.quantity };
    });
    setOrderInputs(initials);
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const items = products
      .filter(p => Number(orderInputs[p._id]?.quantity) > 0)
      .map(p => ({
        product: p._id,
        quantity: Number(orderInputs[p._id].quantity)
      }));

    if (items.length === 0) return addToast("Vui lòng nhập số lượng cho ít nhất 1 sản phẩm", "warning");

    try {
      const payload = { ...formData, items };
      const res = await updateOrder(editingOrder._id, payload);
      if (res.data.success) {
        setOrders(prev => prev.map(o => o._id === editingOrder._id ? res.data.data : o));
        addToast("Cập nhật đơn hàng thành công!", "success");
        setShowEditModal(false);
        setEditingOrder(null);
        setFormData({
          customerName: "",
          orderDate: new Date().toISOString().substring(0, 10),
          note: "",
          totalAmount: 0,
        });
        setOrderInputs({});
      }
    } catch (err) {
      addToast("Lỗi: " + (err.response?.data?.message || err.message || "Không xác định"), "error");
    }
  };

  const handleOpenExport = (order) => {
    let orderExportedMap = {};
    exportsList.forEach(ex => {
      if (ex.note === `Xuất trước cho đơn hàng: ${order.code}`) {
        ex.items.forEach(e => {
          const pid = e.product?._id || e.product;
          orderExportedMap[pid] = (orderExportedMap[pid] || 0) + e.quantity;
        });
      }
    });

    const exportItems = order.items.map(it => {
        if (!it.product) return null;
        const exported = orderExportedMap[it.product._id] || 0;
        const remainingToFulfil = it.quantity - exported;
        if (remainingToFulfil <= 0) return null;

        const stock = it.product.quantity || 0;
        return {
           product: it.product._id,
           productName: it.product.name,
           unit: it.product.unit,
           requested: remainingToFulfil,
           stock,
           exportQty: remainingToFulfil
        }
    }).filter(Boolean);

    if (exportItems.length === 0) {
       addToast("Đơn hàng này đã được xuất đủ từ trước", "success");
       return;
    }

    setExportModal({ order, items: exportItems });
  };

  const handleConfirmExport = async () => {
    if (!exportModal) return;
    const { order, items } = exportModal;

    const validItems = items
      .filter(it => Number(it.exportQty) > 0)
      .map(it => ({ product: it.product, quantity: Number(it.exportQty) }));

    if (validItems.length === 0) return addToast("Không có mặt hàng nào để xuất", "error");

    setLoading(true);
    try {
      const exportData = {
        purpose: "Khác",
        note: `Xuất trước cho đơn hàng: ${order.code}`,
        items: validItems
      };
      await createExport(exportData);
      
      const isFull = items.every(it => Number(it.exportQty) >= it.requested);
      try {
        await updateOrderStatus(order._id, isFull ? "Đã xuất thành công" : "Đã xuất trước");
      } catch { /* ignore */ }

      addToast("Xuất kho thành công!", "success");
      setExportModal(null);
    } catch (err) {
      addToast("Lỗi xuất kho: " + (err.response?.data?.message || err.message), "error");
    } finally {
      fetchData();
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchSearch =
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDate = filterDate
      ? (() => {
          const d = new Date(o.orderDate);
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, "0");
          const dd = String(d.getDate()).padStart(2, "0");
          return `${yyyy}-${mm}-${dd}` === filterDate;
        })()
      : true;

    if (showPendingOnly) {
      if (o.status === "Đã xuất thành công") return false;
    }

    return matchSearch && matchDate;
  });

  // --- Logic Tổng Hợp Tồn Kho vs Hàng Đặt ---
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const productDemandMap = {};
  orders.forEach(o => {
    // Tính cả đơn quá khứ chưa xuất vào bảng tổng hợp
    if (o.status !== "Đã xuất thành công") {
      let orderExportedMap = {};
      exportsList.forEach(ex => {
        if (ex.note === `Xuất trước cho đơn hàng: ${o.code}`) {
          ex.items.forEach(e => {
            const pid = e.product?._id || e.product;
            orderExportedMap[pid] = (orderExportedMap[pid] || 0) + e.quantity;
          });
        }
      });

      o.items.forEach(it => {
        if (it.product && it.product._id) {
           const exported = orderExportedMap[it.product._id] || 0;
           const remaining = Math.max(0, it.quantity - exported);
           productDemandMap[it.product._id] = (productDemandMap[it.product._id] || 0) + remaining;
        }
      });
    }
  });

  const handleExportSummary = () => {
    try {
      const headerStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 16 },
        fill: { fgColor: { rgb: "4F46E5" } },
        alignment: { horizontal: "center", vertical: "center" }
      };

      const dataStyle = {
        font: { bold: true, sz: 16 },
        alignment: { horizontal: "left", vertical: "center" }
      };

      const numStyle = {
        font: { bold: true, sz: 16 },
        alignment: { horizontal: "center", vertical: "center" }
      };

      const rows = [
        [
          { v: "SẢN PHẨM", s: headerStyle },
          { v: "TỔNG TỒN HIỆN TẠI", s: headerStyle },
          { v: "SỐ LƯỢNG CẦN GIAO", s: headerStyle },
          { v: "CÒN THIẾU", s: headerStyle }
        ]
      ];

      let sumStock = 0, sumDemand = 0, sumDeficit = 0;

      products.forEach(p => {
        const demand = productDemandMap[p._id] || 0;
        const deficit = demand - p.quantity;
        const deficitVal = deficit > 0 ? deficit : 0;

        sumStock   += p.quantity;
        sumDemand  += demand;
        sumDeficit += deficitVal;
        
        const row = [
          { v: p.name, s: dataStyle },
          { v: p.quantity, s: numStyle },
          { v: demand, s: numStyle },
          { v: deficitVal, s: numStyle }
        ];
        
        if (deficit > 0) {
          row[3].s = { font: { color: { rgb: "DC2626" }, bold: true, sz: 16 }, alignment: { horizontal: "center", vertical: "center" } };
        }
        
        rows.push(row);
      });

      // Hàng tổng cộng
      const sumRowStyle = {
        font: { bold: true, sz: 16, color: { rgb: "1E1E1E" } },
        fill: { fgColor: { rgb: "E0E7FF" } },
        alignment: { horizontal: "center", vertical: "center" }
      };
      const sumLabelStyle = {
        font: { bold: true, sz: 16, color: { rgb: "1E1E1E" } },
        fill: { fgColor: { rgb: "E0E7FF" } },
        alignment: { horizontal: "left", vertical: "center" }
      };
      rows.push([
        { v: "TỔNG CỘNG", s: sumLabelStyle },
        { v: sumStock,   s: sumRowStyle },
        { v: sumDemand,  s: sumRowStyle },
        { v: sumDeficit, s: { ...sumRowStyle, font: { bold: true, sz: 16, color: { rgb: sumDeficit > 0 ? "DC2626" : "1E1E1E" } } } }
      ]);

      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws["!cols"] = [{ wch: 40 }, { wch: 28 }, { wch: 26 }, { wch: 22 }];
      ws["!rows"] = [{ hpt: 26 }]; // header row cao hơn

      // Thêm border cho tất cả các ô
      const border = {
        top:    { style: "thin", color: { rgb: "AAAAAA" } },
        bottom: { style: "thin", color: { rgb: "AAAAAA" } },
        left:   { style: "thin", color: { rgb: "AAAAAA" } },
        right:  { style: "thin", color: { rgb: "AAAAAA" } },
      };
      // Border đậm cho hàng tổng cộng
      const boldBorder = {
        top:    { style: "medium", color: { rgb: "4F46E5" } },
        bottom: { style: "medium", color: { rgb: "4F46E5" } },
        left:   { style: "thin",   color: { rgb: "AAAAAA" } },
        right:  { style: "thin",   color: { rgb: "AAAAAA" } },
      };
      const range = XLSX.utils.decode_range(ws["!ref"]);
      const lastRow = range.e.r;
      for (let R = range.s.r; R <= range.e.r; R++) {
        for (let C = range.s.c; C <= range.e.c; C++) {
          const addr = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[addr]) ws[addr] = { v: "", t: "s" };
          ws[addr].s = { ...(ws[addr].s || {}), border: R === lastRow ? boldBorder : border };
        }
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "TongHop");

      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbout], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TongHop_TonKho_CanGiao_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      addToast("Xuất Excel bảng tổng hợp thành công!", "success");
    } catch (err) {
      console.error("Export Excel lỗi:", err);
      addToast("Lỗi xuất Excel: " + err.message, "error");
    }
  };


  return (
    <div>
      <div className="page-header">
      
        <div style={{ display: "flex", gap: "12px" }}>
          <button 
            className="btn btn-outline" 
            onClick={() => setShowPendingOnly(!showPendingOnly)}
            style={showPendingOnly ? { borderColor: "var(--primary-color, #4f46e5)", color: "var(--primary-color, #4f46e5)", backgroundColor: "var(--primary-color-light, #e0e7ff)" } : {}}
            title="Lọc các đơn hàng chưa xuất xong (bao gồm cả đơn quá hạn)"
          >
            <Filter size={16} /> {showPendingOnly ? "Tất cả đơn" : "Đơn chưa xuất xong"}
          </button>
          <button className="btn btn-outline" onClick={() => setShowSummaryModal(true)}>
            <BarChart2 size={16} /> Bảng Tổng Hợp
          </button>
          <button className="btn btn-primary" onClick={() => {
             setFormData({
               customerName: "",
               orderDate: new Date().toISOString().substring(0, 10),
               note: "",
               totalAmount: 0,
             });
             setOrderInputs({});
             setShowModal(true);
          }}>
            <Plus size={16} /> Tạo đơn đặt hàng
          </button>
        </div>
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="search-input-wrap">
            <Search size={16} />
            <input
              type="text"
              className="form-input"
              placeholder="Tìm theo tên khách, mã đơn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
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

        {loading ? (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p className="text-muted mt-16">Đang tải dữ liệu...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty-state">
            <ShoppingCart size={48} />
            <h3 className="text-secondary fw-700 mt-16">Chưa có đơn đặt hàng nào</h3>
            <p>Bấm Tạo đơn đặt hàng để bắt đầu.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Ngày đặt</th>
                  <th>Sản phẩm Yêu Cầu &amp; Tình trạng Tồn kho</th>
                  <th>Tổng tiền</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o) => {
                  const todayStart = new Date();
                  todayStart.setHours(0, 0, 0, 0);
                  const orderDateStart = new Date(o.orderDate);
                  orderDateStart.setHours(0, 0, 0, 0);
                  const isExpired = orderDateStart.getTime() < todayStart.getTime();

                  return (
                    <tr key={o._id} style={{ opacity: isExpired ? 0.6 : 1, transition: "opacity 0.2s" }}>
                      <td>
                        <div className="fw-700 text-primary">{o.code}</div>
                        <div style={{ marginTop: "4px" }}>
                          {o.status === "Đã xuất thành công" ? (
                            <span className="badge badge-success" style={{ fontSize: "11px" }}>{o.status}</span>
                          ) : o.status === "Đã xuất trước" ? (
                            <span className="badge badge-info" style={{ fontSize: "11px" }}>⚡ Đã xuất trước</span>
                          ) : (
                            <span className="badge badge-warning" style={{ fontSize: "11px" }}>{o.status || "Chờ xuất hàng"}</span>
                          )}
                        </div>
                      </td>
                      <td className="fw-700 text-primary" style={{ fontSize: "15px" }}>{o.customerName}</td>
                      <td>{new Date(o.orderDate).toLocaleDateString("vi-VN")}</td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {o.items.map((it, idx) => {
                            // Build status badge
                            let statusNode;
                            if (!it.product) {
                              statusNode = <span className="badge badge-danger">Lỗi SP</span>;
                            } else if (o.status === "Đã xuất thành công") {
                              statusNode = (
                                <span className="badge badge-success">
                                  <CheckCircle size={12} /> Đã xuất đủ
                                </span>
                              );
                            } else {
                              let exportedQty = 0;
                              exportsList.forEach(ex => {
                                if (ex.note === `Xuất trước cho đơn hàng: ${o.code}`) {
                                  const matchedItem = ex.items.find(e => e.product?._id === it.product._id || e.product === it.product._id);
                                  if (matchedItem) exportedQty += matchedItem.quantity;
                                }
                              });
                              const remainingToFulfil = it.quantity - exportedQty;
                              const missing = remainingToFulfil - it.product.quantity;
                              const isEnough = missing <= 0;

                              if (remainingToFulfil <= 0 && exportedQty > 0) {
                                statusNode = (
                                  <span className="badge badge-success">
                                    <CheckCircle size={12} /> Đã xuất đủ ({exportedQty})
                                  </span>
                                );
                              } else {
                                statusNode = (
                                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "flex-start" }}>
                                    {exportedQty > 0 && (
                                      <span className="text-info fw-600" style={{ fontSize: "11px" }}>
                                        ⚡ Đã xuất: {exportedQty}
                                      </span>
                                    )}
                                    {isEnough ? (
                                      <span className="badge badge-success">
                                        <CheckCircle size={12} /> Đủ xuất (Tồn: {it.product.quantity})
                                      </span>
                                    ) : (
                                      <span className="badge badge-danger">
                                        <AlertTriangle size={12} /> Thiếu {missing} {it.product.unit} (Tồn: {it.product.quantity})
                                      </span>
                                    )}
                                  </div>
                                );
                              }
                            }

                            return (
                              <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "4px 0", borderBottom: idx < o.items.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                                <div style={{ fontSize: "12px", whiteSpace: "nowrap", minWidth: "140px" }}>
                                  • {it.product?.name || "SP đã xóa"}: <strong>{it.quantity}</strong> {it.product?.unit}
                                </div>
                                <div style={{ flexShrink: 0 }}>
                                  {statusNode}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td className="fw-600 text-success">
                        {o.totalAmount ? o.totalAmount.toLocaleString("vi-VN") + " đ" : "-"}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", justifyContent: "flex-end", flexWrap: "wrap", minWidth: "220px" }}>
                          {o.status !== "Đã xuất thành công" && (
                             <button
                               className="btn btn-sm btn-primary d-flex align-center gap-4"
                               title="Xuất kho cho đơn hàng này"
                               onClick={() => handleOpenExport(o)}
                             >
                               <PackagePlus size={14} /> Xuất kho
                             </button>
                          )}
                          {/* Nút sửa hiển thị cả đơn quá hạn, trừ đơn đã xuất xong */}
                          {o.status !== "Đã xuất thành công" && (
                            <button
                              className="btn btn-icon btn-ghost"
                              title="Sửa đơn hàng"
                              style={{ color: "var(--primary-color, #4f46e5)" }}
                              onClick={() => handleEdit(o)}
                            >
                              <Pencil size={16} />
                            </button>
                          )}
                          <button
                            className="btn btn-icon btn-ghost text-danger"
                            title="Xóa đơn"
                            onClick={() => handleDelete(o._id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <h3>Thêm Đơn Đặt Hàng Mới</h3>
              <button className="btn btn-icon btn-ghost" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <form id="orderForm" onSubmit={handleSubmit} className="d-flex" style={{ flexDirection: "column", gap: "20px" }}>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Khách hàng</label>
                    <select
                      required
                      className="form-select"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    >
                      <option value="">-- Chọn khách hàng --</option>
                      {customers.map((c) => (
                        <option key={c._id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    {formData.customerName && (
                      <div className="mt-8 text-muted" style={{ fontSize: "12px" }}>
                        {customers.find(c => c.name === formData.customerName)?.address && (
                          <div>Địa chỉ: {customers.find(c => c.name === formData.customerName).address}</div>
                        )}
                        {customers.find(c => c.name === formData.customerName)?.phone && (
                          <div>SĐT: {customers.find(c => c.name === formData.customerName).phone}</div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ngày nhận hàng</label>
                    <input
                      type="date"
                      required
                      className="form-input"
                      value={formData.orderDate}
                      onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <div className="section-title justify-between mb-16">
                    <span className="d-flex align-center gap-8">
                      <ShoppingCart size={16} className="text-primary" />
                      Nhập số lượng hàng
                    </span>
                  </div>
                  <div className="table-wrapper" style={{ maxHeight: "350px", overflowY: "auto" }}>
                    <table style={{ margin: 0 }}>
                      <thead style={{ position: "sticky", top: 0, zIndex: 1, background: "var(--card-bg)" }}>
                        <tr>
                          <th>TÊN MÓN</th>
                          <th style={{ width: 140, textAlign: "center" }}>SỐ LƯỢNG ĐẶT</th>
                          <th style={{ width: 140, textAlign: "center" }}>CÒN TỒN</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((p) => {
                          const val = orderInputs[p._id]?.quantity || "";
                          return (
                            <tr key={p._id}>
                              <td className="fw-600">{p.name} {p.unit ? `(${p.unit})` : ''}</td>
                              <td>
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  className="form-input"
                                  style={{ textAlign: "center", fontWeight: "bold" }}
                                  value={val}
                                  onChange={(e) => setOrderInputs(prev => ({
                                    ...prev,
                                    [p._id]: { quantity: e.target.value }
                                  }))}
                                />
                              </td>
                              <td style={{ textAlign: "center", color: "var(--text-muted)" }}>
                                {p.quantity} {p.unit}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Tổng số tiền (VNĐ)</label>
                    <input
                      type="number"
                      className="form-input"
                      min="0"
                      value={formData.totalAmount}
                      onChange={(e) => setFormData({ ...formData, totalAmount: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ghi chú (Tùy chọn)</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Ghi chú thêm về đơn đặt hàng..."
                      value={formData.note}
                      onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    />
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                Hủy bỏ
              </button>
              <button type="submit" form="orderForm" className="btn btn-primary">
                Tạo Đơn Hàng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Modal Sửa Đơn Đặt Hàng --- */}
      {showEditModal && editingOrder && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <h3>✏️ Sửa Đơn Hàng — {editingOrder.code}</h3>
              <button className="btn btn-icon btn-ghost" onClick={() => { setShowEditModal(false); setEditingOrder(null); }}>✕</button>
            </div>
            <div className="modal-body">
              <form id="editOrderForm" onSubmit={handleUpdate} className="d-flex" style={{ flexDirection: "column", gap: "20px" }}>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Khách hàng</label>
                    <select
                      required
                      className="form-select"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    >
                      <option value="">-- Chọn khách hàng --</option>
                      {customers.map((c) => (
                        <option key={c._id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ngày nhận hàng</label>
                    <input
                      type="date"
                      required
                      className="form-input"
                      value={formData.orderDate}
                      onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <div className="section-title justify-between mb-16">
                    <span className="d-flex align-center gap-8">
                      <ShoppingCart size={16} className="text-primary" />
                      Nhập số lượng hàng
                    </span>
                  </div>
                  <div className="table-wrapper" style={{ maxHeight: "350px", overflowY: "auto" }}>
                    <table style={{ margin: 0 }}>
                      <thead style={{ position: "sticky", top: 0, zIndex: 1, background: "var(--card-bg)" }}>
                        <tr>
                          <th>TÊN MÓN</th>
                          <th style={{ width: 140, textAlign: "center" }}>SỐ LƯỢNG ĐẶT</th>
                          <th style={{ width: 140, textAlign: "center" }}>CÒN TỒN</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((p) => {
                          const val = orderInputs[p._id]?.quantity || "";
                          return (
                            <tr key={p._id}>
                              <td className="fw-600">{p.name} {p.unit ? `(${p.unit})` : ''}</td>
                              <td>
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  className="form-input"
                                  style={{ textAlign: "center", fontWeight: "bold" }}
                                  value={val}
                                  onChange={(e) => setOrderInputs(prev => ({
                                    ...prev,
                                    [p._id]: { quantity: e.target.value }
                                  }))}
                                />
                              </td>
                              <td style={{ textAlign: "center", color: "var(--text-muted)" }}>
                                {p.quantity} {p.unit}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Tổng số tiền (VNĐ)</label>
                    <input
                      type="number"
                      className="form-input"
                      min="0"
                      value={formData.totalAmount}
                      onChange={(e) => setFormData({ ...formData, totalAmount: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ghi chú (Tùy chọn)</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Ghi chú thêm về đơn đặt hàng..."
                      value={formData.note}
                      onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    />
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => { setShowEditModal(false); setEditingOrder(null); }}>
                Hủy bỏ
              </button>
              <button type="submit" form="editOrderForm" className="btn btn-primary">
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Modal Chọn Số Lượng XUẤT KHO --- */}
      {exportModal && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <h3>Xuất kho cho đơn hàng {exportModal.order.code}</h3>
              <button className="btn btn-icon btn-ghost" onClick={() => setExportModal(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      <th style={{textAlign: "center"}}>Yêu cầu xuất</th>
                      <th style={{textAlign: "center"}}>Tồn kho</th>
                      <th style={{textAlign: "center", width: 140}}>Số lượng xuất</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exportModal.items.map((it, idx) => {
                      const qty = Number(it.exportQty) || 0;
                      const exceed = qty > it.stock;
                      return (
                        <tr key={idx}>
                          <td className="fw-600">{it.productName}</td>
                          <td align="center">{it.requested} {it.unit}</td>
                          <td align="center">{it.stock} {it.unit}</td>
                          <td align="center">
                            <input
                              type="number"
                              min="0"
                              className="form-input"
                              style={{ textAlign: "center", borderColor: exceed ? "var(--accent-danger)" : "" }}
                              value={it.exportQty}
                              onChange={(e) => {
                                const val = e.target.value;
                                setExportModal(prev => {
                                  const c = {...prev};
                                  c.items[idx].exportQty = val;
                                  return c;
                                });
                              }}
                            />
                            {exceed && (
                              <div className="text-danger fs-12 mt-4"><AlertTriangle size={12}/> Vượt tồn kho</div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setExportModal(null)}>Hủy bỏ</button>
              <button className="btn btn-primary" onClick={handleConfirmExport}>Xác nhận xuất</button>
            </div>
          </div>
        </div>
      )}

      {/* --- Modal Tổng Hợp Tồn Kho vs Hàng Đặt --- */}
      {showSummaryModal && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <h3>Bảng Tổng Hợp Tồn Kho & Cần Giao (Tính từ hôm nay)</h3>
              <button className="btn btn-icon btn-ghost" onClick={() => setShowSummaryModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      <th>Tổng tồn hiện tại</th>
                      <th>Số lượng cần giao</th>
                      <th>Còn thiếu</th>
                      <th>Tình trạng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => {
                      const demand = productDemandMap[p._id] || 0;
                      const deficit = demand - p.quantity;
                      return (
                        <tr key={p._id}>
                          <td className="fw-600">{p.name}</td>
                          <td>{p.quantity} {p.unit}</td>
                          <td>{demand} {p.unit}</td>
                          <td className={deficit > 0 ? "text-danger fw-600" : ""}>
                            {deficit > 0 ? `${deficit} ${p.unit}` : "0"}
                          </td>
                          <td>
                            {deficit > 0 ? (
                              <span className="badge badge-danger">
                                <AlertTriangle size={12} /> Thiếu hàng
                              </span>
                            ) : (
                              <span className="badge badge-success">
                                <CheckCircle size={12} /> Đủ hàng
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer" style={{ display: "flex", justifyContent: "space-between" }}>
              <button className="btn btn-outline" style={{ display: "flex", alignItems: "center", gap: 8 }} onClick={handleExportSummary}>
                <FileSpreadsheet size={16} /> Xuất Excel
              </button>
              <button className="btn btn-primary" onClick={() => setShowSummaryModal(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
