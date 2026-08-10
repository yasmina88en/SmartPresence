import { useState } from "react";
import api from "../utils/api";  // ← ajoute cette ligne
import { useNavigate } from "react-router-dom";
import { Lock, ShieldCheck, ArrowLeft, Key, AlertCircle, CheckCircle } from "lucide-react";

export default function ChangePassword() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();

  const brandColor = "#5b4afd";

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Le nouveau mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/etudiant/change-password", {
        old_password: oldPassword,
        new_password: newPassword,
      });

      setSuccess(true);
      setTimeout(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        navigate("/");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur lors du changement de mot de passe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)",
      display: "flex",
      flexDirection: "column",
      fontFamily: "var(--font-sans, system-ui)"
    }}>
      {/* Header / Back */}
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
          <ArrowLeft size={16} /> Retour à l'accueil
        </button>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
        <div style={{
          background: "white", borderRadius: "24px",
          padding: "2.5rem", width: "100%", maxWidth: "440px",
          boxShadow: "0 12px 40px rgba(91,74,253,0.08)",
          position: "relative", overflow: "hidden"
        }}>
          {success ? (
            <div style={{ textAlign: "center", padding: "1rem 0" }}>
              <div style={{
                width: "80px", height: "80px", borderRadius: "50%",
                background: "#f0fdf4", color: "#16a34a",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 1.5rem"
              }}>
                <CheckCircle size={40} />
              </div>
              <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#1a1a2e", marginBottom: "0.5rem" }}>
                Mot de passe mis à jour !
              </h2>
              <p style={{ color: "#666", fontSize: "14px" }}>
                Redirection vers la page de connexion...
              </p>
            </div>
          ) : (
            <>
              {/* Card Header */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "2rem" }}>
                <div style={{
                  width: "64px", height: "64px", borderRadius: "16px",
                  background: "#eef2ff", display: "flex",
                  alignItems: "center", justifyContent: "center", marginBottom: "1rem"
                }}>
                  <Key size={32} color={brandColor} />
                </div>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: "4px",
                  background: "#fff7ed", color: "#ea580c",
                  fontSize: "12px", fontWeight: 500,
                  borderRadius: "20px", padding: "4px 12px", marginBottom: "0.75rem"
                }}>
                  <ShieldCheck size={12} />
                  Sécurité requise
                </div>
                <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#1a1a2e", margin: 0, textAlign: "center" }}>
                  Changer votre mot de passe
                </h2>
                <p style={{ fontSize: "13px", color: "#888", marginTop: "6px", textAlign: "center", lineHeight: 1.5 }}>
                  C'est votre première connexion. Veuillez définir un nouveau mot de passe pour sécuriser votre compte.
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div style={{
                  background: "#fef2f2", border: "1px solid #fecaca",
                  borderRadius: "12px", padding: "12px 16px",
                  display: "flex", alignItems: "center", gap: "10px",
                  fontSize: "13px", color: "#dc2626", marginBottom: "1.5rem"
                }}>
                  <AlertCircle size={16} flexShrink={0} />
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleChangePassword}>
                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#4b5563", marginBottom: "6px" }}>
                    Ancien mot de passe
                  </label>
                  <div style={{ position: "relative" }}>
                    <Lock size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                    <input
                      type="password"
                      placeholder="Ancien mot de passe"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ height: "1px", background: "#f3f4f6", margin: "1.5rem 0" }} />

                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#4b5563", marginBottom: "6px" }}>
                    Nouveau mot de passe
                  </label>
                  <div style={{ position: "relative" }}>
                    <Lock size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                    <input
                      type="password"
                      placeholder="Minimum 6 caractères"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: "2rem" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#4b5563", marginBottom: "6px" }}>
                    Confirmer le nouveau mot de passe
                  </label>
                  <div style={{ position: "relative" }}>
                    <Lock size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                    <input
                      type="password"
                      placeholder="Confirmez votre saisie"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%", padding: "14px",
                    background: loading ? "#a5b4fc" : brandColor,
                    color: "white", border: "none",
                    borderRadius: "14px", fontSize: "15px",
                    fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center",
                    justifyContent: "center", gap: "10px",
                    transition: "all 0.2s",
                    boxShadow: "0 4px 12px rgba(91,74,253,0.2)"
                  }}
                >
                  {loading ? "Mise à jour..." : "Mettre à jour mon mot de passe"}
                </button>
              </form>
            </>
          )}

          <p style={{ textAlign: "center", fontSize: "12px", color: "#9ca3af", marginTop: "2rem" }}>
            SmartPresence Security · Vos données sont chiffrées
          </p>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px 14px 12px 42px",
  border: "1.5px solid #e5e7eb",
  borderRadius: "12px",
  fontSize: "14px",
  color: "#1f2937",
  background: "#f9fafb",
  outline: "none",
  transition: "all 0.2s",
  boxSizing: "border-box"
};

