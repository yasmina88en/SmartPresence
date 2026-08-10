import { useState } from "react";
import { Users, Plus, Mail, User, Save, GraduationCap, Trash2 } from "lucide-react";
import { useProfs } from "../../hooks/useProfs";
import PageHeader from "../../components/PageHeader";
import ListItemNode from "../../components/ListItemNode";
import EmptyState from "../../components/EmptyState";

export default function Profs() {
    const { profs, addProf, updateProf, deleteProf } = useProfs();

    const [nom, setNom] = useState("");
    const [prenom, setPrenom] = useState("");
    const [email, setEmail] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const resetForm = () => {
        setNom("");
        setPrenom("");
        setEmail("");
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!nom.trim() || !prenom.trim()) return;

        let res;
        if (editingId) {
            res = await updateProf(editingId, { nom, prenom, email });
        } else {
            res = await addProf({ nom, prenom, email: email.trim() || undefined });
        }

        if (res.success) resetForm();
        else alert(res.error);
    };

    const handleEdit = (prof) => {
        setNom(prof.nom);
        setPrenom(prof.prenom);
        setEmail(prof.email);
        setEditingId(prof.id);
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        setDeleting(true);
        const res = await deleteProf(confirmDelete);
        if (!res.success) alert(res.error);
        setDeleting(false);
        setConfirmDelete(null);
    };

    const inputStyle = {
        width: "100%",
        padding: "12px 14px 12px 42px",
        border: "1.5px solid #e5e7ef",
        borderRadius: "10px",
        fontSize: "14px",
        color: "#1a1a2e",
        background: "#fafbff",
        outline: "none",
        boxSizing: "border-box",
        transition: "border 0.2s",
    };

    return (
        <div style={{ padding: "1rem", maxWidth: "900px", margin: "0 auto", fontFamily: "var(--font-sans, system-ui)" }}>

            <PageHeader
                title="Professeurs"
                subtitle="Gérez les comptes des enseignants"
                color="#7c3aed"
                bgColor="#f5f3ff"
            />

            {/* Formulaire ajout / modification */}
            <div style={{
                background: "white", borderRadius: "16px",
                border: "1px solid #efefef", padding: "1.5rem",
                marginBottom: "2rem", boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
            }}>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "#1a1a2e", marginBottom: "1rem" }}>
                    {editingId ? "Modifier le professeur" : "Ajouter un professeur"}
                </p>
                <form onSubmit={handleSubmit} style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr 1.5fr auto",
                    gap: "1rem", alignItems: "center",
                }}>
                    <div style={{ position: "relative" }}>
                        <User size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#aaa" }} />
                        <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom" required style={inputStyle} />
                    </div>
                    <div style={{ position: "relative" }}>
                        <User size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#aaa" }} />
                        <input type="text" value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Prénom" required style={inputStyle} />
                    </div>
                    <div style={{ position: "relative" }}>
                        <Mail size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#aaa" }} />
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email professeur" style={inputStyle} />
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                        <button type="submit" style={{
                            padding: "12px 20px", background: "#7c3aed", color: "white",
                            border: "none", borderRadius: "10px", fontSize: "14px",
                            fontWeight: 600, cursor: "pointer", display: "flex",
                            alignItems: "center", gap: "8px", whiteSpace: "nowrap",
                        }}>
                            {editingId ? <Save size={16} /> : <Plus size={16} />}
                            {editingId ? "Enregistrer" : "Ajouter"}
                        </button>
                        {editingId && (
                            <button type="button" onClick={resetForm} style={{
                                padding: "12px 16px", background: "#f1f5f9", color: "#475569",
                                border: "none", borderRadius: "10px", fontSize: "14px",
                                fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                            }}>
                                Annuler
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Liste des professeurs */}
            <div style={{
                background: "white", borderRadius: "16px",
                border: "1px solid #efefef", overflow: "hidden",
                boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
            }}>
                <div style={{
                    padding: "1rem 1.5rem", borderBottom: "1px solid #f5f5f5",
                    display: "flex", alignItems: "center", gap: "8px", background: "#fafbff",
                }}>
                    <GraduationCap size={18} color="#7c3aed" />
                    <span style={{ fontSize: "14px", fontWeight: 600, color: "#1a1a2e" }}>Liste des professeurs</span>
                    <span style={{
                        marginLeft: "auto", background: "#f5f3ff", color: "#7c3aed",
                        fontSize: "12px", fontWeight: 600, borderRadius: "20px", padding: "2px 10px",
                    }}>
                        {profs.length}
                    </span>
                </div>

                {profs.length === 0 ? (
                    <EmptyState message="Aucun professeur enregistré." />
                ) : (
                    <div>
                        {profs.map((prof, i) => (
                            <ListItemNode
                                key={prof.id}
                                title={`${prof.nom} ${prof.prenom}`}
                                subtitle={prof.email}
                                icon={User}
                                iconColor="#7c3aed"
                                iconBg="#f5f3ff"
                                onEdit={() => handleEdit(prof)}
                                onDelete={() => setConfirmDelete(prof.id)}
                                isLast={i === profs.length - 1}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modale confirmation suppression */}
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
                            Cette action supprimera définitivement ce professeur ainsi que toutes ses données associées.
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
        </div>
    );
}