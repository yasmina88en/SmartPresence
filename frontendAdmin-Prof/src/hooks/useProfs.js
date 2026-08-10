import { useState, useEffect, useCallback } from "react";
import api from "../utils/api";

export function useProfs() {
    const [profs, setProfs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchProfs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get("/profs/");
            setProfs(res.data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError("Erreur lors de la récupération des professeurs");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfs();
    }, [fetchProfs]);

    const addProf = async ({ nom, prenom, email }) => {
        try {
            await api.post(`/profs/`, { nom, prenom, email });
            await fetchProfs();
            return { success: true };
        } catch (err) {
            console.error(err);
            return {
                success: false,
                error: err.response?.data?.detail || "Erreur lors de l'ajout",
            };
        }
    };

    const updateProf = async (id, { nom, prenom, email }) => {
        try {
            await api.put(`/profs/${id}`, { nom, prenom, email });
            await fetchProfs();
            return { success: true };
        } catch (err) {
            console.error(err);
            return {
                success: false,
                error: err.response?.data?.detail || "Erreur lors de la modification",
            };
        }
    };

    const deleteProf = async (id) => {
        try {
            await api.delete(`/profs/${id}`);
            await fetchProfs();
            return { success: true };
        } catch (err) {
            console.error(err);
            return {
                success: false,
                error: err.response?.data?.detail || "Erreur lors de la suppression",
            };
        }
    };

    return { profs, loading, error, fetchProfs, addProf, updateProf, deleteProf };
}