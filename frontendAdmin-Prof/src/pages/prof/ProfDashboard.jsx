import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Calendar, History, Loader2, Plus, Filter, Search, Inbox } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import SessionCard from "../../components/prof/SessionCard";
import ManualSessionModal from "../../components/prof/ManualSessionModal";
import { useProfSessions } from "../../hooks/useProfSessions";

export default function ProfDashboard() {
  const {
    sessions, loading, error, metadata,
    fetchSessions, fetchMetadata, startSession, createManualSession
  } = useProfSessions();
  const navigate = useNavigate();
  const location = useLocation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterMatiere, setFilterMatiere] = useState("");
  const [filterMonth, setFilterMonth] = useState("");

  const brandColor = "#5b4afd"; // Use Admin brand color
  const isHistoryMode = location.pathname.includes("sessions");



  useEffect(() => {
    fetchSessions(isHistoryMode ? "all" : false);
    fetchMetadata();
  }, [location.pathname]);
  const handleStartSeance = async (creneauGroupeId) => {
    const res = await startSession(creneauGroupeId);
    if (res.success) {
      navigate(`/prof/seance/${res.data.id}`);
    } else {
      alert(res.error);
      fetchSessions(isHistoryMode);
    }
  };

  const handleManualSession = async (data) => {
    const res = await createManualSession(data);
    if (res.success) {
      setIsModalOpen(false);
      fetchSessions(false);
    } else {
      alert(res.error);
    }
  };

  const handleEnterSeance = (seanceId) => {
    navigate(`/prof/seance/${seanceId}`);
  };

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      if (!isHistoryMode) return true;
      if (filterMatiere && s.matiere !== filterMatiere) return false;
      return true;
    });
  }, [sessions, isHistoryMode, filterMatiere]);

  // Extract unique matieres for filter
  const uniqueMatieres = useMemo(() => {
    return [...new Set(sessions.map(s => s.matiere))].sort();
  }, [sessions]);

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: window.innerWidth < 600 ? "0 10px" : "0" }}>
      <div style={{ position: "relative", marginBottom: "2.5rem" }}>
        <PageHeader
          premium
          title={isHistoryMode ? "Mes Séances" : "Tableau de Bord"}
          subtitle={isHistoryMode ? "Historique complet de vos cours dispensés" : "Gérez vos séances prévues pour aujourd'hui"}
          icon={isHistoryMode ? History : Calendar}
          color={brandColor}
          bgColor="#eef2ff"
        />

        {!isHistoryMode && (
          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              position: window.innerWidth < 600 ? "static" : "absolute",
              right: "2rem", bottom: "2rem",
              margin: window.innerWidth < 600 ? "10px auto 0" : "0",
              display: "flex", alignItems: "center", gap: "8px",
              padding: "12px 24px", background: window.innerWidth < 600 ? brandColor : "rgba(255,255,255,0.2)",
              border: "1px solid rgba(255,255,255,0.4)", color: "white",
              borderRadius: "14px", fontWeight: 800, cursor: "pointer",
              transition: "all 0.2s", fontSize: "14px", backdropFilter: "blur(12px)",
              zIndex: 10,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              width: window.innerWidth < 600 ? "calc(100% - 20px)" : "auto",
              justifyContent: "center"
            }}
            onMouseOver={e => {
              e.currentTarget.style.background = "rgba(255,255,255,0.3)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = "rgba(255,255,255,0.2)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <Plus size={18} /> Hors Planning
          </button>
        )}
      </div>

      {isHistoryMode && sessions.length > 0 && (
        <div style={{
          display: "flex", gap: "1rem", marginBottom: "1.5rem", padding: "1rem",
          background: "white", borderRadius: "16px", border: "1px solid #efefef",
          alignItems: "center"
        }}>
          <Filter size={18} color="#9ca3af" />
          <div style={{ flex: 1, display: "flex", gap: "10px" }}>
            <select
              value={filterMatiere}
              onChange={e => setFilterMatiere(e.target.value)}
              style={{
                flex: 1, padding: "8px 12px", borderRadius: "10px",
                border: "1px solid #e5e7eb", fontSize: "13px", fontWeight: 600,
                outline: "none", cursor: "pointer"
              }}
            >
              <option value="">Toutes les matières</option>
              {uniqueMatieres.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div style={{ fontSize: "12px", color: "#9ca3af", fontWeight: 500 }}>
            {filteredSessions.length} résultat(s)
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "6rem" }}>
          <Loader2 className="animate-spin" size={48} color={brandColor} />
        </div>
      ) : error ? (
        <div style={{ padding: "3rem", textAlign: "center", background: "#fef2f2", borderRadius: "24px", border: "1px solid #fee2e2" }}>
          <p style={{ color: "#dc2626", fontWeight: 700 }}>{error}</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div style={{ textAlign: "center", padding: "6rem", background: "white", borderRadius: "30px", border: "1px dashed #e5e7eb" }}>
          <Inbox size={64} color="#e5e7eb" style={{ margin: "0 auto 1.5rem" }} />
          <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#1a1a2e", marginBottom: "0.5rem" }}>
            Aucune séance trouvée
          </h3>
          <p style={{ color: "#9ca3af", maxWidth: "300px", margin: "0 auto", fontSize: "14px" }}>
            {isHistoryMode ? "Essayez de modifier vos filtres ou revenez plus tard." : "Vous n'avez pas de cours prévus pour le moment."}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {[...filteredSessions].sort((a, b) => {
            if (!isHistoryMode) {
              const getPriority = (session) => {
                if (session.statut === "ACTIVE") return 0;
                if (session.statut === "TERMINEE") return 3;
                const now = new Date();
                const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                if ((session.heure_fin || "") < currentTime) return 2;
                if ((session.heure_debut || "") > currentTime) return 1;
                return 1;
              };
              if (getPriority(a) !== getPriority(b)) return getPriority(a) - getPriority(b);
            }
            if (isHistoryMode) {
              const dateA = a.date || "";
              const dateB = b.date || "";
              const dateCompare = dateB.localeCompare(dateA);
              if (dateCompare !== 0) return dateCompare;
            }
            const heureA = a.heure_debut || "";
            const heureB = b.heure_debut || "";
            return heureA.localeCompare(heureB);
          }).map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              isHistory={isHistoryMode}
              onStart={handleStartSeance}
              onEnter={handleEnterSeance}
              brandColor={brandColor}
            />
          ))}
        </div>
      )}

      <ManualSessionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        metadata={metadata}
        onSubmit={handleManualSession}
        brandColor={brandColor}
      />

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
