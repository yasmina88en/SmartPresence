import { useParams,useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import {
  Users, FolderOpen, Mail, User, Save,
  Upload, FileSpreadsheet, CheckCircle, AlertCircle, X, Trash2,
} from "lucide-react";
import { useFilieres } from "../../hooks/useFilieres";
import { useNiveaux } from "../../hooks/useNiveaux";
import { useEtudiants } from "../../hooks/useEtudiants";
import { useGroupes } from "../../hooks/useGroupes";
import PageHeader from "../../components/PageHeader";
import SelectField from "../../components/SelectField";
import EmptyState from "../../components/EmptyState";


export default function Etudiants() {
  const navigate = useNavigate();
  const { id, niveauId } = useParams();

  const { filieres } = useFilieres();
  const [selectedFiliere, setSelectedFiliere] = useState(id || "");
  const { niveaux } = useNiveaux(selectedFiliere);
  const [selectedNiveau, setSelectedNiveau] = useState(niveauId || "");

  const { etudiants, importExcel, deleteAllEtudiants, updateEtudiant, deleteEtudiant } =
    useEtudiants(selectedNiveau);

  const { groupes } = useGroupes(selectedNiveau);

  // ── Modification ──
  const [editingId, setEditingId]   = useState(null);
  const [editNom, setEditNom]       = useState("");
  const [editPrenom, setEditPrenom] = useState("");
  const [editGroupeId, setEditGroupeId] = useState("");

  // ── Import Excel ──
  const fileInputRef = useRef(null);
  const [importFile, setImportFile]     = useState(null);
  const [importing, setImporting]       = useState(false);
  const [importResult, setImportResult] = useState(null);

  // ── Filtre groupe ──
  const [filterGroupe, setFilterGroupe] = useState("tous");

  const resetEdit = () => {
    setEditingId(null);
    setEditNom("");
    setEditPrenom("");
    setEditGroupeId("");
  };

  // [FIX] Ajout du paramètre d'événement `e` + stopPropagation, pour
  // empêcher le clic de remonter jusqu'au onClick du conteneur de ligne
  // (qui navigue vers la page de détail de l'étudiant).
  const handleEdit = (e, etud) => {
    e.stopPropagation();
    setEditingId(etud.id);
    setEditNom(etud.nom);
    setEditPrenom(etud.prenom);
    setEditGroupeId(etud.groupe_id ?? "");
    setImportResult(null);
  };

  const handleSave = async (e, etud) => {
    e.stopPropagation();
    if (!editNom.trim() || !editPrenom.trim()) return;
    const res = await updateEtudiant(etud.id, {
      nom: editNom,
      prenom: editPrenom,
      email: etud.email,
      groupe_id: editGroupeId === "" ? null : parseInt(editGroupeId),
    });
    if (res.success) resetEdit();
    else alert(res.error);
  };

  // [FIX] resetEdit (bouton "Annuler") est aussi dans la ligne cliquable :
  // il a besoin du même traitement.
  const handleCancelEdit = (e) => {
    e.stopPropagation();
    resetEdit();
  };

const [confirmDelete, setConfirmDelete] = useState(null);      // id étudiant
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // [FIX] Idem : stopPropagation pour ouvrir la confirmation de suppression
  // sans déclencher la navigation vers le détail.
  const handleAskDelete = (e, etudId) => {
    e.stopPropagation();
    setConfirmDelete(etudId);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    const res = await deleteEtudiant(confirmDelete);
    if (!res.success) alert(res.error);
    setDeleting(false);
    setConfirmDelete(null);
  };

  const handleDeleteAll = async () => {
    setDeleting(true);
    const res = await deleteAllEtudiants();
    if (!res.success) alert(res.error);
    else setImportResult(null);
    setDeleting(false);
    setConfirmDeleteAll(false);
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) { setImportFile(f); setImportResult(null); }
  };

  const handleRemoveFile = (e) => {
    e.preventDefault();
    setImportFile(null);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImport = async () => {
    if (!importFile || !selectedNiveau) return;
    setImporting(true);
    setImportResult(null);
    const res = await importExcel(importFile);
    setImporting(false);
    if (res.success) {
      setImportResult({ success: true, message: res.data.message, errors: res.data.errors });
      setImportFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } else {
      setImportResult({ success: false, message: res.error, errors: [] });
    }
  };



  // Groupes présents dans la liste pour le filtre
  const groupesDisponibles = [...new Map(
    etudiants.filter((e) => e.groupe).map((e) => [e.groupe.id, e.groupe])
  ).values()];

  const etudiantsFiltres =
    filterGroupe === "tous"
      ? etudiants
      : etudiants.filter((e) => String(e.groupe?.id) === filterGroupe);

  // ── Styles réutilisables (repris du style original) ──
  const cardStyle = {
    background: "white",
    borderRadius: "16px",
    border: "1px solid #efefef",
    padding: "1.5rem",
    marginBottom: "1.5rem",
    boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    border: "1.5px solid #e5e7ef",
    borderRadius: "10px",
    fontSize: "14px",
    color: "#1a1a2e",
    background: "#fafbff",
    outline: "none",
    boxSizing: "border-box",
  };

  const btnPrimary = {
    padding: "10px 20px",
    background: "#d97706",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    whiteSpace: "nowrap",
  };

  const btnSecondary = {
    padding: "10px 16px",
    background: "#f1f5f9",
    color: "#475569",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  const btnDanger = {
    padding: "9px 18px",
    background: "#fef2f2",
    color: "#dc2626",
    border: "1px solid #fecaca",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  };

  return (
    <div style={{ padding: "1rem", maxWidth: "960px", margin: "0 auto", fontFamily: "var(--font-sans, system-ui)" }}>

      {!niveauId && (
        <PageHeader
          title="Étudiants"
          subtitle="Gérez les comptes étudiants par niveau"
          color="#d97706"
          bgColor="#fffbeb"
        />
      )}

      {/* ── Sélecteurs filière / niveau ── */}
      {!niveauId && (
        <div style={{ ...cardStyle, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <SelectField
            label="1. Choisir une filière"
            value={selectedFiliere}
            onChange={(e) => {
              setSelectedFiliere(e.target.value);
              setSelectedNiveau("");
              resetEdit();
              setImportResult(null);
              setFilterGroupe("tous");
            }}
            options={filieres}
            placeholder="-- Filière --"
          />
          <SelectField
            label="2. Choisir un niveau"
            value={selectedNiveau}
            onChange={(e) => {
              setSelectedNiveau(e.target.value);
              resetEdit();
              setImportResult(null);
              setFilterGroupe("tous");
            }}
            options={niveaux}
            disabled={!selectedFiliere}
            placeholder="-- Niveau --"
          />
        </div>
      )}

      {selectedNiveau ? (
        <>
          {/* ── Import Excel ── */}
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem" }}>
              <FileSpreadsheet size={18} color="#16a34a" />
              <p style={{ fontSize: "14px", fontWeight: 600, color: "#1a1a2e", margin: 0 }}>
                Importer depuis Excel
              </p>
              <span style={{ fontSize: "12px", color: "#aaa", marginLeft: "4px" }}>
                — colonnes requises : <strong>nom</strong>, <strong>prenom</strong>
                &nbsp;(email généré automatiquement : nom.prenom@ump.ac.ma)
              </span>
            </div>

            {/* Zone fichier + bouton importer */}
            <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
              <label style={{
                flex: 1, minWidth: "200px",
                display: "flex", alignItems: "center", gap: "10px",
                padding: "12px 16px",
                border: "2px dashed #d1fae5",
                borderRadius: "10px",
                background: importFile ? "#f0fdf4" : "#fafffe",
                cursor: "pointer",
              }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
                <Upload size={18} color="#16a34a" />
                <span style={{ fontSize: "14px", color: importFile ? "#16a34a" : "#aaa" }}>
                  {importFile ? importFile.name : "Cliquer pour choisir un fichier .xlsx"}
                </span>
                {importFile && (
                  <X
                    size={16} color="#aaa"
                    style={{ marginLeft: "auto", cursor: "pointer" }}
                    onClick={handleRemoveFile}
                  />
                )}
              </label>

              <button
                onClick={handleImport}
                disabled={!importFile || importing}
                style={{
                  ...btnPrimary,
                  background: importFile ? "#16a34a" : "#d1fae5",
                  cursor: importFile ? "pointer" : "not-allowed",
                }}
              >
                <Upload size={16} />
                {importing ? "Import en cours..." : "Importer"}
              </button>
            </div>

            {/* Supprimer tous les étudiants (reset import) */}
            {etudiants.length > 0 && (
              <div style={{ marginTop: "1rem" }}>
                <button onClick={() => setConfirmDeleteAll(true)} style={btnDanger}>
                  <Trash2 size={14} />
                  Supprimer tous les étudiants de ce niveau
                </button>
              </div>
            )}

            {/* Résultat import */}
            {importResult && (
              <div style={{
                marginTop: "1rem", padding: "12px 16px", borderRadius: "10px",
                background: importResult.success ? "#f0fdf4" : "#fef2f2",
                border: `1px solid ${importResult.success ? "#bbf7d0" : "#fecaca"}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {importResult.success
                    ? <CheckCircle size={16} color="#16a34a" />
                    : <AlertCircle size={16} color="#dc2626" />}
                  <span style={{
                    fontSize: "14px", fontWeight: 600,
                    color: importResult.success ? "#16a34a" : "#dc2626",
                  }}>
                    {importResult.message}
                  </span>
                </div>
                {importResult.errors?.length > 0 && (
                  <ul style={{ margin: "4px 0 0 24px", padding: 0, fontSize: "12px", color: "#d97706" }}>
                    {importResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* ── Liste des étudiants ── */}
          <div style={{ background: "white", borderRadius: "16px", border: "1px solid #efefef", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>

            {/* En-tête avec filtre groupe */}
            <div style={{
              padding: "1rem 1.5rem", borderBottom: "1px solid #f5f5f5",
              display: "flex", alignItems: "center", gap: "8px",
              background: "#fafbff", flexWrap: "wrap",
            }}>
              <Users size={18} color="#d97706" />
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#1a1a2e" }}>
                Liste des étudiants inscrits
              </span>
              <span style={{
                background: "#fffbeb", color: "#d97706",
                fontSize: "12px", fontWeight: 600,
                borderRadius: "20px", padding: "2px 10px",
              }}>
                {etudiantsFiltres.length}
                {filterGroupe !== "tous" && ` / ${etudiants.length}`}
              </span>

              {/* Boutons filtre groupe */}
              {groupesDisponibles.length > 0 && (
                <div style={{ marginLeft: "auto", display: "flex", gap: "6px", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", color: "#888" }}>Groupe :</span>
                  {["tous", ...groupesDisponibles.map((g) => String(g.id))].map((val) => {
                    const label = val === "tous" ? "Tous" : groupesDisponibles.find((g) => String(g.id) === val)?.nom;
                    const active = filterGroupe === val;
                    return (
                      <button
                        key={val}
                        onClick={() => setFilterGroupe(val)}
                        style={{
                          padding: "4px 14px",
                          borderRadius: "20px",
                          border: `1px solid ${active ? "#d97706" : "#e5e7ef"}`,
                          background: active ? "#d97706" : "white",
                          color: active ? "white" : "#555",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Contenu liste */}
            {etudiantsFiltres.length === 0 ? (
              <EmptyState message="Aucun étudiant trouvé." />
            ) : (
              etudiantsFiltres.map((etud, i) => {
                const isEditing = editingId === etud.id;
                const isLast = i === etudiantsFiltres.length - 1;

                return (
                  <div
                    key={etud.id}
                    onClick={() => navigate(`/admin/etudiants/${etud.id}/detail`)}
                    style={{
                      padding: "1rem 1.5rem",
                      borderBottom: isLast ? "none" : "1px solid #f5f5f5",
                      background: isEditing ? "#fffbeb" : "white",
                      transition: "background 0.15s",
                       cursor: "pointer",
                    }}
                  >
                    {isEditing ? (
                      /* ── Mode édition ── */
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                          {/* Nom */}
                          <div style={{ position: "relative" }}>
                            <label style={{ fontSize: "11px", fontWeight: 600, color: "#888", display: "block", marginBottom: "4px" }}>Nom</label>
                            <User size={15} style={{ position: "absolute", left: "12px", bottom: "11px", color: "#aaa" }} />
                            <input
                              value={editNom}
                              onChange={(e) => setEditNom(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              style={{ ...inputStyle, paddingLeft: "34px" }}
                            />
                          </div>
                          {/* Prénom */}
                          <div style={{ position: "relative" }}>
                            <label style={{ fontSize: "11px", fontWeight: 600, color: "#888", display: "block", marginBottom: "4px" }}>Prénom</label>
                            <User size={15} style={{ position: "absolute", left: "12px", bottom: "11px", color: "#aaa" }} />
                            <input
                              value={editPrenom}
                              onChange={(e) => setEditPrenom(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              style={{ ...inputStyle, paddingLeft: "34px" }}
                            />
                          </div>
                          {/* Groupe */}
                          <div>
                            <label style={{ fontSize: "11px", fontWeight: 600, color: "#888", display: "block", marginBottom: "4px" }}>Groupe</label>
                            <select
                              value={editGroupeId}
                              onChange={(e) => setEditGroupeId(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              style={{ ...inputStyle }}
                            >
                              <option value="">— Aucun groupe —</option>
                              {groupes.map((g) => (
                                <option key={g.id} value={g.id}>{g.nom}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Email en lecture seule */}
                        <div style={{
                          display: "flex", alignItems: "center", gap: "6px",
                          padding: "8px 12px", background: "#f8fafc",
                          borderRadius: "8px", border: "1px solid #e5e7ef",
                        }}>
                          <Mail size={13} color="#aaa" />
                          <span style={{ fontSize: "13px", color: "#94a3b8" }}>{etud.email}</span>
                          <span style={{ fontSize: "11px", color: "#cbd5e1", marginLeft: "4px" }}>(généré automatiquement)</span>
                        </div>

                        {/* Boutons */}
                        <div style={{ display: "flex", gap: "8px" }}>
                          {/* [FIX] passage de l'événement (e) + stopPropagation dans handleSave */}
                          <button onClick={(e) => handleSave(e, etud)} style={btnPrimary}>
                            <Save size={15} /> Enregistrer
                          </button>
                          {/* [FIX] resetEdit direct -> handleCancelEdit qui stoppe la propagation */}
                          <button onClick={handleCancelEdit} style={btnSecondary}>
                            Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* ── Mode affichage ── */
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        {/* Avatar */}
                        <div style={{
                          width: "38px", height: "38px", borderRadius: "10px",
                          background: "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          <User size={18} color="#d97706" />
                        </div>

                        {/* Infos */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#1a1a2e" }}>
                            {etud.nom} {etud.prenom}
                          </p>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                            <Mail size={12} color="#aaa" />
                            <span style={{ fontSize: "12px", color: "#6b7280" }}>{etud.email}</span>
                          </div>
                        </div>

                        {/* Badge groupe */}
                        <div style={{ flexShrink: 0 }}>
                          {etud.groupe ? (
                            <span style={{
                              background: "#eff6ff", color: "#3b82f6",
                              fontSize: "12px", fontWeight: 600,
                              borderRadius: "20px", padding: "4px 12px",
                              border: "1px solid #bfdbfe",
                            }}>
                              {etud.groupe.nom}
                            </span>
                          ) : (
                            <span style={{
                              background: "#f9fafb", color: "#9ca3af",
                              fontSize: "12px", borderRadius: "20px",
                              padding: "4px 12px", border: "1px solid #e5e7ef",
                            }}>
                              Sans groupe
                            </span>
                          )}
                        </div>

                        {/* Boutons action */}
                        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                          {/* [FIX] passage de l'événement (e) + stopPropagation dans handleEdit */}
                          <button
                            onClick={(e) => handleEdit(e, etud)}
                            style={{
                              padding: "8px 16px",
                              background: "#fffbeb",
                              color: "#d97706",
                              border: "1px solid #fde68a",
                              borderRadius: "10px",
                              fontSize: "13px",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            Modifier
                          </button>
                          {/* [FIX] handleAskDelete stoppe la propagation avant d'ouvrir la modale */}
                          <button
                            onClick={(e) => handleAskDelete(e, etud.id)}
                            style={{
                              padding: "8px 16px", background: "#fef2f2", color: "#dc2626",
                              border: "1px solid #fecaca", borderRadius: "10px",
                              fontSize: "13px", fontWeight: 600, cursor: "pointer",
                            }}
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
          {/* Modale suppression étudiant */}
      {confirmDelete && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div style={{
            background: "white", borderRadius: "16px", padding: "2rem",
            maxWidth: "400px", width: "90%", textAlign: "center",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)"
          }}>
            <div style={{
              width: "52px", height: "52px", borderRadius: "50%",
              background: "#fef2f2", display: "flex", alignItems: "center",
              justifyContent: "center", margin: "0 auto 1rem"
            }}>
              <Trash2 size={24} color="#dc2626" />
            </div>
            <h3 style={{ margin: "0 0 0.5rem", color: "#1a1a2e", fontSize: "18px" }}>
              Confirmer la suppression
            </h3>
            <p style={{ color: "#6b7280", fontSize: "14px", margin: "0 0 1.5rem", lineHeight: 1.6 }}>
              Cette action supprimera définitivement cet étudiant.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
                style={{
                  padding: "10px 24px", borderRadius: "10px", border: "1px solid #e5e7eb",
                  background: "white", color: "#374151", fontSize: "14px",
                  fontWeight: 600, cursor: "pointer"
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  padding: "10px 24px", borderRadius: "10px", border: "none",
                  background: "#dc2626", color: "white", fontSize: "14px",
                  fontWeight: 600, cursor: deleting ? "not-allowed" : "pointer",
                  opacity: deleting ? 0.7 : 1,
                  display: "flex", alignItems: "center", gap: "8px"
                }}
              >
                {deleting ? "Suppression..." : <><Trash2 size={16} /> Confirmer</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale suppression tous les étudiants */}
      {confirmDeleteAll && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div style={{
            background: "white", borderRadius: "16px", padding: "2rem",
            maxWidth: "400px", width: "90%", textAlign: "center",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)"
          }}>
            <div style={{
              width: "52px", height: "52px", borderRadius: "50%",
              background: "#fef2f2", display: "flex", alignItems: "center",
              justifyContent: "center", margin: "0 auto 1rem"
            }}>
              <Trash2 size={24} color="#dc2626" />
            </div>
            <h3 style={{ margin: "0 0 0.5rem", color: "#1a1a2e", fontSize: "18px" }}>
              Supprimer tous les étudiants ?
            </h3>
            <p style={{ color: "#6b7280", fontSize: "14px", margin: "0 0 1.5rem", lineHeight: 1.6 }}>
              Cette action est <strong style={{ color: "#dc2626" }}>irréversible</strong>. Tous les étudiants de ce niveau seront définitivement supprimés.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={() => setConfirmDeleteAll(false)}
                disabled={deleting}
                style={{
                  padding: "10px 24px", borderRadius: "10px", border: "1px solid #e5e7eb",
                  background: "white", color: "#374151", fontSize: "14px",
                  fontWeight: 600, cursor: "pointer"
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={deleting}
                style={{
                  padding: "10px 24px", borderRadius: "10px", border: "none",
                  background: "#dc2626", color: "white", fontSize: "14px",
                  fontWeight: 600, cursor: deleting ? "not-allowed" : "pointer",
                  opacity: deleting ? 0.7 : 1,
                  display: "flex", alignItems: "center", gap: "8px"
                }}
              >
                {deleting ? "Suppression..." : <><Trash2 size={16} /> Confirmer</>}
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      ) : (
        <EmptyState icon={FolderOpen} message="Veuillez sélectionner une filière et un niveau." />
      )}
    </div>
  );
}