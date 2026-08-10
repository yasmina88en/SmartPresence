import { useState, useCallback } from "react";
import api from "../utils/api";

export function useProfSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [metadata, setMetadata] = useState({ subjects: [], niveaux: [] });

  const fetchSessions = useCallback(async (isHistory = false) => {
    setLoading(true);
    try {
      const endpoint = isHistory === "all"
        ? "/prof/sessions/all"
        : isHistory
          ? "/prof/sessions/history"
          : "/prof/sessions";
      const res = await api.get(endpoint);
      setSessions(res.data);
      setError(null);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        window.location.href = "/login/prof";
      } else {
        setError("Erreur lors de la récupération des séances.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMetadata = useCallback(async () => {
    try {
      const res = await api.get("/prof/metadata");
      setMetadata(res.data);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        window.location.href = "/login/prof";
      }
      console.error("Failed to fetch metadata", err);
    }
  }, []);

  const startSession = async (creneauGroupeId) => {
    try {
      const res = await api.post(`/prof/sessions/${creneauGroupeId}/start`, {});
      return { success: true, data: res.data };
    } catch (err) {
      if (err.response && err.response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        window.location.href = "/login/prof";
      }
      return { success: false, error: err.response?.data?.detail || "Erreur lors du lancement" };
    }
  };

  const createManualSession = async (data) => {
    try {
      const res = await api.post("/prof/seance/manual", data);
      return { success: true, data: res.data };
    } catch (err) {
      if (err.response && err.response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        window.location.href = "/login/prof";
      }
      return { success: false, error: err.response?.data?.detail || "Erreur lors de la création manuelle" };
    }
  };

  const endSession = async (seanceId) => {
    try {
      await api.post(`/prof/seance/${seanceId}/end`, {});
      return { success: true };
    } catch (err) {
      if (err.response && err.response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        window.location.href = "/login/prof";
      }
      return { success: false, error: "Erreur lors de la clôture" };
    }
  };

  return {
    sessions, loading, error, metadata,
    fetchSessions, fetchMetadata, startSession, createManualSession, endSession
  };
}