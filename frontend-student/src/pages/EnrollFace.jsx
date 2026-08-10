// pages/etudiant/EnrollFace.jsx
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import * as faceapi from "@vladmandic/face-api";
import api from "../utils/api";

const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/";

/**
 * ZONES d'enrôlement avec messages de guidage précis.
 * L'ORDRE de ce tableau définit l'ordre imposé de l'enrôlement.
 *
 * [FIX] Tolérances élargies (surtout sur le pitch, très sensible à la
 * position physique de la caméra, qui varie d'un PC à l'autre — typiquement
 * entre votre machine de dev et le PC utilisé en salle de soutenance).
 */
const ZONES = [
  { id: "face",   yaw:   6, pitch: 36, tol: 26, angle: 270, label: "Face",   guide: "Regardez bien l'écran" },
  { id: "droite", yaw: -32, pitch: 27, tol: 36, angle: 0,   label: "Droite", guide: "Tournez la tête vers la DROITE" },
  { id: "bas",    yaw:   0, pitch: 65, tol: 30, angle: 90,  label: "Bas",    guide: "Baissez légèrement la tête" },
  { id: "gauche", yaw:  32, pitch: 31, tol: 36, angle: 180, label: "Gauche", guide: "Tournez la tête vers la GAUCHE" },
  { id: "haut",   yaw:  -4, pitch: 20, tol: 26, angle: 315, label: "Haut",   guide: "Levez légèrement la tête" },
];

// [FIX] 3 -> 2 frames stables requises. Avec un taux de détection réel souvent
// inférieur à la fréquence nominale (inférence TinyFaceDetector non instantanée),
// exiger 3 frames consécutives stables pouvait représenter 1 à 2 secondes
// d'immobilité parfaite. 2 frames suffisent à éliminer le bruit ponctuel.
const STABILITY_FRAMES = 2;

// Marge utilisée uniquement pour MAINTENIR un verrou déjà acquis sur LA position
// attendue, jamais pour basculer sur une autre position.
const HOLD_MARGIN = 14;

// Fenêtre de lissage de la pose (moving average) pour éliminer le tremblement.
const SMOOTH_WINDOW = 4;

// [FIX] Nombre de frames consécutives sans détection de visage avant d'afficher
// un message explicite à l'utilisateur (évite l'impression de blocage muet).
const NO_FACE_HINT_THRESHOLD = 18; // ~0.6s à 30fps

const RING_CIRC = 2 * Math.PI * 48;

export default function EnrollFace() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);

  const capturedSet = useRef(new Set());
  const isSending = useRef(new Set());
  const stableCount = useRef(0);
  const lastUpdate = useRef(0);
  const detectingRef = useRef(false);

  // Verrou : true une fois qu'on est entré dans la zone attendue, reste true
  // (avec marge élargie) jusqu'à validation ou sortie franche.
  const isLockedRef = useRef(false);

  const poseHistory = useRef([]);

  // [FIX] Compteur de frames consécutives sans visage détecté, pour piloter
  // l'affichage du message d'aide explicite.
  const noFaceStreak = useRef(0);

  const navigate = useNavigate();
  const [doneIds, setDoneIds] = useState([]);
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [hint, setHint] = useState("Vérification...");
  const [inZoneId, setInZoneId] = useState(null);
  const [stabilizeProgress, setStabilizeProgress] = useState(0);
  // [FIX] Etat dédié pour signaler explicitement l'absence de visage détecté.
  const [faceLost, setFaceLost] = useState(false);

  const updateOverallProgress = useCallback((count) => {
    setProgress((count / ZONES.length) * 100);
    setIsDone(count === ZONES.length);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/etudiant/enroll/status");
        const faites = data.positions_faites || [];
        capturedSet.current = new Set(faites);
        setDoneIds(faites);
        updateOverallProgress(faites.length);

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 480 }, height: { ideal: 480 } }
        });
        streamRef.current = stream;
        setHint("Modèles chargés");
      } catch {
        setHint("Accès caméra requis");
      }
    })();
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [updateOverallProgress]);

  const handleStart = () => {
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(console.error);
    }
    setIsStarted(true);
    setHint("Suivez les instructions");
  };

  const getPose = useCallback((lm) => {
    const p = lm.positions;
    const eyeCX = (p[36].x + p[45].x) / 2;
    const eyeCY = (p[36].y + p[45].y) / 2;
    const eyeDist = Math.max(p[45].x - p[36].x, 1);
    const yaw = ((p[30].x - eyeCX) / eyeDist) * 100;
    const pitch = ((p[30].y - eyeCY) / eyeDist) * 100;
    return { yaw, pitch };
  }, []);

  const getSmoothedPose = useCallback((rawPose) => {
    poseHistory.current.push(rawPose);
    if (poseHistory.current.length > SMOOTH_WINDOW) {
      poseHistory.current.shift();
    }
    const n = poseHistory.current.length;
    const sum = poseHistory.current.reduce(
      (acc, p) => ({ yaw: acc.yaw + p.yaw, pitch: acc.pitch + p.pitch }),
      { yaw: 0, pitch: 0 }
    );
    return { yaw: sum.yaw / n, pitch: sum.pitch / n };
  }, []);

  const handleCapture = useCallback(async (id) => {
    if (isSending.current.has(id)) return;
    if (navigator.vibrate) navigator.vibrate(40);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const blob = await new Promise(r => canvas.toBlob(r, "image/jpeg", 0.6));

    isSending.current.add(id);
    const fd = new FormData();
    fd.append("photos", blob, `${id}.jpg`);

    try {
      setHint("Analyse en cours...");
      await api.post(`/etudiant/enroll/${id}`, fd);
      capturedSet.current.add(id);
      const current = Array.from(capturedSet.current);
      setDoneIds(current);
      updateOverallProgress(current.length);
      setHint("Position validée !");
    } catch (err) {
      setHint(err.response?.data?.detail || "Erreur de capture");
    } finally {
      isSending.current.delete(id);
    }
  }, [updateOverallProgress]);

  useEffect(() => {
    if (!modelsLoaded || !isStarted || isDone) return;

    const loop = async (ts) => {
      animFrameRef.current = requestAnimationFrame(loop);

      // [FIX] 50ms -> 33ms : on vise ~30 détections/seconde au lieu de ~20.
      // Le vrai débit effectif dépend du temps d'inférence (voir aussi la
      // réduction d'inputSize plus bas), mais ce changement seul augmente déjà
      // la réactivité perçue, notamment pendant les mouvements de tête rapides.
      if (ts - lastUpdate.current < 33) return;
      if (detectingRef.current) return;
      lastUpdate.current = ts;

      const video = videoRef.current;
      if (!video || video.readyState < 2) return;

      // La SEULE zone qu'on a le droit de tester est la prochaine non capturée,
      // dans l'ordre du tableau ZONES. On ignore complètement toutes les autres,
      // même si la pose géométrique correspondrait à une zone plus loin dans la liste.
      const target = ZONES.find(z => !capturedSet.current.has(z.id));
      if (!target || isSending.current.has(target.id)) return;

      detectingRef.current = true;
      try {
        // [FIX] inputSize 160 -> 128 : réduit le coût de l'inférence du
        // détecteur, donc augmente le débit réel de frames analysées par
        // seconde. Pour du guidage de pose (pas l'extraction d'embedding
        // finale, qui reste faite côté serveur avec ArcFace), cette perte de
        // précision est largement compensée par le gain de fluidité.
        const det = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 128, scoreThreshold: 0.5 })).withFaceLandmarks();

        if (!det) {
          // [FIX] Compteur de frames sans détection, pour afficher un message
          // explicite si l'absence se prolonge, plutôt que de laisser
          // l'utilisateur deviner si l'application est figée ou non.
          noFaceStreak.current += 1;
          if (noFaceStreak.current >= NO_FACE_HINT_THRESHOLD) {
            setFaceLost(true);
          }

          // Visage perdu : on relâche tout, mais SEULEMENT si on n'était pas déjà
          // verrouillé (un verrou actif tolère une frame ratée isolée sans tout casser).
          if (!isLockedRef.current) {
            poseHistory.current = [];
            stableCount.current = 0;
            setInZoneId(null);
            setStabilizeProgress(0);
          }
          return;
        }

        // [FIX] Visage retrouvé : on réinitialise le compteur et on masque le message.
        noFaceStreak.current = 0;
        setFaceLost(false);

        const rawPose = getPose(det.landmarks);
        const { yaw, pitch } = getSmoothedPose(rawPose);

        const dy = Math.abs(yaw - target.yaw);
        const dp = Math.abs(pitch - target.pitch);

        // Tolérance utilisée selon qu'on est déjà verrouillé ou pas :
        // - pas encore verrouillé -> tolérance stricte (z.tol) pour ENTRER dans la zone
        // - déjà verrouillé -> tolérance élargie (z.tol + HOLD_MARGIN) pour Y RESTER
        const tolerance = target.tol + (isLockedRef.current ? HOLD_MARGIN : 0);
        const isInTargetZone = dy < tolerance && dp < tolerance;

        if (isInTargetZone) {
          // On (re)affiche systématiquement l'indication "bonne position" pour LA
          // position attendue, et on ne la masque plus jusqu'à validation complète.
          isLockedRef.current = true;
          setInZoneId(target.id);

          stableCount.current += 1;
          const ratio = Math.min(stableCount.current / STABILITY_FRAMES, 1);
          setStabilizeProgress(ratio * 100);

          if (stableCount.current >= STABILITY_FRAMES) {
            handleCapture(target.id);
            stableCount.current = 0;
            isLockedRef.current = false;
            poseHistory.current = [];
            setInZoneId(null);
            setStabilizeProgress(0);
          }
        } else {
          // Sortie franche de la zone élargie : seulement là on relâche le verrou
          // et on cache l'indication. Une micro-variation reste absorbée par HOLD_MARGIN.
          isLockedRef.current = false;
          stableCount.current = 0;
          setInZoneId(null);
          setStabilizeProgress(0);
        }
      } catch {
        // Détection ignorée pour cette frame
      } finally {
        detectingRef.current = false;
      }
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [modelsLoaded, isStarted, isDone, getPose, getSmoothedPose, handleCapture]);

  const handleReset = async (e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Tout recommencer ?")) return;
    try {
      setHint("Réinitialisation...");
      await api.delete("/etudiant/enroll/reset");
      capturedSet.current = new Set();
      stableCount.current = 0;
      isSending.current = new Set();
      isLockedRef.current = false;
      poseHistory.current = [];
      noFaceStreak.current = 0;
      setFaceLost(false);
      setDoneIds([]);
      setProgress(0);
      setIsDone(false);
      setStabilizeProgress(0);
      setInZoneId(null);
      setHint("Prêt");
    } catch {
      setHint("Erreur reset");
    }
  };

  const nextPos = ZONES.find(z => !doneIds.includes(z.id));

  return (
    <div style={s.page}>
      <style>{`
        @keyframes scanline { 0% { top: 0%; } 100% { top: 100%; } }
        @keyframes popIn { 0% { opacity: 0; transform: scale(0.92); } 100% { opacity: 1; transform: scale(1); } }
      `}</style>

      <nav style={s.nav}>
        <button style={s.backBtn} onClick={() => navigate("/profile")}>✕</button>
        <span style={s.navTitle}>Configuration Face ID</span>
        <div style={{width: 40}} />
      </nav>

      <main style={s.main}>
        <ol style={s.posList}>
          {ZONES.map((z) => {
            const done = doneIds.includes(z.id);
            const isCurrent = !done && nextPos?.id === z.id;
            return (
              <li key={z.id} style={{
                ...s.posItem,
                ...(isCurrent ? s.posItemCurrent : {}),
              }}>
                <span style={{
                  ...s.posIcon,
                  ...(done ? s.posIconDone : isCurrent ? s.posIconCurrent : s.posIconTodo),
                }}>
                  {done ? "✔" : isCurrent ? "●" : "○"}
                </span>
                <span style={{
                  ...s.posLabel,
                  ...(done ? s.posLabelDone : isCurrent ? s.posLabelCurrent : s.posLabelTodo),
                }}>
                  {z.label}
                </span>
                {isCurrent && <span style={s.posCurrentTag}>en cours</span>}
              </li>
            );
          })}
        </ol>

        <div style={s.camWrapper}>
          <svg style={s.svgRing} viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="48" fill="none" stroke="#f5f5f5" strokeWidth="2" />
            <circle cx="50" cy="50" r="48" fill="none" stroke="#5b4afd" strokeWidth="3"
              strokeDasharray={RING_CIRC}
              strokeDashoffset={RING_CIRC - (RING_CIRC * progress) / 100}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.6s ease", transform: "rotate(-90 50 50)" }}
            />
            {inZoneId && (
              <circle cx="50" cy="50" r="42" fill="none" stroke="#10b981" strokeWidth="3"
                strokeDasharray={2 * Math.PI * 42}
                strokeDashoffset={(2 * Math.PI * 42) - ((2 * Math.PI * 42) * stabilizeProgress) / 100}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.08s linear", transform: "rotate(-90 50 50)" }}
              />
            )}
          </svg>

          <div style={s.camCircle}>
            <video ref={videoRef} autoPlay playsInline muted style={s.video} />
            {isStarted && !isDone && <div style={s.scanLine} />}

            {!isStarted && modelsLoaded && (
              <div style={s.overlay}>
                <button style={s.btnStart} onClick={handleStart}>Démarrer</button>
              </div>
            )}

            {isDone && (
              <div style={s.doneOverlay}>
                <div style={s.checkMark}>✓</div>
                <p style={{fontWeight: 700, margin: "10px 0"}}>Configuration Terminée</p>
                <button style={s.btnResetSmall} onClick={handleReset}>Réinitialiser</button>
              </div>
            )}
          </div>
        </div>

        <div style={s.hintArea}>
          {isStarted && !isDone ? (
            faceLost ? (
              // [FIX] Message explicite quand aucun visage n'est détecté depuis
              // un moment, pour éviter l'impression d'application bloquée.
              <div style={s.faceLostBox}>
                <p style={s.faceLostTitle}>Visage non détecté</p>
                <p style={s.subHint}>Rapprochez-vous ou améliorez l'éclairage</p>
              </div>
            ) : inZoneId ? (
              <div style={s.stabilizeBox}>
                <p style={s.stabilizeTitle}>✔ Bonne position</p>
                <p style={s.stabilizeSub}>Stabilisez...</p>
              </div>
            ) : (
              <>
                <p style={s.stepTag}>Étape {doneIds.length + 1} / {ZONES.length}</p>
                <h2 style={s.mainHint}>
                  {nextPos ? nextPos.guide : "Analyse..."}
                </h2>
                <p style={s.subHint}>Position : {nextPos?.label}</p>
              </>
            )
          ) : (
            <>
              <h2 style={s.mainHint}>Bienvenue</h2>
              <p style={s.subHint}>{hint}</p>
            </>
          )}
        </div>
      </main>

      <footer style={s.footer}>
        {isDone ? (
          <button style={s.btnFinish} onClick={() => navigate("/profile")}>Terminer</button>
        ) : isStarted ? (
          <button style={s.btnResetLink} onClick={handleReset}>Réinitialiser tout</button>
        ) : null}
      </footer>
      <canvas ref={canvasRef} style={{display:"none"}} />
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "#f8fafc", color: "#1a1a2e", display: "flex", flexDirection: "column", fontFamily: "sans-serif" },
  nav: { height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", borderBottom: "1px solid #e5e7ef", background: "#fff" },
  backBtn: { border: "none", background: "none", fontSize: 20, cursor: "pointer", color: "#5b4afd" },
  navTitle: { fontSize: 16, fontWeight: 700, color: "#1a1a2e" },

  main: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "20px" },

  posList: { listStyle: "none", margin: "0 0 26px", padding: 0, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, maxWidth: 360 },
  posItem: { display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20, background: "#fff", border: "1px solid #ececf3" },
  posItemCurrent: { background: "#f1effe", border: "1px solid #5b4afd" },
  posIcon: { fontSize: 14, fontWeight: 700, lineHeight: 1, width: 16, textAlign: "center" },
  posIconDone: { color: "#10b981" },
  posIconCurrent: { color: "#5b4afd" },
  posIconTodo: { color: "#c4c4ce" },
  posLabel: { fontSize: 13.5, fontWeight: 600 },
  posLabelDone: { color: "#10b981" },
  posLabelCurrent: { color: "#5b4afd" },
  posLabelTodo: { color: "#9a9aa8" },
  posCurrentTag: { fontSize: 10.5, fontWeight: 700, color: "#5b4afd", background: "#e3e0ff", borderRadius: 10, padding: "2px 7px", textTransform: "uppercase", letterSpacing: 0.3 },

  camWrapper: { position: "relative", width: 300, height: 300, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 30 },
  svgRing: { position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 2 },
  camCircle: { width: 230, height: 230, borderRadius: "50%", overflow: "hidden", position: "relative", border: "1px solid #efefef", boxShadow: "0 8px 24px rgba(0,0,0,0.03)" },
  video: { width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" },
  scanLine: { position: "absolute", inset: 0, height: 2, background: "#5b4afd", animation: "scanline 2s infinite" },

  overlay: { position: "absolute", inset: 0, background: "rgba(255,255,255,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 },
  btnStart: { background: "#5b4afd", color: "#fff", border: "none", padding: "12px 24px", borderRadius: 8, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(91,74,253,0.2)" },

  doneOverlay: {
    position: "absolute",
    inset: 0,
    background: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20
  },
  checkMark: { width: 50, height: 50, borderRadius: "50%", background: "#10b981", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: "bold" },
  btnResetSmall: { background: "#f3f4f6", border: "1px solid #ddd", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", marginTop: 15 },

  hintArea: { textAlign: "center", minHeight: 100 },
  stepTag: { fontSize: 13, fontWeight: 700, color: "#5b4afd", textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 6px" },
  mainHint: { fontSize: 22, fontWeight: 800, margin: "0 0 8px", color: "#1a1a2e" },
  subHint: { fontSize: 15, color: "#666" },
  stabilizeBox: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", animation: "popIn 0.25s ease" },
  stabilizeTitle: { fontSize: 22, fontWeight: 800, color: "#10b981", margin: "0 0 6px" },
  stabilizeSub: { fontSize: 15, color: "#666", margin: 0 },
  // [FIX] Style du message "visage non détecté"
  faceLostBox: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", animation: "popIn 0.25s ease" },
  faceLostTitle: { fontSize: 20, fontWeight: 800, color: "#e1574c", margin: "0 0 6px" },

  footer: { padding: "20px", textAlign: "center" },
  btnFinish: { width: "100%", maxWidth: 300, background: "#5b4afd", color: "#fff", border: "none", padding: "14px", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(91,74,253,0.2)" },
  btnResetLink: { background: "none", border: "none", color: "#999", fontSize: 13, cursor: "pointer", textDecoration: "underline" },
};