import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { BookOpen, Save, Plus, Trash2 } from "lucide-react";
import { useFilieres } from "../../hooks/useFilieres";
import PageHeader from "../../components/PageHeader";
import ConfirmDialog from "../../components/ConfirmDialog";
import ListItemNode from "../../components/ListItemNode";
import EmptyState from "../../components/EmptyState";

export default function Filieres() {
  const navigate = useNavigate();
  const { filieres, addFiliere, updateFiliere, deleteFiliere, loading } = useFilieres();

  const [nom, setNom] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nom.trim()) return;

    setIsActionLoading(true);
    let res;
    if (editingId) {
      res = await updateFiliere(editingId, nom);
      if (res.success) setEditingId(null);
    } else {
      res = await addFiliere(nom);
    }

    if (res.success) setNom("");
    else alert(res.error);
    setIsActionLoading(false);
  };

  const handleEdit = (f) => {
    setNom(f.nom);
    setEditingId(f.id);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsActionLoading(true);
    const res = await deleteFiliere(deletingId);
    if (!res.success) alert(res.error);
    setIsActionLoading(false);
    setConfirmDelete(false);
    setDeletingId(null);
  };

  return (
    <div style={{ padding: "1rem", maxWidth: "900px", margin: "0 auto", fontFamily: "var(--font-sans, system-ui)" }}>

      <PageHeader
        title="Filières"
        subtitle="Gérez les départements et filières de votre établissement"
        color="#8b5cf6"
        bgColor="#f5f3ff"
      />

      {/* Formulaire d'ajout / modification */}
      <div style={{
        background: "white", borderRadius: "24px",
        border: "1px solid #efefef", padding: "1.5rem",
        marginBottom: "2rem", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "8px",
            background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Plus size={18} color="#8b5cf6" />
          </div>
          <p style={{ fontSize: "15px", fontWeight: 700, color: "#1a1a2e", margin: 0 }}>
            {editingId ? "Modifier la filière" : "Ajouter une filière"}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <BookOpen size={18} style={{
              position: "absolute", left: "14px", top: "50%",
              transform: "translateY(-50%)", color: "#aaa"
            }} />
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Nom de la filière (ex: Génie Informatique, GE, Management)"
              required
              disabled={isActionLoading}
              style={{
                width: "100%", padding: "14px 14px 14px 44px",
                border: "1.5px solid #e2e8f0", borderRadius: "12px",
                fontSize: "14px", color: "#1a1a2e", background: "#f8fafc",
                outline: "none", boxSizing: "border-box", transition: "all 0.2s"
              }}
            />
          </div>
          <button
            type="submit"
            disabled={isActionLoading}
            style={{
              padding: "14px 28px", background: "#8b5cf6", color: "white",
              border: "none", borderRadius: "12px", fontSize: "14px",
              fontWeight: 700, cursor: isActionLoading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: "8px",
              transition: "all 0.2s", boxShadow: "0 4px 12px rgba(139, 92, 246, 0.25)",
              opacity: isActionLoading ? 0.7 : 1
            }}
          >
            {isActionLoading ? (
              <div style={{ width: "16px", height: "16px", border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            ) : (editingId ? <Save size={18} /> : <Plus size={18} />)}
            {editingId ? "Enregistrer" : "Ajouter"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={() => { setEditingId(null); setNom(""); }}
              style={{
                padding: "14px 24px", background: "#f1f5f9", color: "#475569",
                border: "none", borderRadius: "12px", fontSize: "14px",
                fontWeight: 600, cursor: "pointer"
              }}
            >
              Annuler
            </button>
          )}
        </form>
      </div>

      {/* Liste des Filières */}
      <div style={{
        background: "white", borderRadius: "24px",
        border: "1px solid #efefef", overflow: "hidden",
        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)"
      }}>
        <div style={{
          padding: "1.25rem 1.5rem", borderBottom: "1px solid #f1f5f9",
          display: "flex", alignItems: "center", gap: "10px",
          background: "#fafbff"
        }}>
          <BookOpen size={20} color="#8b5cf6" />
          <span style={{ fontSize: "15px", fontWeight: 700, color: "#1a1a2e" }}>
            Liste des filières existantes
          </span>
          <span style={{
            marginLeft: "auto", background: "#f5f3ff", color: "#8b5cf6",
            fontSize: "12px", fontWeight: 700, borderRadius: "20px",
            padding: "4px 12px"
          }}>
            {filieres.length}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <div style={{ width: "32px", height: "32px", border: "3px solid #8b5cf6", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
          </div>
        ) : filieres.length === 0 ? (
          <EmptyState icon={BookOpen} message="Aucune filière n'a encore été créée." />
        ) : (
          <div>
            {filieres.map((f, i) => (
              <ListItemNode
                key={f.id}
                title={f.nom}
                subtitle={`Gérer les niveaux et les emplois du temps de ${f.nom}`}
                icon={BookOpen}
                iconColor="#8b5cf6"
                iconBg="#f5f3ff"
                onClick={() => navigate(`/admin/filieres/${f.id}/niveaux`)}
                onEdit={() => handleEdit(f)}
                onDelete={() => { setDeletingId(f.id); setConfirmDelete(true); }}
                isLast={i === filieres.length - 1}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modale confirmation suppression */}
      {/* Modale confirmation suppression */}
      <ConfirmDialog
        isOpen={confirmDelete}
        title="Confirmer la suppression"
        message={
          <>Toutes les niveaux, étudiants et emplois du temps liés à <b>{filieres.find(f => f.id === deletingId)?.nom}</b> seront définitivement supprimés.</>
        }
        onConfirm={handleDelete}
        onCancel={() => { setConfirmDelete(false); setDeletingId(null); }}
        confirmText="Confirmer la suppression"
        cancelText="Annuler"
        type="danger"
        isLoading={isActionLoading}
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}