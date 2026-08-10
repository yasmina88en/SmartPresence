import { useState, useEffect, useCallback } from "react";
import api from "../utils/api";

export function useNiveau(niveauId) {
  const [niveauData, setNiveauData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNiveauData = useCallback(async () => {
    if (!niveauId) {
      setNiveauData(null);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/niveaux/${niveauId}`);
      if (!res.data.error) {
        setNiveauData(res.data);
      } else {
        setError(res.data.error);
      }
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la récupération du niveau");
    } finally {
      setLoading(false);
    }
  }, [niveauId]);

  useEffect(() => {
    fetchNiveauData();
  }, [fetchNiveauData]);

  return { niveauData, loading, error, fetchNiveauData };
}
