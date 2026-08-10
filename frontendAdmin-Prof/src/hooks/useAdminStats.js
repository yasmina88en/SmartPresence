import { useState, useEffect, useCallback } from "react";
import api from "../utils/api";

export function useAdminStats() {
  const [stats, setStats] = useState({
    filieres: 0,
    niveaux: 0,
    professeurs: 0,
    etudiants: 0,
    creneaux: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/auth/admin-stats");
      setStats(response.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la récupération des statistiques");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, fetchStats };
}
