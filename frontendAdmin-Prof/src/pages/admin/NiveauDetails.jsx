import { useParams, useNavigate, Outlet, useLocation } from "react-router-dom";
import { Calendar, Users, GraduationCap } from "lucide-react";
import { useNiveau } from "../../hooks/useNiveau";
import PageHeader from "../../components/PageHeader";

export default function NiveauDetails() {
  const { id, niveauId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { niveauData } = useNiveau(niveauId);

  const isEmploi = location.pathname.includes("emploi");
  const isEtudiants = location.pathname.includes("etudiants");

  return (
    <div style={{ padding: "1rem", maxWidth: "900px", margin: "0 auto", fontFamily: "var(--font-sans, system-ui)" }}>

      <PageHeader
        title={niveauData ? niveauData.nom : `Niveau #${niveauId}`}
        subtitle="Détails du niveau"
        backPath={`/admin/filieres/${id}/niveaux`}
        color="#7c3aed"
        bgColor="#f5f3ff"
      />

      {/* TABS CONTAINER */}
      <div style={{
        display: "flex", gap: "1rem", marginBottom: "2rem",
        background: "white", padding: "10px", borderRadius: "16px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.03)", border: "1px solid #efefef"
      }}>
        <button
          onClick={() => navigate(`/admin/filieres/${id}/niveaux/${niveauId}/emploi`)}
          style={{
            flex: 1, padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            background: isEmploi ? "#f5f3ff" : "transparent",
            color: isEmploi ? "#7c3aed" : "#6b7280",
            border: "none",
            borderRadius: "10px", fontSize: "15px", fontWeight: 600,
            cursor: "pointer", transition: "all 0.2s"
          }}
        >
          <Calendar size={18} /> Emploi du temps
        </button>

        <button
          onClick={() => navigate(`/admin/filieres/${id}/niveaux/${niveauId}/etudiants`)}
          style={{
            flex: 1, padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            background: isEtudiants ? "#fffbeb" : "transparent",
            color: isEtudiants ? "#d97706" : "#6b7280",
            border: "none",
            borderRadius: "10px", fontSize: "15px", fontWeight: 600,
            cursor: "pointer", transition: "all 0.2s"
          }}
        >
          <Users size={18} /> Gérer les Étudiants
        </button>
      </div>

      {/* CONTENU IMBRIQUE (OUTLET) */}
      <div style={{ position: "relative" }}>
        {!isEmploi && !isEtudiants && (
          <div style={{
            textAlign: "center", padding: "4rem 2rem", color: "#ccc",
            background: "white", borderRadius: "16px", border: "1px dashed #e5e7eb"
          }}>
            <GraduationCap size={48} style={{ margin: "0 auto 1rem", color: "#e5e7ef" }} />
            <p style={{ fontSize: "16px", fontWeight: 500, color: "#888", margin: 0 }}>Sélectionnez un onglet ci-dessus pour gérer le niveau.</p>
          </div>
        )}
        <Outlet />
      </div>

    </div>
  );
}
