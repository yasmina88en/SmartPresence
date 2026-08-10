import {
  Clock, MapPin, Play, CheckCircle,
  ArrowRight, Calendar, BarChart2,
  Terminal, Activity, Users
} from "lucide-react";
import { Link } from "react-router-dom";

export default function SessionCard({ session, isHistory, onStart, onEnter, brandColor }) {
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const sessionDate = session.date || null;

  // Séance depuis sessions/all (emploi du temps) — pas de date ni statut
  const isScheduleOnly = !sessionDate && !session.statut;

  const isPlanned = !session.statut || session.statut === "PLANIFIE" || session.statut === "PLANIFIÉ" || session.statut === "PLANIFIEE";

  const isDatePassed = sessionDate ? sessionDate < today : false;
  const isDateFuture = sessionDate ? sessionDate > today : false;
  const isTimePassed = currentTime > session.heure_fin;
  const isTimeFuture = currentTime < session.heure_debut;

  const isPassed = sessionDate
    ? isDatePassed || (sessionDate === today && isTimePassed)
    : isTimePassed;

  const isFuture = sessionDate
    ? isDateFuture || (sessionDate === today && isTimeFuture)
    : isTimeFuture;

  const getStatusColor = () => {
    if (session.statut === "ACTIVE") return { bg: "#f0fdf4", text: "#16a34a", border: "#dcfce7" };
    if (session.statut === "TERMINEE") return { bg: "#f9fafb", text: "#6b7280", border: "#f3f4f6" };
    if (isPassed) return { bg: "#fef2f2", text: "#dc2626", border: "#fee2e2" };
    if (isFuture) return { bg: "#fffbeb", text: "#b45309", border: "#fef3c7" };
    return { bg: "#eef2ff", text: brandColor, border: "#e0e7ff" };
  };

  const status = getStatusColor();

  const getStatusLabel = () => {
    if (session.statut === "ACTIVE") return "En cours";
    if (session.statut === "TERMINEE") return "Terminée";
    if (isPassed) return "Non lancée";
    if (isFuture) return "À venir";
    return "Planifiée";
  };
  console.log({
    matiere: session.matiere,
    sessionDate,
    today,
    isDateFuture,
    isDatePassed,
    isPassed,
    isFuture,
    statut: session.statut
  });

  return (
    <div style={{
      background: "white", borderRadius: "20px", padding: "1.25rem",
      display: "flex",
      flexDirection: window.innerWidth < 600 ? "column" : "row",
      alignItems: window.innerWidth < 600 ? "flex-start" : "center",
      gap: window.innerWidth < 600 ? "1rem" : "1.5rem",
      boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
      border: "1px solid #f1f1f1",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      cursor: "default",
      position: "relative",
      overflow: "hidden"
    }}
      onMouseOver={e => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 12px 30px rgba(91,74,253,0.08)";
        e.currentTarget.style.borderColor = "#e0e7ff";
      }}
      onMouseOut={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.02)";
        e.currentTarget.style.borderColor = "#f1f1f1";
      }}
    >
      {/* Status Bar Indicator */}
      <div style={{
        position: "absolute", left: 0, top: 0,
        bottom: window.innerWidth < 600 ? "auto" : 0,
        right: window.innerWidth < 600 ? 0 : "auto",
        width: window.innerWidth < 600 ? "100%" : "4px",
        height: window.innerWidth < 600 ? "4px" : "100%",
        background: session.statut === "ACTIVE" ? "#22c55e" : isPassed ? "#ef4444" : isFuture ? "#f59e0b" : brandColor,
        opacity: 0.8
      }} />

      <div style={{
        flex: 1, display: "flex",
        flexDirection: window.innerWidth < 600 ? "column" : "row",
        alignItems: window.innerWidth < 600 ? "flex-start" : "center",
        gap: window.innerWidth < 600 ? "1rem" : "1.5rem",
        width: "100%"
      }}>
        {/* Left: Time & Status */}
        <div style={{ display: "flex", flexDirection: "column", minWidth: "110px" }}>
          <span style={{
            fontSize: "11px", fontWeight: 800, textTransform: "uppercase",
            color: status.text, marginBottom: "4px",
            display: "flex", alignItems: "center", gap: "4px"
          }}>
            <Activity size={12} />
            {isHistory
              ? (session.date || session.jour || "-")
              : (isScheduleOnly ? session.jour : getStatusLabel())
            }
          </span>
          <span style={{ fontSize: "16px", fontWeight: 800, color: "#1a1a2e" }}>
            {session.heure_debut}
          </span>
          <span style={{ fontSize: "12px", color: "#9ca3af", fontWeight: 500 }}>
            à {session.heure_fin}
          </span>
        </div>

        {/* Middle: Subject & Niveau */}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#1a1a2e", margin: 0 }}>
              {session.matiere}
            </h3>
            <Link
              to={`/prof/stats/${session.matiere_id}/${session.niveau_id}`}
              style={{
                display: "inline-flex", alignItems: "center", gap: "4px",
                padding: "3px 10px", borderRadius: "8px",
                background: "#f5f3ff", color: brandColor,
                textDecoration: "none", fontSize: "10px", fontWeight: 800,
                border: "1px solid #e0e7ff",
                transition: "all 0.2s"
              }}
              onMouseOver={e => { e.currentTarget.style.background = brandColor; e.currentTarget.style.color = "white"; }}
              onMouseOut={e => { e.currentTarget.style.background = "#f5f3ff"; e.currentTarget.style.color = brandColor; }}
            >
              <BarChart2 size={12} /> RECAP
            </Link>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "6px",
              background: "#f9fafb", padding: "4px 10px", borderRadius: "8px",
              fontSize: "12px", color: "#4b5563", fontWeight: 600
            }}>
              <Users size={14} color="#9ca3af" /> {session.niveau}
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: "6px",
              fontSize: "12px", color: "#6b7280", fontWeight: 500
            }}>
              <MapPin size={14} color="#9ca3af" /> {session.salle || "-"}
            </div>
            {session.nature && (
              <div style={{
                display: "flex", alignItems: "center", gap: "4px",
                fontSize: "11px", color: brandColor, fontWeight: 700,
                textTransform: "uppercase", background: "#f5f3ff",
                padding: "2px 8px", borderRadius: "6px"
              }}>
                {session.nature}
              </div>
            )}
          </div>
        </div>

        {/* Right: Action Button */}
        <div style={{ width: window.innerWidth < 600 ? "100%" : "auto" }}>
          {session.statut === "ACTIVE" ? (
            isDatePassed ? (
              <button
                onClick={() => onEnter(session.seance_id)}
                style={{
                  background: "#fff1f2", color: "#e11d48",
                  border: "1.5px solid #fda4af", padding: "10px 20px",
                  borderRadius: "14px", fontWeight: 800, fontSize: "12px",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: "8px"
                }}
              >
                Non clôturée <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={() => onEnter(session.seance_id)}
                style={{
                  background: "white", color: "#22c55e",
                  border: "1.5px solid #22c55e", padding: "10px 24px",
                  borderRadius: "14px", fontWeight: 800, fontSize: "13px",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: "8px",
                  transition: "all 0.2s"
                }}
                onMouseOver={e => { e.currentTarget.style.background = "#22c55e"; e.currentTarget.style.color = "white"; }}
                onMouseOut={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.color = "#22c55e"; }}
              >
                En cours <ArrowRight size={16} />
              </button>
            )
          ) : session.statut === "TERMINEE" ? (
            <div style={{
              background: "#f9fafb", color: "#6b7280",
              padding: "8px 16px", borderRadius: "12px",
              fontSize: "11px", fontWeight: 800, textTransform: "uppercase",
              border: "1.5px solid #f3f4f6"
            }}>
              Terminée
            </div>
          ) : isPassed ? (
            <div style={{
              background: "#fff1f2", color: "#e11d48",
              padding: "10px 20px", borderRadius: "14px",
              fontSize: "12px", fontWeight: 800, textTransform: "uppercase",
              border: "1.5px solid #fda4af", display: "flex", alignItems: "center", gap: "6px"
            }}>
              <Clock size={16} /> Non lancée
            </div>
          ) : isFuture ? (
            <button
              onClick={() => alert(`Cette séance commence à ${session.heure_debut}.`)}
              style={{
                background: "#fffbeb", color: "#b45309",
                padding: "10px 20px", borderRadius: "14px",
                fontSize: "11px", fontWeight: 800, textTransform: "uppercase",
                border: "1.5px solid #fef3c7", display: "flex", alignItems: "center", gap: "6px",
                cursor: "help"
              }}
            >
              <Clock size={16} /> À venir
            </button>
          ) : (
            <button
              onClick={() => onStart(session.id)}
              style={{
                background: brandColor, color: "white",
                border: "none", padding: "12px 28px",
                borderRadius: "14px", fontWeight: 800, fontSize: "13px",
                cursor: "pointer", display: "flex", alignItems: "center", gap: "10px",
                boxShadow: `0 8px 20px ${brandColor}44`,
                transition: "all 0.2s"
              }}
              onMouseOver={e => { e.currentTarget.style.transform = "scale(1.02)"; }}
              onMouseOut={e => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              <Play size={18} fill="white" /> Lancer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
