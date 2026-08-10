import { useParams, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  RefreshCw, Clock, Users,
  Loader2, QrCode, Power, Camera, CameraOff, Scan, Wifi
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import PageHeader from "../../components/PageHeader";
import ConfirmDialog from "../../components/ConfirmDialog";
import { useSeance } from "../../hooks/useSeance";
import api from "../../utils/api";

export default function ProfQRView() {
  const { seanceId } = useParams();
  const navigate = useNavigate();
  const {
    qrToken, timeLeft, loading,
    attendanceCount, sessionStatus, presences,
    refreshQRCode, endSeance
  } = useSeance(seanceId);

  const brandColor = "#5b4afd";

  // ── Mode : "qr" ou "face" ──
  const [mode, setMode] = useState("qr");

  // ── État reconnaissance faciale ──
  const imgRef = useRef(null);       // pour flux MJPEG (caméra externe)
  const videoRef = useRef(null);     // fallback video si besoin
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [streamUrl, setStreamUrl] = useState("");
  const [streamInput, setStreamInput] = useState("http://192.168.1.101:4747/video");
  const [streamError, setStreamError] = useState(false);

  const [faceLoading, setFaceLoading] = useState(false);
  const [facePresences, setFacePresences] = useState([]);
  const [faceMessage, setFaceMessage] = useState("");
  const [recognizedNow, setRecognizedNow] = useState([]);
  const [scanCount, setScanCount] = useState(0);

  // ── Modal fin de séance ──
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  // ── Fetch presences faciales ──
  const fetchFacePresences = useCallback(async () => {
    try {
      const res = await api.get(`/prof/seance/${seanceId}/face-presences`);
      setFacePresences(res.data);
      setScanCount(res.data.filter(p => p.statut === "PRESENT").length);
    } catch (err) {
      console.error("Erreur fetch face presences:", err);
    }
  }, [seanceId]);

  // ── Capturer un frame et envoyer au backend ──
  const captureAndSend = useCallback(async () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;

    // Utilise imgRef (MJPEG externe) en priorité, sinon videoRef (webcam locale)
    const source = imgRef.current || videoRef.current;
    if (!source) return;

    // Vérifie que la source est prête
    const isImg = source.tagName === "IMG";
    if (!isImg && source.readyState < 2) return;
    if (isImg && (!source.complete || source.naturalWidth === 0)) return;

    canvas.width  = source.naturalWidth  || source.videoWidth  || 640;
    canvas.height = source.naturalHeight || source.videoHeight || 480;

    try {
      canvas.getContext("2d").drawImage(source, 0, 0);
    } catch (e) {
      // Cross-origin ou flux pas encore prêt
      console.warn("Impossible de dessiner le frame:", e);
      return;
    }

    const blob = await new Promise(r => canvas.toBlob(r, "image/jpeg", 0.7));
    if (!blob) return;

    const fd = new FormData();
    fd.append("frame", blob, "frame.jpg");

    setFaceLoading(true);
    try {
      const res = await api.post(`/prof/seance/${seanceId}/face-scan`, fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const newlyRecognized = res.data.recognized || [];
      setRecognizedNow(newlyRecognized);
      if (newlyRecognized.length > 0) {
        setFaceMessage(res.data.message);
      }
    } catch (err) {
      console.error("Erreur face scan:", err);
    } finally {
      setFaceLoading(false);
    }
  }, [seanceId]);

  // ── Démarrer le flux caméra externe (MJPEG) ──
  const startCamera = useCallback(async () => {
    const url = streamInput.trim();
    if (!url) {
      setFaceMessage("Entrez l'URL du flux vidéo (ex: http://192.168.1.x:8080/video)");
      return;
    }

    setStreamError(false);
    setStreamUrl(url);
    setCameraActive(true);
    setFaceMessage("Connexion au flux en cours...");

    // Fetch initiale des présences
    await fetchFacePresences();

    // Scan toutes les 2 secondes
    intervalRef.current = setInterval(async () => {
      await captureAndSend();
      await fetchFacePresences();
    }, 2000);

    setFaceMessage("Flux connecté — scan en cours...");
  }, [streamInput, fetchFacePresences, captureAndSend]);

  // ── Arrêter le flux ──
  const stopCamera = useCallback(() => {
    setStreamUrl("");
    setCameraActive(false);
    setStreamError(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setFaceMessage("");
    setRecognizedNow([]);
  }, []);

  // ── Gestion erreur de chargement du flux ──
  const handleStreamError = useCallback(() => {
    setStreamError(true);
    setFaceMessage("Impossible de charger le flux. Vérifiez l'URL et le réseau.");
    // On ne stoppe pas le scan — le flux peut reprendre
  }, []);

  const handleStreamLoad = useCallback(() => {
    setStreamError(false);
    setFaceMessage("Flux connecté — scan en cours...");
  }, []);

  // ── Cleanup quand on quitte ──
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // ── Switch de mode ──
  const handleModeSwitch = (newMode) => {
    if (newMode === mode) return;
    if (mode === "face") stopCamera();
    setMode(newMode);
  };

  // ── Fin de séance ──
  const handleEndSeance = async () => {
    setIsEnding(true);
    stopCamera();
    const res = await endSeance();
    setIsEnding(false);
    setIsEndModalOpen(false);
    if (res.success) {
      navigate("/prof/dashboard");
    } else {
      alert(res.error);
    }
  };

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
      <Loader2 className="animate-spin" size={48} color={brandColor} />
    </div>
  );

  // Présences à afficher selon le mode
  const displayPresences = mode === "face" ? facePresences : presences;
  const displayCount = mode === "face" ? scanCount : attendanceCount;

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <PageHeader
        premium
        title="Présence en cours"
        subtitle="Choisissez la méthode de prise de présence"
        icon={QrCode}
        backPath="/prof/dashboard"
        color={brandColor}
        bgColor="#eef2ff"
      />

      {/* ── Sélecteur de mode ── */}
      <div style={{
        display: "flex", gap: "1rem", marginBottom: "1.5rem",
        background: "white", borderRadius: "16px", padding: "1rem",
        border: "1px solid #efefef", boxShadow: "0 4px 12px rgba(0,0,0,0.03)"
      }}>
        <button
          onClick={() => handleModeSwitch("qr")}
          style={{
            flex: 1, padding: "14px", borderRadius: "12px", border: "none",
            background: mode === "qr" ? brandColor : "#f1f5f9",
            color: mode === "qr" ? "white" : "#475569",
            fontWeight: 700, fontSize: "14px", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            transition: "all 0.2s",
            boxShadow: mode === "qr" ? `0 8px 20px ${brandColor}44` : "none"
          }}
        >
          <Scan size={18} /> QR Code
        </button>
        <button
          onClick={() => handleModeSwitch("face")}
          style={{
            flex: 1, padding: "14px", borderRadius: "12px", border: "none",
            background: mode === "face" ? "#10b981" : "#f1f5f9",
            color: mode === "face" ? "white" : "#475569",
            fontWeight: 700, fontSize: "14px", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            transition: "all 0.2s",
            boxShadow: mode === "face" ? "0 8px 20px rgba(16,185,129,0.4)" : "none"
          }}
        >
          <Camera size={18} /> Reconnaissance Faciale
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "2rem" }}>

        {/* ── Zone principale ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* Status Bar */}
          <div style={{
            background: sessionStatus === "ACTIVE" ? "#f0fdf4" : "#f9fafb",
            borderRadius: "20px", padding: "1rem 1.5rem",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            border: `1px solid ${sessionStatus === "ACTIVE" ? "#dcfce7" : "#f3f4f6"}`,
            boxShadow: "0 4px 12px rgba(0,0,0,0.02)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                width: "12px", height: "12px", borderRadius: "50%",
                background: sessionStatus === "ACTIVE" ? "#16a34a" : "#6b7280",
                boxShadow: sessionStatus === "ACTIVE" ? "0 0 10px #16a34a88" : "none",
                animation: sessionStatus === "ACTIVE" ? "pulse-dot 2s infinite" : "none"
              }} />
              <span style={{ fontSize: "14px", fontWeight: 800, color: sessionStatus === "ACTIVE" ? "#166534" : "#4b5563", textTransform: "uppercase" }}>
                Session {sessionStatus === "ACTIVE" ? "en cours" : "terminée"}
              </span>
            </div>
            {mode === "qr" && sessionStatus === "ACTIVE" && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 700, color: brandColor }}>
                <Clock size={16} /> Rafraîchissement: {Math.max(0, timeLeft)}s
              </div>
            )}
            {mode === "face" && cameraActive && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 700, color: streamError ? "#dc2626" : "#10b981" }}>
                <Wifi size={16} /> {faceLoading ? "Analyse..." : streamError ? "Flux interrompu" : "Scan actif"}
              </div>
            )}
          </div>

          {/* ── Mode QR Code ── */}
          {mode === "qr" && (
            <div style={{
              background: "white", borderRadius: "24px", padding: "2rem",
              boxShadow: "0 10px 30px rgba(0,0,0,0.03)", border: "1px solid #efefef",
              display: "flex", flexDirection: "column", alignItems: "center"
            }}>
              {sessionStatus === "ACTIVE" ? (
                <>
                  <div className="qr-container" style={{
                    padding: "24px", background: "white", borderRadius: "24px",
                    border: `3px solid ${brandColor}15`, marginBottom: "1.5rem",
                    boxShadow: "0 20px 50px rgba(0,0,0,0.05)", position: "relative"
                  }}>
                    <div className="pulse-ring" style={{ borderColor: brandColor }} />
                    <QRCodeSVG value={qrToken} size={240} level="H" />
                  </div>
                  <p style={{ color: "#9ca3af", fontSize: "13px", textAlign: "center", fontWeight: 500, maxWidth: "80%" }}>
                    Ce code change automatiquement pour garantir la sécurité des présences.
                  </p>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "2rem" }}>
                  <Users size={64} color="#e5e7eb" style={{ margin: "0 auto 1.5rem" }} />
                  <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#1a1a2e" }}>Séance Clôturée</h3>
                  <p style={{ color: "#9ca3af", fontSize: "14px" }}>Le QR code n'est plus disponible.</p>
                </div>
              )}
            </div>
          )}

          {/* ── Mode Reconnaissance Faciale ── */}
          {mode === "face" && (
            <div style={{
              background: "white", borderRadius: "24px", padding: "2rem",
              boxShadow: "0 10px 30px rgba(0,0,0,0.03)", border: "1px solid #efefef",
              display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem"
            }}>

              {/* Champ URL du flux */}
              <div style={{ width: "100%" }}>
                <label style={{ fontSize: "12px", color: "#6b7280", fontWeight: 700, display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  URL du flux caméra externe (MJPEG)
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    value={streamInput}
                    onChange={e => setStreamInput(e.target.value)}
                    disabled={cameraActive}
                    placeholder="http://192.168.1.x:8080/video"
                    style={{
                      flex: 1, padding: "10px 14px",
                      borderRadius: "10px",
                      border: `1px solid ${streamError ? "#fca5a5" : "#e5e7eb"}`,
                      fontSize: "13px", fontFamily: "monospace",
                      background: cameraActive ? "#f9fafb" : "white",
                      color: "#1a1a2e", outline: "none"
                    }}
                  />
                </div>
                
              </div>

              {/* Vidéo / Flux MJPEG */}
              <div style={{
                position: "relative", width: "100%", maxWidth: "480px",
                borderRadius: "16px", overflow: "hidden",
                border: cameraActive
                  ? `3px solid ${streamError ? "#ef4444" : "#10b981"}`
                  : "3px solid #e5e7eb",
                background: "#1a1a2e", minHeight: "270px",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: cameraActive
                  ? `0 0 30px ${streamError ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)"}`
                  : "none",
                transition: "all 0.3s"
              }}>
                {/* Flux MJPEG depuis caméra externe */}
                {cameraActive && streamUrl && (
                  <img
                    ref={imgRef}
                    src={streamUrl}
                    onLoad={handleStreamLoad}
                    onError={handleStreamError}
                    alt="Flux caméra externe"
                    crossOrigin="anonymous"
                    style={{
                      width: "100%", height: "100%", objectFit: "cover",
                      display: "block"
                    }}
                  />
                )}

                {/* Overlay reconnus dans ce frame */}
                {cameraActive && recognizedNow.length > 0 && (
                  <div style={{
                    position: "absolute", top: "10px", left: "10px", right: "10px",
                    display: "flex", flexWrap: "wrap", gap: "6px",
                    pointerEvents: "none"
                  }}>
                    {recognizedNow.map((r, i) => (
                      <div key={i} style={{
                        background: "rgba(16,185,129,0.9)", color: "white",
                        borderRadius: "8px", padding: "4px 10px",
                        fontSize: "12px", fontWeight: 700,
                        backdropFilter: "blur(4px)"
                      }}>
                        ✓ {r.prenom} {r.nom} ({r.score}%)
                      </div>
                    ))}
                  </div>
                )}

                {/* Scanner line animation */}
                {cameraActive && !streamError && (
                  <div style={{
                    position: "absolute", left: 0, right: 0,
                    height: "2px",
                    background: "linear-gradient(90deg, transparent, #10b981, transparent)",
                    animation: "scanline 2s linear infinite",
                    pointerEvents: "none"
                  }} />
                )}

                {/* Indicateur d'erreur flux */}
                {cameraActive && streamError && (
                  <div style={{
                    position: "absolute", inset: 0,
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    background: "rgba(26,26,46,0.85)", color: "#fca5a5",
                    textAlign: "center", padding: "1rem"
                  }}>
                    <Wifi size={32} style={{ marginBottom: "8px", opacity: 0.8 }} />
                    <p style={{ fontSize: "13px", fontWeight: 700, margin: 0 }}>Flux inaccessible</p>
                    <p style={{ fontSize: "11px", opacity: 0.7, margin: "4px 0 0" }}>Vérifiez l'URL et le réseau Wi-Fi</p>
                  </div>
                )}

                {/* Placeholder si caméra inactive */}
                {!cameraActive && (
                  <div style={{ textAlign: "center", color: "#6b7280", padding: "2rem" }}>
                    <Wifi size={48} style={{ marginBottom: "1rem", opacity: 0.4 }} />
                    <p style={{ fontSize: "14px", fontWeight: 600 }}>Caméra externe inactive</p>
                    <p style={{ fontSize: "12px", opacity: 0.7 }}>Entrez l'URL du flux puis cliquez "Démarrer"</p>
                  </div>
                )}
              </div>

              {/* Canvas caché pour capture */}
              <canvas ref={canvasRef} style={{ display: "none" }} />

              {/* Message */}
              {faceMessage && (
                <div style={{
                  padding: "10px 16px", borderRadius: "12px",
                  background: streamError ? "#fef2f2" : cameraActive ? "#f0fdf4" : "#f9fafb",
                  border: `1px solid ${streamError ? "#fecaca" : cameraActive ? "#bbf7d0" : "#e5e7eb"}`,
                  fontSize: "13px", fontWeight: 600,
                  color: streamError ? "#dc2626" : cameraActive ? "#166534" : "#6b7280",
                  textAlign: "center", width: "100%"
                }}>
                  {faceMessage}
                </div>
              )}

              {/* Bouton démarrer/arrêter */}
              {sessionStatus === "ACTIVE" && (
                <button
                  onClick={cameraActive ? stopCamera : startCamera}
                  style={{
                    padding: "14px 32px",
                    background: cameraActive ? "#fef2f2" : "#10b981",
                    color: cameraActive ? "#dc2626" : "white",
                    border: cameraActive ? "1px solid #fecaca" : "none",
                    borderRadius: "14px", fontWeight: 800, fontSize: "15px",
                    cursor: "pointer", transition: "all 0.2s",
                    display: "flex", alignItems: "center", gap: "10px",
                    boxShadow: cameraActive ? "none" : "0 8px 20px rgba(16,185,129,0.3)"
                  }}
                >
                  {cameraActive
                    ? <><CameraOff size={18} /> Arrêter le flux</>
                    : <><Wifi size={18} /> Démarrer le scan</>
                  }
                </button>
              )}

           
           
            </div>
          )}

          {/* ── Liste des présences en temps réel ── */}
          <div style={{
            background: "white", borderRadius: "24px", padding: "1.5rem",
            boxShadow: "0 10px 30px rgba(0,0,0,0.03)", border: "1px solid #efefef"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.25rem" }}>
              <div style={{
                width: "40px", height: "40px", borderRadius: "12px",
                background: mode === "face" ? "#f0fdf4" : "#f5f3ff",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <Users size={20} color={mode === "face" ? "#10b981" : brandColor} />
              </div>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#1a1a2e", margin: 0 }}>
                  {sessionStatus === "ACTIVE" ? "Présences en direct" : "Rapport final"}
                </h3>
                <p style={{ color: "#9ca3af", margin: 0, fontSize: "12px", fontWeight: 600 }}>
                  {displayPresences.filter(p => p.statut === "PRESENT").length} présent(s) / {displayPresences.length} étudiant(s)
                </p>
              </div>
            </div>

            <div style={{ background: "#f9fafb", borderRadius: "16px", overflow: "hidden", border: "1px solid #f3f4f6" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#f3f4f6", color: "#6b7280" }}>
                    <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 700 }}>ÉTUDIANT</th>
                    <th style={{ padding: "10px 16px", textAlign: "center", fontWeight: 700 }}>STATUT</th>
                    <th style={{ padding: "10px 16px", textAlign: "center", fontWeight: 700 }}>MÉTHODE</th>
                    <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: 700 }}>HEURE</th>
                  </tr>
                </thead>
                <tbody>
                  {displayPresences.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ padding: "3rem", textAlign: "center", color: "#9ca3af", fontWeight: 500 }}>
                        {mode === "face" ? "Démarrez le flux pour scanner..." : "En attente du premier scan..."}
                      </td>
                    </tr>
                  ) : (
                    [...displayPresences]
                      .sort((a, b) => {
                        if (a.statut === "PRESENT" && b.statut !== "PRESENT") return -1;
                        if (b.statut === "PRESENT" && a.statut !== "PRESENT") return 1;
                        return new Date(b.heure_scan || 0) - new Date(a.heure_scan || 0);
                      })
                      .map((p) => (
                        <tr key={p.etudiant_id} style={{ borderTop: "1px solid #f3f4f6", background: "white" }}>
                          <td style={{ padding: "12px 16px", fontWeight: 700, color: "#1a1a2e" }}>
                            {p.nom} {p.prenom}
                          </td>
                          <td style={{ padding: "12px 16px", textAlign: "center" }}>
                            <span style={{
                              padding: "4px 10px", borderRadius: "20px", fontSize: "10px", fontWeight: 800,
                              background: p.statut === "PRESENT" ? "#dcfce7" : "#fee2e2",
                              color: p.statut === "PRESENT" ? "#166534" : "#991b1b"
                            }}>
                              {p.statut === "PRESENT" ? "PRÉSENT" : "ABSENT"}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px", textAlign: "center" }}>
                            {p.methode === "face" ? (
                              <span style={{ fontSize: "11px", color: "#10b981", fontWeight: 700 }}>👤 Facial</span>
                            ) : p.methode === "qr" ? (
                              <span style={{ fontSize: "11px", color: brandColor, fontWeight: 700 }}>📱 QR</span>
                            ) : (
                              <span style={{ fontSize: "11px", color: "#9ca3af" }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: "12px 16px", textAlign: "right", color: "#6b7280", fontWeight: 600 }}>
                            {p.heure_scan
                              ? new Date(p.heure_scan).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                              : "-"
                            }
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Sidebar droite ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* Compteur */}
          <div style={{
            background: "white", borderRadius: "24px", padding: "1.5rem",
            border: "1px solid #efefef", boxShadow: "0 10px 20px rgba(0,0,0,0.02)",
            textAlign: "center"
          }}>
            <h4 style={{ fontSize: "12px", color: "#9ca3af", fontWeight: 800, textTransform: "uppercase", marginBottom: "1rem" }}>
              Présents
            </h4>
            <div style={{ fontSize: "48px", fontWeight: 900, color: "#1a1a2e", marginBottom: "4px" }}>
              {displayCount}
            </div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              padding: "6px 16px",
              background: mode === "face" ? "#f0fdf4" : "#f5f3ff",
              color: mode === "face" ? "#16a34a" : brandColor,
              borderRadius: "20px", fontSize: "12px", fontWeight: 800
            }}>
              {mode === "face" ? "📡 FLUX EXTERNE" : "📱 QR CODE"}
            </div>
          </div>

          {/* Statut connexion flux */}
          {mode === "face" && cameraActive && (
            <div style={{
              background: streamError ? "#fef2f2" : "#f0fdf4",
              borderRadius: "16px", padding: "1rem",
              border: `1px solid ${streamError ? "#fecaca" : "#bbf7d0"}`,
              textAlign: "center"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "4px" }}>
                <div style={{
                  width: "8px", height: "8px", borderRadius: "50%",
                  background: streamError ? "#ef4444" : "#10b981",
                  animation: streamError ? "none" : "pulse-dot 2s infinite"
                }} />
                <span style={{ fontSize: "12px", fontWeight: 800, color: streamError ? "#991b1b" : "#166534" }}>
                  {streamError ? "FLUX INTERROMPU" : "FLUX ACTIF"}
                </span>
              </div>
              <p style={{ fontSize: "11px", color: "#9ca3af", margin: 0, wordBreak: "break-all", fontFamily: "monospace" }}>
                {streamUrl}
              </p>
            </div>
          )}

          {/* Bouton refresh QR */}
          {mode === "qr" && (
            <button
              onClick={() => refreshQRCode(true)}
              disabled={sessionStatus !== "ACTIVE"}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                justifyContent: "center", padding: "16px", background: "white",
                border: "1px solid #e5e7eb", borderRadius: "16px",
                color: "#374151", fontWeight: 800, cursor: "pointer",
                transition: "all 0.2s", opacity: sessionStatus !== "ACTIVE" ? 0.5 : 1
              }}
            >
              <RefreshCw size={18} /> Forcer le rafraîchissement
            </button>
          )}

          {/* Bouton clôturer */}
          {sessionStatus === "ACTIVE" && (
            <button
              onClick={() => setIsEndModalOpen(true)}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                justifyContent: "center", padding: "18px", background: "#fef2f2",
                border: "1px solid #fee2e2", borderRadius: "20px",
                color: "#dc2626", fontWeight: 800, cursor: "pointer",
                transition: "all 0.2s", boxShadow: "0 8px 20px rgba(220,38,38,0.1)"
              }}
            >
              <Power size={20} /> Clôturer la séance
            </button>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={isEndModalOpen}
        title="Clôturer la séance ?"
        message="Voulez-vous vraiment terminer cette séance ? Les étudiants ne pourront plus scanner le code."
        onConfirm={handleEndSeance}
        onCancel={() => setIsEndModalOpen(false)}
        confirmText="Clôturer définitivement"
        cancelText="Garder active"
        type="danger"
        isLoading={isEnding}
        brandColor={brandColor}
      />

      <style>{`
        .qr-container { position: relative; }
        .pulse-ring {
          position: absolute;
          top: -10px; left: -10px; right: -10px; bottom: -10px;
          border-radius: 30px;
          border: 4px solid #5b4afd;
          opacity: 0;
          animation: pulse 2.5s cubic-bezier(0.24, 0, 0.38, 1) infinite;
        }
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.6; }
          100% { transform: scale(1.08); opacity: 0; }
        }
        @keyframes pulse-dot {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes scanline {
          0% { top: 0%; }
          100% { top: 100%; }
        }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}