import { useNavigate } from "react-router-dom";
import { Shield, GraduationCap, CheckCircle2 } from "lucide-react";

export default function RoleChoice() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #f0f4ff 0%, #ffffff 100%)",
      fontFamily: "var(--font-sans, system-ui)",
      padding: "2rem"
    }}>
      <div style={{
        background: "white",
        borderRadius: "24px",
        padding: "3rem",
        boxShadow: "0 20px 40px rgba(0,0,0,0.04)",
        maxWidth: "600px",
        width: "100%",
        textAlign: "center"
      }}>
        <div style={{
          width: "60px",
          height: "60px",
          borderRadius: "16px",
          background: "linear-gradient(135deg, #5b4afd 0%, #3b2fb6 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 1.5rem",
          boxShadow: "0 8px 16px rgba(91,74,253,0.2)"
        }}>
          <CheckCircle2 color="white" size={32} />
        </div>

        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#1a1a2e", marginBottom: "8px", marginTop: 0 }}>
          SmartPresence
        </h1>
        <p style={{ fontSize: "15px", color: "#64748b", margin: "0 0 2.5rem" }}>
          Veuillez sélectionner votre espace de connexion pour continuer
        </p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1.5rem"
        }}>
          {/* ADMIN CARD */}
          <div 
            onClick={() => navigate("/login/admin")}
            style={{
              background: "#f8fafc",
              border: "2px solid #e2e8f0",
              borderRadius: "16px",
              padding: "2rem 1.5rem",
              cursor: "pointer",
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#5b4afd";
              e.currentTarget.style.background = "#f0f4ff";
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 12px 24px rgba(91,74,253,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#e2e8f0";
              e.currentTarget.style.background = "#f8fafc";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "#e0e7ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1rem"
            }}>
              <Shield size={24} color="#5b4afd" />
            </div>
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#1e293b", margin: "0 0 8px" }}>
              Espace Administration
            </h2>
            <p style={{ fontSize: "13px", color: "#64748b", margin: 0, lineHeight: 1.5 }}>
              Gérez les filières, les classes, et les emplois du temps de l'établissement.
            </p>
          </div>

          {/* PROF CARD */}
          <div 
            onClick={() => navigate("/login/prof")}
            style={{
              background: "#f8fafc",
              border: "2px solid #e2e8f0",
              borderRadius: "16px",
              padding: "2rem 1.5rem",
              cursor: "pointer",
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#0ea5e9";
              e.currentTarget.style.background = "#f0f9ff";
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 12px 24px rgba(14,165,233,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#e2e8f0";
              e.currentTarget.style.background = "#f8fafc";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "#e0f2fe",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1rem"
            }}>
              <GraduationCap size={24} color="#0ea5e9" />
            </div>
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#1e293b", margin: "0 0 8px" }}>
              Espace Professeur
            </h2>
            <p style={{ fontSize: "13px", color: "#64748b", margin: 0, lineHeight: 1.5 }}>
              Consultez votre emploi du temps et faites l'appel dans vos séances.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}