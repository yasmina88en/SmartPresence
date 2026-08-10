import { useParams } from "react-router-dom";
import { useState, useRef } from "react";
import {
  Upload, FileSpreadsheet, Eye,
  FolderOpen, AlertCircle, CheckCircle, Trash2
} from "lucide-react";

import { useFilieres } from "../../hooks/useFilieres";
import { useNiveaux } from "../../hooks/useNiveaux";
import { useEmploi } from "../../hooks/useEmploi";
import PageHeader from "../../components/PageHeader";
import ConfirmDialog from "../../components/ConfirmDialog";
import SelectField from "../../components/SelectField";
import EmptyState from "../../components/EmptyState";
import api from "../../utils/api";

const API = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

const Spinner = ({ size = 22, color = "#7c3aed", border = 3 }) => (
  <div style={{
    width: size, height: size,
    border: `${border}px solid ${color}`,
    borderTopColor: "transparent",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite"
  }} />
);

export default function EmploiTemps() {
  const { id, niveauId } = useParams();

  const { filieres } = useFilieres();
  const [selectedFiliere, setSelectedFiliere] = useState(id || "");
  const { niveaux } = useNiveaux(selectedFiliere);
  const [selectedNiveau, setSelectedNiveau] = useState(niveauId || "");

  const { emploiUrl, uploadEmploi, uploading, fetchEmploi } = useEmploi(selectedNiveau);

  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef();

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    console.log("FILE:", file);
    console.log("SELECTED NIVEAU:", selectedNiveau);
    if (!file || !selectedNiveau) return;
    const res = await uploadEmploi(file);
    if (res.success) showToast("Emploi du temps uploadé avec succès !");
    else showToast(res.error, "error");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDelete = async () => {
    if (!selectedNiveau) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/emploi/${selectedNiveau}`);
      showToast("Emploi du temps supprimé avec succès !");
      setConfirmDelete(false);
      fetchEmploi(); // On utilise la fonction du hook pour rafraîchir
    } catch (err) {
      showToast(err.response?.data?.detail || "Erreur lors de la suppression", "error");
    } finally {
      setDeleting(false);
    }
  };

  /* ─────────────────────────────────────────── */
  return (
    <div style={{ padding: "1rem", maxWidth: "900px", margin: "0 auto", fontFamily: "var(--font-sans, system-ui)" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: "1.5rem", right: "1.5rem", zIndex: 1100,
          display: "flex", alignItems: "center", gap: "10px",
          background: toast.type === "success" ? "#f0fdf4" : "#fef2f2",
          border: `1px solid ${toast.type === "success" ? "#bbf7d0" : "#fecaca"}`,
          color: toast.type === "success" ? "#16a34a" : "#dc2626",
          borderRadius: "12px", padding: "12px 18px",
          fontSize: "14px", fontWeight: 500,
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)"
        }}>
          {toast.type === "success"
            ? <CheckCircle size={16} />
            : <AlertCircle size={16} />
          }
          {toast.msg}
        </div>
      )}

      {/* Header */}
      {!niveauId && (
        <PageHeader
          title="Emplois du temps"
          subtitle="Uploadez les fichiers Excel d'emplois du temps"
          color="#7c3aed"
          bgColor="#f5f3ff"
        />
      )}

      {/* Filtres */}
      {!niveauId && (
        <div style={{
          background: "white", borderRadius: "16px",
          border: "1px solid #efefef", padding: "1.5rem",
          marginBottom: "1.5rem", boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem"
        }}>
          <SelectField
            label="1. Choisir une filière"
            value={selectedFiliere}
            onChange={(e) => { setSelectedFiliere(e.target.value); setSelectedNiveau(""); }}
            options={filieres}
            placeholder="-- Filière --"
          />
          <SelectField
            label="2. Choisir un niveau"
            value={selectedNiveau}
            onChange={(e) => setSelectedNiveau(e.target.value)}
            options={niveaux}
            disabled={!selectedFiliere}
            placeholder="-- Niveau --"
          />
        </div>
      )}

      {/* Contenu */}
      {selectedNiveau ? (
        <div>
          {/* Zone Upload */}
          <div
            onClick={() => fileRef.current.click()}
            style={{
              background: "white", border: "2px dashed #ede9fe",
              borderRadius: "16px", padding: "2.5rem",
              textAlign: "center", cursor: "pointer",
              marginBottom: "1.5rem", transition: "border-color 0.2s",
              boxShadow: "0 4px 12px rgba(0,0,0,0.02)"
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              style={{ display: "none" }}
              onChange={handleUpload}
            />
            <div style={{
              width: "52px", height: "52px", borderRadius: "50%",
              background: "#f5f3ff", display: "flex", alignItems: "center",
              justifyContent: "center", margin: "0 auto 1rem"
            }}>
              {uploading
                ? <Spinner size={22} color="#7c3aed" border={3} />
                : <Upload size={22} color="#7c3aed" />
              }
            </div>
            <p style={{ fontSize: "15px", fontWeight: 600, color: "#1a1a2e", margin: "0 0 4px" }}>
              {uploading ? "Upload et analyse en cours..." : "Cliquez pour uploader un emploi (.xlsx)"}
            </p>
            <p style={{ fontSize: "13px", color: "#aaa", margin: 0 }}>
              Le nouveau fichier remplacera l'ancien.
            </p>
          </div>

          {/* Fichier Actuel */}
          <div style={{
            background: "white", borderRadius: "16px",
            border: "1px solid #efefef", overflow: "hidden",
            boxShadow: "0 4px 12px rgba(0,0,0,0.03)"
          }}>
            {/* Card header */}
            <div style={{
              padding: "1rem 1.5rem", borderBottom: "1px solid #f5f5f5",
              display: "flex", alignItems: "center", gap: "8px", background: "#fafbff"
            }}>
              <FolderOpen size={16} color="#7c3aed" />
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#1a1a2e" }}>
                Fichier actif
              </span>
            </div>

            {/* Card body */}
            {!emploiUrl ? (
              <div style={{ padding: "3rem", textAlign: "center" }}>
                <FileSpreadsheet size={36} color="#e5e7eb" style={{ margin: "0 auto 0.75rem" }} />
                <p style={{ fontSize: "14px", color: "#9ca3af", margin: 0 }}>
                  Aucun emploi du temps n'a encore été uploadé pour ce niveau.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1.5rem" }}>

                {/* Icône */}
                <div style={{
                  width: "48px", height: "48px", borderRadius: "12px",
                  background: "#f0fdf4", display: "flex",
                  alignItems: "center", justifyContent: "center", flexShrink: 0
                }}>
                  <FileSpreadsheet size={24} color="#16a34a" />
                </div>

                {/* Texte */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "15px", fontWeight: 600, color: "#1a1a2e", margin: 0 }}>
                    Emploi du temps (Actuel)
                  </p>
                  <p style={{ fontSize: "13px", color: "#16a34a", margin: "4px 0 0", fontWeight: 500 }}>
                    Opérationnel et lié à ce niveau
                  </p>
                </div>

                {/* Boutons */}
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <a
                    href={`${API}${emploiUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "flex", alignItems: "center", gap: "6px",
                      padding: "8px 16px", borderRadius: "10px",
                      background: "#f5f3ff", color: "#7c3aed",
                      fontSize: "14px", fontWeight: 600, textDecoration: "none",
                    }}
                  >
                    <Eye size={16} />
                    Voir
                  </a>
                  <button
                    onClick={() => setConfirmDelete(true)}
                    style={{
                      display: "flex", alignItems: "center", gap: "6px",
                      padding: "8px 16px", borderRadius: "10px",
                      background: "#fef2f2", color: "#dc2626", border: "none",
                      fontSize: "14px", fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    <Trash2 size={16} />
                    Supprimer
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={FolderOpen}
          message="Veuillez sélectionner une filière et un niveau pour gérer l'emploi du temps."
        />
      )}

      <ConfirmDialog
        isOpen={confirmDelete}
        title="Supprimer l'emploi du temps ?"
        message="Cette action supprimera définitivement l'emploi du temps ainsi que tous les créneaux et groupes associés à ce niveau."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
        confirmText="Confirmer la suppression"
        cancelText="Annuler"
        type="danger"
        isLoading={deleting}
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}