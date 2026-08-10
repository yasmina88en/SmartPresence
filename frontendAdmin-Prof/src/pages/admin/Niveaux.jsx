import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { GraduationCap, Save, Plus, FolderOpen, Trash2 } from "lucide-react";
import { useFilieres } from "../../hooks/useFilieres";
import { useNiveaux } from "../../hooks/useNiveaux";
import PageHeader from "../../components/PageHeader";
import SelectField from "../../components/SelectField";
import ListItemNode from "../../components/ListItemNode";
import EmptyState from "../../components/EmptyState";

export default function Niveaux() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { filieres } = useFilieres();
  const [selectedFiliere, setSelectedFiliere] = useState(id || "");
  const { niveaux, addNiveau, updateNiveau, deleteNiveau} = useNiveaux(selectedFiliere);

  const [nom, setNom] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // id de niveau à supprimer
  const [deleting, setDeleting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nom.trim() || !selectedFiliere) return;

    let res;
    if (editingId) {
      res = await updateNiveau(editingId, selectedFiliere, nom);
      if (res.success) setEditingId(null);
    } else {
      res = await addNiveau(selectedFiliere, nom);
    }

    if (res.success) setNom("");
    else alert(res.error);
  };

  const handleEdit = (c) => {
    setNom(c.nom);
    setEditingId(c.id);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    const res = await deleteNiveau(confirmDelete);
    if (!res.success) alert(res.error);
    setDeleting(false);
    setConfirmDelete(null);
  };

  return (
    <div style={{ padding: "1rem", maxWidth: "900px", margin: "0 auto", fontFamily: "var(--font-sans, system-ui)" }}>

      <PageHeader
        title="Niveaux"
        subtitle="Gérez les niveaux de vos filières"
        color="#0891b2"
        bgColor="#e0f2fe"
      />

      {!id && (
        <div style={{
          background: "white", borderRadius: "16px",
          border: "1px solid #efefef", padding: "1.5rem",
          marginBottom: "1.5rem", boxShadow: "0 4px 12px rgba(0,0,0,0.03)"
        }}>
          <SelectField
            label="Sélectionner une filière"
            value={selectedFiliere}
            onChange={(e) => {
              setSelectedFiliere(e.target.value);
              setEditingId(null);
              setNom("");
            }}
            options={filieres}
            placeholder="-- Choisir une filière --"
          />
        </div>
      )}

      {selectedFiliere ? (
        <>
          <div style={{
            background: "white", borderRadius: "16px",
            border: "1px solid #efefef", padding: "1.5rem",
            marginBottom: "2rem", boxShadow: "0 4px 12px rgba(0,0,0,0.03)"
          }}>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "#1a1a2e", marginBottom: "1rem" }}>
              {editingId ? "Modifier le niveau" : "Ajouter un niveau"}
            </p>
            <form onSubmit={handleSubmit} style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <div style={{ flex: 1, position: "relative" }}>
                <GraduationCap size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#aaa" }} />
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Nom (ex: L1, L2, Master 1)"
                  required
                  style={{
                    width: "100%", padding: "12px 14px 12px 42px",
                    border: "1.5px solid #e5e7ef", borderRadius: "10px",
                    fontSize: "14px", color: "#1a1a2e", background: "#fafbff",
                    outline: "none", boxSizing: "border-box"
                  }}
                />
              </div>
              <button type="submit" style={{
                padding: "12px 24px", background: "#0891b2", color: "white",
                border: "none", borderRadius: "10px", fontSize: "14px",
                fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px"
              }}>
                {editingId ? <Save size={16} /> : <Plus size={16} />}
                {editingId ? "Enregistrer" : "Ajouter"}
              </button>
              {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setNom(""); }} style={{
                  padding: "12px 24px", background: "#f1f5f9", color: "#475569",
                  border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 600, cursor: "pointer"
                }}>
                  Annuler
                </button>
              )}
            </form>
          </div>

          <div style={{
            background: "white", borderRadius: "16px",
            border: "1px solid #efefef", overflow: "hidden",
            boxShadow: "0 4px 12px rgba(0,0,0,0.03)"
          }}>
            <div style={{
              padding: "1rem 1.5rem", borderBottom: "1px solid #f5f5f5",
              display: "flex", alignItems: "center", gap: "8px", background: "#fafbff"
            }}>
              <FolderOpen size={18} color="#0891b2" />
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#1a1a2e" }}>Liste des niveaux</span>
              <span style={{
                marginLeft: "auto", background: "#e0f2fe", color: "#0891b2",
                fontSize: "12px", fontWeight: 600, borderRadius: "20px", padding: "2px 10px"
              }}>
                {niveaux.length}
              </span>
            </div>

            {niveaux.length === 0 ? (
              <EmptyState message="Aucune niveau trouvée." />
            ) : (
              <div>
                {niveaux.map((c, i) => (
                  <ListItemNode
                    key={c.id}
                    title={c.nom}
                    subtitle={`ID: ${c.id} — Cliquez pour voir les détails`}
                    icon={GraduationCap}
                    iconColor="#0891b2"
                    iconBg="#e0f2fe"
                    onClick={() => navigate(`/admin/filieres/${selectedFiliere}/niveaux/${c.id}`)}
                    onEdit={() => handleEdit(c)}
                    onDelete={() => setConfirmDelete(c.id)}
                    isLast={i === niveaux.length - 1}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <EmptyState icon={FolderOpen} message="Veuillez sélectionner une filière pour gérer ses niveaux." />
      )}

      {/* ── Modale confirmation suppression ── */}
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
        Cette action supprimera définitivement ce niveau ainsi que toutes ses
        données associées.
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
            fontWeight: 600,
            cursor: deleting ? "not-allowed" : "pointer",
            opacity: deleting ? 0.7 : 1,
            display: "flex", alignItems: "center", gap: "8px"
          }}
        >
          {deleting ? (
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              Suppression...
            </span>
          ) : (
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Trash2 size={16} />
              Confirmer
            </span>
          )}
        </button>
      </div>
    </div>
  </div>
)}
    

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  );
}