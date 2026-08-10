import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Mail, BookOpen, CheckCircle, XCircle, Calendar } from "lucide-react";
import { useEtudiantDetails } from "../../hooks/useEtudiantDetails";

export default function EtudiantProfil() {
  const { etudiantId } = useParams();
  const navigate = useNavigate();
  const { profil, loading, error } = useEtudiantDetails(etudiantId);

  if (loading) return <div style={{ padding: "2rem", textAlign: "center", color: "#888" }}>Chargement...</div>;
  if (error)   return <div style={{ padding: "2rem", color: "#dc2626" }}>Erreur : {error}</div>;
  if (!profil) return null;

  const { etudiant, stats_globales: stats, par_matiere, seances } = profil;

  const cardStyle = {
    background: "white", borderRadius: "16px",
    border: "1px solid #efefef", padding: "1.5rem",
    marginBottom: "1.5rem", boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
  };

  return (
    <div style={{ padding: "1rem", maxWidth: "960px", margin: "0 auto", fontFamily: "system-ui" }}>

      {/* ── Retour ── */}
      <button
        onClick={() => navigate(-1)}
        style={{
          display: "flex", alignItems: "center", gap: "6px",
          background: "none", border: "none", cursor: "pointer",
          color: "#6b7280", fontSize: "14px", marginBottom: "1rem", padding: 0,
        }}
      >
        <ArrowLeft size={16} /> Retour
      </button>

      {/* ── Header étudiant ── */}
      <div style={{ ...cardStyle, display: "flex", alignItems: "center", gap: "1rem" }}>
        <div style={{
          width: "56px", height: "56px", borderRadius: "14px",
          background: "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <User size={26} color="#d97706" />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: "20px", color: "#1a1a2e" }}>
            {etudiant.nom} {etudiant.prenom}
          </h2>
          <div style={{ display: "flex", gap: "12px", marginTop: "4px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "13px", color: "#6b7280", display: "flex", alignItems: "center", gap: "4px" }}>
              <Mail size={13} /> {etudiant.email}
            </span>
            <span style={{
              background: "#eff6ff", color: "#3b82f6",
              fontSize: "12px", fontWeight: 600, borderRadius: "20px",
              padding: "2px 10px", border: "1px solid #bfdbfe",
            }}>
              {etudiant.filiere} — {etudiant.niveau}
            </span>
            {etudiant.groupe && (
              <span style={{
                background: "#f0fdf4", color: "#16a34a",
                fontSize: "12px", fontWeight: 600, borderRadius: "20px",
                padding: "2px 10px", border: "1px solid #bbf7d0",
              }}>
                {etudiant.groupe}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats globales ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Séances totales", value: stats.total,    color: "#6366f1", bg: "#eef2ff" },
          { label: "Présences",       value: stats.presents, color: "#16a34a", bg: "#f0fdf4" },
          { label: "Absences",        value: stats.absents,  color: "#dc2626", bg: "#fef2f2" },
          { label: "Taux présence",   value: `${stats.taux_presence}%`, color: "#d97706", bg: "#fffbeb" },
        ].map((s) => (
          <div key={s.label} style={{
            background: s.bg, borderRadius: "14px",
            padding: "1.25rem", textAlign: "center",
            border: `1px solid ${s.bg}`,
          }}>
            <p style={{ margin: 0, fontSize: "28px", fontWeight: 700, color: s.color }}>{s.value}</p>
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#6b7280" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Par matière ── */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem" }}>
          <BookOpen size={18} color="#6366f1" />
          <span style={{ fontSize: "14px", fontWeight: 600, color: "#1a1a2e" }}>Par matière</span>
        </div>
        {par_matiere.length === 0 ? (
          <p style={{ color: "#aaa", fontSize: "14px" }}>Aucune donnée.</p>
        ) : (
          par_matiere.map((m) => {
            const taux = m.total_seances ? Math.round(m.presents / m.total_seances * 100) : 0;
            const barColor = taux >= 75 ? "#16a34a" : taux >= 50 ? "#d97706" : "#dc2626";
            return (
              <div key={m.matiere} style={{ marginBottom: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#1a1a2e" }}>{m.matiere}</span>
                  <span style={{ fontSize: "13px", color: "#6b7280" }}>
                    {m.presents}/{m.total_seances} présences
                    <span style={{ marginLeft: "8px", fontWeight: 700, color: barColor }}>{taux}%</span>
                  </span>
                </div>
                {/* Barre de progression */}
                <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "99px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${taux}%`, background: barColor, borderRadius: "99px", transition: "width 0.4s" }} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Détail séances ── */}
      <div style={{ background: "white", borderRadius: "16px", border: "1px solid #efefef", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #f5f5f5", background: "#fafbff", display: "flex", alignItems: "center", gap: "8px" }}>
          <Calendar size={18} color="#d97706" />
          <span style={{ fontSize: "14px", fontWeight: 600, color: "#1a1a2e" }}>Historique des séances</span>
        </div>
        {seances.length === 0 ? (
          <p style={{ padding: "1.5rem", color: "#aaa", fontSize: "14px" }}>Aucune séance enregistrée.</p>
        ) : (
          seances.map((s, i) => (
            <div key={i} style={{
              padding: "0.9rem 1.5rem",
              borderBottom: i === seances.length - 1 ? "none" : "1px solid #f5f5f5",
              display: "flex", alignItems: "center", gap: "12px",
            }}>
              {s.statut === "PRESENT"
                ? <CheckCircle size={18} color="#16a34a" />
                : <XCircle    size={18} color="#dc2626" />}
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#1a1a2e" }}>{s.matiere}</p>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6b7280" }}>
                  {new Date(s.date).toLocaleDateString("fr-FR")} — {s.heure_debut.slice(0,5)} à {s.heure_fin.slice(0,5)}
                </p>
              </div>
              <span style={{
                fontSize: "12px", fontWeight: 600, borderRadius: "20px", padding: "3px 12px",
                background: s.statut === "PRESENT" ? "#f0fdf4" : "#fef2f2",
                color:      s.statut === "PRESENT" ? "#16a34a"  : "#dc2626",
                border:     `1px solid ${s.statut === "PRESENT" ? "#bbf7d0" : "#fecaca"}`,
              }}>
                {s.statut}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}