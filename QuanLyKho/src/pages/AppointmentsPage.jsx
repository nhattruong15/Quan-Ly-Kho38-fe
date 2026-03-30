import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, Trash2, Plus, FileText } from "lucide-react";
import { getAppointments, createAppointment, deleteAppointment } from "../services/api";
import { useToast } from "../components/Toast";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const addToast = useToast();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newNote, setNewNote] = useState("");

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const monthStr = String(currentDate.getMonth() + 1).padStart(2, "0");
      const res = await getAppointments({ month: `${year}-${monthStr}` });
      if (res.data.success) {
        setAppointments(res.data.data);
      }
    } catch (err) {
      addToast("Lỗi khi tải lịch hẹn: " + (err.response?.data?.message || err.message), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]);

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 7 : day;
  };

  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const numDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    
    const days = [];
    for (let i = 1; i < startDay; i++) {
        days.push(null);
    }
    for (let i = 1; i <= numDays; i++) {
        days.push(new Date(year, month, i));
    }
    const totalCells = Math.ceil(days.length / 7) * 7;
    while (days.length < totalCells) {
        days.push(null);
    }
    return days;
  };

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const resetToToday = () => setCurrentDate(new Date());

  const getAppointmentsForDay = (dateObj) => {
    if (!dateObj) return [];
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    const targetDateStr = `${year}-${month}-${day}`;
    
    return appointments.filter(a => a.date === targetDateStr);
  };

  const handleDayClick = (dateObj) => {
    if (!dateObj) return;
    setSelectedDate(dateObj);
    setShowModal(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) {
      addToast("Vui lòng nhập nội dung!", "warning");
      return;
    }
    
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const day = String(selectedDate.getDate()).padStart(2, "0");
    const targetDateStr = `${year}-${month}-${day}`;

    try {
      const res = await createAppointment({
        date: targetDateStr,
        note: newNote.trim()
      });
      if (res.data.success) {
        addToast("Thêm nội dung thành công!", "success");
        setAppointments([res.data.data, ...appointments]);
        setNewNote("");
      }
    } catch (err) {
      addToast("Lỗi khi thêm: " + (err.response?.data?.message || err.message), "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa ghi chú này?")) return;
    try {
      const res = await deleteAppointment(id);
      if (res.data.success) {
        addToast("Xóa ghi chú thành công!", "success");
        setAppointments(appointments.filter(a => a._id !== id));
      }
    } catch (err) {
      addToast("Lỗi khi xóa ghi chú: " + (err.response?.data?.message || err.message), "error");
    }
  };

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
          <h2>Đơn Hẹn</h2>
          <p>Quản lý lịch hẹn và ghi chú theo ngày</p>
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
                 <p className="text-muted mt-16">Đang tải lịch hẹn...</p>
             </div>
         ) : (
             <div className="calendar-container">
                 <div className="calendar-grid">
                     {weekDayNames.map(day => (
                         <div key={day} className="calendar-day-name">{day}</div>
                     ))}
                     
                     {calendarDays.map((dateObj, idx) => {
                         const dayAppointments = getAppointmentsForDay(dateObj);
                         
                         return (
                             <div 
                                 key={idx} 
                                 className={`calendar-cell ${!dateObj ? 'empty' : ''} ${isToday(dateObj) ? 'today' : ''} ${dayAppointments.length > 0 ? 'has-orders' : ''}`}
                                 onClick={() => handleDayClick(dateObj)}
                             >
                                 {dateObj && (
                                     <>
                                        <div className="calendar-date-number">{dateObj.getDate()}</div>
                                        {dayAppointments.length > 0 && (
                                            <div className="calendar-events">
                                                <div className="calendar-event-badge info" title="Có ghi chú" style={{ backgroundColor: 'rgba(34, 211, 238, 0.15)', color: 'var(--accent-primary)', borderColor: 'var(--accent-primary)' }}>
                                                    {dayAppointments.length} ghi chú
                                                </div>
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
              <h3>Đơn hẹn ngày {selectedDate.toLocaleDateString('vi-VN')}</h3>
              <button className="btn btn-icon btn-ghost" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ minHeight: "350px", display: "flex", flexDirection: "column" }}>
              
              <form id="noteForm" onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                <textarea
                    required
                    className="form-textarea"
                    style={{ width: "100%", minHeight: "100px", resize: "vertical" }}
                    placeholder="Dán nội dung từ tin nhắn khách hàng (hỗ trợ nhiều dòng)..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    autoFocus
                />
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button type="submit" className="btn btn-primary">
                      <Plus size={16} /> Thêm ghi chú
                  </button>
                </div>
              </form>

              <div style={{ flex: 1, maxHeight: "400px", overflowY: "auto" }}>
                  {getAppointmentsForDay(selectedDate).length === 0 ? (
                      <div className="empty-state" style={{ padding: "40px 20px" }}>
                          <FileText size={40} style={{ opacity: 0.2 }} />
                          <p style={{ marginTop: "10px" }}>Ngày này chưa có lịch hẹn hay ghi chú nào.</p>
                      </div>
                  ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                          {getAppointmentsForDay(selectedDate).map((appt) => (
                              <div 
                                key={appt._id} 
                                className="item-row" 
                                style={{ 
                                  display: "flex", 
                                  justifyContent: "space-between", 
                                  alignItems: "flex-start",
                                  padding: "16px 20px",
                                  background: "var(--bg-glass)",
                                  borderRadius: "var(--radius-md)",
                                  borderLeft: "4px solid var(--accent-primary)"
                                }}
                              >
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                    Lúc {new Date(appt.createdAt).toLocaleTimeString("vi-VN")}
                                  </div>
                                  <div style={{ fontSize: "15px", color: "var(--text-primary)", whiteSpace: "pre-wrap", lineHeight: "1.6" }}>
                                    {appt.note}
                                  </div>
                                </div>
                                <button
                                  className="btn btn-icon btn-ghost text-danger"
                                  title="Xóa ghi chú"
                                  onClick={() => handleDelete(appt._id)}
                                  style={{ flexShrink: 0, marginLeft: "16px" }}
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
