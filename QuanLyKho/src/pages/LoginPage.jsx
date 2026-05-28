import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChefHat, Eye, EyeOff, LogIn } from "lucide-react";
import { loginApi } from "../services/api";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await loginApi({ username, password });
      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("username", res.data.username);
        navigate("/");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Đăng nhập thất bại, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="vibrant-gradient"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Background Blobs */}
      <div className="login-blob animate-float" style={{ top: "-10%", left: "-10%", background: "radial-gradient(circle, rgba(255, 61, 104, 0.2) 0%, transparent 70%)" }} />
      <div className="login-blob animate-float-delayed" style={{ bottom: "-10%", right: "-10%", background: "radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)" }} />
      <div className="login-blob animate-float" style={{ top: "40%", right: "15%", width: "300px", height: "300px", background: "radial-gradient(circle, rgba(255, 209, 49, 0.15) 0%, transparent 70%)" }} />

      <div
        className="glass-card"
        style={{
          borderRadius: "24px",
          padding: "48px 40px",
          width: "100%",
          maxWidth: "420px",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div
            className="animate-float"
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "24px",
              background: "linear-gradient(135deg, #FF3D68 0%, #FF8E3C 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              boxShadow: "0 8px 32px rgba(255, 61, 104, 0.4)",
            }}
          >
            <ChefHat size={40} color="white" strokeWidth={2.5} />
          </div>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: 800,
              color: "white",
              margin: 0,
              letterSpacing: "-0.02em",
              textShadow: "0 2px 10px rgba(0,0,0,0.2)",
            }}
          >
            Ăn Vặt Nhà Mơ
          </h1>
         
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {error && (
            <div
              style={{
                background: "rgba(239,68,68,0.2)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "12px",
                padding: "12px 16px",
                color: "#ff8a8a",
                fontSize: "14px",
                backdropFilter: "blur(4px)",
              }}
            >
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" style={{ color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>Tên đăng nhập</label>
            <input
              className="form-input"
              type="text"
              placeholder="Nhập tên đăng nhập..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "white",
                borderRadius: "12px",
              }}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>Mật khẩu</label>
            <div style={{ position: "relative" }}>
              <input
                className="form-input"
                type={showPassword ? "text" : "password"}
                placeholder="Nhập mật khẩu..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  paddingRight: "44px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "white",
                  borderRadius: "12px",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "rgba(255,255,255,0.5)",
                  display: "flex",
                  padding: 10,
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "12px",
              padding: "16px",
              fontSize: "16px",
              fontWeight: 700,
              gap: "10px",
              background: "linear-gradient(135deg, #FF3D68 0%, #FF8E3C 100%)",
              color: "white",
              border: "none",
              borderRadius: "14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 10px 25px -5px rgba(255, 61, 104, 0.4)",
              transition: "all 0.3s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 15px 30px -5px rgba(255, 61, 104, 0.5)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 10px 25px -5px rgba(255, 61, 104, 0.4)";
            }}
          >
            
            {loading ? "Đang xử lý..." : "Đăng nhập ngay"}
          </button>
        </form>
      </div>
    </div>
  );
}
