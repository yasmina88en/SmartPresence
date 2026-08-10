import { useState, useEffect, useCallback } from "react";
import api from "../utils/api";

export function useNiveaux(filiereId) {
  const [niveaux, setNiveaux] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNiveaux = useCallback(async () => {
    if (!filiereId) {
      setNiveaux([]);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/niveaux/filieres/${filiereId}`);
      setNiveaux(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la récupération des niveaux");
    } finally {
      setLoading(false);
    }
  }, [filiereId]);

  useEffect(() => {
    fetchNiveaux();
  }, [fetchNiveaux]);

  const addNiveau = async (filiere_id, nom) => {
    try {
      await api.post(`/niveaux`, { nom, filiere_id: parseInt(filiere_id) });
      await fetchNiveaux();
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: err.response?.data?.detail || "Erreur lors de l'ajout" };
    }
  };

  const updateNiveau = async (id, filiere_id, nom) => {
    try {
      await api.put(`/niveaux/${id}`, { nom, filiere_id: parseInt(filiere_id) });
      await fetchNiveaux();
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: err.response?.data?.detail || "Erreur lors de la modification" };
    }
  };

  const deleteNiveau = async (id) => {
    try {
      await api.delete(`/niveaux/${id}`);
      await fetchNiveaux();
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: err.response?.data?.detail || "Erreur lors de la suppression" };
    }
  };

  return { niveaux, loading, error, fetchNiveaux, addNiveau, updateNiveau, deleteNiveau };
}
