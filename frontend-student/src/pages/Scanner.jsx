import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import api from "../utils/api";
import { useLocation, useNavigate } from "react-router-dom";

export default function Scanner() {
  const scannerRef = useRef(null);
  const isStarting = useRef(false);
  const hasScanned = useRef(false); 

  const location = useLocation();
  const navigate = useNavigate();
  const seanceId = location.state?.seanceId;

  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [cameras, setCameras] = useState([]);
  const [selectedCam, setSelectedCam] = useState("");
  const [debugLog, setDebugLog] = useState([]);

  // Si pas de seanceId, on redirige
  useEffect(() => {
    if (!seanceId) {
      navigate("/dash");
    }
  }, [seanceId, navigate]);

  const log = useCallback((msg) => {
    console.log(msg);
    setDebugLog((prev) => [
      ...prev.slice(-10),
      `${new Date().toLocaleTimeString()} – ${msg}`,
    ]);
  }, []);

  // ── Send token ────────────────────────────────────────
  const sendToken = useCallback(
    async (token) => {
      if (hasScanned.current) {
        log("Scan ignoré : déjà scanné");
        return;
      }
      hasScanned.current = true;
      log(`Envoi token...`);

      try {
        const res = await api.post(`/api/etudiant/scanner/${seanceId}`, {
          token,
        });
        setMessage(res.data.message || "Présence enregistrée ✓");
        setStatus("success");
        log("✓ Présence enregistrée");
      } catch (err) {
        const detail = err.response?.data?.detail || "Erreur réseau";
        setMessage(detail);
        setStatus("error");
        log(`✗ Erreur: ${detail}`);
        if (err.response?.status !== 409) {
          hasScanned.current = false;
        }
      }
    },
    [seanceId, log]
  );

  // ── Stop scanner ──────────────────────────────────────
  const stopScanner = useCallback(
    async (qr) => {
      try {
        const state = qr.getState();
        if (state === 2 || state === 3) {
          await qr.stop();
          log("Scanner arrêté");
        }
      } catch (e) {
        log(`Stop ignoré: ${e.message}`);
      }
    },
    [log]
  );

  // ── Start scanner ─────────────────────────────────────
  const startScanner = useCallback(
    async (qr, cameraId) => {
      if (!qr || isStarting.current) return;
      isStarting.current = true;
      hasScanned.current = false; 

      setStatus("scanning");
      setMessage("");
      log("Démarrage scanner...");

      const qrConfig = {
        fps: 10,
        qrbox: { width: 200, height: 200 },
        aspectRatio: 1.0,
        disableFlip: false,
      };

      const onSuccess = (decodedText) => {
        stopScanner(qr);
        sendToken(decodedText);
      };

      const onError = () => {};

      try {
        log("Essai facingMode environment...");
        await qr.start(
          { facingMode: "environment" },
          qrConfig,
          onSuccess,
          onError
        );
        log("✓ Caméra environment OK");
        isStarting.current = false;
        return;
      } catch (e) {
        log(`✗ environment échoué: ${e.message}`);
        await stopScanner(qr);
      }

      if (cameraId) {
        try {
          log(`Essai deviceId...`);
          await qr.start(
            { deviceId: { exact: cameraId } },
            qrConfig,
            onSuccess,
            onError
          );
          log("✓ deviceId OK");
          isStarting.current = false;
          return;
        } catch (e) {
          log(`✗ deviceId échoué: ${e.message}`);
          await stopScanner(qr);
        }
      }

      try {
        log("Essai facingMode user...");
        await qr.start(
          { facingMode: "user" },
          qrConfig,
          onSuccess,
          onError
        );
        log("✓ Caméra user OK");
        isStarting.current = false;
        return;
      } catch (e) {
        log(`✗ user échoué: ${e.message}`);
      }

      setMessage("Impossible d'ouvrir la caméra. Vérifiez permissions + HTTPS.");
      setStatus("error");
      log("✗ Toutes stratégies échouées");
      isStarting.current = false;
    },
    [sendToken, stopScanner, log]
  );

  useEffect(() => {
    const qr = new Html5Qrcode("qr-reader");
    scannerRef.current = qr;

    Html5Qrcode.getCameras()
      .then((devices) => {
        log(`Caméras: ${devices.length}`);
        if (!devices || devices.length === 0) {
          startScanner(qr, null);
          return;
        }
        setCameras(devices);
        const back = devices.find((d) =>
          /back|arrière|rear|environment/i.test(d.label)
        );
        const camId = back ? back.id : devices[0].id;
        setSelectedCam(camId);
        startScanner(qr, camId);
      })
      .catch((err) => {
        log(`getCameras échoué: ${err.message}`);
        startScanner(qr, null);
      });

    return () => {
      stopScanner(qr);
    };
  }, [startScanner, stopScanner, log]);

  const handleCameraChange = async (e) => {
    const camId = e.target.value;
    setSelectedCam(camId);
    isStarting.current = false;
    await stopScanner(scannerRef.current);
    startScanner(scannerRef.current, camId);
  };

  const retry = async () => {
    setStatus("idle");
    setMessage("");
    setDebugLog([]);
    isStarting.current = false;
    hasScanned.current = false;
    await stopScanner(scannerRef.current);
    startScanner(scannerRef.current, selectedCam);
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>Scanner QR</h2>

      {cameras.length > 1 && (
        <select
          value={selectedCam}
          onChange={handleCameraChange}
          style={styles.select}
        >
          {cameras.map((cam) => (
            <option key={cam.id} value={cam.id}>
              {cam.label || cam.id}
            </option>
          ))}
        </select>
      )}

      <div id="qr-reader" style={styles.reader} />

      {message && (
        <p
          style={{
            ...styles.message,
            color:
              status === "success"
                ? "#4caf50"
                : status === "error"
                ? "#f44336"
                : "#fff",
          }}
        >
          {message}
        </p>
      )}

      {(status === "error" || status === "success") && (
        <button onClick={retry} style={styles.button}>
          Scanner à nouveau
        </button>
      )}

      <div style={styles.debug}>
        <p style={{ color: "#aaa", margin: "0 0 4px" }}>── Debug ──</p>
        {debugLog.map((l, i) => (
          <p
            key={i}
            style={{
              margin: "2px 0",
              color: l.includes("✓")
                ? "#4caf50"
                : l.includes("✗")
                ? "#f44336"
                : "#fff",
            }}
          >
            {l}
          </p>
        ))}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#111",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: 20,
  },
  title: { marginBottom: 20 },
  reader: {
    width: 300,
    height: 300,
    borderRadius: 10,
    overflow: "hidden",
    background: "#222",
  },
  select: { marginBottom: 10, padding: 8, width: 280 },
  message: { marginTop: 15, textAlign: "center", maxWidth: 280 },
  button: {
    marginTop: 10,
    padding: "10px 24px",
    cursor: "pointer",
    borderRadius: 8,
    border: "none",
    background: "#5b4afd",
    color: "#fff",
    fontSize: 16,
    boxShadow: "0 4px 12px rgba(91,74,253,0.3)",
  },
  debug: {
    marginTop: 20,
    background: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: 8,
    padding: 10,
    width: 290,
    fontSize: 11,
    fontFamily: "monospace",
    wordBreak: "break-all",
  },
};