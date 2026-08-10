import api from "../utils/api";
import { useState,useCallback ,useEffect} from "react";
export function useEmploi(niveauId) {
  const [emploiUrl, setEmploiUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEmploi = useCallback(async () => {
    if (!niveauId) {
      setEmploiUrl(null);
      return;
    }
    setLoading(true);
    try {
      const r = await api.get(`/emploi-file/${niveauId}`);
      setEmploiUrl(r.data.url);
      setError(null);
    } catch  {
      setEmploiUrl(null);
      // We don't always set error here because it's common for a niveau to not have an emploi yet
    } finally {
      setLoading(false);
    }
  }, [niveauId]);

  useEffect(() => {
    fetchEmploi();
  }, [fetchEmploi]);

  const uploadEmploi = async (file) => {
    if (!file || !niveauId) return { success: false, error: "Fichier ou niveau non spécifié" };
    setUploading(true);
    
    const form = new FormData();
    form.append("file", file);
    
    try {
      await api.post(`/upload-emploi/${niveauId}`, form, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      await fetchEmploi();
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: err.response?.data?.detail || "Erreur lors de l'upload." };
    } finally {
      setUploading(false);
    }
  };

  return { emploiUrl, loading, uploading, error, fetchEmploi, uploadEmploi };
}
