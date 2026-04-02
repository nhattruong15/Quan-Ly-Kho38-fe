import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Package, PackagePlus, PackageMinus,
  Boxes, BarChart3, Warehouse, ChefHat, X, ShoppingCart, Users, LogOut,
  ChevronDown, ChevronRight, CalendarDays, Calendar
} from "lucide-react";

const navItems = [
  { section: "Tổng quan", items: [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
  ]},
  { section: "Quản lý", items: [
    { 
      id: "kho-hang",
      label: "Kho hàng", 
      icon: Warehouse,
      subItems: [
        { to: "/products", label: "Sản phẩm", icon: Package },
        { to: "/inventory", label: "Tồn kho", icon: Boxes },
        { to: "/imports", label: "Phiếu nhập kho", icon: PackagePlus },
        { to: "/exports", label: "Phiếu xuất kho", icon: PackageMinus },
        { to: "/orders", label: "Đơn đặt hàng", icon: ShoppingCart },
        // { to: "/calendar", label: "Lịch đơn hàng", icon: CalendarDays },
        { to: "/customers", label: "Khách hàng", icon: Users },
      ]
    },
  ]},
  { section: "Phân tích", items: [
    { to: "/appointments", label: "Đơn hẹn", icon: Calendar },
    { to: "/reports", label: "Báo cáo", icon: BarChart3 },
  ]},
];

export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [expandedMenus, setExpandedMenus] = useState({
    "kho-hang": false
  });

  useEffect(() => {
    navItems.forEach(section => {
      section.items.forEach(item => {
        if (item.subItems) {
          const isActive = item.subItems.some(sub => sub.to === location.pathname);
          if (isActive) {
            setExpandedMenus(prev => ({ ...prev, [item.id]: true }));
          }
        }
      });
    });
  }, [location.pathname]);

  const toggleMenu = (id) => {
    setExpandedMenus(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/login");
  };

  const username = localStorage.getItem("username") || "Admin";

  return (
    <aside className={`sidebar${open ? " open" : ""}`}>
      <div className="sidebar-logo">
        <div className="sidebar-logo-brand">
          <div className="sidebar-logo-icon">
            <ChefHat size={20} color="#020c1b" />
          </div>
          <div className="sidebar-logo-text">
            <h2>Kho Cháo 38</h2>
            <span>Quản lý nhập xuất kho</span>
          </div>
          {/* Close button — visible on mobile */}
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Đóng menu">
            <X size={18} />
          </button>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((section) => (
          <div key={section.section}>
            <p className="nav-section-title">{section.section}</p>
            {section.items.map((item) => {
              if (item.subItems) {
                const isExpanded = expandedMenus[item.id];
                const isActiveSub = item.subItems.some(sub => sub.to === location.pathname);
                return (
                  <div key={item.id} className="nav-item-group">
                    <div 
                      className={`nav-item ${isActiveSub && !isExpanded ? "active" : ""}`}
                      onClick={() => toggleMenu(item.id)}
                      style={{ justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <item.icon size={18} />
                        {item.label}
                      </div>
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>
                    {isExpanded && (
                      <div className="nav-sub-menu">
                        {item.subItems.map(subItem => (
                          <NavLink
                            key={subItem.to}
                            to={subItem.to}
                            end={subItem.to === "/"}
                            className={({ isActive }) => `nav-sub-item ${isActive ? "active" : ""}`}
                            onClick={onClose}
                          >
                            <subItem.icon size={16} style={{ opacity: 0.7 }} />
                            <span style={{ fontSize: '13px' }}>{subItem.label}</span>
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
                  onClick={onClose}
                >
                  <item.icon size={18} />
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{username.slice(0, 2).toUpperCase()}</div>
          <div className="sidebar-user-info">
            <h4>{username}</h4>
            <p>Quản lý kho</p>
          </div>
          <button
            onClick={handleLogout}
            title="Đăng xuất"
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              padding: "4px",
              borderRadius: "6px",
              flexShrink: 0,
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-danger)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            <LogOut size={16} />
          </button>
        </div>
        <p style={{ textAlign: "center", fontSize: "11px", color: "var(--text-muted)", marginTop: "10px", opacity: 0.6 }}>
          © {new Date().getFullYear()} by truonghocitngu
        </p>
      </div>
    </aside>
  );
}
