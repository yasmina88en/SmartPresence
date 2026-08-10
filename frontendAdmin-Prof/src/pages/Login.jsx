import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../utils/api";
import { UserCog, Lock, Mail, ArrowLeft, Shield } from "lucide-react";

export default function Login() {
  const { role } = useParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/login", { email, password });
      const { access_token, role: userRole, must_change_password } = res.data;

      if (role !== userRole) {
        setError(`Compte ${userRole} détecté. Accès ${role} non autorisé.`);
        setLoading(false);
        return;
      }

      localStorage.setItem("token", access_token);
      localStorage.setItem("role", userRole);

      if (must_change_password) {
        navigate("/change-password");
      } else {
        navigate(userRole === "admin" ? "/admin" : "/prof");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Email ou mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)",
      display: "flex",
      flexDirection: "column"
    }}>
      <div style={{ padding: "1.5rem 2rem" }}>
        <button
          onClick={() => navigate("/")}
          style={{
            background: "none", border: "none",
            color: "#5b4afd", display: "flex",
            alignItems: "center", gap: "6px",
            fontWeight: 500, cursor: "pointer", fontSize: "14px"
          }}
        >
          <ArrowLeft size={16} /> Retour
        </button>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
        <div style={{
          background: "white", borderRadius: "20px",
          padding: window.innerWidth < 600 ? "1.5rem" : "2.5rem", 
          width: "100%", maxWidth: "420px",
          margin: window.innerWidth < 600 ? "0 1rem" : "0",
          boxShadow: "0 8px 32px rgba(91,74,253,0.10)"
        }}>
          {/* Header */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "2rem" }}>
            <div style={{
              width: "72px", height: "72px", borderRadius: "50%",
              background: "#eef2ff", display: "flex",
              alignItems: "center", justifyContent: "center", marginBottom: "1rem"
            }}>
              <UserCog size={36} color="#5b4afd" />
            </div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "4px",
              background: "#eef2ff", color: "#5b4afd",
              fontSize: "12px", fontWeight: 500,
              borderRadius: "20px", padding: "4px 12px", marginBottom: "0.75rem"
            }}>
              <Shield size={12} />
              {role === "admin" ? "Espace Administrateur" : "Espace Professeur"}
            </div>
            <h2 style={{ fontSize: "22px", fontWeight: 600, color: "#1a1a2e", margin: 0 }}>
              Connexion {role === "admin" ? "Admin" : "Professeur"}
            </h2>
            <p style={{ fontSize: "13px", color: "#888", marginTop: "4px" }}>
              {role === "admin" ? "Gérez votre établissement" : "Gérez vos présences"}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: "10px", padding: "10px 14px",
              fontSize: "13px", color: "#dc2626", marginBottom: "1.25rem"
            }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#444", marginBottom: "6px" }}>
                Email
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#aaa" }} />
                <input
                  type="email"
                  placeholder={role === "admin" ? "admin@ecole.ma" : "prof@ecole.ma"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: "100%", padding: "11px 14px 11px 40px",
                    border: "1.5px solid #e5e7ef", borderRadius: "10px",
                    fontSize: "14px", color: "#1a1a2e", background: "#fafbff",
                    outline: "none", boxSizing: "border-box"
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#444", marginBottom: "6px" }}>
                Mot de passe
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#aaa" }} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: "100%", padding: "11px 14px 11px 40px",
                    border: "1.5px solid #e5e7ef", borderRadius: "10px",
                    fontSize: "14px", color: "#1a1a2e", background: "#fafbff",
                    outline: "none", boxSizing: "border-box"
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "13px",
                background: loading ? "#a5b4fc" : "#5b4afd",
                color: "white", border: "none",
                borderRadius: "12px", fontSize: "15px",
                fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center",
                justifyContent: "center", gap: "8px"
              }}
            >
              <Lock size={18} />
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          <div style={{ height: "1px", background: "#f0f0f5", margin: "1.5rem 0" }} />
          <p style={{ textAlign: "center", fontSize: "12px", color: "#bbb" }}>
            SmartPresence · Système de gestion par QR Code
          </p>
        </div>
      </div>
    </div>
  );
}