// Login.jsx
import { useState } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/etudiant/login", {
        email: email.trim(),
        password: password.trim(),
      });

console.log("Response:", res.data); // ← ajoute cette ligne
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("role",  res.data.role || "etudiant");
      if (res.data.must_change_password) {
  navigate("/change-password");
} else {
  navigate("/dash");
}
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || "Erreur de connexion";
      setError(msg);
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logoRow}>
          <div style={s.logoIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span style={s.logoText}>Présence</span>
        </div>

        <h1 style={s.title}>Connexion</h1>
        <p style={s.subtitle}>Espace étudiant</p>

        <form onSubmit={handleLogin} style={s.form}>
          <div style={s.fieldWrap}>
            <label style={s.label}>Adresse email</label>
            <input
              type="email" required value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="vous@universite.ma"
              style={s.input}
            />
          </div>

          <div style={s.fieldWrap}>
            <label style={s.label}>Mot de passe</label>
            <input
              type="password" required value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={s.input}
            />
          </div>

          {error && <p style={s.error}>{error}</p>}

          <button type="submit" disabled={loading} style={loading ? { ...s.btn, opacity: 0.6 } : s.btn}>
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh", display: "flex", alignItems: "center",
    justifyContent: "center", background: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)", padding: "1rem",
  },
  card: {
    background: "#ffffff", borderRadius: 20, padding: "2.5rem 2rem",
    width: "100%", maxWidth: 380,
    boxShadow: "0 8px 32px rgba(91,74,253,0.10)",
  },
  logoRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: "2rem" },
  logoIcon: {
    width: 40, height: 40, borderRadius: 12, background: "#eef2ff",
    color: "#5b4afd", display: "flex", alignItems: "center", justifyContent: "center",
  },
  logoText: { fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em", color: "#1a1a2e" },
  title: { fontSize: 24, fontWeight: 700, color: "#1a1a2e", margin: "0 0 4px", letterSpacing: "-0.03em" },
  subtitle: { fontSize: 14, color: "#888", margin: "0 0 2rem" },
  form: { display: "flex", flexDirection: "column", gap: 16 },
  fieldWrap: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 500, color: "#444" },
  input: {
    padding: "10px 14px", border: "1.5px solid #e5e7ef", borderRadius: 10,
    fontSize: 15, outline: "none", transition: "border-color 0.15s",
    background: "#fafbff",
    // [FIX] Couleur de texte explicite : sans cette ligne, le texte tapé
    // pouvait hériter d'une couleur claire (blanche) depuis un style global
    // ou le mode sombre du système, le rendant invisible sur le fond clair
    // de l'input. On force la même teinte sombre que le reste de l'interface.
    color: "#1a1a2e",
  },
  error: {
    fontSize: 13, color: "#dc2626", background: "#fef2f2",
    border: "1px solid #fecaca", borderRadius: 8, padding: "8px 12px", margin: 0,
  },
  btn: {
    padding: "12px", background: "#5b4afd", color: "#fff", border: "none",
    borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer",
    letterSpacing: "-0.01em", marginTop: 4,
    boxShadow: "0 4px 12px rgba(91,74,253,0.2)",
  },
};