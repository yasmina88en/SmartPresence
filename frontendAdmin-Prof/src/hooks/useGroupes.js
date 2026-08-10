import { useState, useEffect, useCallback } from "react";
import api from "../utils/api";

export function useGroupes(niveauId) {
  const [groupes, setGroupes] = useState([]);

  const fetchGroupes = useCallback(async () => {
    if (!niveauId) {
      setGroupes([]);
      return;
    }
    try {
      const res = await api.get(`/groupes/niveau/${niveauId}`);
      setGroupes(res.data);
    } catch (err) {
      console.error("Erreur groupes:", err);
    }
  }, [niveauId]);

  useEffect(() => {
    fetchGroupes();
  }, [fetchGroupes]);

  return { groupes };
}