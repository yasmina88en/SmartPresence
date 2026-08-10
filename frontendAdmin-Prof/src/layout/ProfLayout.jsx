import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, LogOut, ShieldCheck, 
  Calendar, QrCode 
} from "lucide-react";

export default function ProfLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login/prof");
  };

  const menuItems = [
    { label: "Dashboard", path: "/prof/dashboard", icon: LayoutDashboard },
    { label: "Sessions", path: "/prof/sessions", icon: Calendar },
  ];

  const brandColor = "#5b4afd";
  const bgGradient = "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)";

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: isMobile ? "column" : "row",
      minHeight: "100vh", 
      background: bgGradient, 
      fontFamily: "var(--font-sans, system-ui)" 
    }}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside style={{
          width: "260px",
          background: "white",
          boxShadow: "4px 0 24px rgba(91,74,253,0.05)",
          display: "flex",
          flexDirection: "column",
          zIndex: 50
        }}>
          <div style={{ padding: "2rem", display: "flex", alignItems: "center", gap: "12px" }}>
             <div style={{
                width: "40px", height: "40px", borderRadius: "10px",
                background: brandColor, display: "flex",
                alignItems: "center", justifyContent: "center"
              }}>
                <QrCode size={24} color="white" />
              </div>
              <span style={{ fontSize: "18px", fontWeight: 700, color: "#1a1a2e" }}>
                Prof Espace
              </span>
          </div>

          <nav style={{ flex: 1, padding: "0 1rem", marginTop: "1rem" }}>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <li key={item.path}>
                    <button
                      onClick={() => navigate(item.path)}
                      style={{
                        width: "100%",
                        display: "flex", alignItems: "center", gap: "12px",
                        padding: "12px 16px",
                        borderRadius: "12px",
                        border: "none",
                        background: isActive ? brandColor : "transparent",
                        color: isActive ? "white" : "#666",
                        fontSize: "14px", fontWeight: isActive ? 600 : 500,
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      <Icon size={18} />
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div style={{ padding: "1.5rem 1rem" }}>
            <button
              onClick={handleLogout}
              style={{
                width: "100%",
                display: "flex", alignItems: "center", gap: "12px",
                padding: "12px 16px",
                borderRadius: "12px",
                border: "1px solid #fecaca",
                background: "#fef2f2",
                color: "#dc2626",
                fontSize: "14px", fontWeight: 500,
                cursor: "pointer"
              }}
            >
              <LogOut size={18} />
              Déconnexion
            </button>
          </div>
        </aside>
      )}

      {/* Mobile Header (minimal) */}
      {isMobile && (
        <header style={{ 
          background: "white", padding: "12px 16px", 
          display: "flex", justifyContent: "space-between", alignItems: "center",
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)", zIndex: 100
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <QrCode size={20} color={brandColor} />
            <span style={{ fontSize: "16px", fontWeight: 700 }}>SmartPresence</span>
          </div>
          <button 
            onClick={handleLogout}
            style={{ 
              background: "none", border: "none", color: "#666", 
              padding: "4px", display: "flex" 
            }}
          >
            <LogOut size={20} />
          </button>
        </header>
      )}

      {/* Main Content Area */}
      <main style={{ 
        flex: 1, 
        overflowY: "auto", 
        padding: isMobile ? "1rem" : "2rem",
        paddingBottom: isMobile ? "80px" : "2rem" 
      }}>
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "white", padding: "12px 0",
          display: "flex", justifyContent: "space-around",
          borderTop: "1px solid #eee", boxShadow: "0 -4px 12px rgba(0,0,0,0.05)",
          zIndex: 1000
        }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  background: "none", border: "none",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                  color: isActive ? brandColor : "#94a3b8",
                  cursor: "pointer"
                }}
              >
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                <span style={{ fontSize: "10px", fontWeight: isActive ? 700 : 500 }}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
