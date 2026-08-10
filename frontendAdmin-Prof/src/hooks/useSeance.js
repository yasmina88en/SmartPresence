import { useState, useEffect, useCallback } from "react";
import api from "../utils/api";

export function useSeance(seanceId) {
  const [qrToken, setQrToken] = useState("");
  const [timeLeft, setTimeLeft] = useState(120);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [sessionStatus, setSessionStatus] = useState("ACTIVE");
  const [presences, setPresences] = useState([]);

  const fetchPresences = useCallback(async () => {
    try {
      const res = await api.get(`/prof/seance/${seanceId}/presences`);
      setPresences(res.data);
      setAttendanceCount(res.data.filter(p => p.statut === "PRESENT").length);
    } catch {
      console.error("Failed to fetch presences");
    }
  }, [seanceId]);

  const fetchQRCode = useCallback(async (force = false) => {
    try {
      const res = await api.get(`/prof/seance/${seanceId}/qrcode?force=${force}`);
      setQrToken(res.data.token || "");
      setTimeLeft(res.data.seconds_left || 0);
      setAttendanceCount(res.data.attendance_count);
      setSessionStatus(res.data.statut);
      
      if (res.data.statut === "TERMINEE") {
        fetchPresences();
      }
      setError("");
    } catch (err) {
      if (err.response && err.response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        window.location.href = "/login/prof";
      } else if (err.response && err.response.status === 404) {
        setSessionStatus("TERMINÉE");
        fetchPresences();
      } else {
        setError("Erreur de connexion au serveur.");
      }
    } finally {
      setLoading(false);
    }
  }, [seanceId, fetchPresences]);

  const fetchAttendanceOnly = useCallback(async () => {
    try {
      const res = await api.get(`/prof/seance/${seanceId}/qrcode`);
      setAttendanceCount(res.data.attendance_count);
    } catch {
      console.error("Failed to fetch attendance");
    }
  }, [seanceId]);

  const endSeance = useCallback(async () => {
    try {
      await api.post(`/prof/seance/${seanceId}/end`, {});
      return { success: true };
    } catch {
      return { success: false, error: "Erreur lors de la clôture" };
    }
  }, [seanceId]);

  useEffect(() => {
    if (!seanceId) return;
    
    fetchQRCode();
    
    // Periodically fetch everything: QR token, counts, and student names
    const dataInterval = setInterval(() => {
      fetchQRCode(); // Refresh token & count
      if (sessionStatus === "ACTIVE") {
        fetchPresences(); // Refresh the list of students who scanned
      }
    }, 5000);

    const interval = setInterval(() => {
      if (sessionStatus === "TERMINÉE") return;
      setTimeLeft((prev) => {
        if (prev <= 1) {
          fetchQRCode();
          return 120;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(dataInterval);
    };
  }, [seanceId, fetchQRCode, fetchAttendanceOnly, sessionStatus]);

  return {
    qrToken,
    timeLeft,
    loading,
    error,
    attendanceCount,
    sessionStatus,
    presences,
    refreshQRCode: fetchQRCode,
    endSeance
  };
}
