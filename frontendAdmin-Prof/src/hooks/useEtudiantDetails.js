// hooks/useEtudiantProfil.js
import { useState, useEffect } from "react";
import api from "../utils/api";

export function useEtudiantDetails(etudiantId) {
  const [profil, setProfil]   = useState(null);
  const [error, setError]     = useState(null);

  // ✅ Corrigé
const [loading, setLoading] = useState(true);  // ← true dès le départ

useEffect(() => {
    if (!etudiantId) return;
    // ← supprime setLoading(true) ici
    api.get(`/etudiants/${etudiantId}/detail`)
        .then(res => setProfil(res.data))
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
}, [etudiantId]);

  return { profil, loading, error };
}