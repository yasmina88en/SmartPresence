import { useState } from "react";
import { X, Calendar as CalIcon, Clock, Book, MapPin, GraduationCap, Plus } from "lucide-react";

export default function ManualSessionModal({ isOpen, onClose, metadata, onSubmit, brandColor }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    heure_debut: "",
    heure_fin: "",
    matiere_id: "",
    niveau_id: "",
    salle: ""
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const inputStyle = {
    width: "100%", padding: "12px", borderRadius: "12px",
    border: "1px solid #e5e7eb", fontSize: "14px", marginTop: "6px",
    background: "#f9fafb", outline: "none", transition: "border-color 0.2s"
  };

  const labelStyle = { 
    fontSize: "12px", fontWeight: 700, color: "#4b5563", 
    display: "flex", alignItems: "center", gap: "6px" 
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(10,10,35,0.4)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 1000,
      backdropFilter: "blur(8px)"
    }}>
      <div style={{
        background: "white", width: "500px", borderRadius: "28px",
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.2)"
      }}>
        <div style={{
          padding: "1.5rem 2rem", borderBottom: "1px solid #f1f1f1",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: `linear-gradient(135deg, ${brandColor} 0%, #3b2fb6 100%)`, 
          color: "white"
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800 }}>Séance Spontanée</h3>
            <p style={{ margin: "2px 0 0", fontSize: "12px", opacity: 0.8 }}>Lancer un cours hors emploi du temps</p>
          </div>
          <button 
            onClick={onClose} 
            style={{ 
              background: "rgba(255,255,255,0.2)", border: "none", color: "white", 
              cursor: "pointer", width: "32px", height: "32px", borderRadius: "10px",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "1rem" }}>
            <div>
              <label style={labelStyle}><CalIcon size={14} /> Date de la séance</label>
              <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}><MapPin size={14} /> Salle</label>
              <input type="text" placeholder="Ex: B102" value={formData.salle} onChange={e => setFormData({...formData, salle: e.target.value})} style={inputStyle} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={labelStyle}><Clock size={14} /> Heure Début</label>
              <input type="time" value={formData.heure_debut} onChange={e => setFormData({...formData, heure_debut: e.target.value})} style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}><Clock size={14} /> Heure Fin</label>
              <input type="time" value={formData.heure_fin} onChange={e => setFormData({...formData, heure_fin: e.target.value})} style={inputStyle} required />
            </div>
          </div>

          <div>
            <label style={labelStyle}><Book size={14} /> Matière</label>
            <select value={formData.matiere_id} onChange={e => setFormData({...formData, matiere_id: e.target.value})} style={inputStyle} required>
               <option value="">Sélectionner parmi vos matières</option>
               {metadata.subjects.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}><GraduationCap size={14} /> Niveau cible</label>
            <select value={formData.niveau_id} onChange={e => setFormData({...formData, niveau_id: e.target.value})} style={inputStyle} required>
               <option value="">Sélectionner un Niveau</option>
               {metadata.niveaux.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </div>

          <button type="submit" style={{
            marginTop: "1.25rem", padding: "14px", background: brandColor,
            color: "white", border: "none", borderRadius: "14px",
            fontWeight: 800, cursor: "pointer", 
            boxShadow: `0 10px 25px ${brandColor}44`,
            fontSize: "15px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
            transition: "all 0.2s"
          }}
          onMouseOver={e => e.currentTarget.style.transform = "scale(1.02)"}
          onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
          >
            <Plus size={20} /> Enregistrer la séance
          </button>
        </form>
      </div>
    </div>
  );
}
