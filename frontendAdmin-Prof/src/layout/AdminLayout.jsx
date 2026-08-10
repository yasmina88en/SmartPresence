import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, BookOpen, GraduationCap, Users,
  UserCheck, Calendar, LogOut, ShieldCheck, Menu, X
} from "lucide-react";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) setIsSidebarOpen(false);
  }, [location.pathname, isMobile]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login/admin");
  };

  const menuItems = [
    { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Filières", path: "/admin/filieres", icon: BookOpen },
    { label: "Niveaux", path: "/admin/niveaux", icon: GraduationCap },
    { label: "Emplois", path: "/admin/emplois", icon: Calendar },
    { label: "Professeurs", path: "/admin/professeurs", icon: UserCheck },
    { label: "Étudiants", path: "/admin/etudiants", icon: Users },
  ];

  const brandColor = "#5b4afd";
  const bgGradient = "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)";

  const SidebarContent = () => (
    <>
      <div style={{ padding: "2rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "40px", height: "40px", borderRadius: "10px",
            background: brandColor, display: "flex",
            alignItems: "center", justifyContent: "center"
          }}>
            <ShieldCheck size={24} color="white" />
          </div>
          <span style={{ fontSize: "18px", fontWeight: 700, color: "#1a1a2e" }}>
            Admin Panel
          </span>
        </div>
        {isMobile && (
          <button onClick={() => setIsSidebarOpen(false)} style={{ background: "none", border: "none", color: "#666" }}>
            <X size={24} />
          </button>
        )}
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
                    fontSize: "14px", fontWeight: 500,
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
    </>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: bgGradient, fontFamily: "var(--font-sans, system-ui)" }}>
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
          <SidebarContent />
        </aside>
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobile && isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000,
            backdropFilter: "blur(4px)"
          }}
        />
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <aside style={{
          position: "fixed", left: isSidebarOpen ? 0 : "-280px", top: 0, bottom: 0,
          width: "280px", background: "white", zIndex: 1001,
          transition: "all 0.3s ease",
          display: "flex", flexDirection: "column",
          boxShadow: "10px 0 30px rgba(0,0,0,0.1)"
        }}>
          <SidebarContent />
        </aside>
      )}

      {/* Main Content Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Mobile Header */}
        {isMobile && (
          <header style={{
            background: "white", padding: "12px 16px",
            display: "flex", alignItems: "center", gap: "12px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)", zIndex: 100
          }}>
            <button
              onClick={() => setIsSidebarOpen(true)}
              style={{ background: "none", border: "none", color: "#666", display: "flex", padding: "4px" }}
            >
              <Menu size={24} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldCheck size={20} color={brandColor} />
              <span style={{ fontSize: "16px", fontWeight: 700 }}>Admin Panel</span>
            </div>
          </header>
        )}

        <main style={{
          flex: 1,
          overflowY: "auto",
          padding: isMobile ? "1rem" : "2rem",
          width: "100%",
          boxSizing: "border-box"
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}