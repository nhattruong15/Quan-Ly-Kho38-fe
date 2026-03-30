import { Menu } from "lucide-react";

const pageMeta = {
  "/": { title: "Dashboard", desc: "Tổng quan hoạt động kho hàng" },
  "/products": { title: "Sản phẩm", desc: "Quản lý danh mục hàng hóa" },
  "/inventory": { title: "Tồn kho", desc: "Theo dõi số lượng hàng hiện có" },
  "/imports": { title: "Phiếu nhập kho", desc: "Quản lý phiếu nhập hàng hóa" },
  "/exports": { title: "Phiếu xuất kho", desc: "Quản lý phiếu xuất hàng hóa" },
};

export default function Header({ pathname, onMenuClick }) {
  const meta = pageMeta[pathname] || { title: "Trang", desc: "" };

  const now = new Date();
  const dateStr = now.toLocaleDateString("vi-VN", {
    weekday: "short", year: "numeric", month: "2-digit", day: "2-digit",
  });

  return (
    <header className="header">
      <div className="header-left">
        {/* Hamburger — hidden on desktop via CSS */}
        <button className="hamburger-btn" onClick={onMenuClick} aria-label="Mở menu">
          <Menu size={20} />
        </button>
        <div>
          <h1>{meta.title}</h1>
          <p>{meta.desc}</p>
        </div>
      </div>
      <div className="header-right">
        <span className="header-date">{dateStr}</span>
      </div>
    </header>
  );
}
