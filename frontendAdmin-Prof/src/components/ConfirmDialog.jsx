// components/ConfirmDialog.jsx
import React from "react";
import { AlertTriangle, Trash2, X, Info, CheckCircle2 } from "lucide-react";

/**
 * Un dialogue de confirmation premium et réutilisable.
 * types: 'danger' (rouge), 'info' (bleu/violet), 'success' (vert)
 */
export default function ConfirmDialog({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = "Confirmer", 
  cancelText = "Annuler",
  type = "danger", // danger, info, success
  isLoading = false,
  brandColor = "#5b4afd"
}) {
  if (!isOpen) return null;

  const themes = {
    danger:  { icon: Trash2, color: "#dc2626", bg: "#fef2f2" },
    info:    { icon: Info,   color: brandColor, bg: "#f5f3ff" },
    success: { icon: CheckCircle2, color: "#10b981", bg: "#f0fdf4" }
  };

  const theme = themes[type] || themes.info;
  const Icon = theme.icon;

  return (
    <div style={s.overlay}>
      <div style={s.modal}>
        {/* Header Icon */}
        <div style={{ ...s.iconCircle, background: theme.bg }}>
          <Icon size={24} color={theme.color} />
        </div>

        {/* Content */}
        <h3 style={s.title}>{title}</h3>
        <p style={s.message}>{message}</p>

        {/* Buttons */}
        <div style={s.btnGroup}>
          <button 
            onClick={onCancel} 
            disabled={isLoading}
            style={s.btnCancel}
            onMouseOver={e => e.currentTarget.style.background = "#f1f5f9"}
            onMouseOut={e => e.currentTarget.style.background = "white"}
          >
            {cancelText}
          </button>
          
          <button 
            onClick={onConfirm} 
            disabled={isLoading}
            style={{ 
              ...s.btnConfirm, 
              background: type === "danger" ? "#dc2626" : brandColor,
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? "not-allowed" : "pointer"
            }}
            onMouseOver={e => { if(!isLoading) e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseOut={e => { if(!isLoading) e.currentTarget.style.transform = "translateY(0)"; }}
          >
            {isLoading ? (
              <div style={s.spinner} />
            ) : confirmText}
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes modalShow {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const s = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(10, 10, 31, 0.4)",
    backdropFilter: "blur(8px)", display: "flex", alignItems: "center",
    justifyContent: "center", zIndex: 9999, padding: "20px"
  },
  modal: {
    background: "white", borderRadius: "24px", padding: "2rem",
    maxWidth: "400px", width: "100%", textAlign: "center",
    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
    animation: "modalShow 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
    border: "1px solid rgba(255,255,255,0.1)"
  },
  iconCircle: {
    width: "56px", height: "56px", borderRadius: "18px",
    display: "flex", alignItems: "center", justifyContent: "center",
    margin: "0 auto 1.25rem"
  },
  title: { fontSize: "19px", fontWeight: 800, color: "#1a1a2e", margin: "0 0 0.5rem", letterSpacing: "-0.02em" },
  message: { fontSize: "14px", color: "#64748b", margin: "0 0 1.75rem", lineHeight: 1.6 },
  btnGroup: { display: "flex", gap: "12px", justifyContent: "center" },
  btnCancel: {
    flex: 1, padding: "12px", borderRadius: "14px", border: "1px solid #e2e8f0",
    background: "white", color: "#475569", fontSize: "14px", fontWeight: 700,
    cursor: "pointer", transition: "all 0.2s"
  },
  btnConfirm: {
    flex: 1, padding: "12px", borderRadius: "14px", border: "none",
    color: "white", fontSize: "14px", fontWeight: 700,
    transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center"
  },
  spinner: { width: "18px", height: "18px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }
};
