// pages/etudiant/Profile.jsx
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // États pour le test Face ID
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCamOpen, setIsCamOpen] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [hint, setHint] = useState("");

  useEffect(() => {
    api.get("/api/etudiant/me")
      .then(res => setUser(res.data))
      .catch(() => navigate("/"))
      .finally(() => setLoading(false));
  }, [navigate]);

  const toggleCam = async () => {
    if (isCamOpen) {
      const stream = videoRef.current?.srcObject;
      stream?.getTracks().forEach(t => t.stop());
      setIsCamOpen(false);
      setTestResult(null);
      setHint("");
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        setIsCamOpen(true);
        setTimeout(() => {
          if (videoRef.current) videoRef.current.srcObject = stream;
        }, 100);
        if (navigator.vibrate) navigator.vibrate(20);
      } catch {
        alert("Impossible d'accéder à la caméra");
      }
    }
  };

  const handleVerify = async () => {
    if (!videoRef.current) return;
    setIsTesting(true);
    setTestResult(null);
    setHint("Analyse biométrique...");
    if (navigator.vibrate) navigator.vibrate(30);

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth || 480;
      canvas.height = video.videoHeight || 480;
      canvas.getContext("2d").drawImage(video, 0, 0);
      
      const blob = await new Promise(r => canvas.toBlob(r, "image/jpeg", 0.7));
      const fd = new FormData();
      fd.append("photo", blob, "test.jpg");

      const { data } = await api.post("/etudiant/enroll/verify/", fd);
      setTestResult(data);
      setHint(data.message);
      
      if (data.success) {
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      } else {
        if (navigator.vibrate) navigator.vibrate(300);
      }
    } catch {
      setHint("Erreur lors de la vérification");
      if (navigator.vibrate) navigator.vibrate(300);
    } finally {
      setIsTesting(false);
    }
  };

  if (loading) return (
    <div style={s.center}>
      <div style={s.loader}></div>
    </div>
  );
  
  if (!user) return null;

  const initials = `${user.prenom[0]}${user.nom[0]}`.toUpperCase();

  return (
    <div style={s.page}>
      <style>{`
        @keyframes scanLine { 0% { top: 0%; } 100% { top: 100%; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>

      <nav style={s.nav}>
        <button onClick={() => navigate("/dash")} style={s.backBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <span style={s.navTitle}>Profil Étudiant</span>
        <div style={{width: 40}} />
      </nav>

      <main style={s.main}>
        <div style={s.cardUser}>
          <div style={s.avatarLarge}>{initials}</div>
          <h1 style={s.userName}>{user.prenom} {user.nom}</h1>
          <p style={s.userEmail}>{user.email}</p>
          <div style={s.badge}>{user.filiere} — {user.groupe}</div>
        </div>

        <section style={s.section}>
          <h2 style={s.sectionTitle}>Identification Faciale</h2>
          <div style={s.bioCard}>
            <div style={{...s.camBox, borderColor: isTesting ? "#3b82f6" : "#eee"}}>
                {isCamOpen ? (
                  <video ref={videoRef} autoPlay playsInline muted style={s.video} />
                ) : (
                  <div style={s.camPlaceholder}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  </div>
                )}
                {isTesting && <div style={s.scanLine} />}
                {testResult && !isTesting && (
                  <div style={{...s.resultOverlay, background: testResult.success ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)"}} />
                )}
            </div>
            
            <div style={s.bioInfo}>
              <p style={s.bioHint}>{hint || "Vérifiez votre profil Face ID enregistré."}</p>
              {testResult && (
                <div style={{...s.scoreBadge, color: testResult.success ? "#10b981" : "#ef4444"}}>
                  <span style={{marginRight: 6}}>{testResult.success ? "✓" : "✗"}</span>
                  {testResult.success ? "Identité Confirmée" : "Échec du Match"} ({testResult.score.toFixed(0)}%)
                </div>
              )}
              <div style={s.btnRow}>
                <button onClick={toggleCam} style={isCamOpen ? s.btnSecondary : s.btnPrimary}>
                  {isCamOpen ? "Désactiver" : "Activer Caméra"}
                </button>
                {isCamOpen && (
                  <button onClick={handleVerify} disabled={isTesting} style={s.btnVerify}>
                    {isTesting ? "Analyse..." : "Vérifier"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <section style={s.section}>
          <h2 style={s.sectionTitle}>Compte</h2>
          <div style={s.menuList}>
            <button style={s.menuItem} onClick={() => navigate("/change-password")}>
              <div style={{...s.menuIconBox, background: "#f0f9ff", color: "#0369a1"}}>🔒</div>
              <div style={s.menuTxt}>
                <p style={s.menuLbl}>Mot de passe</p>
                <p style={s.menuSub}>Modifier votre accès sécurisé</p>
              </div>
              <span style={s.menuArrow}>›</span>
            </button>
            
            <button style={s.menuItem} onClick={() => navigate("/enroll-face")}>
              <div style={{...s.menuIconBox, background: "#f0fdf4", color: "#15803d"}}>👤</div>
              <div style={s.menuTxt}>
                <p style={s.menuLbl}>Configuration Face ID</p>
                <p style={s.menuSub}>Gérer vos 5 captures biométriques</p>
              </div>
              <span style={s.menuArrow}>›</span>
            </button>
          </div>

          <button style={s.logoutBtn} onClick={() => { localStorage.clear(); navigate("/"); }}>
            Déconnexion de la session
          </button>
        </section>

        <canvas ref={canvasRef} style={{display: "none"}} />
      </main>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "#f8fafc", color: "#1a1a2e", fontFamily: "'Inter', system-ui, sans-serif" },
  center: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" },
  loader: { width: 30, height: 30, border: "3px solid #eee", borderTopColor: "#5b4afd", borderRadius: "50%", animation: "spin 1s linear infinite" },
  nav: { background: "rgba(255,255,255,0.8)", backdropFilter: "blur(10px)", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", borderBottom: "1px solid rgba(0,0,0,0.05)", position: "sticky", top: 0, zIndex: 100 },
  backBtn: { border: "none", background: "#f3f4f6", color: "#5b4afd", width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background 0.2s" },
  navTitle: { fontSize: 16, fontWeight: 700, letterSpacing: "-0.3px" },
  main: { maxWidth: 500, margin: "0 auto", padding: "32px 20px", animation: "fadeIn 0.5s ease-out" },
  cardUser: { background: "#fff", borderRadius: 24, padding: 32, textAlign: "center", boxShadow: "0 10px 40px rgba(0,0,0,0.03)", marginBottom: 32, border: "1px solid rgba(0,0,0,0.02)" },
  avatarLarge: { width: 88, height: 88, borderRadius: "50%", background: "#5b4afd", color: "#fff", fontSize: 32, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: "0 10px 25px rgba(91,74,253,0.15)" },
  userName: { fontSize: 24, fontWeight: 800, margin: "0 0 4px", letterSpacing: "-0.5px" },
  userEmail: { fontSize: 14, color: "#666", marginBottom: 20 },
  badge: { display: "inline-block", background: "#eef2ff", padding: "8px 16px", borderRadius: 100, fontSize: 13, fontWeight: 600, color: "#5b4afd" },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 13, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 16, marginLeft: 4 },
  bioCard: { background: "#fff", borderRadius: 24, padding: 24, boxShadow: "0 10px 40px rgba(0,0,0,0.03)", display: "flex", gap: 20, alignItems: "center", border: "1px solid rgba(0,0,0,0.02)" },
  camBox: { width: 110, height: 110, borderRadius: "50%", background: "#f8f9fa", overflow: "hidden", position: "relative", flexShrink: 0, border: "4px solid #fff", boxShadow: "0 8px 20px rgba(0,0,0,0.05)", transition: "all 0.3s ease" },
  video: { width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" },
  camPlaceholder: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" },
  scanLine: { position: "absolute", inset: 0, height: 3, background: "linear-gradient(90deg, transparent, #5b4afd, transparent)", animation: "scanLine 2s infinite", zIndex: 5 },
  resultOverlay: { position: "absolute", inset: 0, zIndex: 4 },
  bioInfo: { flex: 1 },
  bioHint: { fontSize: 14, color: "#666", lineHeight: 1.5, marginBottom: 12 },
  scoreBadge: { fontSize: 15, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center" },
  btnRow: { display: "flex", gap: 10 },
  btnPrimary: { background: "#5b4afd", color: "#fff", border: "none", padding: "10px 16px", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "transform 0.1s", boxShadow: "0 4px 12px rgba(91,74,253,0.2)" },
  btnSecondary: { background: "#f3f4f6", color: "#111", border: "none", padding: "10px 16px", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer" },
  btnVerify: { background: "#10b981", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 12px rgba(16,185,129,0.3)" },
  menuList: { background: "#fff", borderRadius: 24, overflow: "hidden", border: "1px solid rgba(0,0,0,0.02)", boxShadow: "0 10px 40px rgba(0,0,0,0.03)" },
  menuItem: { width: "100%", display: "flex", alignItems: "center", background: "none", border: "none", padding: "20px", textAlign: "left", cursor: "pointer", borderBottom: "1px solid #f8f9fa", transition: "background 0.2s" },
  menuIconBox: { width: 44, height: 44, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginRight: 16 },
  menuTxt: { flex: 1 },
  menuLbl: { fontSize: 16, fontWeight: 600, color: "#1a1a2e", margin: 0 },
  menuSub: { fontSize: 13, color: "#999", margin: "2px 0 0" },
  menuArrow: { fontSize: 24, color: "#d1d5db" },
  logoutBtn: { width: "100%", marginTop: 24, padding: 20, background: "none", border: "none", color: "#ef4444", fontSize: 15, fontWeight: 700, cursor: "pointer", textAlign: "center", opacity: 0.8 }
};