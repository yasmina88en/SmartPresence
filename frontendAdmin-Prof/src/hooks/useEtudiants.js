import { useState, useEffect, useCallback } from "react";
import api from "../utils/api";

export function useEtudiants(niveauId) {
  const [etudiants, setEtudiants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEtudiants = useCallback(async () => {
    if (!niveauId) { setEtudiants([]); return; }
    setLoading(true);
    try {
      const res = await api.get(`/etudiants/niveau/${niveauId}`);
      setEtudiants(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la récupération des étudiants");
    } finally {
      setLoading(false);
    }
  }, [niveauId]);

  useEffect(() => { fetchEtudiants(); }, [fetchEtudiants]);

  const importExcel = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("niveau_id", niveauId);
    try {
      const res = await api.post(`/etudiants/import-excel`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchEtudiants();
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.detail || "Erreur lors de l'import" };
    }
  };

  const deleteAllEtudiants = async () => {
    try {
      await api.delete(`/etudiants/niveau/${niveauId}/all`);
      await fetchEtudiants();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.detail || "Erreur lors de la suppression" };
    }
  };

  // groupe_id inclus dans la mise à jour
  const updateEtudiant = async (id, { nom, prenom, email, groupe_id }) => {
    try {
      await api.put(`/etudiants/${id}`, { nom, prenom, email, groupe_id });
      await fetchEtudiants();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.detail || "Erreur lors de la modification" };
    }
  };

  const deleteEtudiant = async (id) => {
    try {
      await api.delete(`/etudiants/${id}`);
      await fetchEtudiants();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.detail || "Erreur lors de la suppression" };
    }
  };

  return {
    etudiants, loading, error, fetchEtudiants,
    importExcel, deleteAllEtudiants, updateEtudiant, deleteEtudiant,
  };
}