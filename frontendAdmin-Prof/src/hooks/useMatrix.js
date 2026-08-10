import { useState, useEffect, useCallback, useMemo } from "react";
import api from "../utils/api";
import * as XLSX from "xlsx";

export function useMatrix(matiereId, niveauId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  const fetchMatrix = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/prof/matiere/${matiereId}/niveau/${niveauId}/matrix`);
      setData(res.data);
      setError("");
    } catch  {
      setError("Erreur lors de la récupération des données.");
    } finally {
      setLoading(false);
    }
  }, [matiereId, niveauId]);

  useEffect(() => {
    if (matiereId && niveauId) {
      fetchMatrix();
    }
  }, [matiereId, niveauId, fetchMatrix]);

  const filteredSessions = useMemo(() => {
    return data?.sessions.filter(s => {
      if (!selectedMonth) return true;
      const sessionMonth = new Date(s.date).toISOString().slice(0, 7); // "YYYY-MM"
      return sessionMonth === selectedMonth;
    }) || [];
  }, [data, selectedMonth]);

  const filteredStudents = useMemo(() => {
    return data?.students.map(student => ({
      ...student,
      presences: student.presences.filter(p => filteredSessions.some(s => s.id === p.seance_id))
    })) || [];
  }, [data, filteredSessions]);

  const availableMonths = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.sessions.map(s => new Date(s.date).toISOString().slice(0, 7)))].sort().reverse();
  }, [data]);

  const exportToExcel = useCallback(() => {
    if (!data) return;

    const headers = ["Étudiant", ...filteredSessions.map(s => `${new Date(s.date).toLocaleDateString()} (${s.heure})`), "Taux (%)"];
    
    const rows = filteredStudents.map(student => {
      const studentPresences = filteredSessions.map(s => {
        const p = student.presences.find(pr => pr.seance_id === s.id);
        return p?.statut === "PRESENT" ? "P" : "A";
      });
      
      const presentCount = studentPresences.filter(p => p === "P").length;
      const rate = filteredSessions.length > 0 ? Math.round((presentCount / filteredSessions.length) * 100) : 0;
      
      return [
        `${student.nom} ${student.prenom}`,
        ...studentPresences,
        rate
      ];
    });

    const worksheetData = [
      [`Récapitulatif de Présence - ${data.matiere_name}`],
      [`Niveau: ${data.niveau_name}`],
      [], 
      headers,
      ...rows
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(wb, ws, "Présences");
    XLSX.writeFile(wb, `Presences_${data.matiere_name}_${data.niveau_name}_${new Date().toISOString().split('T')[0]}.xlsx`);
  }, [data, filteredSessions, filteredStudents]);

  return {
    data,
    loading,
    error,
    selectedMonth,
    setSelectedMonth,
    filteredSessions,
    filteredStudents,
    availableMonths,
    exportToExcel,
    refresh: fetchMatrix
  };
}
