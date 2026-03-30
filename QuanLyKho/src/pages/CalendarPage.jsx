import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from "lucide-react";
import { getOrders } from "../services/api";
import { useToast } from "../components/Toast";

export default function CalendarPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const addToast = useToast();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await getOrders();
        if (res.data.success) {
          setOrders(res.data.data);
        }
      } catch (err) {
        addToast("Lỗi khi tải dữ liệu đơn hàng: " + err.message, "error");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [addToast]);

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => {
    let day = new Date(year, month, 1).getDay();
    // Chuyển Chủ Nhật (0) thành 7 để tuần bắt đầu bằng Thứ 2
    return day === 0 ? 7 : day;
  };

  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const numDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    
    const days = [];
    
    // Các ngày trống của tháng trước
    for (let i = 1; i < startDay; i++) {
        days.push(null);
    }
    
    // Các ngày của tháng hiện hành
    for (let i = 1; i <= numDays; i++) {
        days.push(new Date(year, month, i));
    }
    
    // Cân bằng số ô để luôn đủ các hàng (mỗi hàng 7 ô), tối đa 6 hàng = 42 ô
    const totalCells = Math.ceil(days.length / 7) * 7;
    while (days.length < totalCells) {
        days.push(null);
    }
    
    return days;
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  const resetToToday = () => {
    setCurrentDate(new Date());
  };

  const getOrdersForDay = (dateObj) => {
    if (!dateObj) return [];
    
    const targetDateStr = dateObj.toLocaleDateString('en-CA'); // Trả về dạng YYYY-MM-DD an toàn (local time)
    
    return orders.filter(o => {
      const orderDateObj = new Date(o.orderDate);
      const orderDateStr = orderDateObj.toLocaleDateString('en-CA');
      return orderDateStr === targetDateStr;
    });
  };

  const handleDayClick = (dateObj) => {
    if (!dateObj) return;
    const ordersForDay = getOrdersForDay(dateObj);
    if (ordersForDay.length > 0) {
      setSelectedDate(dateObj);
      setShowModal(true);
    }
  };

  const renderOrderStatus = (status) => {
    if (status === "Đã xuất thành công") {
        return <span className="badge badge-success" style={{ fontSize: "11px" }}>{status}</span>;
    }
    if (status === "Đã xuất trước") {
        return <span className="badge badge-info" style={{ fontSize: "11px" }}>⚡ Đã xuất trước</span>;
    }
    return <span className="badge badge-warning" style={{ fontSize: "11px" }}>{status || "Chờ xuất hàng"}</span>;
  };

  // Helper cho kiểm tra ngày hôm nay
  const isToday = (dateObj) => {
    if (!dateObj) return false;
    const today = new Date();
    return dateObj.getDate() === today.getDate() &&
           dateObj.getMonth() === today.getMonth() &&
           dateObj.getFullYear() === today.getFullYear();
  };

  const calendarDays = getCalendarDays();
  const weekDayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <h2>Lịch Đơn Hàng</h2>
          <p>Tất cả đơn đặt hàng (pre-order) của khách theo từng ngày</p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
            <button className="btn btn-outline" onClick={resetToToday}>
                <CalendarIcon size={16} /> Hôm nay
            </button>
        </div>
      </div>

      <div className="card">
         <div className="calendar-header-nav">
            <button className="btn btn-icon btn-ghost" onClick={prevMonth}>
                <ChevronLeft size={20} />
            </button>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 20px', minWidth: '150px', textAlign: 'center' }}>
                Tháng {currentDate.getMonth() + 1}, {currentDate.getFullYear()}
            </h3>
            <button className="btn btn-icon btn-ghost" onClick={nextMonth}>
                <ChevronRight size={20} />
            </button>
         </div>

         {loading ? (
           <div className="loading-overlay" style={{ minHeight: '400px' }}>
             <div className="spinner"></div>
             <p className="text-muted mt-16">Đang tải lịch đơn hàng...</p>
           </div>
         ) : (
           <div className="calendar-container">
               <div className="calendar-grid">
                   {weekDayNames.map(day => (
                       <div key={day} className="calendar-day-name">{day}</div>
                   ))}
                   
                   {calendarDays.map((dateObj, idx) => {
                       const dayOrders = getOrdersForDay(dateObj);
                       const pendingOrders = dayOrders.filter(o => o.status !== "Đã xuất thành công");
                       const completedOrders = dayOrders.filter(o => o.status === "Đã xuất thành công");
                       
                       return (
                           <div 
                               key={idx} 
                               className={`calendar-cell ${!dateObj ? 'empty' : ''} ${isToday(dateObj) ? 'today' : ''} ${dayOrders.length > 0 ? 'has-orders' : ''}`}
                               onClick={() => handleDayClick(dateObj)}
                           >
                               {dateObj && (
                                   <>
                                      <div className="calendar-date-number">{dateObj.getDate()}</div>
                                      {dayOrders.length > 0 && (
                                          <div className="calendar-events">
                                              {pendingOrders.length > 0 && (
                                                <div className="calendar-event-badge pending" title="Đơn cần giao">
                                                    {pendingOrders.length} đơn chờ
                                                </div>
                                              )}
                                              {completedOrders.length > 0 && (
                                                <div className="calendar-event-badge completed" title="Đơn đã giao">
                                                    {completedOrders.length} đã giao
                                                </div>
                                              )}
                                          </div>
                                      )}
                                   </>
                               )}
                           </div>
                       );
                   })}
               </div>
           </div>
         )}
      </div>

      {showModal && selectedDate && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <h3>Đơn hàng ngày {selectedDate.toLocaleDateString('vi-VN')}</h3>
              <button className="btn btn-icon btn-ghost" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th>Khách hàng</th>
                      <th>Sản phẩm Yêu Cầu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getOrdersForDay(selectedDate).map(o => (
                      <tr key={o._id}>
                        <td>
                            <div className="fw-700 text-primary">{o.code}</div>
                            <div style={{ marginTop: "4px" }}>
                                {renderOrderStatus(o.status)}
                            </div>
                        </td>
                        <td className="fw-700 text-primary">{o.customerName}</td>
                        <td>
                             <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                              {o.items.map((it, idx) => (
                                <div key={idx} style={{ fontSize: "12px" }}>
                                  • {it.product?.name || "SP đã xóa"}: <strong>{it.quantity}</strong> {it.product?.unit}
                                </div>
                              ))}
                            </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setShowModal(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
