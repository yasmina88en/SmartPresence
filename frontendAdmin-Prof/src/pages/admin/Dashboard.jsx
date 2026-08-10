import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap, BookOpen, Users, UserCheck,
  TrendingUp, Calendar, ChevronRight
} from "lucide-react";
import { useAdminStats } from "../../hooks/useAdminStats";
import PageHeader from "../../components/PageHeader";

export default function AdminDashboard() {
  const { stats, loading } = useAdminStats();
  const navigate = useNavigate();


  const statCards = [
    {
      label: "Filières",
      key: "filieres",
      value: stats.filieres,
      icon: BookOpen,
      color: "#5b4afd",
      bg: "#eef2ff",
      link: "/admin/filieres",
    },
    {
      label: "Niveaux",
      key: "niveaux",
      value: stats.niveaux,
      icon: GraduationCap,
      color: "#0891b2",
      bg: "#e0f2fe",
      link: "/admin/niveaux",
    },
    {
      label: "Professeurs",
      key: "professeurs",
      value: stats.professeurs,
      icon: UserCheck,
      color: "#16a34a",
      bg: "#f0fdf4",
      link: "/admin/professeurs",
    },
    {
      label: "Étudiants",
      key: "etudiants",
      value: stats.etudiants,
      icon: Users,
      color: "#d97706",
      bg: "#fffbeb",
      link: "/admin/etudiants",
    },
  ];

  const quickLinks = [
    {
      label: "Gérer les filières",
      desc: "Créer, modifier ou supprimer des filières",
      icon: BookOpen,
      color: "#5b4afd",
      bg: "#eef2ff",
      link: "/admin/filieres",
    },
    {
      label: "Gérer les niveaux",
      desc: "Organiser les niveaux par filière",
      icon: GraduationCap,
      color: "#0891b2",
      bg: "#e0f2fe",
      link: "/admin/niveaux",
    },
    {
      label: "Emplois du temps",
      desc: "Uploader les fichiers Excel par niveau",
      icon: Calendar,
      color: "#7c3aed",
      bg: "#f5f3ff",
      link: "/admin/emplois",
    },
    {
      label: "Professeurs",
      desc: "Consulter et gérer les comptes profs",
      icon: UserCheck,
      color: "#16a34a",
      bg: "#f0fdf4",
      link: "/admin/professeurs",
    },
    {
      label: "Étudiants",
      desc: "Consulter et gérer les comptes étudiants",
      icon: Users,
      color: "#d97706",
      bg: "#fffbeb",
      link: "/admin/etudiants",
    },
    {
      label: "Présences",
      desc: "Visualiser les rapports de présence",
      icon: TrendingUp,
      color: "#db2777",
      bg: "#fdf2f8",
      link: "/admin/presences",
    },
  ];

  const Skeleton = () => (
    <div style={{
      height: "24px",
      borderRadius: "6px",
      background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.2s infinite",
      width: "48px",
      margin: "0 auto"
    }} />
  );

  return (
    <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto", fontFamily: "var(--font-sans)" }}>

      <PageHeader 
        title="Tableau de bord" 
        subtitle="Bienvenue dans votre espace d'administration SmartPresence" 
        onBack={() => navigate("/")} // Custom back for dashboard or hidden
      />

      {/* Stat Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "1rem",
        marginBottom: "2rem"
      }}>
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.key} to={s.link} style={{ textDecoration: "none" }}>
              <div 
                style={{
                  background: "white",
                  borderRadius: "16px",
                  border: "1px solid #efefef",
                  padding: "1.25rem",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                  transition: "transform 0.2s, box-shadow 0.2s"
                }}
                className="dashboard-card"
              >
                <div style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  background: s.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1rem"
                }}>
                  <Icon size={20} color={s.color} />
                </div>

                <div style={{ fontSize: "28px", fontWeight: 700, color: "#1a1a2e" }}>
                  {loading ? <Skeleton /> : s.value}
                </div>

                <div style={{ fontSize: "13px", color: "#888" }}>
                  {s.label}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Links */}
      <div style={{
        background: "white",
        borderRadius: "16px",
        border: "1px solid #efefef",
        overflow: "hidden",
        boxShadow: "0 4px 12px rgba(0,0,0,0.03)"
      }}>
        <div style={{
          padding: "1rem 1.5rem",
          borderBottom: "1px solid #f5f5f5",
          fontWeight: 600,
          color: "#1a1a2e",
          background: "#fafbff"
        }}>
          Accès rapide
        </div>

        {quickLinks.map((q, i) => {
          const Icon = q.icon;
          return (
            <Link key={q.label} to={q.link} style={{ textDecoration: "none" }}>
              <div 
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "0.875rem 1.5rem",
                  borderBottom: i < quickLinks.length - 1 ? "1px solid #f5f5f5" : "none",
                  transition: "background 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#fafbff"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <div style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "10px",
                  background: q.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Icon size={18} color={q.color} />
                </div>

                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, color: "#1a1a2e", margin: 0, fontSize: "15px" }}>{q.label}</p>
                  <p style={{ fontSize: "12px", color: "#aaa", margin: "2px 0 0" }}>{q.desc}</p>
                </div>

                <ChevronRight size={16} color="#ccc" />
              </div>
            </Link>
          );
        })}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .dashboard-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.08) !important;
        }
      `}</style>

    </div>
  );
}
