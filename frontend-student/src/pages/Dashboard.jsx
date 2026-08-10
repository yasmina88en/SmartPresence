// Dashboard.jsx
import { useEffect, useState, useMemo } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser]         = useState(null);
  const [seances, setSeances]   = useState([]);
  const [filter, setFilter]     = useState("all");
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState("home"); // "home" | "profile"

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/", { replace: true }); return; }

    Promise.all([
      api.get("/api/etudiant/me"),
      api.get("/api/etudiant/seances"),
    ])
      .then(([userRes, seancesRes]) => {
        setUser(userRes.data);
        setSeances(seancesRes.data);
        console.log("Séances:", seancesRes.data); // ← ajouter
      })
      .catch((err) => {
        console.error("Dashboard error:", err);
        localStorage.removeItem("token");
        navigate("/", { replace: true });
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const stats = useMemo(() => {
    const present = seances.filter(s => s.presence === "PRESENT").length;
    const absent  = seances.filter(
      s => s.statut === "TERMINEE" && s.presence !== "PRESENT"
    ).length;
    const total   = present + absent;
    const taux    = total ? Math.round((present / total) * 100) : 0;
    return { present, absent, taux };
  }, [seances]);

  const filtered = useMemo(() => {
    if (filter === "all")     return seances;
    if (filter === "encours") return seances.filter(s => s.statut === "ACTIVE");
    if (filter === "present") return seances.filter(s => s.presence === "PRESENT");
    if (filter === "absent")  return seances.filter(
      s => s.statut === "TERMINEE" && s.presence !== "PRESENT"
    );
    return seances;
  }, [seances, filter]);

  // Group by date label
  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(s => {
      const label = formatDate(s.date);
      if (!map[label]) map[label] = [];
      map[label].push(s);
    });
    return map;
  }, [filtered]);

  const logout = () => { localStorage.clear(); navigate("/", { replace: true }); };

  if (loading) return <div style={s.center}>Chargement…</div>;
  if (!user)   return null;

  const initials = `${user.prenom[0]}${user.nom[0]}`.toUpperCase();

  return (
    <div style={s.page}>
      {/* ── NAV ── */}
      <nav style={s.nav}>
        <div style={s.navLogo}>
          <div style={s.logoIcon}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5b4afd" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span style={s.logoTxt}>Présence</span>
        </div>
        <div style={s.navBtns}>
          <NavBtn active={page === "home"} onClick={() => setPage("home")} icon={<HomeIcon />} label="Accueil" />
          <NavBtn active={false} onClick={() => navigate("/profile")} icon={<UserIcon />} label="Profil" />
        </div>
      </nav>

      {/* ── HOME ── */}
      {page === "home" && (
        <main style={s.main}>
          <div style={s.headerRow}>
            <div>
              <h1 style={s.userName}>{user.prenom} {user.nom}</h1>
              <p style={s.userMeta}>
                {user.filiere} — {user.groupe} &bull; {user.semestre} {user.annee}
              </p>
            </div>
            <div style={s.avatar}>{initials}</div>
          </div>

          {/* Stats */}
          <div style={s.statsGrid}>
            <StatCard value={stats.present} label="Présences" color="#3B6D11" />
            <StatCard value={stats.absent}  label="Absences"  color="#A32D2D" />
            <StatCard value={`${stats.taux}%`} label="Taux" />
          </div>

          {/* Filters */}
          <div style={s.filters}>
            {[
              { key: "all",     label: "Tout"     },
              { key: "encours", label: "En cours" },
              { key: "present", label: "Présent"  },
              { key: "absent",  label: "Absent"   },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={filter === f.key ? { ...s.filterBtn, ...s.filterActive } : s.filterBtn}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Session list */}
          {Object.keys(grouped).length === 0 ? (
            <p style={{ textAlign: "center", color: "#888", padding: "40px 0", fontSize: 14 }}>
              Aucune séance
            </p>
          ) : (
            Object.entries(grouped).map(([dateLabel, list]) => (
              <div key={dateLabel}>
                <p style={s.dayLabel}>{dateLabel}</p>
                {list.map(seance => (
                  <SeanceCard
                    key={seance.id}
                    seance={seance}
                    onScan={() => navigate("/scanner", { state: { seanceId: seance.id } })}
                  />
                ))}
              </div>
            ))
          )}
        </main>
      )}

      {/* ── PROFILE ── */}
      {page === "profile" && (
        <main style={s.main}>
          <div style={s.headerRow}>
            <div>
              <h1 style={s.userName}>Mon profil</h1>
              <p style={s.userMeta}>Gérer vos informations</p>
            </div>
            <div style={s.avatar}>{initials}</div>
          </div>

          {[
            { label: "Nom complet", value: `${user.prenom} ${user.nom}` },
            { label: "Email",       value: user.email                   },
            { label: "Niveau · Groupe", value: `${user.filiere} — ${user.groupe}` },
          ].map(row => (
            <div key={row.label} style={s.profileRow}>
              <p style={s.profileLabel}>{row.label}</p>
              <p style={s.profileVal}>{row.value}</p>
            </div>
          ))}

          <button style={s.pwdBtn} onClick={() => navigate("/change-password")}>
            Changer le mot de passe
          </button>

          <button style={{ ...s.pwdBtn, background: "#185FA5" }} onClick={() => navigate("/enroll-face")}>
            Configurer Face ID
          </button>

          <button style={s.logoutBtn} onClick={logout}>
            Déconnexion
          </button>
        </main>
      )}
    </div>
  );
}

/* ── Sub-components ── */

function NavBtn({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} style={active ? { ...s.navBtn, ...s.navBtnActive } : s.navBtn}>
      {icon} {label}
    </button>
  );
}

function StatCard({ value, label, color }) {
  return (
    <div style={s.statCard}>
      <div style={{ ...s.statVal, ...(color ? { color } : {}) }}>{value}</div>
      <div style={s.statLbl}>{label}</div>
    </div>
  );
}

function SeanceCard({ seance, onScan }) {
  const isActive = seance.statut === "ACTIVE";
  return (
    <div style={isActive ? { ...s.card, ...s.cardActive } : s.card}>
      <div style={s.cardTop}>
        <span style={s.cardTitle}>{seance.matiere}</span>
        <StatusLabel statut={seance.statut} />
      </div>
      <div style={s.cardInfo}>
        <InfoChip icon={<UserSm />} text={seance.prof} />
        <InfoChip icon={<PinSm />}  text={seance.salle} />
        <NatureBadge nature={seance.nature} />
      </div>
      <div style={s.cardBottom}>
        <span style={s.timeStr}>
          <ClockSm /> {seance.heure_debut} – {seance.heure_fin}
        </span>
        <ActionChip seance={seance} onScan={onScan} />
      </div>
    </div>
  );
}

function StatusLabel({ statut }) {
  const map = {
    ACTIVE:   { label: "En cours", bg: "#E6F1FB", color: "#185FA5" },
    PLANIFIE: { label: "Planifié", bg: "#F1EFE8", color: "#5F5E5A" },
    TERMINEE: { label: "Terminée", bg: "#F1EFE8", color: "#5F5E5A" },
  };
  const { label, bg, color } = map[statut] || map.PLANIFIE;
  return (
    <span style={{ ...s.chip, background: bg, color, fontSize: 11, padding: "2px 8px" }}>
      {statut === "ACTIVE" && <span style={s.dot} />}
      {label}
    </span>
  );
}

function ActionChip({ seance, onScan }) {
  // Scanner QR — only for ACTIVE sessions with no presence yet
  if (seance.statut === "ACTIVE" && seance.presence !== "PRESENT") {
    return (
      <button style={s.scanBtn} onClick={onScan}>
        Scanner QR
      </button>
    );
  }
  if (seance.presence === "PRESENT") {
    return <span style={{ ...s.chip, background: "#EAF3DE", color: "#3B6D11" }}>✓ Présence marquée</span>;
  }
  if (seance.statut === "TERMINEE" && seance.presence !== "PRESENT") {
    return <span style={{ ...s.chip, background: "#FCEBEB", color: "#A32D2D" }}>Absent</span>;
  }
  return <span style={{ ...s.chip, background: "#F1EFE8", color: "#5F5E5A" }}>Pas encore</span>;
}

function NatureBadge({ nature }) {
  const map = {
    "Cours":     { bg: "#E6F1FB", color: "#185FA5" },
    "TD":        { bg: "#EAF3DE", color: "#3B6D11" },
    "TP":        { bg: "#FAEEDA", color: "#854F0B" },
    "Cours/TD":  { bg: "#EEEDFE", color: "#534AB7" },
    "Cours/TP":  { bg: "#EEEDFE", color: "#534AB7" },
    "Cours/TD/TP":{ bg: "#EEEDFE", color: "#534AB7" },
  };
  const { bg, color } = map[nature] || map["Cours"];
  return <span style={{ ...s.chip, background: bg, color }}>{nature}</span>;
}

function InfoChip({ icon, text }) {
  return (
    <span style={s.infoChip}>
      {icon} {text}
    </span>
  );
}

/* ── Tiny SVG icons ── */
const HomeIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const UserIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const UserSm  = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const PinSm   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const ClockSm = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{verticalAlign:"-1px",marginRight:4}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;

/* ── Helpers ── */
function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

/* ── Styles ── */
const s = {
  page:        { minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui,sans-serif" },
  center:      { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#888" },
  nav:         { background: "#fff", borderBottom: "0.5px solid #e5e7ef", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: 56 },
  navLogo:     { display: "flex", alignItems: "center", gap: 9 },
  logoIcon:    { width: 34, height: 34, borderRadius: 9, background: "#eef2ff", color: "#5b4afd", display: "flex", alignItems: "center", justifyContent: "center" },
  logoTxt:     { fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em", color: "#1a1a2e" },
  navBtns:     { display: "flex", gap: 6 },
  navBtn:      { padding: "6px 13px", borderRadius: 8, border: "0.5px solid #e5e7ef", background: "transparent", cursor: "pointer", fontSize: 13, color: "#666", display: "flex", alignItems: "center", gap: 6 },
  navBtnActive:{ background: "#eef2ff", color: "#5b4afd", fontWeight: 500, borderColor: "#c7d2fe" },
  main:        { maxWidth: 640, margin: "0 auto", padding: "24px 16px" },
  headerRow:   { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 },
  avatar:      { width: 44, height: 44, borderRadius: "50%", background: "#5b4afd", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 },
  userName:    { fontSize: 20, fontWeight: 700, letterSpacing: "-0.03em", color: "#1a1a2e", marginBottom: 3 },
  userMeta:    { fontSize: 13, color: "#888" },
  statsGrid:   { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 18 },
  statCard:    { background: "#ffffff", borderRadius: 16, padding: "12px 14px", border: "1px solid #efefef", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" },
  statVal:     { fontSize: 22, fontWeight: 700, color: "#1a1a2e", letterSpacing: "-0.02em" },
  statLbl:     { fontSize: 12, color: "#888", marginTop: 2 },
  filters:     { display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" },
  filterBtn:   { padding: "5px 13px", borderRadius: 20, border: "0.5px solid #ddd", background: "transparent", cursor: "pointer", fontSize: 13, color: "#666" },
  filterActive:{ background: "#5b4afd", color: "#fff", borderColor: "#5b4afd", boxShadow: "0 4px 12px rgba(91,74,253,0.2)" },
  dayLabel:    { fontSize: 12, fontWeight: 500, color: "#999", textTransform: "uppercase", letterSpacing: "0.06em", margin: "18px 0 8px" },
  card:        { background: "#fff", border: "0.5px solid #efefef", borderRadius: 16, padding: "14px 16px", marginBottom: 8, display: "flex", flexDirection: "column", gap: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.01)" },
  cardActive:  { borderColor: "#5b4afd", borderWidth: 1.5, boxShadow: "0 8px 24px rgba(91,74,253,0.08)" },
  cardTop:     { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  cardTitle:   { fontSize: 15, fontWeight: 600, color: "#1a1a2e" },
  cardInfo:    { display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" },
  cardBottom:  { display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8, borderTop: "0.5px solid #f8fafc" },
  timeStr:     { fontSize: 13, color: "#888", display: "flex", alignItems: "center" },
  infoChip:    { fontSize: 12, color: "#777", display: "flex", alignItems: "center", gap: 4 },
  chip:        { fontSize: 12, padding: "4px 10px", borderRadius: 20, fontWeight: 500, whiteSpace: "nowrap" },
  dot:         { width: 7, height: 7, borderRadius: "50%", background: "#5b4afd", display: "inline-block", marginRight: 5 },
  scanBtn:     { background: "#5b4afd", color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 12px rgba(91,74,253,0.2)" },
  profileRow:  { background: "#fff", border: "0.5px solid #efefef", borderRadius: 16, padding: "14px 16px", marginBottom: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.01)" },
  profileLabel:{ fontSize: 12, color: "#999", marginBottom: 4 },
  profileVal:  { fontSize: 15, fontWeight: 500, color: "#1a1a2e" },
  pwdBtn:      { width: "100%", padding: 13, background: "#5b4afd", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer", marginTop: 10, marginBottom: 10, boxShadow: "0 4px 12px rgba(91,74,253,0.2)" },
  logoutBtn:   { width: "100%", padding: 13, background: "transparent", color: "#888", border: "0.5px solid #e5e7ef", borderRadius: 10, fontSize: 14, cursor: "pointer" },
};