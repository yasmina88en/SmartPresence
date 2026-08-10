import { Edit2, Trash2 } from "lucide-react";

export default function ListItemNode({ 
  id, 
  title, 
  subtitle, 
  icon: Icon, 
  iconColor = "#5b4afd", 
  iconBg = "#eef2ff",
  onClick, 
  onEdit, 
  onDelete,
  isLast = false
}) {
  return (
    <div 
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: "1rem",
        padding: "1rem 1.5rem",
        borderBottom: isLast ? "none" : "1px solid #f5f5f5",
        cursor: onClick ? "pointer" : "default", 
        transition: "background 0.15s"
      }}
      className="list-item-hover"
      onMouseEnter={onClick ? e => e.currentTarget.style.background = "#f8fafc" : null}
      onMouseLeave={onClick ? e => e.currentTarget.style.background = "transparent" : null}
    >
      <div style={{
        width: "40px", height: "40px", borderRadius: "10px",
        background: iconBg, display: "flex",
        alignItems: "center", justifyContent: "center", flexShrink: 0
      }}>
        {Icon && <Icon size={18} color={iconColor} />}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: "15px", fontWeight: 600, color: "#1a1a2e", margin: 0 }}>
          {title}
        </p>
        {subtitle && (
          <p style={{ fontSize: "13px", color: "#888", margin: "2px 0 0" }}>
            {subtitle}
          </p>
        )}
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        {onEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "32px", height: "32px", borderRadius: "8px",
              background: "#fdf8ea", color: "#d97706",
              border: "none", cursor: "pointer", transition: "background 0.2s"
            }}
            title="Modifier"
          >
            <Edit2 size={14} />
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "32px", height: "32px", borderRadius: "8px",
              background: "#fef2f2", color: "#dc2626",
              border: "none", cursor: "pointer", transition: "background 0.2s"
            }}
            title="Supprimer"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
